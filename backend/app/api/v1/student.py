import json
from datetime import datetime, timezone

from fastapi import APIRouter, HTTPException
from sqlalchemy import select

from app.core.deps import DbDep, UserDep
from app.models.exams import ExamAttempt
from app.models.ops import SupportTicket
from app.models.people import StudentProfile
from app.schemas.auth import ExamAttemptCreate
from app.services.spa_exams import analysis_from_attempt, attempt_to_dict
from app.services.examination import get_published_exam, list_published_exams, start_exam, submit_exam_attempt
from app.services import student_runtime
from app.services import intervention_practice
from app.workers.intelligence import rebuild_student_dna

router = APIRouter(tags=["student"])


def _require_student(db, user) -> StudentProfile:
    profile = db.get(StudentProfile, user.id)
    if not profile:
        raise HTTPException(403, "Student profile required")
    return profile


@router.get("/student/profile")
def student_profile(db: DbDep, user: UserDep):
    _require_student(db, user)
    return student_runtime.build_profile(db, user)


@router.get("/intelligence/profile")
def intelligence_profile(db: DbDep, user: UserDep):
    _require_student(db, user)
    return student_runtime.build_profile(db, user)


@router.get("/intelligence/summary")
def intelligence_summary(db: DbDep, user: UserDep):
    return student_runtime.assemble_student_intelligence(db, user)


@router.get("/intelligence/datasets")
def intelligence_datasets(db: DbDep, user: UserDep):
    return student_runtime.assemble_student_intelligence(db, user)["datasets"]


@router.get("/intelligence/derived")
def intelligence_derived(db: DbDep, user: UserDep):
    return student_runtime.assemble_student_intelligence(db, user)["derived"]


@router.get("/intelligence/exam-dna-signals")
def exam_dna_signals(db: DbDep, user: UserDep):
    from app.models.intelligence import StudentDnaSnapshot

    rows = db.scalars(
        select(StudentDnaSnapshot)
        .where(StudentDnaSnapshot.student_id == user.id)
        .order_by(StudentDnaSnapshot.computed_at.desc())
    ).all()
    pools = {"university": {"chapters": [], "strengths": [], "weaknesses": []}, "competitive": {"JEE": {"chapters": []}, "NEET": {"chapters": []}}}
    for row in rows:
        try:
            data = json.loads(row.payload or "{}")
        except json.JSONDecodeError:
            continue
        mode = (row.exam_mode or "university").lower()
        family = (row.exam_family or "").upper()
        if mode == "competitive" and family in {"JEE", "NEET"}:
            pools["competitive"][family] = data
        else:
            pools["university"] = data
    return {
        **pools,
        "source": "exam-agent",
        "demoExcluded": True,
        "generatedAt": datetime.now(timezone.utc).isoformat(),
    }


@router.get("/intelligence/exam-attempts")
def intelligence_attempts(
    db: DbDep,
    user: UserDep,
    studentId: str | None = None,
    roll: str | None = None,
    examMode: str | None = None,
    examFamily: str | None = None,
    examId: str | None = None,
    batchId: str | None = None,
    sectionId: str | None = None,
    includeDemo: bool = False,
    includeSeeds: bool = True,
):
    q = db.query(ExamAttempt)
    target = studentId or user.id
    if user.primary_role == "student":
        target = user.id
    q = q.filter(ExamAttempt.student_id == target)
    if not includeDemo:
        q = q.filter(ExamAttempt.is_demo.is_(False))
    rows = q.order_by(ExamAttempt.submitted_at.desc()).all()
    items = [attempt_to_dict(r, db) for r in rows]
    if examMode:
        items = [a for a in items if str(a.get("examMode") or "").lower() == examMode.lower()]
    if examFamily:
        items = [a for a in items if str(a.get("examFamily") or "").lower() == examFamily.lower()]
    if examId:
        items = [a for a in items if a.get("examId") == examId]
    if roll:
        items = [a for a in items if a.get("roll") == roll]
    if batchId:
        items = [a for a in items if a.get("batchId") == batchId]
    if sectionId:
        items = [a for a in items if a.get("sectionId") == sectionId]
    return {
        "items": items,
        "count": len(items),
        "total": len(items),
        "demoExcluded": not includeDemo,
        "seedsIncluded": includeSeeds,
        "filters": {
            "studentId": target,
            "roll": roll,
            "examMode": examMode,
            "examFamily": examFamily,
            "examId": examId,
            "batchId": batchId,
            "sectionId": sectionId,
            "includeDemo": includeDemo,
            "includeSeeds": includeSeeds,
        },
    }


