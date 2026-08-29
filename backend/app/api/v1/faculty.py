import copy
from datetime import datetime, timezone
from typing import Annotated
from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import and_, func, select

from app.core.deps import DbDep, UserDep, require_roles
from app.models.assessment import Question
from app.models.catalog import Subject
from app.models.exams import ExamAttempt
from app.models.identity import User
from app.services import live_catalog
from app.services.people_directory import faculty_students_directory
from app.services.spa_exams import analysis_from_attempt, attempt_to_dict, practice_questions
from app.services.spa_issues import build_similar_issues, can_transition, intervention_from_group
from app.services.spa_payloads import payload
from app.services.examination import (
    archive_sql_paper,
    create_sql_paper,
    delete_sql_paper,
    duplicate_sql_paper,
    get_faculty_paper,
    list_faculty_papers,
    list_question_bank,
    publish_sql_paper,
    regenerate_sql_paper,
)
from app.services.spa_store import coll_key, kv_get, kv_set

router = APIRouter(tags=["faculty"])
FacultyDep = Annotated[User, Depends(require_roles("faculty", "admin"))]


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


def _today() -> str:
    return datetime.now(timezone.utc).date().isoformat()


def _groups(db, user):
    directory = faculty_students_directory(db, user.institution_id)
    packed = build_similar_issues(directory.get("students") or [])
    custom = kv_get(db, coll_key("custom_groups", user.institution_id), [])
    if custom:
        packed["groups"] = list(packed.get("groups") or []) + custom
        packed["count"] = len(packed["groups"])
    overrides = kv_get(db, coll_key("interventions", user.institution_id), {})
    return packed, overrides, directory


def _papers(db, user) -> dict:
    default = payload("paper-generator")
    stored = kv_get(db, coll_key("papers", user.institution_id), None)
    return stored or default


def _save_papers(db, user, data: dict) -> dict:
    return kv_set(db, coll_key("papers", user.institution_id), data)


def _reports(db, user) -> list:
    stored = kv_get(db, coll_key("faculty_reports", user.institution_id), None)
    if stored is not None:
        return stored
    return payload("faculty-workspace")["reports"]


@router.get("/faculty/students")
def faculty_students(db: DbDep, user: FacultyDep):
    return faculty_students_directory(db, user.institution_id)


def _live_bank_stats(db, institution_id: str) -> dict:
    """Question-bank scalars derived from the REAL questions table.

    The only authoritative question source. Empty bank → honest zeros/nulls;
    real rows → real counts. Never reads SPA payloads.
    """
    base = Question.institution_id == institution_id
    total = db.scalar(select(func.count()).select_from(Question).where(base)) or 0
    ai_generated = db.scalar(
        select(func.count()).select_from(Question).where(and_(base, func.lower(Question.source) == "ai"))
    ) or 0
    flagged = db.scalar(
        select(func.count()).select_from(Question).where(and_(base, func.lower(Question.status) == "flagged"))
    ) or 0
    subject_map = {
        s.id: s.code or s.name
        for s in db.scalars(select(Subject).where(Subject.institution_id == institution_id)).all()
    }
    by_subject: dict[str, int] = {}
    for subject_id, count in db.execute(
        select(Question.subject_id, func.count()).where(base).group_by(Question.subject_id)
    ).all():
        key = subject_map.get(subject_id) or (subject_id or "General")
        by_subject[key] = int(count)
    return {"total": int(total), "aiGenerated": int(ai_generated), "flagged": int(flagged), "bySubject": by_subject}


def _merge_live_question_bank(db, user, derived: dict) -> None:
    """Replace fabricated question-bank scalars in the intelligence summary
    with values derived from the REAL questions table (Phase G). Analytics
    structures are preserved; an empty bank keeps neutral stats."""
    stats = _live_bank_stats(db, user.institution_id)

    assessment = derived.get("assessment")
    if isinstance(assessment, dict):
        question_stats = assessment.get("questionStats")
        if isinstance(question_stats, dict):
            question_stats["total"] = stats["total"]
            question_stats["bySubject"] = stats["bySubject"]
            question_stats["aiGenerated"] = stats["aiGenerated"]
            question_stats["flagged"] = stats["flagged"]
            if not stats["total"]:
                question_stats["avgAccuracy"] = None
                question_stats["qualityAvg"] = None

    assessment_summary = derived.get("assessmentSummary")
    if isinstance(assessment_summary, dict):
        assessment_summary["questionBank"] = stats["total"]
        assessment_summary["aiGenerated"] = stats["aiGenerated"]
        assessment_summary["flagged"] = stats["flagged"]

    status = f"{stats['total']} questions · {stats['flagged']} flagged"
    dashboard = derived.get("dashboard")
    if isinstance(dashboard, dict):
        dashboard["questionBankStatus"] = status
        success_center = dashboard.get("successCenter")
        if isinstance(success_center, dict):
            health = success_center.get("assessmentHealth")
            if isinstance(health, dict):
                health["questionBankStatus"] = status


