import json
from datetime import datetime, timezone

from fastapi import APIRouter, HTTPException
from sqlalchemy import select

from app.core.deps import DbDep, UserDep
from app.models.exams import ExamAttempt, ExamQuestionAttempt
from app.models.ops import SupportTicket
from app.models.people import StudentProfile
from app.schemas.auth import ExamAttemptCreate
from app.services.seed import student_master_profile
from app.services.spa_exams import analysis_from_attempt, attempt_to_dict, practice_questions
from app.services.spa_issues import build_similar_issues, intervention_from_group
from app.services import live_catalog
from app.services.spa_payloads import payload
from app.services.spa_store import coll_key, kv_get, kv_set
from app.services.people_directory import faculty_students_directory
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
    return student_master_profile(db, user)


@router.get("/intelligence/profile")
def intelligence_profile(db: DbDep, user: UserDep):
    _require_student(db, user)
    return student_master_profile(db, user)


@router.get("/intelligence/summary")
def intelligence_summary(db: DbDep, user: UserDep):
    _require_student(db, user)
    snap = payload("student-intelligence-summary")
    snap["profile"] = student_master_profile(db, user)
    return snap


@router.get("/intelligence/datasets")
def intelligence_datasets(user: UserDep):
    return payload("student-intelligence-datasets")


@router.get("/intelligence/derived")
def intelligence_derived(user: UserDep):
    return payload("student-intelligence-derived")


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
    if includeSeeds and target in {user.id, "u_stu_001"}:
        portal = payload("student-portal")
        # keep live attempts first; seed-shaped analysis options still come from exam-analysis fixture
        _ = portal
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
    return live_catalog.exam_agent_bundle(db, user.institution_id)


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
    profile = _require_student(db, user)
    started = body.startedAt or datetime.now(timezone.utc).isoformat()
    submitted = body.submittedAt or body.completedAt or datetime.now(timezone.utc).isoformat()
    snapshot = body.examSnapshot or body.exam or {}
    exam_name = body.examName or body.examTitle or snapshot.get("title") or body.examId or "Exam"
    attempt = ExamAttempt(
        institution_id=user.institution_id,
        student_id=user.id,
        roll_no=profile.roll_no,
        batch_id=profile.batch_id,
        exam_id=body.examId or snapshot.get("id") or "exam",
        exam_name=exam_name,
        exam_mode=body.examMode.lower() if body.examMode else "university",
        exam_family=(body.examFamily or "").lower() or None,
        source="exam_agent",
        attempt_kind=body.attemptKind,
        is_demo=body.isDemo,
        intervention_id=body.interventionId,
        started_at=datetime.fromisoformat(started.replace("Z", "+00:00")),
        submitted_at=datetime.fromisoformat(submitted.replace("Z", "+00:00")),
        exam_snapshot=json.dumps(snapshot),
        timing=json.dumps(body.timing or {"elapsedSeconds": body.elapsedSeconds}),
        scoring=json.dumps(body.scoring),
        interactions=json.dumps(body.interactions),
        summary=json.dumps(body.summary) if body.summary else None,
    )
    db.add(attempt)
    db.flush()
    for i, qa in enumerate(body.questionAttempts, start=1):
        db.add(
            ExamQuestionAttempt(
                attempt_id=attempt.id,
                question_id=qa.get("questionId"),
                question_number=qa.get("questionNumber") or i,
                question_snapshot=json.dumps(qa.get("question") or {}),
                academic_context=json.dumps(qa.get("academicContext") or {}),
                response=json.dumps(qa.get("response") or {}),
                timing=json.dumps(qa.get("timing") or {}),
                behaviour=json.dumps(qa.get("behaviour") or {}),
                evaluation=json.dumps(qa.get("evaluation") or {}),
            )
        )
    db.commit()
    rebuild_student_dna(db, user.id)
    saved = db.get(ExamAttempt, attempt.id)
    return {"ok": True, "id": attempt.id, "attempt": attempt_to_dict(saved, db)}


@router.get("/student/dashboard")
def student_dashboard(user: UserDep):
    return payload("student-portal")["dashboard"]


@router.get("/student/attendance")
def student_attendance(user: UserDep):
    return payload("student-portal")["attendance"]


@router.get("/student/assignments")
def student_assignments(db: DbDep, user: UserDep):
    return {"items": live_catalog.student_assignments(db, user)}


@router.get("/student/courses")
def student_courses(db: DbDep, user: UserDep):
    return {"items": live_catalog.student_courses(db, user)}