@router.get("/student/exam-agent/exams")
def exam_agent_exams(db: DbDep, user: UserDep):
    return list_published_exams(db, user, include_questions=True)


@router.get("/student/exam-agent/attempts")
def list_my_attempts(db: DbDep, user: UserDep):
    rows = db.query(ExamAttempt).filter(ExamAttempt.student_id == user.id).order_by(ExamAttempt.submitted_at.desc()).all()
    return {"items": [attempt_to_dict(r, db, include_questions=False) for r in rows]}


@router.get("/student/exam-agent/attempts/{attempt_id}")
def get_attempt(attempt_id: str, db: DbDep, user: UserDep):
    row = db.get(ExamAttempt, attempt_id)
    if not row or (user.primary_role == "student" and row.student_id != user.id):
        raise HTTPException(404, "Attempt not found.")
    return {"attempt": attempt_to_dict(row, db)}


@router.post("/student/exam-agent/attempts")
def submit_attempt(body: ExamAttemptCreate, db: DbDep, user: UserDep):
    payload = body.model_dump() if hasattr(body, "model_dump") else dict(body)
    return submit_exam_attempt(db, user, payload)


@router.get("/student/dashboard")
def student_dashboard(db: DbDep, user: UserDep):
    return student_runtime.student_dashboard_payload(db, user)


@router.get("/student/attendance")
def student_attendance(db: DbDep, user: UserDep):
    _require_student(db, user)
    return student_runtime.calculate_attendance(db, user)


@router.get("/student/assignments")
def student_assignments(db: DbDep, user: UserDep):
    return {"items": student_runtime.list_student_assignments(db, user)}


@router.get("/student/micro-assessments")
def student_micro_list(db: DbDep, user: UserDep):
    from app.services import micro_assessments

    return micro_assessments.list_student(db, user)


@router.get("/student/micro-assessments/{assessment_id}")
def student_micro_get(assessment_id: str, db: DbDep, user: UserDep):
    from app.services import micro_assessments

    return micro_assessments.get_student(db, user, assessment_id)


@router.post("/student/micro-assessments/{assessment_id}/attempts")
def student_micro_submit(assessment_id: str, body: dict, db: DbDep, user: UserDep):
    from app.services import micro_assessments

    return micro_assessments.submit_student(db, user, assessment_id, body or {})


@router.post("/student/assignments/{assignment_id}/submit")
def student_assignment_submit(assignment_id: str, db: DbDep, user: UserDep, body: dict | None = None):
    return student_runtime.submit_assignment(db, user, assignment_id, body or {})


@router.get("/student/courses")
def student_courses(db: DbDep, user: UserDep):
    return {"items": student_runtime.list_student_courses(db, user)}


@router.get("/student/courses/{course_id}")
def student_course(course_id: str, db: DbDep, user: UserDep):
    return student_runtime.course_detail(db, user, course_id)


@router.get("/student/subjects")
def student_subjects(db: DbDep, user: UserDep):
    snap = student_runtime.assemble_student_intelligence(db, user)
    return {"items": snap["datasets"].get("subjects") or []}


@router.get("/student/events")
def student_events(db: DbDep, user: UserDep):
    return {"items": student_runtime.list_student_events(db, user)}


@router.get("/student/mock-tests")
def mock_tests(db: DbDep, user: UserDep):
    return {"items": student_runtime.list_mock_tests(db, user)}


@router.get("/student/exams")
def exams(db: DbDep, user: UserDep):
    return list_published_exams(db, user, include_questions=False)


@router.get("/student/exams/{exam_id}")
def exam_detail(exam_id: str, db: DbDep, user: UserDep):
    return get_published_exam(db, user, exam_id, include_questions=False)


@router.post("/student/exams/{exam_id}/start")
def exam_start(exam_id: str, db: DbDep, user: UserDep, body: dict | None = None):
    body = body or {}
    return start_exam(
        db,
        user,
        exam_id,
        attempt_kind=str(body.get("attemptKind") or "practice"),
        is_demo=bool(body.get("isDemo")),
    )


@router.post("/student/exams/{exam_id}/submit")
def exam_submit(exam_id: str, body: dict, db: DbDep, user: UserDep):
    return submit_exam_attempt(db, user, body or {}, exam_id=exam_id, attempt_id=(body or {}).get("attemptId"))


@router.get("/student/settings")
def student_settings(db: DbDep, user: UserDep):
    _require_student(db, user)
    return student_runtime.settings_payload(db, user)


@router.patch("/student/settings")
def patch_student_settings(body: dict, db: DbDep, user: UserDep):
    _require_student(db, user)
    current = student_runtime.patch_settings(db, user, body or {})
    return {"ok": True, "settings": current}