@router.get("/faculty-intelligence/summary")
def faculty_intel(db: DbDep, user: FacultyDep):
    snap = payload("faculty-intelligence-summary", db) or {}
    live = faculty_students_directory(db, user.institution_id)
    derived = snap.get("derived") or {}
    derived["students"] = live
    _merge_live_question_bank(db, user, derived)
    snap["derived"] = derived
    return snap


@router.get("/faculty/attendance")
def faculty_attendance(db: DbDep, user: FacultyDep):
    return live_catalog.faculty_attendance(db, user.institution_id)


@router.get("/faculty/assignments")
def faculty_assignments(db: DbDep, user: FacultyDep):
    return {"items": live_catalog.faculty_assignments(db, user.institution_id)}


@router.get("/faculty/question-bank")
def question_bank(
    db: DbDep,
    user: FacultyDep,
    domain: str | None = None,
    examFamily: str | None = None,
    subject: str | None = None,
    chapter: str | None = None,
    topic: str | None = None,
    difficulty: str | None = None,
    questionType: str | None = None,
    search: str | None = None,
    page: int = 1,
    limit: int = 50,
):
    return list_question_bank(
        db,
        user,
        domain=domain,
        exam_family=examFamily,
        subject=subject,
        chapter=chapter,
        topic=topic,
        difficulty=difficulty,
        question_type=questionType,
        search=search,
        page=page,
        limit=limit,
    )


@router.get("/faculty/research")
def faculty_research(user: FacultyDep):
    return payload("faculty-workspace")["research"]


@router.get("/faculty/lecture-planner")
def lecture_planner(user: FacultyDep):
    return {"items": payload("faculty-workspace")["lecturePlanner"]}


@router.get("/faculty/exam-builder")
def exam_builder(user: FacultyDep):
    return payload("faculty-workspace")["examBuilder"]


@router.get("/faculty/settings")
def faculty_settings(user: FacultyDep):
    return payload("faculty-workspace")["settings"]


@router.get("/faculty/roster")
def faculty_roster(db: DbDep, user: FacultyDep):
    live = faculty_students_directory(db, user.institution_id)
    return {"students": live.get("students") or payload("faculty-workspace", db).get("roster") or []}


@router.get("/faculty/courses")
def faculty_courses(user: FacultyDep):
    return {"items": payload("faculty-workspace")["courses"]}


@router.get("/faculty/timetable")
def faculty_timetable(user: FacultyDep):
    return {"items": payload("faculty-workspace")["timetable"]}


@router.get("/faculty/announcements")
def faculty_announcements(db: DbDep, user: FacultyDep):
    return {"items": live_catalog.faculty_announcements(db, user.institution_id)}


@router.get("/faculty/quiz-builder")
def quiz_builder(user: FacultyDep):
    return payload("faculty-workspace")["quizBuilder"]


@router.get("/faculty/ai-studio")
def ai_studio(user: FacultyDep):
    return payload("faculty-workspace")["aiStudio"]


@router.post("/faculty/ai-studio/save")
def ai_studio_save(body: dict, db: DbDep, user: FacultyDep):
    history = kv_get(db, coll_key("ai_studio_history", user.institution_id), [])
    entry = {"id": f"as_{uuid4().hex[:8]}", "kind": body.get("kind"), "item": body.get("item"), "savedAt": _now()}
    history.insert(0, entry)
    kv_set(db, coll_key("ai_studio_history", user.institution_id), history)
    return {"ok": True, "historyEntry": entry}


@router.get("/faculty/reports")
def list_reports(db: DbDep, user: FacultyDep):
    return {"items": _reports(db, user)}


@router.post("/faculty/reports")
def create_report(body: dict, db: DbDep, user: FacultyDep):
    title = str(body.get("title") or "").strip()
    if not title:
        return {"ok": False, "error": "Report title is required."}
    report = {
        "id": f"fr_new_{uuid4().hex[:8]}",
        "title": title,
        "type": body.get("format") or "PDF",
        "category": body.get("category") or "Academic",
        "status": "Ready",
        "scope": body.get("scope") or "All courses",
        "period": body.get("period") or "Current",
        "generated": _today(),
        "size": "1.2 MB",
        "pages": 8,
        "downloads": 0,
        "archived": False,
        "summary": body.get("summary") or "Generated from the Faculty Intelligence Foundation.",
        "template": body.get("template") or "Custom",
    }
    items = _reports(db, user)
    items.insert(0, report)
    kv_set(db, coll_key("faculty_reports", user.institution_id), items)
    return {"ok": True, "report": report}


@router.delete("/faculty/reports/{report_id}")
def delete_report(report_id: str, db: DbDep, user: FacultyDep):
    items = [r for r in _reports(db, user) if r.get("id") != report_id]
    kv_set(db, coll_key("faculty_reports", user.institution_id), items)
    return {"ok": True, "deleted": report_id}


