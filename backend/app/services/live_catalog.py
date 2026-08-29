"""Live Postgres serializers for catalog, people, teaching, and exams."""

from __future__ import annotations

import json
from collections import defaultdict
from datetime import datetime, timezone

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.assessment import Paper, PaperQuestion, Question
from app.models.catalog import Batch, CalendarEvent, Course, Department, Program, Subject
from app.models.identity import Institution, User
from app.models.people import Enrollment, FacultyProfile, StudentProfile
from app.models.teaching import Announcement, Assignment, AssignmentSubmission, AttendanceRecord, AttendanceSession
from app.services.spa_payloads import payload


def _iso(value) -> str | None:
    if value is None:
        return None
    if isinstance(value, datetime):
        if value.tzinfo is None:
            value = value.replace(tzinfo=timezone.utc)
        return value.isoformat()
    return str(value)


def _extra(profile: StudentProfile | None) -> dict:
    if profile is None:
        return {}
    try:
        return json.loads(profile.extra or "{}")
    except json.JSONDecodeError:
        return {}


def _dept_counts(db: Session, institution_id: str) -> tuple[dict[str, int], dict[str, int]]:
    students = defaultdict(int)
    faculty = defaultdict(int)
    for profile in db.scalars(select(StudentProfile).where(StudentProfile.institution_id == institution_id)).all():
        if profile.department_id:
            students[profile.department_id] += 1
    for profile in db.scalars(select(FacultyProfile).where(FacultyProfile.institution_id == institution_id)).all():
        if profile.department_id:
            faculty[profile.department_id] += 1
    return students, faculty


def admin_departments(db: Session, institution_id: str) -> list[dict]:
    depts = db.scalars(select(Department).where(Department.institution_id == institution_id).order_by(Department.code)).all()
    if not depts:
        return payload("admin-catalog", db).get("departments") or []
    student_n, faculty_n = _dept_counts(db, institution_id)
    programs = db.scalars(select(Program).where(Program.institution_id == institution_id)).all()
    prog_n = defaultdict(int)
    for program in programs:
        if program.department_id:
            prog_n[program.department_id] += 1
    users = {u.id: u for u in db.scalars(select(User).where(User.institution_id == institution_id)).all()}
    fixture = {row.get("code"): row for row in (payload("admin-catalog", db).get("departments") or [])}
    items = []
    for dept in depts:
        hod = users.get(dept.hod_user_id) if dept.hod_user_id else None
        base = fixture.get(dept.code) or {}
        items.append(
            {
                "id": dept.id,
                "name": dept.name,
                "code": dept.code,
                "students": student_n.get(dept.id, base.get("students") or 0),
                "faculty": faculty_n.get(dept.id, base.get("faculty") or 0),
                "programs": prog_n.get(dept.id, base.get("programs") or 0),
                "hod": hod.full_name if hod else base.get("hod"),
                "placement": base.get("placement"),
            }
        )
    return items


def admin_courses(db: Session, institution_id: str) -> list[dict]:
    courses = db.scalars(select(Course).where(Course.institution_id == institution_id).order_by(Course.code)).all()
    if not courses:
        return payload("admin-catalog", db).get("courses") or []
    depts = {d.id: d for d in db.scalars(select(Department).where(Department.institution_id == institution_id)).all()}
    subjects = {s.id: s for s in db.scalars(select(Subject).where(Subject.institution_id == institution_id)).all()}
    faculty = {p.user_id: p for p in db.scalars(select(FacultyProfile).where(FacultyProfile.institution_id == institution_id)).all()}
    users = {u.id: u for u in db.scalars(select(User).where(User.institution_id == institution_id)).all()}
    enrolled = dict(
        db.execute(
            select(Enrollment.course_id, func.count()).group_by(Enrollment.course_id)
        ).all()
    )
    fixture = {row.get("code"): row for row in (payload("admin-catalog", db).get("courses") or [])}
    items = []
    for course in courses:
        subject = subjects.get(course.subject_id)
        dept = depts.get(subject.department_id) if subject else None
        faculty_name = None
        for profile in faculty.values():
            if dept and profile.department_id == dept.id:
                faculty_name = users.get(profile.user_id).full_name if users.get(profile.user_id) else None
                break
        base = fixture.get(course.code) or {}
        items.append(
            {
                "id": course.id,
                "code": course.code,
                "title": course.name,
                "dept": dept.code if dept else base.get("dept"),
                "credits": course.credits or base.get("credits"),
                "enrolled": int(enrolled.get(course.id) or base.get("enrolled") or 0),
                "faculty": base.get("faculty") or faculty_name,
                "semester": f"Sem {course.semester_no}" if course.semester_no else base.get("semester"),
                "passRate": base.get("passRate"),
                "status": "Active",
            }
        )
    return items


