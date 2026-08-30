"""Per-logged-in-admin runtime snapshot assembled from institution-scoped SQL.

Admin dashboards must never fall back to SPA / MIT-P / Anil / Meera fixtures.
Empty tables yield calculated zeros and empty arrays — not prototype history.
"""

from __future__ import annotations

import json
import re
import secrets
from collections import defaultdict
from datetime import date, datetime, timezone
from typing import Any

from fastapi import HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.security import hash_password
from app.models.ai import AiConversation, AiMessage, AiTrace
from app.models.assessment import Paper, Question
from app.models.capabilities import GeneratedReport, ResearchPublication
from app.models.catalog import (
    AcademicTerm,
    Batch,
    CalendarEvent,
    Campus,
    Course,
    Department,
    Program,
    Subject,
)
from app.models.exams import ExamAttempt
from app.models.identity import Institution, Role, User, UserRole
from app.models.interventions import Intervention
from app.models.ops import AuditLog, SupportTicket
from app.models.people import Enrollment, FacultyProfile, StudentProfile
from app.models.teaching import Assignment, AssignmentSubmission, AttendanceRecord, AttendanceSession
from app.services.faculty_runtime import iso, parse_json, round1, clamp

FORBIDDEN_DEMO = ("MIT-P", "Meridian Institute of Technology", "Anil Menon", "Dr. Anil", "Meera Krishnan", "Aarav Sharma")

ROLE_COLORS = {
    "admin": "from-violet-500 to-purple-500",
    "faculty": "from-teal-500 to-emerald-500",
    "student": "from-indigo-500 to-blue-500",
    "parent": "from-emerald-500 to-lime-500",
}

P3_GAP = "BACKEND GAP — invoices, scholarships, CMS, placements, API keys and data import are not operational."


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


def require_admin(user: User) -> None:
    if user.primary_role != "admin":
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Admin profile required")
    if not user.institution_id:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Institution required")


def grade_for(score: float, *, has_evidence: bool) -> str:
    if not has_evidence:
        return "Building"
    if score >= 85:
        return "Excellent"
    if score >= 70:
        return "Good"
    if score >= 55:
        return "At Risk"
    return "Critical"


def settings_blob(inst: Institution | None) -> dict:
    if inst is None:
        return {}
    return parse_json(inst.settings_json, {})


def write_audit(
    db: Session,
    user: User,
    *,
    action: str,
    resource_type: str,
    resource_id: str | None = None,
    before: Any = None,
    after: Any = None,
) -> None:
    db.add(
        AuditLog(
            institution_id=user.institution_id,
            actor_id=user.id,
            action=action,
            resource_type=resource_type,
            resource_id=resource_id,
            before=json.dumps(before) if before is not None else None,
            after=json.dumps(after) if after is not None else None,
            occurred_at=utcnow(),
        )
    )


def _role_code(user: User) -> str:
    codes = [link.role.code for link in (user.role_links or []) if link.role]
    for preferred in ("admin", "faculty", "student", "parent"):
        if preferred in codes:
            return preferred
    return user.legacy_role or (codes[0] if codes else "student")


def _ensure_role(db: Session, institution_id: str, code: str) -> Role:
    role = db.query(Role).filter(Role.institution_id == institution_id, Role.code == code).first()
    if role is None:
        role = Role(institution_id=institution_id, code=code, name=code.title())
        db.add(role)
        db.flush()
    return role


def _count(db: Session, model, institution_id: str) -> int:
    return int(db.scalar(select(func.count()).select_from(model).where(model.institution_id == institution_id)) or 0)


def _dept_counts(db: Session, institution_id: str) -> tuple[dict[str, int], dict[str, int]]:
    students: dict[str, int] = defaultdict(int)
    faculty: dict[str, int] = defaultdict(int)
    for profile in db.scalars(select(StudentProfile).where(StudentProfile.institution_id == institution_id)).all():
        if profile.department_id:
            students[profile.department_id] += 1
    for profile in db.scalars(select(FacultyProfile).where(FacultyProfile.institution_id == institution_id)).all():
        if profile.department_id:
            faculty[profile.department_id] += 1
    return students, faculty


def list_departments(db: Session, institution_id: str) -> list[dict]:
    depts = db.scalars(select(Department).where(Department.institution_id == institution_id).order_by(Department.code)).all()
    student_n, faculty_n = _dept_counts(db, institution_id)
    programs = db.scalars(select(Program).where(Program.institution_id == institution_id)).all()
    prog_n: dict[str, int] = defaultdict(int)
    for program in programs:
        if program.department_id:
            prog_n[program.department_id] += 1
    users = {u.id: u for u in db.scalars(select(User).where(User.institution_id == institution_id)).all()}
    items = []
    for dept in depts:
        hod = users.get(dept.hod_user_id) if dept.hod_user_id else None
        items.append(
            {
                "id": dept.id,
                "name": dept.name,
                "code": dept.code,
                "students": student_n.get(dept.id, 0),
                "faculty": faculty_n.get(dept.id, 0),
                "programs": prog_n.get(dept.id, 0),
                "hod": hod.full_name if hod else None,
                "placement": None,
            }
        )
    return items


def list_courses(db: Session, institution_id: str) -> list[dict]:
    courses = db.scalars(select(Course).where(Course.institution_id == institution_id).order_by(Course.code)).all()
    depts = {d.id: d for d in db.scalars(select(Department).where(Department.institution_id == institution_id)).all()}
    subjects = {s.id: s for s in db.scalars(select(Subject).where(Subject.institution_id == institution_id)).all()}
    faculty = {p.user_id: p for p in db.scalars(select(FacultyProfile).where(FacultyProfile.institution_id == institution_id)).all()}
    users = {u.id: u for u in db.scalars(select(User).where(User.institution_id == institution_id)).all()}
    enrolled = dict(
        db.execute(
            select(Enrollment.course_id, func.count())
            .select_from(Enrollment)
            .join(StudentProfile, StudentProfile.user_id == Enrollment.student_id)
            .where(StudentProfile.institution_id == institution_id)
            .group_by(Enrollment.course_id)
        ).all()
    )
    items = []
    for course in courses:
        subject = subjects.get(course.subject_id)
        dept = depts.get(subject.department_id) if subject else depts.get(None)
        if subject and subject.department_id:
            dept = depts.get(subject.department_id)
        else:
            dept = None
        faculty_name = None
        if dept:
            for profile in faculty.values():
                if profile.department_id == dept.id:
                    owner = users.get(profile.user_id)
                    faculty_name = owner.full_name if owner else None
                    break
        items.append(
            {
                "id": course.id,
                "code": course.code,
                "title": course.name,
                "dept": dept.code if dept else None,
                "credits": course.credits,
                "enrolled": int(enrolled.get(course.id) or 0),
                "faculty": faculty_name,
                "semester": f"Sem {course.semester_no}" if course.semester_no else None,
                "passRate": None,
                "status": "Active",
            }
        )
    return items


def list_programs(db: Session, institution_id: str) -> list[dict]:
    rows = db.scalars(select(Program).where(Program.institution_id == institution_id).order_by(Program.code)).all()
    depts = {d.id: d for d in db.scalars(select(Department).where(Department.institution_id == institution_id)).all()}
    students: dict[str, int] = defaultdict(int)
    for profile in db.scalars(select(StudentProfile).where(StudentProfile.institution_id == institution_id)).all():
        if profile.program_id:
            students[profile.program_id] += 1
    items = []
    for program in rows:
        dept = depts.get(program.department_id)
        items.append(
            {
                "id": program.id,
                "name": program.name,
                "code": program.code,
                "dept": dept.code if dept else None,
                "duration": f"{program.duration_years} yrs" if program.duration_years else None,
                "students": students.get(program.id, 0),
                "intake": None,
                "fee": None,
                "accreditations": [],
                "placements": None,
                "status": "Active",
            }
        )
    return items