@router.patch("/faculty/reports/{report_id}/archive")
def archive_report(report_id: str, body: dict, db: DbDep, user: FacultyDep):
    items = _reports(db, user)
    row = next((r for r in items if r.get("id") == report_id), None)
    if not row:
        return {"ok": False, "error": "Report not found"}
    row["archived"] = body.get("archived") if "archived" in body else (not row.get("archived"))
    kv_set(db, coll_key("faculty_reports", user.institution_id), items)
    return {"ok": True, "report": row}


@router.get("/faculty/paper-generator")
def paper_generator(db: DbDep, user: FacultyDep):
    data = _papers(db, user)
    return {**data, "generatedPapers": list_faculty_papers(db, user)}


@router.get("/faculty/paper-generator/papers")
def list_papers(db: DbDep, user: FacultyDep):
    papers = list_faculty_papers(db, user)
    return {"generatedPapers": papers, "items": papers}


@router.get("/faculty/paper-generator/papers/{paper_id}")
def paper_detail(paper_id: str, db: DbDep, user: FacultyDep):
    paper = get_faculty_paper(db, user, paper_id)
    return {"paper": paper, **paper}


@router.post("/faculty/paper-generator/papers")
def create_paper(body: dict, db: DbDep, user: FacultyDep):
    return create_sql_paper(db, user, body or {})


@router.delete("/faculty/paper-generator/papers/{paper_id}")
def delete_paper(paper_id: str, db: DbDep, user: FacultyDep):
    return delete_sql_paper(db, user, paper_id)


@router.post("/faculty/paper-generator/papers/{paper_id}/duplicate")
def duplicate_paper(paper_id: str, db: DbDep, user: FacultyDep):
    return duplicate_sql_paper(db, user, paper_id)


@router.post("/faculty/paper-generator/papers/{paper_id}/regenerate")
def regenerate_paper(paper_id: str, db: DbDep, user: FacultyDep):
    return regenerate_sql_paper(db, user, paper_id)


@router.patch("/faculty/paper-generator/papers/{paper_id}/archive")
def archive_paper(paper_id: str, body: dict, db: DbDep, user: FacultyDep):
    return archive_sql_paper(db, user, paper_id, body.get("archived") if isinstance(body, dict) else None)


@router.post("/faculty/paper-generator/papers/{paper_id}/publish")
def publish_paper(paper_id: str, db: DbDep, user: FacultyDep):
    return publish_sql_paper(db, user, paper_id)


@router.post("/faculty/paper-generator/papers/{paper_id}/share")
def share_paper(paper_id: str, body: dict, db: DbDep, user: FacultyDep):
    paper = get_faculty_paper(db, user, paper_id)
    share = {
        "id": f"share_{uuid4().hex[:8]}",
        "paperId": paper_id,
        "title": paper.get("title"),
        "audience": body.get("audience") or "batch",
        "recipients": body.get("recipients") or [],
        "message": body.get("message"),
        "status": "Sent (prototype)",
        "sharedAt": _now(),
        "sharedBy": user.full_name,
    }
    shares = kv_get(db, coll_key("paper_shares", user.institution_id), [])
    shares.insert(0, share)
    kv_set(db, coll_key("paper_shares", user.institution_id), shares)
    return {"ok": True, "share": share}


@router.get("/faculty/paper-generator/shares")
def paper_shares(db: DbDep, user: FacultyDep):
    return {"items": kv_get(db, coll_key("paper_shares", user.institution_id), [])}


@router.get("/faculty/pyq-analysis")
def pyq_analysis(user: FacultyDep):
    return payload("pyq")["analysis"]


@router.get("/faculty/pyq-analysis/filters")
def pyq_filters(user: FacultyDep):
    return payload("pyq")["filters"]


@router.get("/faculty/pyq-analysis/patterns")
def pyq_patterns(user: FacultyDep):
    data = payload("pyq")["patterns"]
    if isinstance(data, list):
        return {"items": data}
    return data


@router.get("/faculty/pyq-analysis/analytics")
def pyq_analytics(user: FacultyDep, subject: str | None = None):
    variants = payload("pyq").get("variants") or {}
    if subject and isinstance(variants, dict) and subject in variants:
        return variants[subject]
    return payload("pyq")["analysis"]


def _studio(db, user):
    return kv_get(db, coll_key("studio_sessions", user.institution_id), [])


def _sources():
    return payload("question-studio-sources").get("sources") or []