def admin_programs(db: Session, institution_id: str) -> list[dict]:
    rows = db.scalars(select(Program).where(Program.institution_id == institution_id).order_by(Program.code)).all()
    if not rows:
        return payload("admin-catalog", db).get("programs") or []
    depts = {d.id: d for d in db.scalars(select(Department).where(Department.institution_id == institution_id)).all()}
    students = defaultdict(int)
    for profile in db.scalars(select(StudentProfile).where(StudentProfile.institution_id == institution_id)).all():
        if profile.program_id:
            students[profile.program_id] += 1
    fixture = {row.get("name"): row for row in (payload("admin-catalog", db).get("programs") or [])}
    items = []
    for program in rows:
        dept = depts.get(program.department_id)
        base = fixture.get(program.name) or {}
        items.append(
            {
                "id": program.id,
                "name": program.name,
                "dept": dept.code if dept else base.get("dept"),
                "duration": f"{program.duration_years} yrs" if program.duration_years else base.get("duration"),
                "students": students.get(program.id, base.get("students") or 0),
                "intake": base.get("intake"),
                "fee": base.get("fee"),
                "accreditations": base.get("accreditations") or [],
                "placements": base.get("placements"),
                "status": "Active",
            }
        )
    return items


def admin_subjects(db: Session, institution_id: str) -> list[dict]:
    rows = db.scalars(select(Subject).where(Subject.institution_id == institution_id).order_by(Subject.code)).all()
    if not rows:
        return payload("admin-catalog", db).get("subjects") or []
    fixture = {row.get("code"): row for row in (payload("admin-catalog", db).get("subjects") or [])}
    items = []
    for subject in rows:
        base = fixture.get(subject.code) or {}
        items.append(
            {
                "id": subject.id,
                "code": subject.code,
                "name": subject.name,
                "program": base.get("program"),
                "semester": base.get("semester"),
                "credits": base.get("credits"),
                "courses": base.get("courses") or 1,
                "faculty": base.get("faculty"),
                "passRate": base.get("passRate"),
                "status": "Active",
            }
        )
    return items


def admin_batches(db: Session, institution_id: str) -> list[dict]:
    rows = db.scalars(select(Batch).where(Batch.institution_id == institution_id).order_by(Batch.code)).all()
    if not rows:
        return payload("admin-catalog", db).get("batches") or []
    students = defaultdict(int)
    cgpa_sum = defaultdict(float)
    cgpa_n = defaultdict(int)
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


def admin_users(db: Session, institution_id: str) -> list[dict]:
    users = db.scalars(select(User).where(User.institution_id == institution_id).order_by(User.full_name)).all()
    if not users:
        return payload("admin-catalog", db).get("users") or []
    students = {p.user_id: p for p in db.scalars(select(StudentProfile).where(StudentProfile.institution_id == institution_id)).all()}
    faculty = {p.user_id: p for p in db.scalars(select(FacultyProfile).where(FacultyProfile.institution_id == institution_id)).all()}
    depts = {d.id: d for d in db.scalars(select(Department).where(Department.institution_id == institution_id)).all()}
    items = []
    for user in users:
        codes = [link.role.code for link in (user.role_links or []) if link.role]
        role = codes[0] if codes else "student"
        for preferred in ("admin", "faculty", "student", "parent"):
            if preferred in codes:
                role = preferred
                break
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
                "dept": dept.code if dept else ("Administration" if role == "admin" else "—"),
                "status": (user.status or "active").title(),
                "lastActive": _iso(user.last_login_at) or "—",
            }
        )
    return items


def admin_calendar(db: Session, institution_id: str) -> list[dict]:
    rows = db.scalars(select(CalendarEvent).where(CalendarEvent.institution_id == institution_id).order_by(CalendarEvent.starts_at)).all()
    if not rows:
        return payload("admin-catalog", db).get("calendar") or []
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