def list_subjects(db: Session, institution_id: str) -> list[dict]:
    rows = db.scalars(select(Subject).where(Subject.institution_id == institution_id).order_by(Subject.code)).all()
    depts = {d.id: d for d in db.scalars(select(Department).where(Department.institution_id == institution_id)).all()}
    course_n: dict[str, int] = defaultdict(int)
    for course in db.scalars(select(Course).where(Course.institution_id == institution_id)).all():
        if course.subject_id:
            course_n[course.subject_id] += 1
    items = []
    for subject in rows:
        dept = depts.get(subject.department_id)
        items.append(
            {
                "id": subject.id,
                "code": subject.code,
                "name": subject.name,
                "program": dept.code if dept else "",
                "semester": None,
                "credits": None,
                "courses": course_n.get(subject.id, 0),
                "faculty": None,
                "passRate": None,
                "dept": dept.code if dept else None,
                "examMode": subject.exam_mode,
                "examFamily": subject.exam_family,
                "status": "Active",
            }
        )
    return items


def list_batches(db: Session, institution_id: str) -> list[dict]:
    rows = db.scalars(select(Batch).where(Batch.institution_id == institution_id).order_by(Batch.code)).all()
    students: dict[str, int] = defaultdict(int)
    cgpa_sum: dict[str, float] = defaultdict(float)
    cgpa_n: dict[str, int] = defaultdict(int)
    for profile in db.scalars(select(StudentProfile).where(StudentProfile.institution_id == institution_id)).all():
        if not profile.batch_id:
            continue
        students[profile.batch_id] += 1
        if profile.cgpa is not None:
            cgpa_sum[profile.batch_id] += profile.cgpa
            cgpa_n[profile.batch_id] += 1
    programs = {p.id: p for p in db.scalars(select(Program).where(Program.institution_id == institution_id)).all()}
    items = []
    for batch in rows:
        program = programs.get(batch.program_id)
        n = cgpa_n.get(batch.id) or 0
        items.append(
            {
                "id": batch.id,
                "name": batch.name or batch.code,
                "program": program.name if program else None,
                "intake": students.get(batch.id, 0),
                "students": students.get(batch.id, 0),
                "coordinator": None,
                "semester": batch.section,
                "avgCgpa": round(cgpa_sum[batch.id] / n, 1) if n else None,
                "status": "Active",
            }
        )
    return items


def list_users(db: Session, institution_id: str) -> list[dict]:
    users = db.scalars(select(User).where(User.institution_id == institution_id).order_by(User.full_name)).all()
    students = {p.user_id: p for p in db.scalars(select(StudentProfile).where(StudentProfile.institution_id == institution_id)).all()}
    faculty = {p.user_id: p for p in db.scalars(select(FacultyProfile).where(FacultyProfile.institution_id == institution_id)).all()}
    depts = {d.id: d for d in db.scalars(select(Department).where(Department.institution_id == institution_id)).all()}
    items = []
    for user in users:
        role = _role_code(user)
        dept = None
        if user.id in students:
            dept = depts.get(students[user.id].department_id)
        elif user.id in faculty:
            dept = depts.get(faculty[user.id].department_id)
        items.append(
            {
                "id": user.id,
                "name": user.full_name,
                "email": user.email,
                "role": role.title(),
                "dept": dept.code if dept else ("Administration" if role == "admin" else None),
                "status": (user.status or "active").title(),
                "lastActive": iso(user.last_login_at) or "—",
            }
        )
    return items


def list_calendar(db: Session, institution_id: str) -> list[dict]:
    rows = db.scalars(select(CalendarEvent).where(CalendarEvent.institution_id == institution_id).order_by(CalendarEvent.starts_at)).all()
    kind_map = {
        "deadline": "Deadline",
        "event": "Event",
        "exam": "Exam",
        "academic": "Academic",
        "placement": "Placement",
        "finance": "Finance",
        "research": "Research",
    }
    return [
        {
            "id": row.id,
            "date": row.starts_at.date().isoformat() if row.starts_at else None,
            "title": row.title,
            "type": kind_map.get((row.kind or "").lower(), (row.kind or "Academic").title()),
            "scope": "All",
        }
        for row in rows
    ]


def dashboard_payload(db: Session, institution_id: str) -> dict:
    student_n = _count(db, StudentProfile, institution_id)
    faculty_n = _count(db, FacultyProfile, institution_id)
    course_n = _count(db, Course, institution_id)
    return {
        "kpis": [
            {"label": "Students", "value": student_n, "delta": None, "up": None},
            {"label": "Faculty", "value": faculty_n, "delta": None, "up": None},
            {"label": "Courses", "value": course_n, "delta": None, "up": None},
        ]
    }


def students_payload(db: Session, institution_id: str) -> dict:
    profiles = db.scalars(select(StudentProfile).where(StudentProfile.institution_id == institution_id)).all()
    users = {u.id: u for u in db.scalars(select(User).where(User.institution_id == institution_id)).all()}
    depts = {d.id: d for d in db.scalars(select(Department).where(Department.institution_id == institution_id)).all()}
    programs = {p.id: p for p in db.scalars(select(Program).where(Program.institution_id == institution_id)).all()}
    attendance_pct = _attendance_by_student(db, institution_id)
    items = []
    for profile in profiles:
        user = users.get(profile.user_id)
        if not user:
            continue
        extra = parse_json(profile.extra, {})
        dept = depts.get(profile.department_id)
        program = programs.get(profile.program_id)
        pct = attendance_pct.get(profile.user_id)
        items.append(
            {
                "id": profile.user_id,
                "name": user.full_name,
                "roll": profile.roll_no,
                "email": user.email,
                "cgpa": profile.cgpa,
                "attendance": pct,
                "internalMarks": extra.get("internalMarks"),
                "status": profile.academic_status or extra.get("academicLabel"),
                "dept": dept.code if dept else None,
                "program": program.name if program else extra.get("program"),
                "accountStatus": user.status,
            }
        )
    return {"students": items, "total": len(items)}


def faculty_payload(db: Session, institution_id: str) -> dict:
    profiles = db.scalars(select(FacultyProfile).where(FacultyProfile.institution_id == institution_id)).all()
    users = {u.id: u for u in db.scalars(select(User).where(User.institution_id == institution_id)).all()}
    depts = {d.id: d for d in db.scalars(select(Department).where(Department.institution_id == institution_id)).all()}
    pubs: dict[str, int] = defaultdict(int)
    for row in db.scalars(select(ResearchPublication).where(ResearchPublication.institution_id == institution_id)).all():
        pubs[row.faculty_id] += 1
    items = []
    for profile in profiles:
        user = users.get(profile.user_id)
        if not user:
            continue
        dept = depts.get(profile.department_id)
        items.append(
            {
                "id": profile.user_id,
                "name": user.full_name,
                "email": user.email,
                "dept": dept.code if dept else None,
                "designation": profile.designation,
                "courses": 0,
                "students": 0,
                "publications": pubs.get(profile.user_id, 0),
                "status": "Active" if user.status == "active" else (user.status or "inactive").title(),
            }
        )
    return {"faculty": items, "total": len(items)}