@router.get("/student/courses/{course_id}")
def student_course(course_id: str, user: UserDep):
    detail = payload("student-portal")["courseDetail"]
    courses = payload("student-portal")["courses"]
    match = next((c for c in courses if c.get("id") == course_id), None)
    if match:
        return {"course": {**detail, **match, "id": course_id}}
    return {"course": {**detail, "id": course_id, "code": course_id}}


@router.get("/student/subjects")
def student_subjects(user: UserDep):
    return {"items": payload("student-portal")["subjects"]}


@router.get("/student/events")
def student_events(db: DbDep, user: UserDep):
    return {"items": live_catalog.student_events(db, user)}


@router.get("/student/mock-tests")
def mock_tests(user: UserDep):
    return {"items": payload("student-portal")["mockTests"]}


@router.get("/student/exams")
def exams(user: UserDep):
    return {"items": payload("student-portal")["exams"]}


@router.get("/student/settings")
def student_settings(db: DbDep, user: UserDep):
    stored = kv_get(db, coll_key("student_settings", user.id), None)
    return stored or payload("student-portal")["settings"]


@router.patch("/student/settings")
def patch_student_settings(body: dict, db: DbDep, user: UserDep):
    current = kv_get(db, coll_key("student_settings", user.id), payload("student-portal")["settings"])
    current.update(body or {})
    kv_set(db, coll_key("student_settings", user.id), current)
    return {"ok": True, "settings": current}


@router.get("/student/programs")
def programs(user: UserDep):
    return payload("student-portal")["programs"]


@router.get("/student/forum")
def forum(user: UserDep):
    portal = payload("student-portal")
    return {"topics": portal["forumTopics"], "categories": portal["forumCategories"]}


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
def admit_card(user: UserDep):
    return payload("student-portal")["admitCard"]


@router.get("/student/exam-analysis")
def exam_analysis(user: UserDep):
    return payload("student-portal")["examAnalysis"]


@router.get("/student/exam-analysis/options")
def exam_analysis_options(db: DbDep, user: UserDep):
    rows = db.query(ExamAttempt).filter(ExamAttempt.student_id == user.id, ExamAttempt.is_demo.is_(False)).order_by(ExamAttempt.submitted_at.desc()).all()
    live = []
    for r in rows:
        d = attempt_to_dict(r, db, include_questions=False)
        live.append(
            {
                "id": d["id"],
                "attemptId": d["id"],
                "examId": d.get("examId"),
                "title": d.get("examTitle") or d.get("examName"),
                "examMode": d.get("examMode"),
                "examFamily": d.get("examFamily"),
                "submittedAt": d.get("submittedAt"),
                "sample": False,
            }
        )
    options = payload("student-portal")["examAnalysisOptions"]
    if isinstance(options, list):
        return live + options
    if isinstance(options, dict) and "items" in options:
        return {**options, "items": live + (options.get("items") or [])}
    return {"items": live or options}


@router.get("/student/exam-analysis/{analysis_id}")
def exam_analysis_by_id(analysis_id: str, db: DbDep, user: UserDep):
    row = db.get(ExamAttempt, analysis_id)
    if row and (user.primary_role != "student" or row.student_id == user.id):
        return analysis_from_attempt(attempt_to_dict(row, db))
    variants = payload("student-portal").get("examAnalysisVariants") or {}
    if isinstance(variants, dict) and analysis_id in variants:
        return variants[analysis_id]
    if isinstance(variants, list):
        found = next((v for v in variants if v.get("id") == analysis_id), None)
        if found:
            return found
    return payload("student-portal")["examAnalysis"]


@router.get("/student/mentor/workspace")
def mentor_workspace(user: UserDep):
    portal = payload("student-portal")
    intel = payload("student-intelligence-datasets")
    mentor = portal["mentor"]
    return {
        **mentor,
        "conversations": intel.get("aiConversations"),
        "suggestedQuestions": intel.get("suggestedQuestions"),
        "quickPrompts": intel.get("quickPrompts"),
        "resourceRecommendations": intel.get("resourceRecommendations"),
        "generatedNotes": intel.get("generatedNotes"),
        "downloads": intel.get("downloads"),
        "completedRecommendations": intel.get("completedRecommendations"),
    }


@router.get("/student/academic-profile")
def academic_profile(user: UserDep):
    return payload("student-portal")["academicProfile"]


@router.get("/student/academic-resources")
def academic_resources(user: UserDep):
    return {"items": payload("student-portal")["academicResources"]}


@router.get("/student/academic-progress")
def academic_progress(user: UserDep):
    return payload("student-portal")["academicProgress"]