def admin_dashboard(db: Session, institution_id: str) -> dict:
    snap = payload("admin-catalog", db)["dashboard"]
    student_n = db.scalar(select(func.count()).select_from(StudentProfile).where(StudentProfile.institution_id == institution_id)) or 0
    faculty_n = db.scalar(select(func.count()).select_from(FacultyProfile).where(FacultyProfile.institution_id == institution_id)) or 0
    course_n = db.scalar(select(func.count()).select_from(Course).where(Course.institution_id == institution_id)) or 0
    kpis = list(snap.get("kpis") or [])
    if kpis:
        kpis[0] = {**kpis[0], "value": int(student_n) or kpis[0].get("value")}
    if len(kpis) > 1:
        kpis[1] = {**kpis[1], "value": int(faculty_n) or kpis[1].get("value")}
    if len(kpis) > 2:
        kpis[2] = {**kpis[2], "value": int(course_n) or kpis[2].get("value")}
    return {**snap, "kpis": kpis}


def student_assignments(db: Session, user: User) -> list[dict]:
    rows = db.scalars(select(Assignment).where(Assignment.institution_id == user.institution_id).order_by(Assignment.due_at)).all()
    if not rows:
        return payload("student-portal", db).get("assignments") or []
    courses = {c.id: c for c in db.scalars(select(Course).where(Course.institution_id == user.institution_id)).all()}
    subs = {
        s.assignment_id: s
        for s in db.scalars(select(AssignmentSubmission).where(AssignmentSubmission.student_id == user.id)).all()
    }
    items = []
    for row in rows:
        course = courses.get(row.course_id)
        sub = subs.get(row.id)
        status = (sub.status if sub else "pending") or "pending"
        items.append(
            {
                "id": row.id,
                "title": row.title,
                "course": course.code if course else row.course_id,
                "courseTitle": course.name if course else None,
                "due": _iso(row.due_at),
                "dueDate": _iso(row.due_at),
                "maxScore": row.max_marks,
                "max": row.max_marks,
                "body": row.body,
                "status": status.title() if status != "pending" else "Pending",
                "score": sub.marks if sub else None,
                "feedback": sub.feedback if sub else None,
            }
        )
    return items


def faculty_assignments(db: Session, institution_id: str) -> list[dict]:
    assignments = db.scalars(select(Assignment).where(Assignment.institution_id == institution_id).order_by(Assignment.due_at.desc())).all()
    courses = {course.id: course for course in db.scalars(select(Course).where(Course.institution_id == institution_id)).all()}
    students = db.scalars(select(StudentProfile).where(StudentProfile.institution_id == institution_id)).all()
    enrollments = db.scalars(select(Enrollment).where(Enrollment.student_id.in_([student.user_id for student in students]))).all() if students else []
    enrolled_by_course: dict[str, set[str]] = defaultdict(set)
    for enrollment in enrollments:
        enrolled_by_course[enrollment.course_id].add(enrollment.student_id)
    submissions = db.scalars(select(AssignmentSubmission).where(AssignmentSubmission.assignment_id.in_([row.id for row in assignments]))).all() if assignments else []
    submission_by_assignment: dict[str, list[AssignmentSubmission]] = defaultdict(list)
    for submission in submissions:
        submission_by_assignment[submission.assignment_id].append(submission)
    items = []
    for assignment in assignments:
        rows = submission_by_assignment[assignment.id]
        course = courses.get(assignment.course_id)
        submitted = len(rows)
        graded = sum(1 for row in rows if row.marks is not None or row.status == "graded")
        scores = [float(row.marks) for row in rows if row.marks is not None]
        total = len(enrolled_by_course.get(assignment.course_id, set()))
        items.append({
            "id": assignment.id,
            "title": assignment.title,
            "course": course.code if course else assignment.course_id,
            "due": _iso(assignment.due_at),
            "published": _iso(assignment.created_at),
            "submissions": submitted,
            "total": total,
            "graded": graded,
            "status": "Graded" if submitted and graded == submitted else "Open",
            "maxScore": assignment.max_marks,
            "avgScore": round(sum(scores) / len(scores), 1) if scores else None,
        })
    return items