def question_bank_payload(db: Session, institution_id: str) -> dict:
    questions = db.scalars(select(Question).where(Question.institution_id == institution_id).order_by(Question.created_at.desc())).all()
    subjects = {s.id: s for s in db.scalars(select(Subject).where(Subject.institution_id == institution_id)).all()}
    by_type: dict[str, int] = defaultdict(int)
    ai_generated = 0
    approved = 0
    flagged = 0
    items = []
    for question in questions:
        subject = subjects.get(question.subject_id)
        q_type = (question.q_type or "mcq").upper() if question.q_type != "mcq" else "MCQ"
        by_type[q_type] += 1
        status_label = (question.status or "approved").title()
        if (question.source or "").lower() == "ai":
            ai_generated += 1
        if status_label.lower() == "approved":
            approved += 1
        if status_label.lower() == "flagged":
            flagged += 1
        items.append(
            {
                "id": question.id,
                "code": question.id[:12],
                "subject": (subject.code if subject else None) or question.exam_mode or "General",
                "topic": question.concept or "—",
                "type": q_type,
                "difficulty": (question.difficulty or "medium").title(),
                "usage": 0,
                "status": status_label,
                "lastUsed": iso(question.updated_at) if getattr(question, "updated_at", None) else None,
            }
        )
    return {
        "summary": {
            "total": len(items),
            "aiGenerated": ai_generated,
            "approved": approved,
            "flagged": flagged,
            "byType": dict(by_type),
        },
        "questions": items,
    }


def research_payload(db: Session, institution_id: str) -> dict:
    rows = db.scalars(
        select(ResearchPublication)
        .where(ResearchPublication.institution_id == institution_id)
        .order_by(ResearchPublication.year.desc(), ResearchPublication.created_at.desc())
    ).all()
    citations = sum(row.citations or 0 for row in rows)
    faculty = {p.user_id: p for p in db.scalars(select(FacultyProfile).where(FacultyProfile.institution_id == institution_id)).all()}
    depts = {d.id: d for d in db.scalars(select(Department).where(Department.institution_id == institution_id)).all()}
    users = {u.id: u for u in db.scalars(select(User).where(User.institution_id == institution_id)).all()}
    by_dept: dict[str, int] = defaultdict(int)
    for row in rows:
        profile = faculty.get(row.faculty_id)
        dept = depts.get(profile.department_id) if profile else None
        by_dept[dept.code if dept else "—"] += 1
    years = sorted({row.year for row in rows if row.year})
    trend = [{"year": year, "citations": sum((r.citations or 0) for r in rows if r.year == year), "amount": None} for year in years]
    publications = []
    for row in rows:
        owner = users.get(row.faculty_id)
        extra = parse_json(row.extra, {})
        publications.append(
            {
                "id": row.id,
                "title": row.title,
                "pi": owner.full_name if owner else None,
                "venue": row.venue,
                "year": row.year,
                "status": extra.get("status") or "Published",
                "funding": None,
                "citations": row.citations or 0,
            }
        )
    return {
        "kpis": [
            {"label": "Publications", "value": len(rows), "delta": "—", "up": True},
            {"label": "Citations", "value": citations, "delta": "—", "up": True},
            {"label": "Grants", "value": 0, "delta": "—", "up": False},
            {"label": "Faculty with pubs", "value": len({r.faculty_id for r in rows}), "delta": "—", "up": True},
        ],
        "grantTrend": trend,
        "byDept": [{"dept": code, "pubs": count} for code, count in sorted(by_dept.items())],
        "topProjects": [],
        "publications": publications,
        "grants": [],
    }


def roles_payload(db: Session, institution_id: str) -> dict:
    roles = db.scalars(select(Role).where(Role.institution_id == institution_id).order_by(Role.code)).all()
    counts: dict[str, int] = defaultdict(int)
    for link in db.scalars(select(UserRole).where(UserRole.institution_id == institution_id)).all():
        counts[link.role_id] += 1
    items = []
    for role in roles:
        items.append(
            {
                "id": role.id,
                "name": role.name or role.code.title(),
                "code": role.code,
                "description": f"{role.name or role.code.title()} access for this institution.",
                "members": counts.get(role.id, 0),
                "color": ROLE_COLORS.get(role.code, "from-slate-500 to-slate-700"),
            }
        )
    return {"roles": items}


def audit_logs_payload(db: Session, institution_id: str) -> dict:
    rows = db.scalars(
        select(AuditLog).where(AuditLog.institution_id == institution_id).order_by(AuditLog.occurred_at.desc())
    ).all()
    users = {u.id: u for u in db.scalars(select(User).where(User.institution_id == institution_id)).all()}
    logs = []
    for row in rows:
        actor = users.get(row.actor_id)
        logs.append(
            {
                "id": row.id,
                "actor": actor.full_name if actor else row.actor_id,
                "ip": None,
                "action": (row.action or "").upper(),
                "module": (row.resource_type or "").title(),
                "target": row.resource_id,
                "time": iso(row.occurred_at),
                "result": "Success",
            }
        )
    return {"logs": logs}


def settings_payload(db: Session, user: User) -> dict:
    inst = db.get(Institution, user.institution_id) if user.institution_id else None
    blob = settings_blob(inst)
    identity = blob.get("identity") or {}
    academics = blob.get("academics") or {}
    security = blob.get("security") or {}
    features = blob.get("features") or {}
    current_term = db.scalars(
        select(AcademicTerm).where(AcademicTerm.institution_id == user.institution_id, AcademicTerm.is_current.is_(True))
    ).first()
    return {
        "institution": {
            "name": inst.name if inst else None,
            "shortName": inst.short_name if inst else None,
            "address": identity.get("address"),
            "phone": identity.get("phone"),
            "email": identity.get("email"),
            "timezone": inst.timezone if inst else None,
            "fiscalYear": identity.get("fiscalYear"),
        },
        "academics": {
            "semesterSystem": academics.get("semesterSystem") or "Semester",
            "currentTerm": current_term.name if current_term else (inst.academic_year if inst else None),
            "gradingScale": academics.get("gradingScale") or "10-point CGPA",
            "attendanceThreshold": inst.attendance_threshold if inst else 75,
            "passMark": inst.pass_mark if inst else 40,
        },
        "security": {
            "ssoProvider": security.get("ssoProvider"),
            "ssoEnabled": bool(security.get("ssoEnabled")),
            "mfaRequired": bool(security.get("mfaRequired")),
            "sessionTimeout": security.get("sessionTimeout") or 30,
            "dataResidency": security.get("dataResidency"),
        },
        "features": {
            "enableAiTutor": bool(features.get("enableAiTutor")),
            "enableCodingLab": bool(features.get("enableCodingLab")),
            "enableParentPortal": bool(features.get("enableParentPortal")),
            "enablePlacements": bool(features.get("enablePlacements")),
            "enableResearch": bool(features.get("enableResearch")),
            "enablePublicPortfolio": bool(features.get("enablePublicPortfolio")),
        },
    }