@router.get("/student/programs")
def programs(db: DbDep, user: UserDep):
    return student_runtime.programs_payload(db, user)


@router.get("/student/forum")
def forum(user: UserDep):
    return {**student_runtime.forum_payload(), "gap": "BACKEND GAP — forum tables are unused"}


@router.get("/student/support")
def support(db: DbDep, user: UserDep):
    rows = db.query(SupportTicket).filter(SupportTicket.requester_id == user.id).order_by(SupportTicket.created_at.desc()).all()
    tickets = [
        {
            "id": t.id,
            "title": t.title,
            "status": (t.status or "open").title(),
            "created": t.created_at.isoformat() if t.created_at else None,
            "messages": 1,
        }
        for t in rows
    ]
    return {"tickets": tickets}


@router.post("/student/support")
def create_support(body: dict, db: DbDep, user: UserDep):
    ticket = SupportTicket(
        institution_id=user.institution_id or "platform",
        requester_id=user.id,
        title=body.get("title") or "Support request",
        body=body.get("body") or body.get("message"),
        status="open",
    )
    db.add(ticket)
    db.commit()
    return {
        "ok": True,
        "ticket": {
            "id": ticket.id,
            "title": ticket.title,
            "category": body.get("category") or "Technical",
            "status": "Open",
            "priority": body.get("priority") or "Medium",
            "created": ticket.created_at.isoformat() if ticket.created_at else datetime.now(timezone.utc).isoformat(),
            "messages": 1,
        },
    }


@router.get("/student/admit-card")
def admit_card(db: DbDep, user: UserDep):
    return student_runtime.admit_card_payload(db, user)


@router.get("/student/exam-analysis")
def exam_analysis(db: DbDep, user: UserDep):
    return student_runtime.exam_analysis_options(db, user)


@router.get("/student/exam-analysis/options")
def exam_analysis_options(db: DbDep, user: UserDep):
    return student_runtime.exam_analysis_options(db, user)


@router.get("/student/exam-analysis/{analysis_id}")
def exam_analysis_by_id(analysis_id: str, db: DbDep, user: UserDep):
    row = db.get(ExamAttempt, analysis_id)
    if row and (user.primary_role != "student" or row.student_id == user.id):
        return analysis_from_attempt(attempt_to_dict(row, db))
    raise HTTPException(404, "Attempt not found.")


@router.get("/student/mentor/workspace")
def mentor_workspace(db: DbDep, user: UserDep):
    return student_runtime.mentor_workspace(db, user)


@router.get("/student/academic-profile")
def academic_profile(db: DbDep, user: UserDep):
    return student_runtime.build_profile(db, user)


@router.get("/student/academic-resources")
def academic_resources(db: DbDep, user: UserDep):
    snap = student_runtime.assemble_student_intelligence(db, user)
    return {"items": snap["datasets"].get("academicResources") or []}


@router.get("/student/academic-progress")
def academic_progress(db: DbDep, user: UserDep):
    snap = student_runtime.assemble_student_intelligence(db, user)
    return snap["derived"].get("university", {}).get("progress") or {"overall": 0, "courses": [], "subjects": []}


@router.get("/student/performance-accuracy")
def performance_accuracy(db: DbDep, user: UserDep):
    return student_runtime.assemble_student_intelligence(db, user)["derived"]


@router.get("/student/interventions")
def my_interventions(db: DbDep, user: UserDep, studentId: str | None = None):
    from app.services import interventions_sql

    snap = student_runtime.assemble_student_intelligence(db, user)
    derived = snap["derived"].get("interventions") or []
    sql_items = interventions_sql.student_sql_interventions(db, user)
    sql_ids = {row["id"] for row in sql_items}
    items = sql_items + [row for row in derived if row.get("id") not in sql_ids]
    return {"items": items, "interventions": items, "count": len(items)}


@router.get("/student/interventions/{intervention_id}/practice")
def intervention_practice_get(intervention_id: str, db: DbDep, user: UserDep):
    return intervention_practice.student_practice_payload(db, user, intervention_id)


@router.get("/student/interventions/{intervention_id}/retest")
def intervention_retest(intervention_id: str, db: DbDep, user: UserDep):
    return intervention_practice.student_retest_payload(db, user, intervention_id)


@router.post("/student/interventions/{intervention_id}/practice-attempts")
def submit_practice_attempt(intervention_id: str, body: dict, db: DbDep, user: UserDep):
    return intervention_practice.submit_practice(db, user, intervention_id, body or {})