@router.get("/student/performance-accuracy")
def performance_accuracy(user: UserDep):
    return payload("student-portal")["performanceAccuracy"]


def _student_groups(db, user):
    directory = faculty_students_directory(db, user.institution_id)
    packed = build_similar_issues(directory.get("students") or [])
    overrides = kv_get(db, coll_key("interventions", user.institution_id), {})
    return packed["groups"], overrides


@router.get("/student/interventions")
def my_interventions(db: DbDep, user: UserDep, studentId: str | None = None):
    target = studentId or user.id
    if user.primary_role == "student":
        target = user.id
    groups, overrides = _student_groups(db, user)
    items = []
    for g in groups:
        iv = intervention_from_group(g, overrides.get(g["id"]))
        if target in (iv.get("studentIds") or []):
            items.append(iv)
    return {"items": items, "interventions": items, "count": len(items)}


@router.get("/student/interventions/{intervention_id}/practice")
def intervention_practice(intervention_id: str, db: DbDep, user: UserDep):
    groups, overrides = _student_groups(db, user)
    group = next((g for g in groups if g["id"] == intervention_id), None)
    if not group:
        raise HTTPException(404, "Intervention not found.")
    iv = intervention_from_group(group, overrides.get(group["id"]))
    questions = practice_questions(subject=iv.get("subject"), chapter=iv.get("chapter"), count=iv.get("practiceConfig", {}).get("count") or 8)
    return {
        "items": questions,
        "questions": questions,
        "count": len(questions),
        "requested": iv.get("practiceConfig", {}).get("count") or 8,
        "sufficient": len(questions) >= 5,
        "interventionId": iv["id"],
        "practiceType": iv.get("practiceConfig", {}).get("type"),
        "durationMinutes": iv.get("practiceConfig", {}).get("duration") or 20,
        "whyAssigned": f"Your recent assessments show repeated difficulty with {iv.get('chapter')}.",
        "chapter": iv.get("chapter"),
        "subject": iv.get("subject"),
    }


@router.get("/student/interventions/{intervention_id}/retest")
def intervention_retest(intervention_id: str, db: DbDep, user: UserDep):
    retests = kv_get(db, coll_key("retests", user.institution_id), [])
    retest = next((r for r in retests if r.get("interventionId") == intervention_id), None)
    if not retest:
        raise HTTPException(404, "No re-test assigned for this intervention.")
    return {"retest": retest}


@router.post("/student/interventions/{intervention_id}/practice-attempts")
def submit_practice_attempt(intervention_id: str, body: dict, db: DbDep, user: UserDep):
    groups, overrides = _student_groups(db, user)
    group = next((g for g in groups if g["id"] == intervention_id), None)
    if not group:
        raise HTTPException(404, "Intervention not found.")
    iv = intervention_from_group(group, overrides.get(group["id"]))
    kind = body.get("kind") or "practice"
    attempt = {
        "id": f"ip-{int(datetime.now(timezone.utc).timestamp() * 1000)}",
        "interventionId": iv["id"],
        "studentId": body.get("studentId") or user.id,
        "kind": kind,
        "domain": iv.get("domain"),
        "examFamily": iv.get("examFamily"),
        "subject": iv.get("subject"),
        "chapter": iv.get("chapter"),
        "questionAttempts": body.get("questionAttempts") or [],
        "score": body.get("score") or 0,
        "maxScore": body.get("maxScore") or 0,
        "accuracy": body.get("accuracy") or 0,
        "attemptRate": body.get("attemptRate") or 0,
        "avgTime": body.get("avgTime") or 0,
        "incorrect": body.get("incorrect") or 0,
        "startedAt": body.get("startedAt"),
        "submittedAt": datetime.now(timezone.utc).isoformat(),
        "mode": "intervention-retest" if kind == "retest" else "intervention-practice",
    }
    attempts = kv_get(db, coll_key("practice_attempts", user.institution_id), [])
    attempts.append(attempt)
    kv_set(db, coll_key("practice_attempts", user.institution_id), attempts)
    current = overrides.get(iv["id"]) or {}
    if kind == "practice":
        if current.get("status") in {None, "Assigned"}:
            current["status"] = "In Progress"
        elif current.get("status") == "In Progress":
            current["status"] = "Completed"
            current["completedAt"] = attempt["submittedAt"]
    else:
        current["status"] = "Evaluating"
    current["updatedAt"] = attempt["submittedAt"]
    overrides[iv["id"]] = current
    kv_set(db, coll_key("interventions", user.institution_id), overrides)
    return {"ok": True, "attempt": attempt, "status": current["status"]}