@router.get("/faculty/question-studio")
def question_studio(db: DbDep, user: FacultyDep):
    sources = _sources()
    sessions = _studio(db, user)
    metrics = payload("question-studio-sources").get("metrics") or {}
    metrics = {**metrics, "sessions": len(sessions), "approved": sum(len([q for q in s.get("questions") or [] if q.get("approved")]) for s in sessions)}
    return {
        "metrics": metrics,
        "sources": [
            {
                "sourceId": s.get("sourceId"),
                "title": s.get("title"),
                "shortTitle": s.get("shortTitle"),
                "sourceType": s.get("sourceType"),
                "domain": s.get("domain"),
                "exam": s.get("exam"),
                "subject": s.get("subject"),
                "chapter": s.get("chapter"),
                "pageCount": s.get("pageCount"),
                "featured": s.get("featured"),
                "sourceLabel": s.get("sourceLabel"),
                "questionCountGenerated": s.get("questionCountGenerated"),
                "approvedQuestionCount": s.get("approvedQuestionCount"),
                "analysisStatus": s.get("analysisStatus"),
                "uploadedAt": s.get("uploadedAt"),
                "lastAnalyzedAt": s.get("lastAnalyzedAt"),
                "topics": s.get("topics"),
            }
            for s in sources
        ],
    }


@router.get("/faculty/question-studio/sources")
def studio_sources(
    user: FacultyDep,
    search: str | None = None,
    domain: str | None = None,
    exam: str | None = None,
    subject: str | None = None,
    sourceType: str | None = None,
    status: str | None = None,
    featured: str | None = None,
):
    items = list(_sources())
    if search:
        q = search.lower()
        items = [s for s in items if q in f"{s.get('title')} {s.get('subject')} {s.get('chapter')} {s.get('sourceType')}".lower()]
    if domain and domain != "All":
        items = [s for s in items if s.get("domain") == domain]
    if exam and exam != "All":
        items = [s for s in items if not s.get("exam") or s.get("exam") == exam or exam in str(s.get("exam"))]
    if subject and subject != "All":
        items = [s for s in items if s.get("subject") == subject]
    if sourceType and sourceType != "All":
        items = [s for s in items if s.get("sourceType") == sourceType]
    if status and status != "All":
        items = [s for s in items if s.get("analysisStatus") == status]
    if featured == "true":
        items = [s for s in items if s.get("featured")]
    return {"items": items, "count": len(items), "total": len(_sources())}


@router.get("/faculty/question-studio/sources/{source_id}")
def studio_source(source_id: str, user: FacultyDep):
    source = next((s for s in _sources() if s.get("sourceId") == source_id), None)
    if not source:
        raise HTTPException(404, "Source not found.")
    return {"source": source}


@router.post("/faculty/question-studio/sources/{source_id}/analyze")
def analyze_source(source_id: str, user: FacultyDep):
    source = next((s for s in _sources() if s.get("sourceId") == source_id), None)
    if not source:
        raise HTTPException(404, "Source not found.")
    analysis = source.get("analysis") or {
        "status": "Analyzed",
        "topics": source.get("topics") or [],
        "chapter": source.get("chapter"),
        "subject": source.get("subject"),
        "note": "Prototype Content Intelligence",
    }
    return {"ok": True, "sourceId": source_id, "analysis": analysis, "source": {**source, "analysisStatus": "Analyzed", "analysis": analysis}}


@router.post("/faculty/question-studio/sources/upload")
def upload_source(body: dict, db: DbDep, user: FacultyDep):
    uploads = kv_get(db, coll_key("studio_uploads", user.institution_id), [])
    source = {
        "sourceId": f"src_up_{uuid4().hex[:8]}",
        "title": body.get("name") or "Uploaded source",
        "sourceType": body.get("type") or "PDF",
        "analysisStatus": "Pending",
        "uploadedAt": _now(),
        "featured": False,
        "domain": body.get("domain") or "University",
        "subject": body.get("subject"),
        "chapter": body.get("chapter"),
    }
    uploads.insert(0, source)
    kv_set(db, coll_key("studio_uploads", user.institution_id), uploads)
    return {"ok": True, "source": source}


@router.post("/faculty/question-studio/generate")
def generate_studio(body: dict, db: DbDep, user: FacultyDep):
    source_id = body.get("sourceId")
    settings = body.get("settings") or {}
    source = next((s for s in _sources() if s.get("sourceId") == source_id), {"sourceId": source_id, "title": "Source", "chapter": "General", "subject": "General"})
    count = int(settings.get("count") or 8)
    questions = []
    for i in range(count):
        questions.append(
            {
                "questionId": f"qs_{source_id}_{uuid4().hex[:6]}",
                "stem": f"{source.get('chapter') or 'Topic'} — generated item {i + 1}",
                "question": f"Which statement best describes {source.get('chapter') or 'this concept'}? (item {i + 1})",
                "options": ["Option A", "Option B", "Option C", "Option D"],
                "answer": 0,
                "difficulty": settings.get("difficulty") or "Medium",
                "qType": settings.get("qType") or "MCQ",
                "bloomsLevel": settings.get("bloomsLevel") or "Apply",
                "subject": source.get("subject"),
                "chapter": source.get("chapter"),
                "reviewStatus": "Draft",
                "approved": False,
            }
        )
    session = {
        "studioSessionId": f"sess_{uuid4().hex[:8]}",
        "sourceId": source_id,
        "settings": settings,
        "status": "open",
        "questions": questions,
        "createdAt": _now(),
        "title": source.get("title"),
    }
    sessions = _studio(db, user)
    sessions.insert(0, session)
    kv_set(db, coll_key("studio_sessions", user.institution_id), sessions)
    return {"ok": True, "session": session}