def faculty_attendance(db: Session, institution_id: str) -> dict:
    sessions = db.scalars(select(AttendanceSession).join(Course).where(Course.institution_id == institution_id).order_by(AttendanceSession.session_date.desc())).all()
    courses = {course.id: course for course in db.scalars(select(Course).where(Course.institution_id == institution_id)).all()}
    batches = {batch.id: batch for batch in db.scalars(select(Batch).where(Batch.institution_id == institution_id)).all()}
    records = db.scalars(select(AttendanceRecord).where(AttendanceRecord.session_id.in_([row.id for row in sessions]))).all() if sessions else []
    records_by_session: dict[str, list[AttendanceRecord]] = defaultdict(list)
    attendance_by_student: dict[str, list[AttendanceRecord]] = defaultdict(list)
    for record in records:
        records_by_session[record.session_id].append(record)
        attendance_by_student[record.student_id].append(record)
    classes = []
    for session in sessions:
        row_records = records_by_session[session.id]
        total = len(row_records)
        present = sum(1 for row in row_records if row.mark == "present")
        course = courses.get(session.course_id)
        batch = batches.get(session.batch_id)
        classes.append({
            "id": session.id,
            "course": course.code if course else session.course_id,
            "section": batch.section or "-" if batch else "-",
            "date": session.session_date.isoformat(),
            "total": total,
            "present": present,
            "pct": round((present / total) * 100, 1) if total else 0,
            "status": "Marked",
            "topic": session.topic or "Class session",
        })
    student_profiles = {profile.user_id: profile for profile in db.scalars(select(StudentProfile).where(StudentProfile.institution_id == institution_id)).all()}
    users = {user.id: user for user in db.scalars(select(User).where(User.id.in_(student_profiles))).all()} if student_profiles else {}
    threshold = []
    for student_id, student_records in attendance_by_student.items():
        total = len(student_records)
        present = sum(1 for record in student_records if record.mark == "present")
        percentage = round((present / total) * 100, 1) if total else 0
        if percentage < 75:
            profile = student_profiles[student_id]
            threshold.append({"name": users[student_id].full_name, "roll": profile.roll_no, "attendance": percentage, "classes": total - present})
    percentages = [row["pct"] for row in classes]
    weekly_trend = [{"week": f"W{index + 1}", "pct": row["pct"]} for index, row in enumerate(reversed(classes))]
    return {
        "classes": classes,
        "weeklyTrend": weekly_trend,
        "summary": {
            "avgAttendance": round(sum(percentages) / len(percentages), 1) if percentages else 0,
            "highestClass": max(classes, key=lambda row: row["pct"])["course"] if classes else "-",
            "lowestClass": min(classes, key=lambda row: row["pct"])["course"] if classes else "-",
            "studentsBelow75": len(threshold),
        },
        "studentsBelowThreshold": threshold,
    }


def student_courses(db: Session, user: User) -> list[dict]:
    enrollments = db.scalars(select(Enrollment).where(Enrollment.student_id == user.id)).all()
    if not enrollments:
        return payload("student-portal", db).get("courses") or []
    fixture = {row.get("id") or row.get("code"): row for row in (payload("student-portal", db).get("courses") or [])}
    items = []
    for enrollment in enrollments:
        course = db.get(Course, enrollment.course_id)
        if not course:
            continue
        base = fixture.get(course.id) or fixture.get(course.code) or {}
        items.append(
            {
                **base,
                "id": course.id,
                "code": course.code,
                "title": course.name,
                "name": course.name,
                "credits": course.credits,
                "semester": course.semester_no,
                "status": enrollment.status,
            }
        )
    return items or payload("student-portal", db).get("courses") or []


def student_events(db: Session, user: User) -> list[dict]:
    rows = db.scalars(select(CalendarEvent).where(CalendarEvent.institution_id == user.institution_id).order_by(CalendarEvent.starts_at)).all()
    if not rows:
        return payload("student-portal", db).get("events") or []
    return [
        {
            "id": row.id,
            "date": row.starts_at.date().isoformat() if row.starts_at else None,
            "title": row.title,
            "kind": row.kind,
            "type": row.kind,
        }
        for row in rows
    ]


def faculty_announcements(db: Session, institution_id: str) -> list[dict]:
    rows = db.scalars(select(Announcement).where(Announcement.institution_id == institution_id).order_by(Announcement.created_at.desc())).all()
    if not rows:
        return payload("faculty-workspace", db).get("announcements") or []
    return [
        {
            "id": row.id,
            "title": row.title,
            "body": row.body,
            "date": _iso(row.created_at),
            "pinned": bool(row.pinned),
            "audience": "All sections",
            "attachments": [],
        }
        for row in rows
    ]