def save_settings(db: Session, user: User, body: dict) -> dict:
    require_admin(user)
    inst = db.get(Institution, user.institution_id)
    if inst is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Institution not found")
    blob = settings_blob(inst)
    identity = {**(blob.get("identity") or {}), **((body or {}).get("institution") or {})}
    academics = {**(blob.get("academics") or {}), **((body or {}).get("academics") or {})}
    security = {**(blob.get("security") or {}), **((body or {}).get("security") or {})}
    features = {**(blob.get("features") or {}), **((body or {}).get("features") or {})}
    if identity.get("name"):
        inst.name = str(identity["name"])
    if identity.get("shortName") is not None:
        inst.short_name = identity.get("shortName")
    if identity.get("timezone"):
        inst.timezone = identity["timezone"]
    threshold = academics.get("attendanceThreshold")
    if threshold is not None:
        try:
            inst.attendance_threshold = float(str(threshold).replace("%", ""))
        except (TypeError, ValueError):
            pass
    pass_mark = academics.get("passMark")
    if pass_mark is not None:
        try:
            inst.pass_mark = float(str(pass_mark).replace("%", ""))
        except (TypeError, ValueError):
            pass
    inst.settings_json = json.dumps({"identity": identity, "academics": academics, "security": security, "features": features})
    write_audit(db, user, action="UPDATE", resource_type="settings", resource_id=inst.id, after={"features": features})
    db.commit()
    return {"ok": True, **settings_payload(db, user)}


def empty_p3(kind: str) -> dict:
    base = {"unavailable": True, "gap": P3_GAP}
    if kind == "revenue":
        return {**base, "kpis": [], "invoices": [], "revenueTrend": [], "bySource": [], "byDept": []}
    if kind == "scholarships":
        return {**base, "items": []}
    if kind == "cms":
        return {**base, "pages": [], "banners": [], "announcements": []}
    if kind == "api-config":
        return {**base, "endpoints": [], "webhooks": [], "keys": []}
    if kind == "data-tools":
        return {**base, "exports": [], "imports": [], "templates": []}
    if kind == "permissions":
        return {**base, "modules": []}
    if kind == "placements":
        return {**base, "kpis": [], "branchWise": [], "companyWise": [], "salaryTrend": [], "drives": []}
    if kind == "ai-config":
        return {**base, "models": [], "quotas": [], "prompts": [], "guardrails": {}}
    return base


def _attendance_by_student(db: Session, institution_id: str) -> dict[str, float]:
    sessions = db.scalars(select(AttendanceSession).join(Course).where(Course.institution_id == institution_id)).all()
    if not sessions:
        return {}
    records = db.scalars(select(AttendanceRecord).where(AttendanceRecord.session_id.in_([row.id for row in sessions]))).all()
    grouped: dict[str, list[AttendanceRecord]] = defaultdict(list)
    for record in records:
        grouped[record.student_id].append(record)
    out = {}
    for student_id, rows in grouped.items():
        total = len(rows)
        present = sum(1 for row in rows if row.mark == "present")
        out[student_id] = round1((present / total) * 100) if total else 0
    return out


def _attendance_stats(db: Session, institution_id: str, depts: dict[str, Department], student_dept: dict[str, str | None]) -> dict:
    sessions = db.scalars(select(AttendanceSession).join(Course).where(Course.institution_id == institution_id).order_by(AttendanceSession.session_date)).all()
    if not sessions:
        return {"overall": 0, "trend": [], "weekly": [], "byDept": [], "best": None, "worst": None, "belowThreshold": [], "belowThresholdCount": 0, "hasEvidence": False}
    records = db.scalars(select(AttendanceRecord).where(AttendanceRecord.session_id.in_([s.id for s in sessions]))).all()
    by_session: dict[str, list[AttendanceRecord]] = defaultdict(list)
    by_student: dict[str, list[AttendanceRecord]] = defaultdict(list)
    for record in records:
        by_session[record.session_id].append(record)
        by_student[record.student_id].append(record)
    class_pcts = []
    weekly = []
    for index, session in enumerate(sessions):
        rows = by_session[session.id]
        total = len(rows)
        present = sum(1 for row in rows if row.mark == "present")
        pct = round1((present / total) * 100) if total else 0
        class_pcts.append(pct)
        weekly.append({"week": f"W{index + 1}", "pct": pct})
    overall = round1(sum(class_pcts) / len(class_pcts)) if class_pcts else 0
    by_dept_acc: dict[str, list[float]] = defaultdict(list)
    users = {u.id: u for u in db.scalars(select(User).where(User.institution_id == institution_id)).all()}
    profiles = {p.user_id: p for p in db.scalars(select(StudentProfile).where(StudentProfile.institution_id == institution_id)).all()}
    inst = db.get(Institution, institution_id)
    threshold = inst.attendance_threshold if inst else 75
    below = []
    for student_id, rows in by_student.items():
        total = len(rows)
        present = sum(1 for row in rows if row.mark == "present")
        pct = round1((present / total) * 100) if total else 0
        dept_id = student_dept.get(student_id)
        dept = depts.get(dept_id) if dept_id else None
        if dept:
            by_dept_acc[dept.code].append(pct)
        if pct < threshold:
            profile = profiles.get(student_id)
            user = users.get(student_id)
            below.append(
                {
                    "name": user.full_name if user else student_id,
                    "roll": profile.roll_no if profile else None,
                    "dept": dept.code if dept else None,
                    "attendance": pct,
                    "classesMissed": total - present,
                }
            )
    by_dept = [{"dept": code, "pct": round1(sum(vals) / len(vals))} for code, vals in sorted(by_dept_acc.items())]
    best = max(by_dept, key=lambda row: row["pct"]) if by_dept else None
    worst = min(by_dept, key=lambda row: row["pct"]) if by_dept else None
    trend = [{"month": iso(session.session_date)[:7] if session.session_date else f"S{i+1}", "pct": class_pcts[i]} for i, session in enumerate(sessions)]
    return {
        "overall": overall,
        "trend": trend,
        "weekly": weekly,
        "byDept": by_dept,
        "best": best,
        "worst": worst,
        "belowThreshold": below,
        "belowThresholdCount": len(below),
        "hasEvidence": True,
    }


def _assignment_stats(db: Session, institution_id: str) -> dict:
    assignments = db.scalars(select(Assignment).where(Assignment.institution_id == institution_id)).all()
    if not assignments:
        return {"total": 0, "submissionRate": 0, "onTimeRate": None, "aiGradedShare": None, "byDept": [], "monthly": [], "hasEvidence": False}
    enroll_total = 0
    submitted = 0
    for assignment in assignments:
        enrolled = db.scalar(
            select(func.count())
            .select_from(Enrollment)
            .join(StudentProfile, StudentProfile.user_id == Enrollment.student_id)
            .where(Enrollment.course_id == assignment.course_id, StudentProfile.institution_id == institution_id)
        ) or 0
        subs = db.scalar(select(func.count()).select_from(AssignmentSubmission).where(AssignmentSubmission.assignment_id == assignment.id)) or 0
        enroll_total += int(enrolled)
        submitted += int(subs)
    rate = round1((submitted / enroll_total) * 100) if enroll_total else 0
    return {
        "total": len(assignments),
        "submissionRate": rate,
        "onTimeRate": None,
        "aiGradedShare": None,
        "byDept": [],
        "monthly": [],
        "hasEvidence": True,
    }