@router.get("/faculty/question-studio/sessions")
def studio_sessions(db: DbDep, user: FacultyDep):
    return {"items": _studio(db, user)}


@router.get("/faculty/question-studio/sessions/{session_id}")
def studio_session(session_id: str, db: DbDep, user: FacultyDep):
    session = next((s for s in _studio(db, user) if s.get("studioSessionId") == session_id), None)
    if not session:
        raise HTTPException(404, "Session not found.")
    return {"session": session}


def _mutate_question(db, user, session_id: str, qid: str, mutator):
    sessions = _studio(db, user)
    session = next((s for s in sessions if s.get("studioSessionId") == session_id), None)
    if not session:
        raise HTTPException(404, "Session not found.")
    question = next((q for q in session.get("questions") or [] if q.get("questionId") == qid), None)
    if question is None and mutator.__name__ != "delete":
        raise HTTPException(404, "Question not found.")
    result = mutator(session, question)
    kv_set(db, coll_key("studio_sessions", user.institution_id), sessions)
    return result, session, question


@router.post("/faculty/question-studio/sessions/{session_id}/questions/{qid}/regenerate")
def studio_regenerate(session_id: str, qid: str, body: dict, db: DbDep, user: FacultyDep):
    sessions = _studio(db, user)
    session = next((s for s in sessions if s.get("studioSessionId") == session_id), None)
    question = next((q for q in (session or {}).get("questions") or [] if q.get("questionId") == qid), None)
    if not session or not question:
        raise HTTPException(404, "Question not found.")
    question["question"] = (body.get("prompt") or question.get("question") or "Regenerated question") + " (regenerated)"
    question["reviewStatus"] = "Draft"
    kv_set(db, coll_key("studio_sessions", user.institution_id), sessions)
    return {"ok": True, "question": question}


@router.post("/faculty/question-studio/sessions/{session_id}/questions/{qid}/edit")
def studio_edit(session_id: str, qid: str, body: dict, db: DbDep, user: FacultyDep):
    sessions = _studio(db, user)
    session = next((s for s in sessions if s.get("studioSessionId") == session_id), None)
    question = next((q for q in (session or {}).get("questions") or [] if q.get("questionId") == qid), None)
    if not session or not question:
        raise HTTPException(404, "Question not found.")
    question.update(body or {})
    kv_set(db, coll_key("studio_sessions", user.institution_id), sessions)
    return {"ok": True, "question": question}


@router.post("/faculty/question-studio/sessions/{session_id}/questions/{qid}/delete")
def studio_delete(session_id: str, qid: str, db: DbDep, user: FacultyDep):
    sessions = _studio(db, user)
    session = next((s for s in sessions if s.get("studioSessionId") == session_id), None)
    if not session:
        raise HTTPException(404, "Session not found.")
    session["questions"] = [q for q in session.get("questions") or [] if q.get("questionId") != qid]
    kv_set(db, coll_key("studio_sessions", user.institution_id), sessions)
    return {"ok": True, "deleted": qid}


@router.post("/faculty/question-studio/sessions/{session_id}/questions/{qid}/approve")
def studio_approve(session_id: str, qid: str, db: DbDep, user: FacultyDep):
    sessions = _studio(db, user)
    session = next((s for s in sessions if s.get("studioSessionId") == session_id), None)
    question = next((q for q in (session or {}).get("questions") or [] if q.get("questionId") == qid), None)
    if not session or not question:
        raise HTTPException(404, "Question not found.")
    question["approved"] = True
    question["reviewStatus"] = "Approved"
    kv_set(db, coll_key("studio_sessions", user.institution_id), sessions)
    return {"ok": True, "approved": True, "question": question, "note": "Approved — added to the Question Bank (synced). Never labelled as PYQ."}


@router.post("/faculty/question-studio/sessions/{session_id}/questions/{qid}/reject")
def studio_reject(session_id: str, qid: str, db: DbDep, user: FacultyDep):
    sessions = _studio(db, user)
    session = next((s for s in sessions if s.get("studioSessionId") == session_id), None)
    question = next((q for q in (session or {}).get("questions") or [] if q.get("questionId") == qid), None)
    if not session or not question:
        raise HTTPException(404, "Question not found.")
    question["approved"] = False
    question["reviewStatus"] = "Rejected"
    kv_set(db, coll_key("studio_sessions", user.institution_id), sessions)
    return {"ok": True, "rejected": True, "question": question}