def faculty_question_bank(db: Session, institution_id: str) -> dict:
    questions = db.scalars(select(Question).where(Question.institution_id == institution_id).order_by(Question.created_at.desc())).all()
    if not questions:
        return payload("faculty-workspace", db).get("questionBank") or {"summary": {}, "questions": []}
    subjects = {s.id: s for s in db.scalars(select(Subject).where(Subject.institution_id == institution_id)).all()}
    items = []
    by_subject: dict[str, int] = defaultdict(int)
    for question in questions:
        subject = subjects.get(question.subject_id)
        code = subject.code if subject else question.exam_mode
        by_subject[code or "General"] += 1
        options = []
        try:
            options = json.loads(question.options or "[]")
        except json.JSONDecodeError:
            options = []
        items.append(
            {
                "id": question.id,
                "subject": code,
                "topic": question.concept,
                "chapter": question.concept,
                "type": (question.q_type or "mcq").upper() if question.q_type != "mcq" else "MCQ",
                "difficulty": (question.difficulty or "medium").title(),
                "text": question.stem,
                "options": options,
                "status": (question.status or "approved").title(),
                "source": question.source or "Bank",
                "usage": 0,
                "lastUsed": _iso(question.updated_at) if getattr(question, "updated_at", None) else None,
                "bloom": (question.bloom or "Apply").title() if question.bloom else "Apply",
                "tags": [],
            }
        )
    summary = payload("faculty-workspace", db).get("questionBank", {}).get("summary") or {}
    return {
        "summary": {**summary, "total": len(items), "bySubject": dict(by_subject)},
        "questions": items,
    }


def exam_agent_bundle(db: Session, institution_id: str | None = None) -> dict:
    papers = db.scalars(select(Paper).where(Paper.status == "published").order_by(Paper.paper_code)).all()
    if institution_id:
        papers = [p for p in papers if p.institution_id == institution_id]
    live_items = []
    for paper in papers:
        links = db.scalars(select(PaperQuestion).where(PaperQuestion.paper_id == paper.id).order_by(PaperQuestion.sort_order)).all()
        questions = []
        for link in links:
            question = db.get(Question, link.question_id)
            snap = {}
            try:
                snap = json.loads(link.snapshot or "{}")
            except json.JSONDecodeError:
                snap = {}
            options = snap.get("options")
            if options is None and question:
                try:
                    options = json.loads(question.options or "[]")
                except json.JSONDecodeError:
                    options = []
            stem = snap.get("stem") or (question.stem if question else "")
            correct = snap.get("correct")
            if correct is None and question:
                try:
                    correct = int(question.correct_answer)
                except (TypeError, ValueError):
                    correct = question.correct_answer if question else 0
            questions.append(
                {
                    "id": (question.id.split("-")[-1] if question and "-" in question.id else f"Q{link.sort_order:02d}"),
                    "subject": snap.get("subject") or (question.concept if question else paper.title),
                    "chapter": snap.get("chapter") or "",
                    "topic": snap.get("topic") or (question.concept if question else ""),
                    "difficulty": (snap.get("difficulty") or (question.difficulty if question else "medium") or "medium").title(),
                    "question": stem,
                    "options": options or [],
                    "correctAnswer": correct,
                    "type": "MCQ",
                    "marks": question.marks if question else 1,
                    "negativeMarks": question.negative_marks if question else 0,
                }
            )
        if paper.exam_family == "jee":
            exam_type = "JEE"
        elif paper.exam_family == "neet":
            exam_type = "NEET"
        else:
            exam_type = "University"
        live_items.append(
            {
                "id": paper.id,
                "title": paper.title,
                "type": exam_type,
                "category": "Competitive" if paper.exam_mode == "competitive" else "University",
                "durationMinutes": paper.duration_minutes,
                "marksPerQuestion": questions[0]["marks"] if questions else 0,
                "negativeMarksPerQuestion": questions[0]["negativeMarks"] if questions else 0,
                "questions": questions,
                "totalMarks": paper.total_marks,
            }
        )
    return {"items": live_items, "groupLabels": {}}


def registration_options(db: Session) -> dict:
    stored = payload("registration-options", db)
    institutions = db.scalars(select(Institution).order_by(Institution.name)).all()
    if institutions:
        stored = dict(stored)
        stored["institutions"] = [
            {"id": inst.id, "name": inst.name, "city": json.loads(inst.settings_json or "{}").get("city") or ""}
            for inst in institutions
        ]
        stored["institutions"].append({"id": "inst_other", "name": "Other institution", "city": ""})
    programs = db.scalars(select(Program).order_by(Program.name)).all()
    if programs:
        stored["degrees"] = [p.name for p in programs] + ["Other degree"]
    depts = db.scalars(select(Department).order_by(Department.name)).all()
    if depts:
        stored["branches"] = [d.name for d in depts] + ["Other branch"]
    return stored