def _exam_stats(db: Session, institution_id: str, pass_mark: float) -> dict:
    attempts = db.scalars(
        select(ExamAttempt).where(ExamAttempt.institution_id == institution_id, ExamAttempt.is_demo.is_(False))
    ).all()
    papers = db.scalars(select(Paper).where(Paper.institution_id == institution_id)).all()
    accuracies = []
    by_subject: dict[str, list[float]] = defaultdict(list)
    dist = {"90–100": 0, "80–89": 0, "70–79": 0, "60–69": 0, "Below 60": 0}
    passed = 0
    for attempt in attempts:
        scoring = parse_json(attempt.scoring, {})
        acc = scoring.get("accuracy")
        if acc is None:
            continue
        acc = float(acc)
        accuracies.append(acc)
        if acc >= pass_mark:
            passed += 1
        if acc >= 90:
            dist["90–100"] += 1
        elif acc >= 80:
            dist["80–89"] += 1
        elif acc >= 70:
            dist["70–79"] += 1
        elif acc >= 60:
            dist["60–69"] += 1
        else:
            dist["Below 60"] += 1
        label = attempt.exam_name or "Exam"
        by_subject[label].append(acc)
    upcoming = []
    drafting = 0
    ready = 0
    in_review = 0
    for paper in papers:
        st = (paper.status or "draft").lower()
        if st == "published":
            ready += 1
            label = "Ready"
        elif st in {"review", "in_review"}:
            in_review += 1
            label = "In Review"
        else:
            drafting += 1
            label = "Drafting"
        upcoming.append({"title": paper.title, "date": iso(paper.created_at)[:10] if paper.created_at else None, "students": None, "status": label})
    avg_score = round1(sum(accuracies) / len(accuracies)) if accuracies else None
    pass_rate = round1((passed / len(accuracies)) * 100) if accuracies else None
    return {
        "total": len(papers) or len(attempts),
        "averageScore": avg_score,
        "passRate": pass_rate,
        "malpractice": 0,
        "scoreDistribution": [{"range": key, "count": value} for key, value in dist.items()] if accuracies else [],
        "bySubject": [{"subject": name, "avg": round1(sum(vals) / len(vals))} for name, vals in by_subject.items()],
        "upcoming": upcoming,
        "readiness": {"total": len(papers), "ready": ready, "inReview": in_review, "drafting": drafting},
        "hasEvidence": bool(attempts or papers),
    }


def _interventions(db: Session, institution_id: str) -> list[dict]:
    rows = db.scalars(select(Intervention).where(Intervention.institution_id == institution_id).order_by(Intervention.created_at.desc())).all()
    items = []
    for row in rows:
        items.append(
            {
                "id": row.id,
                "priority": (row.priority or "medium").title(),
                "category": row.title,
                "reason": row.objectives or row.title,
                "action": row.recommended_action,
                "expected": row.expected_outcome,
            }
        )
    return items


def build_admin_profile(db: Session, user: User) -> dict:
    inst = db.get(Institution, user.institution_id) if user.institution_id else None
    blob = settings_blob(inst)
    identity = blob.get("identity") or {}
    names = (user.full_name or "").split(" ", 1)
    first = user.first_name or (names[0] if names else None)
    campuses = [
        {"id": c.id, "name": c.name, "city": c.city, "students": c.student_count}
        for c in db.scalars(select(Campus).where(Campus.institution_id == user.institution_id)).all()
    ]
    depts = list_departments(db, user.institution_id)
    programs = list_programs(db, user.institution_id)
    current_term = db.scalars(
        select(AcademicTerm).where(AcademicTerm.institution_id == user.institution_id, AcademicTerm.is_current.is_(True))
    ).first()
    totals = {
        "students": _count(db, StudentProfile, user.institution_id),
        "faculty": _count(db, FacultyProfile, user.institution_id),
        "courses": _count(db, Course, user.institution_id),
        "departments": len(depts),
        "programs": len(programs),
        "activeBatches": _count(db, Batch, user.institution_id),
    }
    return {
        "id": inst.id if inst else user.institution_id,
        "userId": user.id,
        "firstName": first,
        "fullName": user.full_name,
        "email": user.email,
        "name": inst.name if inst else None,
        "shortName": inst.short_name if inst else None,
        "type": identity.get("type"),
        "tagline": identity.get("tagline"),
        "address": identity.get("address"),
        "phone": identity.get("phone") or user.phone,
        "institutionEmail": identity.get("email"),
        "timezone": inst.timezone if inst else None,
        "fiscalYear": identity.get("fiscalYear"),
        "campuses": campuses,
        "branches": [c.get("city") for c in campuses if c.get("city")],
        "academicYear": inst.academic_year if inst else None,
        "currentSemester": {
            "id": current_term.id if current_term else None,
            "name": current_term.name if current_term else None,
            "label": current_term.name if current_term else (inst.academic_year if inst else None),
            "system": "Semester",
            "gradingScale": "10-point CGPA",
            "attendanceThreshold": inst.attendance_threshold if inst else 75,
            "passMark": inst.pass_mark if inst else 40,
        },
        "academicCalendarContext": None,
        "totals": totals,
        "leadership": identity.get("leadership") or {},
        "departments": depts,
        "programs": [{"code": p.get("code"), "name": p.get("name"), "dept": p.get("dept"), "duration": p.get("duration"), "students": p.get("students")} for p in programs],
        "aiContext": {"aiAdoptionSessions": _count(db, AiTrace, user.institution_id)},
    }