@router.get("/faculty/question-studio/approved")
def studio_approved(db: DbDep, user: FacultyDep):
    items = [q for s in _studio(db, user) for q in s.get("questions") or [] if q.get("approved")]
    return {"items": items, "count": len(items)}


@router.get("/faculty/students/weak-topic-questions")
def weak_topic_questions(user: FacultyDep, subject: str | None = None, chapter: str | None = None):
    bank = payload("faculty-workspace")["questionBank"]
    questions = bank.get("questions") if isinstance(bank, dict) else bank
    items = []
    for q in questions or []:
        if chapter and str(q.get("chapter") or "").lower() != str(chapter).lower() and str(chapter).lower() not in str(q.get("topic") or "").lower():
            continue
        if subject and subject not in str(q.get("subject") or "") and not str(q.get("subject") or "").lower() in str(subject).lower():
            if not str(subject).startswith("Data") and q.get("subject") != subject:
                continue
        items.append({"id": q.get("id"), "text": q.get("text"), "subject": q.get("subject"), "chapter": q.get("chapter"), "topic": q.get("topic"), "difficulty": q.get("difficulty"), "type": q.get("type"), "status": q.get("status")})
        if len(items) >= 6:
            break
    return {"items": items, "count": len(items), "subject": subject, "chapter": chapter}


@router.get("/faculty/students/{student_id}/360")
def student_360(student_id: str, db: DbDep, user: FacultyDep):
    directory = faculty_students_directory(db, user.institution_id)
    student = next((s for s in directory.get("students") or [] if s["id"] == student_id), None)
    if not student:
        raise HTTPException(404, "Student not found.")
    template = payload("student-360-aarav")
    batch = next((b for b in directory.get("batches") or [] if b.get("id") == student.get("batchId")), template.get("batch"))
    rows = db.query(ExamAttempt).filter(ExamAttempt.student_id == student_id, ExamAttempt.is_demo.is_(False)).order_by(ExamAttempt.submitted_at.desc()).all()
    attempts = [attempt_to_dict(r, db) for r in rows]
    template["student"] = {**(template.get("student") or {}), **student, "batchName": student.get("batchName")}
    template["batch"] = batch
    template["attempts"] = attempts
    template["derived"] = {
        **(template.get("derived") or {}),
        "examsCompleted": len(attempts),
        "accuracy": student.get("latestAccuracy"),
        "status": student.get("status"),
        "latest": attempts[0] if attempts else None,
    }
    template["overview"] = {**(template.get("overview") or {}), "examsCompleted": len(attempts), "latestAccuracy": student.get("latestAccuracy"), "status": student.get("status")}
    template["attention"] = student.get("attention")
    template["attentionReason"] = student.get("attentionReason")
    template["defaultDomain"] = student.get("domain") or "University"
    return template


@router.get("/faculty/students/{student_id}/exams/{attempt_id}/analysis")
def faculty_attempt_analysis(student_id: str, attempt_id: str, db: DbDep, user: FacultyDep):
    row = db.get(ExamAttempt, attempt_id)
    if not row or row.student_id != student_id:
        raise HTTPException(404, "Attempt not found.")
    return analysis_from_attempt(attempt_to_dict(row, db))


@router.get("/faculty/similar-issues")
def similar_issues(db: DbDep, user: FacultyDep, scope: str = "all"):
    packed, _, _ = _groups(db, user)
    return {**packed, "scope": scope}


@router.get("/faculty/similar-issues/{group_id}")
def similar_issue_group(group_id: str, db: DbDep, user: FacultyDep):
    packed, _, _ = _groups(db, user)
    group = next((g for g in packed["groups"] if g["id"] == group_id), None)
    if not group:
        raise HTTPException(404, "Issue group not found.")
    return {"group": group}


@router.get("/faculty/similar-issues/{group_id}/evidence")
def similar_issue_evidence(group_id: str, db: DbDep, user: FacultyDep):
    packed, _, _ = _groups(db, user)
    group = next((g for g in packed["groups"] if g["id"] == group_id), None)
    if not group:
        raise HTTPException(404, "Issue group not found.")
    return {"group": group, "evidence": group.get("evidence"), "whyDetected": group.get("whyDetected")}


@router.get("/faculty/similar-issues/{group_id}/intervention-preflight")
def similar_issue_preflight(group_id: str, db: DbDep, user: FacultyDep):
    packed, overrides, _ = _groups(db, user)
    group = next((g for g in packed["groups"] if g["id"] == group_id), None)
    if not group:
        raise HTTPException(404, "Issue group not found.")
    questions = practice_questions(subject=group.get("subject"), chapter=group.get("chapter"), count=8)
    return {"ok": True, "group": group, "yield": len(questions), "sufficient": len(questions) >= 5, "questions": len(questions)}


