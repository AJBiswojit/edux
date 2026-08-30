import json
from collections import defaultdict

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.catalog import Batch, Department, Program
from app.models.exams import ExamAttempt
from app.models.identity import Institution, User
from app.models.people import FacultyProfile, StudentProfile


def _extra(profile: StudentProfile) -> dict:
    try:
        return json.loads(profile.extra or "{}")
    except json.JSONDecodeError:
        return {}


def _label_to_faculty_status(label: str | None) -> str:
    if label == "Excellent":
        return "Strong"
    if label == "At Risk":
        return "Needs Attention"
    if label == "Good":
        return "Stable"
    return "No exams"


def faculty_students_directory(db: Session, institution_id: str) -> dict:
    inst = db.get(Institution, institution_id) if institution_id else None
    academic_year = inst.academic_year if inst else None
    programs = {p.id: p for p in db.scalars(select(Program).where(Program.institution_id == institution_id)).all()}
    batches = db.scalars(select(Batch).where(Batch.institution_id == institution_id)).all()
    profiles = db.scalars(select(StudentProfile).where(StudentProfile.institution_id == institution_id)).all()
    user_ids = [p.user_id for p in profiles]
    users = {u.id: u for u in db.scalars(select(User).where(User.id.in_(user_ids))).all()} if user_ids else {}

    attempts_by_student: dict[str, list[ExamAttempt]] = defaultdict(list)
    if user_ids:
        for attempt in db.scalars(
            select(ExamAttempt).where(
                ExamAttempt.institution_id == institution_id,
                ExamAttempt.is_demo.is_(False),
            )
        ).all():
            attempts_by_student[attempt.student_id].append(attempt)

    batch_map = {b.id: b for b in batches}
    students_out = []
    for profile in profiles:
        user = users.get(profile.user_id)
        if not user:
            continue
        extra = _extra(profile)
        batch = batch_map.get(profile.batch_id)
        domain = extra.get("domain") or ("Competitive" if batch and batch.exam_mode == "competitive" else "University")
        exam_family = extra.get("examFamily")
        if exam_family is None and batch and batch.exam_family:
            exam_family = batch.exam_family.upper() if batch.exam_family in {"jee", "neet"} else batch.exam_family

        attempts = sorted(attempts_by_student.get(profile.user_id, []), key=lambda a: a.submitted_at or a.created_at)
        accuracies = []
        last = None
        for a in attempts:
            scoring = json.loads(a.scoring or "{}")
            acc = scoring.get("accuracy")
            if acc is not None:
                accuracies.append(acc)
            last = a
        if accuracies:
            latest = accuracies[-1]
            exams_completed = len(attempts)
            if latest < 55:
                status = "Needs Attention"
            elif latest >= 75:
                status = "Strong"
            else:
                status = "Stable"
            latest_accuracy = latest
            last_scoring = json.loads(last.scoring or "{}") if last else {}
            last_exam = {
                "title": last.exam_name,
                "shortTitle": last.exam_name,
                "date": last.submitted_at.isoformat()[:10] if last.submitted_at else None,
                "pct": last_scoring.get("accuracy"),
                "attemptId": last.id,
            }
        else:
            status = _label_to_faculty_status(extra.get("academicLabel"))
            exams_completed = 0
            latest_accuracy = None
            last_exam = None
            last_scoring = {}

        students_out.append(
            {
                "id": profile.user_id,
                "email": user.email,
                "roll": profile.roll_no,
                "name": user.full_name,
                "batchId": profile.batch_id,
                "batchName": batch.name if batch else "—",
                "domain": domain,
                "examFamily": exam_family,
                "program": extra.get("program") or (None),
                "course": None,
                "courseCode": None,
                "semester": extra.get("semester") or (batch.section if batch else None),
                "section": profile.section or (batch.section if batch else None),
                "academicSession": academic_year,
                "examsCompleted": exams_completed,
                "latestAccuracy": latest_accuracy,
                "accuracy": latest_accuracy,
                "latestScore": last_scoring.get("score") if last_scoring else None,
                "maxScore": last_scoring.get("maxScore") if last_scoring else None,
                "status": status,
                "trend": "stable",
                "attention": status == "Needs Attention",
                "attentionReason": "Academic record flagged at risk" if status == "Needs Attention" and not accuracies else None,
                "lastExam": last_exam,
                "accountStatus": user.status,
                "cgpa": profile.cgpa,
            }
        )

    overview = {
        "students": len(students_out),
        "batches": len(batches),
        "needsAttention": sum(1 for s in students_out if s["status"] == "Needs Attention"),
        "improving": sum(1 for s in students_out if s["status"] == "Improving"),
        "strong": sum(1 for s in students_out if s["status"] == "Strong"),
        "stable": sum(1 for s in students_out if s["status"] == "Stable"),
    }

    batch_rows = []
    for b in batches:
        members = [s for s in students_out if s["batchId"] == b.id]
        accuracies = [s["latestAccuracy"] for s in members if s["latestAccuracy"] is not None]
        domain = "Competitive" if b.exam_mode == "competitive" else "University"
        family = b.exam_family.upper() if b.exam_family in {"jee", "neet"} else b.exam_family
        program = programs.get(b.program_id)
        batch_rows.append(
            {
                "id": b.id,
                "name": b.name,
                "domain": domain,
                "examFamily": family,
                "academicSession": academic_year,
                "program": program.name if program else None,
                "section": b.section,
                "status": "Active",
                "studentCount": len(members),
                "avgAccuracy": round(sum(accuracies) / len(accuracies), 1) if accuracies else 0,
                "attentionCount": sum(1 for s in members if s["attention"]),
                "improvingCount": 0,
                "strongCount": sum(1 for s in members if s["status"] == "Strong"),
                "students": members,
            }
        )

    return {"overview": overview, "students": students_out, "batches": batch_rows}


def admin_students_payload(db: Session, institution_id: str) -> dict:
    profiles = db.scalars(select(StudentProfile).where(StudentProfile.institution_id == institution_id)).all()
    users = {u.id: u for u in db.scalars(select(User).where(User.institution_id == institution_id)).all()}
    depts = {d.id: d for d in db.scalars(select(Department).where(Department.institution_id == institution_id)).all()}
    items = []
    for profile in profiles:
        user = users.get(profile.user_id)
        if not user:
            continue
        extra = _extra(profile)
        dept = depts.get(profile.department_id)
        items.append(
            {
                "id": profile.user_id,
                "name": user.full_name,
                "roll": profile.roll_no,
                "email": user.email,
                "cgpa": profile.cgpa,
                "attendance": extra.get("attendance"),
                "internalMarks": extra.get("internalMarks"),
                "status": profile.academic_status or extra.get("academicLabel"),
                "dept": dept.code if dept else None,
                "program": extra.get("program"),
                "accountStatus": user.status,
            }
        )
    return {"students": items, "total": len(items)}


def admin_faculty_payload(db: Session, institution_id: str) -> dict:
    profiles = db.scalars(select(FacultyProfile).where(FacultyProfile.institution_id == institution_id)).all()
    users = {u.id: u for u in db.scalars(select(User).where(User.institution_id == institution_id)).all()}
    depts = {d.id: d for d in db.scalars(select(Department).where(Department.institution_id == institution_id)).all()}
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
                "status": "Active" if user.status == "active" else user.status.title(),
            }
        )
    return {"faculty": items, "total": len(items)}