def assemble_admin_intelligence(db: Session, user: User) -> dict:
    require_admin(user)
    profile = build_admin_profile(db, user)
    inst = db.get(Institution, user.institution_id)
    pass_mark = inst.pass_mark if inst else 40
    depts_rows = {d.id: d for d in db.scalars(select(Department).where(Department.institution_id == user.institution_id)).all()}
    student_profiles = db.scalars(select(StudentProfile).where(StudentProfile.institution_id == user.institution_id)).all()
    student_dept = {p.user_id: p.department_id for p in student_profiles}
    attendance = _attendance_stats(db, user.institution_id, depts_rows, student_dept)
    assignments = _assignment_stats(db, user.institution_id)
    exams = _exam_stats(db, user.institution_id, pass_mark)
    bank = question_bank_payload(db, user.institution_id)
    research = research_payload(db, user.institution_id)
    people_students = students_payload(db, user.institution_id)
    people_faculty = faculty_payload(db, user.institution_id)
    interventions_sql = _interventions(db, user.institution_id)
    reports_items = []
    try:
        from app.services.reports_runtime import list_reports

        reports_items = list_reports(db, user)
    except Exception:
        reports_items = []

    totals = profile["totals"]
    has_people = bool(totals["students"] or totals["faculty"])
    has_catalog = bool(totals["departments"] or totals["courses"] or totals["programs"])
    has_ops = attendance["hasEvidence"] or assignments["hasEvidence"] or exams["hasEvidence"] or bool(bank["summary"]["total"])
    has_evidence = has_people or has_catalog or has_ops

    cgpas = [p.cgpa for p in student_profiles if p.cgpa is not None]
    cgpa_avg = round1(sum(cgpas) / len(cgpas)) if cgpas else None
    at_risk = []
    for student in people_students["students"]:
        att = student.get("attendance")
        status_label = (student.get("status") or "").lower()
        if (att is not None and att < (inst.attendance_threshold if inst else 75)) or status_label in {"at risk", "at_risk", "needs attention"}:
            at_risk.append(student)
    at_risk_rate = round1((len(at_risk) / totals["students"]) * 100) if totals["students"] else 0

    academic_score = 0.0
    if has_evidence:
        parts = []
        if exams["passRate"] is not None:
            parts.append(exams["passRate"])
        if cgpa_avg is not None:
            parts.append(min(cgpa_avg * 10, 100))
        if attendance["hasEvidence"]:
            parts.append(attendance["overall"])
        if assignments["hasEvidence"]:
            parts.append(assignments["submissionRate"])
        academic_score = round1(sum(parts) / len(parts)) if parts else 0

    student_success = round1(clamp(100 - min(at_risk_rate, 100))) if totals["students"] else 0
    attendance_score = attendance["overall"] if attendance["hasEvidence"] else 0
    assessment_score = 0.0
    if exams["hasEvidence"] or assignments["hasEvidence"] or bank["summary"]["total"]:
        bits = [v for v in (exams["averageScore"], exams["passRate"], assignments["submissionRate"] if assignments["hasEvidence"] else None) if v is not None]
        assessment_score = round1(sum(bits) / len(bits)) if bits else 0
    pubs = research["kpis"][0]["value"] if research["kpis"] else 0
    faculty_score = 0.0
    if totals["faculty"]:
        faculty_score = round1(clamp((pubs / max(totals["faculty"], 1)) * 20 + (50 if totals["faculty"] else 0)))
    outcomes_score = 0.0  # placements/grants are P3 — do not invent

    pillars = [
        {"label": "Academic health", "value": academic_score, "grade": grade_for(academic_score, has_evidence=has_evidence)},
        {"label": "Student success", "value": student_success, "grade": grade_for(student_success, has_evidence=bool(totals["students"]))},
        {"label": "Attendance health", "value": attendance_score, "grade": grade_for(attendance_score, has_evidence=attendance["hasEvidence"])},
        {"label": "Assessment health", "value": assessment_score, "grade": grade_for(assessment_score, has_evidence=exams["hasEvidence"] or assignments["hasEvidence"])},
        {"label": "Faculty health", "value": faculty_score, "grade": grade_for(faculty_score, has_evidence=bool(totals["faculty"]))},
        {"label": "Outcomes", "value": outcomes_score, "grade": grade_for(outcomes_score, has_evidence=False)},
    ]
    health_score = round1(sum(p["value"] * w for p, w in zip(pillars, (0.25, 0.2, 0.15, 0.15, 0.15, 0.1)))) if has_evidence else 0
    institution_health = {"score": health_score, "grade": grade_for(health_score, has_evidence=has_evidence), "pillars": pillars}

    dept_list = []
    for dept in profile["departments"]:
        att_row = next((row for row in attendance["byDept"] if row["dept"] == dept["code"]), None)
        att_pct = att_row["pct"] if att_row else (attendance["overall"] if attendance["hasEvidence"] else 0)
        pass_rate = exams["passRate"] if exams["passRate"] is not None else 0
        score = round1(pass_rate * 0.5 + att_pct * 0.5) if (exams["hasEvidence"] or attendance["hasEvidence"]) else 0
        dept_list.append(
            {
                **dept,
                "passRate": exams["passRate"],
                "attendance": att_pct if attendance["hasEvidence"] else None,
                "placement": None,
                "score": score,
                "grade": grade_for(score, has_evidence=exams["hasEvidence"] or attendance["hasEvidence"] or bool(dept["students"])),
            }
        )
    dept_list.sort(key=lambda row: row["score"] or 0, reverse=True)
    departments = {
        "list": dept_list,
        "best": dept_list[0] if dept_list else None,
        "worst": dept_list[-1] if dept_list else None,
        "avgScore": round1(sum(d["score"] or 0 for d in dept_list) / len(dept_list)) if dept_list else 0,
    }

    risk_trend = [{"month": row.get("month") or row.get("week"), "atRisk": at_risk_rate} for row in (attendance["trend"] or attendance["weekly"] or [])]
    students_derived = {
        "totals": {
            "totalStudents": totals["students"],
            "activeRisk": len(at_risk),
            "improvingStudents": 0,
            "flagged": len(at_risk),
            "recoveryRate": None,
            "avgWeeksToRecover": None,
        },
        "riskTrend": risk_trend,
        "riskSummary": {
            "latestRate": at_risk_rate if totals["students"] else 0,
            "firstRate": risk_trend[0]["atRisk"] if risk_trend else at_risk_rate,
            "trendDelta": 0,
            "trendReduction": 0,
        },
        "distribution": [],
        "distributionSummary": {},
        "highPerformers": [
            {"name": s["name"], "dept": s.get("dept"), "cgpa": s.get("cgpa")}
            for s in sorted([s for s in people_students["students"] if s.get("cgpa") is not None], key=lambda s: s["cgpa"], reverse=True)[:6]
        ],
        "attendanceRisk": attendance["belowThreshold"],
        "retention": None,
        "cgpaAvg": cgpa_avg,
    }

    faculty_by_dept: dict[str, int] = defaultdict(int)
    for row in people_faculty["faculty"]:
        faculty_by_dept[row.get("dept") or "—"] += 1
    faculty_derived = {
        "totals": totals["faculty"],
        "health": {
            "score": faculty_score,
            "grade": grade_for(faculty_score, has_evidence=bool(totals["faculty"])),
            "teachingSatisfaction": None,
            "publicationsPerFaculty": round1(pubs / totals["faculty"]) if totals["faculty"] else 0,
            "factors": [
                {"label": "Teaching satisfaction", "value": None},
                {"label": "Digital satisfaction", "value": None},
                {"label": "Research output", "value": faculty_score},
            ],
        },
        "rosterCount": people_faculty["total"],
        "byDept": [{"code": code, "count": count} for code, count in faculty_by_dept.items()],
    }

    assessments = {
        "exams": exams,
        "assignments": assignments,
        "questionBank": bank["summary"],
        "attendance": {"overall": attendance["overall"] if attendance["hasEvidence"] else None},
    }

    interventions = {
        "list": interventions_sql,
        "critical": sum(1 for i in interventions_sql if i.get("priority") == "Critical"),
        "high": sum(1 for i in interventions_sql if i.get("priority") == "High"),
    }

    first = profile.get("firstName") or "Admin"
    hour = utcnow().hour
    period = "morning" if hour < 12 else "afternoon" if hour < 17 else "evening"
    report_institution = {
        "headline": f"Institution health {health_score}/100 ({institution_health['grade']})",
        "body": (
            f"{totals['students']} students · {totals['faculty']} faculty across {totals['departments']} departments."
            if has_evidence
            else "No operational records yet. KPIs will fill in from students, faculty, attendance, assignments and exams."
        ),
        "highlights": [
            f"{len(at_risk)} at-risk students",
            f"Exam pass rate {exams['passRate'] if exams['passRate'] is not None else '—'}% · attendance {attendance['overall'] if attendance['hasEvidence'] else '—'}%",
            f"AI traces {profile['aiContext']['aiAdoptionSessions']}",
        ],
    }

    derived = {
        "profile": {
            "name": profile["name"],
            "shortName": profile["shortName"],
            "address": profile.get("address"),
            "phone": profile.get("phone"),
            "email": profile.get("email"),
            "timezone": profile.get("timezone"),
            "fiscalYear": profile.get("fiscalYear"),
            "academicYear": profile.get("academicYear"),
            "currentSemester": (profile.get("currentSemester") or {}).get("label"),
            "firstName": first,
            "fullName": profile.get("fullName"),
        },
        "masterProfile": profile,
        "totals": totals,
        "institutionHealth": institution_health,
        "departments": departments,
        "students": students_derived,
        "faculty": faculty_derived,
        "academics": {
            "programs": profile["programs"],
            "courses": totals["courses"],
            "subjects": _count(db, Subject, user.institution_id),
            "batches": totals["activeBatches"],
            "calendar": list_calendar(db, user.institution_id),
            "deptHodMap": {d["code"]: d.get("hod") for d in profile["departments"]},
        },
        "assessments": assessments,
        "attendance": attendance,
        "interventions": interventions,
        "reports": {
            "institution": report_institution,
            "library": reports_items,
        },
        "ai": {
            "insights": [],
            "recommendations": [],
            "reportTemplates": [],
            "promptSeeds": [],
            "aiAdoption": {"sessions": profile["aiContext"]["aiAdoptionSessions"]},
            "greeting": f"Good {period}, {first}.",
        },
        "generatedAt": utcnow().isoformat(),
    }

    datasets = {
        "profile": profile,
        "people": {"students": people_students["students"], "faculty": people_faculty["faculty"]},
        "analytics": {
            "adminAnalytics": {
                "retention": [],
                "genderSplit": [],
                "semesterWise": [],
                "feeCollection": [],
                "aiUsage": [{"month": "now", "sessions": profile["aiContext"]["aiAdoptionSessions"]}] if profile["aiContext"]["aiAdoptionSessions"] else [],
                "satisfaction": {},
            },
            "adminPerformance": {"deptPassRates": [{"dept": d["code"], "pass": d.get("passRate")} for d in dept_list if d.get("passRate") is not None]},
            "adminAttendanceAnalytics": attendance,
            "adminExamAnalytics": {
                "kpis": [
                    {"label": "Exams this term", "value": exams["total"]},
                    {"label": "Average score", "value": exams["averageScore"]},
                    {"label": "Pass rate", "value": exams["passRate"]},
                ],
                "scoreDistribution": exams["scoreDistribution"],
                "bySubject": exams["bySubject"],
                "upcoming": exams["upcoming"],
            },
            "adminAssignmentAnalytics": {
                "kpis": [
                    {"label": "Assignments this term", "value": assignments["total"]},
                    {"label": "Submission rate", "value": assignments["submissionRate"]},
                ],
                "byDept": [],
                "monthly": [],
            },
            "adminQuestionBank": bank,
            "adminResearch": research,
            "adminPlacements": empty_p3("placements"),
            "adminRevenue": empty_p3("revenue"),
        },
        "academics": {
            "adminCourses": list_courses(db, user.institution_id),
            "adminSubjects": list_subjects(db, user.institution_id),
            "adminBatches": list_batches(db, user.institution_id),
            "adminAcademicCalendar": list_calendar(db, user.institution_id),
            "adminPrograms": list_programs(db, user.institution_id),
            "deptHodMap": {d["code"]: d.get("hod") for d in profile["departments"]},
        },
        "ai": {"execInsightPool": [], "interventionPool": [], "adminReportTemplates": [], "execPromptSeeds": []},
    }
    return {"profile": profile, "datasets": datasets, "derived": derived}