@router.post("/faculty/similar-issues/{group_id}/interventions")
def create_from_group(group_id: str, body: dict, db: DbDep, user: FacultyDep):
    packed, overrides, _ = _groups(db, user)
    group = next((g for g in packed["groups"] if g["id"] == group_id), None)
    if not group:
        raise HTTPException(404, "Issue group not found.")
    override = {
        **(overrides.get(group_id) or {}),
        "status": "Recommended",
        "studentIds": body.get("studentIds") or group.get("studentIds"),
        "priority": body.get("priority") or group.get("priority"),
        "notes": body.get("notes"),
        "practiceConfig": body.get("practiceConfig"),
        "updatedAt": _now(),
    }
    overrides[group_id] = override
    kv_set(db, coll_key("interventions", user.institution_id), overrides)
    return {"ok": True, "intervention": intervention_from_group(group, override)}


@router.get("/faculty/interventions")
def list_interventions(db: DbDep, user: FacultyDep):
    packed, overrides, _ = _groups(db, user)
    items = [intervention_from_group(g, overrides.get(g["id"])) for g in packed["groups"]]
    return {"items": items, "interventions": items, "count": len(items)}


@router.get("/faculty/interventions/related-resources")
def related_resources(user: FacultyDep, subject: str | None = None, chapter: str | None = None):
    questions = practice_questions(subject=subject, chapter=chapter, count=6)
    return {"items": questions, "count": len(questions), "subject": subject, "chapter": chapter}


@router.get("/faculty/interventions/{intervention_id}")
def get_intervention(intervention_id: str, db: DbDep, user: FacultyDep):
    packed, overrides, _ = _groups(db, user)
    group = next((g for g in packed["groups"] if g["id"] == intervention_id), None)
    if not group:
        raise HTTPException(404, "Intervention not found.")
    return {"intervention": intervention_from_group(group, overrides.get(group["id"]))}


@router.get("/faculty/interventions/{intervention_id}/practice")
def faculty_intervention_practice(intervention_id: str, db: DbDep, user: FacultyDep):
    packed, overrides, _ = _groups(db, user)
    group = next((g for g in packed["groups"] if g["id"] == intervention_id), None)
    if not group:
        raise HTTPException(404, "Intervention not found.")
    iv = intervention_from_group(group, overrides.get(group["id"]))
    questions = practice_questions(subject=iv.get("subject"), chapter=iv.get("chapter"), count=8)
    return {"items": questions, "questions": questions, "count": len(questions), "interventionId": iv["id"]}


@router.get("/faculty/interventions/{intervention_id}/effectiveness")
def intervention_effectiveness(intervention_id: str, db: DbDep, user: FacultyDep):
    packed, overrides, _ = _groups(db, user)
    group = next((g for g in packed["groups"] if g["id"] == intervention_id), None)
    if not group:
        raise HTTPException(404, "Intervention not found.")
    iv = intervention_from_group(group, overrides.get(group["id"]))
    attempts = [a for a in kv_get(db, coll_key("practice_attempts", user.institution_id), []) if a.get("interventionId") == intervention_id]
    practice = [a for a in attempts if a.get("kind") == "practice"]
    retest = [a for a in attempts if a.get("kind") == "retest"]
    before = (iv.get("baseline") or {}).get("accuracy") or 0
    after = (retest[-1].get("accuracy") if retest else (practice[-1].get("accuracy") if practice else before))
    delta = round((after or 0) - (before or 0), 1)
    outcome = "Improving" if delta >= 5 else ("Resolved" if delta >= 15 else "Persistent" if delta < 0 else "Pending")
    return {"interventionId": intervention_id, "before": before, "after": after, "delta": delta, "outcome": outcome, "prototype": True, "practiceCount": len(practice), "retestCount": len(retest)}


@router.post("/faculty/interventions/{group_id}/status")
def transition(group_id: str, body: dict, db: DbDep, user: UserDep):
    packed, overrides, _ = _groups(db, user)
    group = next((g for g in packed["groups"] if g["id"] == group_id), None)
    if not group:
        raise HTTPException(404, "Intervention not found")
    current = intervention_from_group(group, overrides.get(group_id))
    to = str(body.get("status") or "")
    if to and to[0].islower():
        to = to.replace("_", " ").replace("-", " ").title().replace("Retest", "Re-test")
        mapping = {
            "Detected": "Detected",
            "Recommended": "Recommended",
            "Approved": "Approved",
            "Planned": "Planned",
            "Assigned": "Assigned",
            "In Progress": "In Progress",
            "Completed": "Completed",
            "Retest Pending": "Re-test Pending",
            "Re-Test Pending": "Re-test Pending",
            "Evaluating": "Evaluating",
            "Resolved": "Resolved",
            "Improving": "Improving",
            "Persistent": "Persistent",
            "Dismissed": "Dismissed",
        }
        to = mapping.get(to, to)
    if not can_transition(current["status"], to):
        raise HTTPException(400, f"Cannot move from {current['status']} to {to}")
    override = {**(overrides.get(group_id) or {}), "status": to, "action": body.get("action"), "updatedAt": _now()}
    if to == "Assigned":
        override["assignedAt"] = _now()
    overrides[group_id] = override
    kv_set(db, coll_key("interventions", user.institution_id), overrides)
    iv = intervention_from_group(group, override)
    return {"ok": True, "id": iv["id"], "status": iv["status"], "intervention": iv}