def create_student(db: Session, user: User, body: dict) -> dict:
    require_admin(user)
    email = str((body or {}).get("email") or "").strip().lower()
    name = str((body or {}).get("fullName") or (body or {}).get("name") or "").strip()
    roll = str((body or {}).get("roll") or (body or {}).get("rollNo") or "").strip()
    if not email or not name or not roll:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "email, fullName and roll are required")
    existing = db.scalars(select(User).where(User.institution_id == user.institution_id, User.email == email)).first()
    if existing:
        raise HTTPException(status.HTTP_409_CONFLICT, "A user with this email already exists")
    password = str((body or {}).get("password") or secrets.token_urlsafe(8))
    row = User(
        institution_id=user.institution_id,
        email=email,
        password_hash=hash_password(password),
        full_name=name,
        first_name=name.split(" ", 1)[0],
        status="active",
        legacy_role="student",
    )
    db.add(row)
    db.flush()
    role = _ensure_role(db, user.institution_id, "student")
    db.add(UserRole(user_id=row.id, role_id=role.id, institution_id=user.institution_id))
    db.add(
        StudentProfile(
            user_id=row.id,
            institution_id=user.institution_id,
            roll_no=roll,
            program_id=(body or {}).get("programId"),
            department_id=(body or {}).get("departmentId"),
            batch_id=(body or {}).get("batchId"),
            academic_status="regular",
        )
    )
    write_audit(db, user, action="CREATE", resource_type="student", resource_id=row.id, after={"email": email, "roll": roll})
    db.commit()
    db.refresh(row)
    return {"ok": True, "student": {"id": row.id, "email": row.email, "name": row.full_name, "roll": roll}}


def create_faculty(db: Session, user: User, body: dict) -> dict:
    require_admin(user)
    email = str((body or {}).get("email") or "").strip().lower()
    name = str((body or {}).get("fullName") or (body or {}).get("name") or email.split("@")[0]).strip()
    if not email:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "email is required")
    existing = db.scalars(select(User).where(User.institution_id == user.institution_id, User.email == email)).first()
    if existing:
        raise HTTPException(status.HTTP_409_CONFLICT, "A user with this email already exists")
    password = str((body or {}).get("password") or secrets.token_urlsafe(8))
    row = User(
        institution_id=user.institution_id,
        email=email,
        password_hash=hash_password(password),
        full_name=name,
        first_name=name.split(" ", 1)[0],
        status=(body or {}).get("status") or "invited",
        legacy_role="faculty",
    )
    db.add(row)
    db.flush()
    role = _ensure_role(db, user.institution_id, "faculty")
    db.add(UserRole(user_id=row.id, role_id=role.id, institution_id=user.institution_id))
    db.add(
        FacultyProfile(
            user_id=row.id,
            institution_id=user.institution_id,
            department_id=(body or {}).get("departmentId"),
            designation=(body or {}).get("designation"),
        )
    )
    write_audit(db, user, action="CREATE", resource_type="faculty", resource_id=row.id, after={"email": email})
    db.commit()
    db.refresh(row)
    return {"ok": True, "faculty": {"id": row.id, "email": row.email, "name": row.full_name, "status": row.status}}


def invite_users(db: Session, user: User, body: dict) -> dict:
    require_admin(user)
    emails = (body or {}).get("emails") or []
    if isinstance(emails, str):
        emails = [part.strip() for part in re.split(r"[\s,;]+", emails) if part.strip()]
    role_code = str((body or {}).get("role") or "student").lower()
    if role_code not in {"admin", "faculty", "student", "parent"}:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "role must be admin, faculty, student or parent")
    created = []
    for email in emails:
        email = email.strip().lower()
        if not email:
            continue
        existing = db.scalars(select(User).where(User.institution_id == user.institution_id, User.email == email)).first()
        if existing:
            continue
        name = email.split("@")[0]
        row = User(
            institution_id=user.institution_id,
            email=email,
            password_hash=hash_password(secrets.token_urlsafe(8)),
            full_name=name,
            status="invited",
            legacy_role=role_code,
        )
        db.add(row)
        db.flush()
        role = _ensure_role(db, user.institution_id, role_code)
        db.add(UserRole(user_id=row.id, role_id=role.id, institution_id=user.institution_id))
        if role_code == "faculty":
            db.add(FacultyProfile(user_id=row.id, institution_id=user.institution_id, department_id=(body or {}).get("departmentId")))
        elif role_code == "student":
            roll = f"INV-{row.id[:8]}"
            db.add(StudentProfile(user_id=row.id, institution_id=user.institution_id, roll_no=roll, department_id=(body or {}).get("departmentId")))
        created.append({"id": row.id, "email": email, "role": role_code, "status": "invited"})
    write_audit(db, user, action="CREATE", resource_type="invite", after={"count": len(created), "role": role_code})
    db.commit()
    return {"ok": True, "invited": created, "count": len(created)}


def set_user_status(db: Session, user: User, user_id: str, body: dict) -> dict:
    require_admin(user)
    target = db.get(User, user_id)
    if not target or target.institution_id != user.institution_id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "User not found")
    new_status = str((body or {}).get("status") or "").lower()
    if new_status not in {"active", "inactive", "suspended", "invited"}:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "status must be active, inactive, suspended or invited")
    before = target.status
    target.status = new_status
    write_audit(db, user, action="UPDATE", resource_type="user", resource_id=target.id, before={"status": before}, after={"status": new_status})
    db.commit()
    return {"ok": True, "user": {"id": target.id, "status": target.status}}


def create_department(db: Session, user: User, body: dict) -> dict:
    require_admin(user)
    code = str((body or {}).get("code") or "").strip().upper()
    name = str((body or {}).get("name") or "").strip()
    if not code or not name:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "code and name are required")
    row = Department(institution_id=user.institution_id, code=code, name=name, hod_user_id=(body or {}).get("hodUserId"))
    db.add(row)
    write_audit(db, user, action="CREATE", resource_type="department", after={"code": code})
    db.commit()
    db.refresh(row)
    return {"ok": True, "department": {"id": row.id, "code": row.code, "name": row.name}}


def create_program(db: Session, user: User, body: dict) -> dict:
    require_admin(user)
    code = str((body or {}).get("code") or (body or {}).get("name") or "").strip()[:32]
    name = str((body or {}).get("name") or "").strip()
    if not name:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "name is required")
    duration = (body or {}).get("durationYears") or (body or {}).get("duration")
    years = None
    if duration:
        try:
            years = int(str(duration).split()[0])
        except ValueError:
            years = None
    row = Program(
        institution_id=user.institution_id,
        department_id=(body or {}).get("departmentId"),
        code=code or name[:16],
        name=name,
        degree_type=(body or {}).get("degreeType"),
        duration_years=years,
    )
    db.add(row)
    write_audit(db, user, action="CREATE", resource_type="program", after={"name": name})
    db.commit()
    db.refresh(row)
    return {"ok": True, "program": {"id": row.id, "code": row.code, "name": row.name}}


def create_course(db: Session, user: User, body: dict) -> dict:
    require_admin(user)
    code = str((body or {}).get("code") or "").strip()
    name = str((body or {}).get("name") or (body or {}).get("title") or "").strip()
    if not code or not name:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "code and name are required")
    row = Course(
        institution_id=user.institution_id,
        program_id=(body or {}).get("programId"),
        subject_id=(body or {}).get("subjectId"),
        code=code,
        name=name,
        credits=(body or {}).get("credits"),
        semester_no=(body or {}).get("semesterNo"),
    )
    db.add(row)
    write_audit(db, user, action="CREATE", resource_type="course", after={"code": code})
    db.commit()
    db.refresh(row)
    return {"ok": True, "course": {"id": row.id, "code": row.code, "title": row.name}}


def create_subject(db: Session, user: User, body: dict) -> dict:
    require_admin(user)
    code = str((body or {}).get("code") or "").strip()
    name = str((body or {}).get("name") or "").strip()
    if not code or not name:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "code and name are required")
    row = Subject(
        institution_id=user.institution_id,
        department_id=(body or {}).get("departmentId"),
        code=code,
        name=name,
        exam_mode=(body or {}).get("examMode") or "university",
        exam_family=(body or {}).get("examFamily"),
    )
    db.add(row)
    write_audit(db, user, action="CREATE", resource_type="subject", after={"code": code})
    db.commit()
    db.refresh(row)
    return {"ok": True, "subject": {"id": row.id, "code": row.code, "name": row.name}}


def create_batch(db: Session, user: User, body: dict) -> dict:
    require_admin(user)
    code = str((body or {}).get("code") or (body or {}).get("name") or "").strip()
    name = str((body or {}).get("name") or code).strip()
    if not code:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "name is required")
    row = Batch(
        institution_id=user.institution_id,
        code=code[:64],
        name=name,
        exam_mode=(body or {}).get("examMode") or "university",
        exam_family=(body or {}).get("examFamily"),
        program_id=(body or {}).get("programId"),
        section=(body or {}).get("section"),
    )
    db.add(row)
    write_audit(db, user, action="CREATE", resource_type="batch", after={"code": code})
    db.commit()
    db.refresh(row)
    return {"ok": True, "batch": {"id": row.id, "code": row.code, "name": row.name}}


def create_calendar_event(db: Session, user: User, body: dict) -> dict:
    require_admin(user)
    title = str((body or {}).get("title") or "").strip()
    if not title:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "title is required")
    starts = None
    raw = (body or {}).get("date") or (body or {}).get("startsAt")
    if raw:
        try:
            starts = datetime.fromisoformat(str(raw).replace("Z", "+00:00"))
        except ValueError:
            try:
                starts = datetime.fromisoformat(str(raw)[:10] + "T00:00:00+00:00")
            except ValueError:
                starts = utcnow()
    row = CalendarEvent(
        institution_id=user.institution_id,
        title=title,
        kind=str((body or {}).get("type") or (body or {}).get("kind") or "academic").lower(),
        starts_at=starts or utcnow(),
        payload=json.dumps({"scope": (body or {}).get("scope") or "All"}),
    )
    db.add(row)
    write_audit(db, user, action="CREATE", resource_type="calendar", after={"title": title})
    db.commit()
    db.refresh(row)
    return {"ok": True, "event": {"id": row.id, "title": row.title, "date": iso(row.starts_at)[:10] if row.starts_at else None, "type": row.kind.title(), "scope": "All"}}


def support_tickets(db: Session, user: User) -> dict:
    rows = db.scalars(select(SupportTicket).where(SupportTicket.institution_id == user.institution_id).order_by(SupportTicket.created_at.desc())).all()
    return {
        "items": [
            {"id": row.id, "title": row.title, "body": row.body, "status": row.status, "createdAt": iso(row.created_at)}
            for row in rows
        ]
    }


def create_support_ticket(db: Session, user: User, body: dict) -> dict:
    require_admin(user)
    title = str((body or {}).get("title") or "").strip()
    if not title:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "title is required")
    row = SupportTicket(
        institution_id=user.institution_id,
        requester_id=user.id,
        title=title,
        body=(body or {}).get("body") or (body or {}).get("details"),
        status="open",
    )
    db.add(row)
    write_audit(db, user, action="CREATE", resource_type="support", after={"title": title})
    db.commit()
    db.refresh(row)
    return {"ok": True, "ticket": {"id": row.id, "title": row.title, "status": row.status}}


def executive_history(db: Session, user: User) -> dict:
    convos = db.scalars(
        select(AiConversation)
        .where(AiConversation.user_id == user.id, AiConversation.channel == "executive")
        .order_by(AiConversation.created_at.desc())
    ).all()
    threads = []
    for conv in convos:
        messages = db.scalars(select(AiMessage).where(AiMessage.conversation_id == conv.id).order_by(AiMessage.created_at)).all()
        threads.append(
            {
                "id": conv.id,
                "title": conv.title,
                "updated": iso(conv.created_at),
                "messages": [{"id": m.id, "role": m.role, "text": m.content} for m in messages],
            }
        )
    return {"threads": threads, "history": threads}


def executive_context(db: Session, user: User) -> dict:
    snap = assemble_admin_intelligence(db, user)
    derived = snap["derived"]
    health = derived.get("institutionHealth") or {}
    totals = derived.get("totals") or {}
    return {
        "institution": derived.get("profile", {}).get("name"),
        "health": health.get("score"),
        "grade": health.get("grade"),
        "students": totals.get("students"),
        "faculty": totals.get("faculty"),
        "departments": totals.get("departments"),
        "atRisk": (derived.get("students") or {}).get("totals", {}).get("activeRisk"),
        "attendance": (derived.get("attendance") or {}).get("overall"),
        "examPassRate": ((derived.get("assessments") or {}).get("exams") or {}).get("passRate"),
        "questions": ((derived.get("assessments") or {}).get("questionBank") or {}).get("total"),
    }