@router.post("/faculty/interventions/{group_id}/modify")
def modify_intervention(group_id: str, body: dict, db: DbDep, user: FacultyDep):
    packed, overrides, _ = _groups(db, user)
    group = next((g for g in packed["groups"] if g["id"] == group_id), None)
    if not group:
        raise HTTPException(404, "Intervention not found.")
    override = {**(overrides.get(group_id) or {}), **{k: v for k, v in body.items() if v is not None}, "updatedAt": _now()}
    if body.get("studentIds"):
        override["studentIds"] = body["studentIds"]
    overrides[group_id] = override
    kv_set(db, coll_key("interventions", user.institution_id), overrides)
    return {"ok": True, "intervention": intervention_from_group(group, override)}


@router.post("/faculty/interventions/{group_id}/assign")
def assign_intervention(group_id: str, db: DbDep, user: FacultyDep):
    return transition(group_id, {"status": "Assigned", "action": "assign"}, db, user)


@router.post("/faculty/interventions/{group_id}/retest")
def create_retest(group_id: str, body: dict, db: DbDep, user: FacultyDep):
    packed, overrides, _ = _groups(db, user)
    group = next((g for g in packed["groups"] if g["id"] == group_id), None)
    if not group:
        raise HTTPException(404, "Intervention not found.")
    iv = intervention_from_group(group, overrides.get(group_id))
    questions = practice_questions(subject=iv.get("subject"), chapter=iv.get("chapter"), count=int(body.get("count") or 10))
    retest = {
        "id": f"rt_{uuid4().hex[:8]}",
        "interventionId": iv["id"],
        "title": f"Re-test — {iv.get('chapter')}",
        "chapter": iv.get("chapter"),
        "subject": iv.get("subject"),
        "domain": iv.get("domain"),
        "examFamily": iv.get("examFamily"),
        "questions": questions,
        "count": len(questions),
        "createdAt": _now(),
        "mode": "intervention-retest",
    }
    items = kv_get(db, coll_key("retests", user.institution_id), [])
    items.insert(0, retest)
    kv_set(db, coll_key("retests", user.institution_id), items)
    override = {**(overrides.get(group_id) or {}), "status": "Re-test Pending", "updatedAt": _now()}
    overrides[group_id] = override
    kv_set(db, coll_key("interventions", user.institution_id), overrides)
    return {"ok": True, "retest": retest, "intervention": intervention_from_group(group, override)}


@router.get("/faculty/students/{student_id}/interventions")
def student_interventions(student_id: str, db: DbDep, user: FacultyDep):
    packed, overrides, _ = _groups(db, user)
    items = [intervention_from_group(g, overrides.get(g["id"])) for g in packed["groups"] if student_id in (g.get("studentIds") or [])]
    return {"items": items, "count": len(items)}


@router.post("/faculty/students/{student_id}/interventions")
def create_student_intervention(student_id: str, body: dict, db: DbDep, user: FacultyDep):
    packed, overrides, directory = _groups(db, user)
    student = next((s for s in directory.get("students") or [] if s["id"] == student_id), None)
    if not student:
        raise HTTPException(404, "Student not found.")
    gid = f"sig-ind-{uuid4().hex[:8]}"
    group = {
        "id": gid,
        "domain": student.get("domain") or "University",
        "examFamily": student.get("examFamily"),
        "subject": body.get("subject") or "General",
        "chapter": body.get("chapter") or "Targeted practice",
        "issueType": body.get("issueType") or "Performance Gap",
        "priority": body.get("priority") or "Medium",
        "studentIds": [student_id],
        "students": [{"studentId": student_id, "name": student.get("name"), "roll": student.get("roll")}],
        "avgAccuracy": student.get("latestAccuracy") or 60,
        "avgTime": 110,
        "totalIncorrect": 4,
        "whyDetected": body.get("objective") or "Created from Student 360.",
        "recommendation": {"title": "Targeted practice", "actions": []},
        "evidence": {},
    }
    override = {"status": "Recommended", "studentIds": body.get("studentIds") or [student_id], "notes": body.get("notes"), "practiceConfig": body.get("practiceConfig"), "updatedAt": _now()}
    overrides[gid] = override
    kv_set(db, coll_key("interventions", user.institution_id), overrides)
    extra = kv_get(db, coll_key("custom_groups", user.institution_id), [])
    extra.append(group)
    kv_set(db, coll_key("custom_groups", user.institution_id), extra)
    return {"ok": True, "intervention": intervention_from_group(group, override)}
