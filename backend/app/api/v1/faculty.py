from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import Response

from app.core.deps import DbDep, UserDep, require_roles
from app.models.exams import ExamAttempt
from app.models.identity import User
from app.services import live_catalog
from app.services import faculty_runtime
from app.services import micro_assessments
from app.services import studio_lifecycle
from app.services import teaching_ops
from app.services import reports_runtime
from app.services import content_analysis
from app.services import interventions_sql
from app.services.people_directory import faculty_students_directory
from app.services.spa_exams import analysis_from_attempt, attempt_to_dict
from app.services.similar_issues_runtime import derived_intervention, find_group, similar_issues_for_faculty
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
from app.services.question_generation import (
    create_generation,
    get_generation,
    get_generation_questions,
    list_generations,
    retry_generation,
    serialize_generation,
)


router = APIRouter(tags=["faculty"])
FacultyDep = Annotated[User, Depends(require_roles("faculty", "admin"))]


def _groups(db, user):
    packed = similar_issues_for_faculty(db, user)
    directory = faculty_students_directory(db, user.institution_id)
    return packed, directory


def _reports(db, user) -> list:
    return faculty_runtime.reports_list(db, user)


@router.get("/faculty/students")
def faculty_students(db: DbDep, user: FacultyDep):
    return faculty_students_directory(db, user.institution_id)


@router.get("/faculty-intelligence/summary")
def faculty_intel(db: DbDep, user: FacultyDep):
    return faculty_runtime.assemble_faculty_intelligence(db, user)


@router.get("/faculty/attendance")
def faculty_attendance(db: DbDep, user: FacultyDep):
    return live_catalog.faculty_attendance(db, user.institution_id)


@router.get("/faculty/assignments")
def faculty_assignments(db: DbDep, user: FacultyDep):
    return {"items": live_catalog.faculty_assignments(db, user.institution_id)}


@router.post("/faculty/assignments")
def create_faculty_assignment(body: dict, db: DbDep, user: FacultyDep):
    return faculty_runtime.create_assignment(db, user, body or {})


@router.post("/faculty/assignments/{assignment_id}/grade")
def grade_faculty_assignment(assignment_id: str, body: dict, db: DbDep, user: FacultyDep):
    return faculty_runtime.grade_assignment(db, user, assignment_id, body or {})


@router.post("/faculty/assignments/{assignment_id}/publish")
def publish_faculty_assignment(assignment_id: str, db: DbDep, user: FacultyDep):
    return teaching_ops.publish_assignment(db, user, assignment_id)


@router.post("/faculty/assignments/{assignment_id}/archive")
def archive_faculty_assignment(assignment_id: str, db: DbDep, user: FacultyDep):
    return teaching_ops.archive_assignment(db, user, assignment_id)


@router.post("/faculty/attendance")
def create_attendance_session(body: dict, db: DbDep, user: FacultyDep):
    return faculty_runtime.create_attendance_session(db, user, body or {})


@router.post("/faculty/attendance/{session_id}/mark")
def mark_attendance_session(session_id: str, body: dict, db: DbDep, user: FacultyDep):
    return faculty_runtime.mark_attendance(db, user, session_id, body or {})


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


@router.post("/faculty/question-bank/generate")
def generate_questions(body: dict, db: DbDep, user: FacultyDep):
    """Generate AI questions and persist to PostgreSQL.

    Request body contains paper configuration:
    domain, examFamily, subject, chapter, topic, questionCount,
    difficulty, questionTypes, blueprint, examPattern, negativeMarking, etc.

    Returns generationId, status, and persisted question IDs.
    """
    return create_generation(db, user, body or {})


@router.get("/faculty/question-bank/generations")
def list_question_generations(db: DbDep, user: FacultyDep, limit: int = 20):
    gens = list_generations(db, user, limit=limit)
    return {"items": [serialize_generation(g) for g in gens], "count": len(gens)}


@router.get("/faculty/question-bank/generations/{generation_id}")
def get_question_generation(generation_id: str, db: DbDep, user: FacultyDep):
    gen = get_generation(db, user, generation_id)
    return {"ok": True, "generation": serialize_generation(gen), **serialize_generation(gen)}


@router.get("/faculty/question-bank/generations/{generation_id}/questions")
def get_questions_for_generation(generation_id: str, db: DbDep, user: FacultyDep):
    return get_generation_questions(db, user, generation_id)


@router.post("/faculty/question-bank/generations/{generation_id}/retry")
def retry_question_generation(generation_id: str, db: DbDep, user: FacultyDep):
    return retry_generation(db, user, generation_id)


@router.get("/faculty/research")
def faculty_research(db: DbDep, user: FacultyDep):
    return teaching_ops.list_research(db, user)


@router.post("/faculty/research")
def create_faculty_research(body: dict, db: DbDep, user: FacultyDep):
    return teaching_ops.create_publication(db, user, body or {})


@router.get("/faculty/lecture-planner")
def lecture_planner(db: DbDep, user: FacultyDep):
    return teaching_ops.list_lessons(db, user)


@router.post("/faculty/lecture-planner")
def create_lecture(body: dict, db: DbDep, user: FacultyDep):
    return teaching_ops.create_lesson(db, user, body or {})


@router.get("/faculty/exam-builder")
def exam_builder(user: FacultyDep):
    return faculty_runtime.empty_exam_builder()


@router.get("/faculty/settings")
def faculty_settings(db: DbDep, user: FacultyDep):
    return faculty_runtime.settings_payload(db, user)


@router.get("/faculty/roster")
def faculty_roster(db: DbDep, user: FacultyDep):
    live = faculty_students_directory(db, user.institution_id)
    return {"students": live.get("students") or []}


@router.get("/faculty/courses")
def faculty_courses(db: DbDep, user: FacultyDep):
    return {"items": faculty_runtime.list_faculty_courses(db, user)}


@router.get("/faculty/timetable")
def faculty_timetable(db: DbDep, user: FacultyDep):
    return teaching_ops.list_slots(db, user)


@router.post("/faculty/timetable")
def create_faculty_timetable(body: dict, db: DbDep, user: FacultyDep):
    return teaching_ops.create_slot(db, user, body or {})


@router.get("/faculty/announcements")
def faculty_announcements(db: DbDep, user: FacultyDep):
    return {"items": live_catalog.faculty_announcements(db, user.institution_id)}


@router.get("/faculty/quiz-builder")
def quiz_builder(user: FacultyDep):
    return faculty_runtime.empty_quiz_builder()


@router.get("/faculty/ai-studio")
def ai_studio(db: DbDep, user: FacultyDep):
    history = faculty_runtime.list_studio_history(db, user)
    return {
        "contentTemplates": [],
        "rubricTemplates": [],
        "generationHistory": history,
    }


@router.post("/faculty/ai-studio/save")
def ai_studio_save(body: dict, db: DbDep, user: FacultyDep):
    return faculty_runtime.save_studio_item(db, user, body or {})


@router.get("/faculty/reports")
def list_reports(db: DbDep, user: FacultyDep):
    return {"items": reports_runtime.list_reports(db, user)}


@router.post("/faculty/reports")
def create_report(body: dict, db: DbDep, user: FacultyDep):
    return reports_runtime.create_report(db, user, body or {})


@router.delete("/faculty/reports/{report_id}")
def delete_report(report_id: str, db: DbDep, user: FacultyDep):
    return reports_runtime.delete_report(db, user, report_id)


@router.patch("/faculty/reports/{report_id}/archive")
def archive_report(report_id: str, body: dict, db: DbDep, user: FacultyDep):
    return reports_runtime.archive_report(db, user, report_id, body.get("archived") if isinstance(body, dict) else None)


@router.get("/faculty/reports/{report_id}/download")
def download_report(report_id: str, db: DbDep, user: FacultyDep):
    row, data = reports_runtime.download_report(db, user, report_id)
    payload = reports_runtime.serialize_report(row)
    filename = f"{payload.get('title') or 'report'}.pdf".replace(" ", "_")
    return Response(content=data, media_type="application/pdf", headers={"Content-Disposition": f'attachment; filename="{filename}"'})


@router.get("/faculty/paper-generator")
def paper_generator(db: DbDep, user: FacultyDep):
    return faculty_runtime.paper_generator_payload(db, user)


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
    return faculty_runtime.share_faculty_paper(db, user, paper_id, body or {})


@router.get("/faculty/paper-generator/shares")
def paper_shares(db: DbDep, user: FacultyDep):
    return {"items": faculty_runtime.list_paper_shares(db, user)}


@router.get("/faculty/pyq-analysis")
def pyq_analysis(db: DbDep, user: FacultyDep):
    _, analysis = faculty_runtime.pyq_corpus(db, user)
    return analysis


@router.get("/faculty/pyq-analysis/filters")
def pyq_filters(db: DbDep, user: FacultyDep):
    return faculty_runtime.pyq_filters(db, user)


@router.get("/faculty/pyq-analysis/patterns")
def pyq_patterns(db: DbDep, user: FacultyDep):
    return {"items": faculty_runtime.pyq_patterns(db, user)}


@router.get("/faculty/pyq-analysis/analytics")
def pyq_analytics(db: DbDep, user: FacultyDep, subject: str | None = None):
    _, analysis = faculty_runtime.pyq_corpus(db, user, subject=subject)
    return analysis


@router.get("/faculty/question-studio")
def question_studio(db: DbDep, user: FacultyDep):
    sources = faculty_runtime.list_content_sources(db, user)
    sessions = faculty_runtime.studio_sessions(db, user)
    return {
        "metrics": {"sessions": len(sessions), "approved": 0, "sources": len(sources)},
        "sources": sources,
    }


@router.get("/faculty/question-studio/sources")
def studio_sources(
    db: DbDep,
    user: FacultyDep,
    search: str | None = None,
    domain: str | None = None,
    exam: str | None = None,
    subject: str | None = None,
    sourceType: str | None = None,
    status: str | None = None,
    featured: str | None = None,
):
    items = faculty_runtime.list_content_sources(db, user)
    total = len(items)
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
    return {"items": items, "count": len(items), "total": total}


@router.get("/faculty/question-studio/sources/{source_id}")
def studio_source(source_id: str, db: DbDep, user: FacultyDep):
    source = next((s for s in faculty_runtime.list_content_sources(db, user) if s.get("sourceId") == source_id), None)
    if not source:
        raise HTTPException(404, "Source not found.")
    return {"source": source}


@router.post("/faculty/question-studio/sources/{source_id}/analyze")
def analyze_source(source_id: str, db: DbDep, user: FacultyDep, body: dict | None = None):
    return content_analysis.analyze_source(db, user, source_id, body or {})


@router.post("/faculty/question-studio/sources/upload")
def upload_source(body: dict, db: DbDep, user: FacultyDep):
    return faculty_runtime.upload_content_source(db, user, body or {})


@router.post("/faculty/question-studio/generate")
def generate_studio(body: dict, db: DbDep, user: FacultyDep):
    return faculty_runtime.generate_studio_session(db, user, body or {})


@router.get("/faculty/question-studio/sessions")
def studio_sessions(db: DbDep, user: FacultyDep):
    return {"items": faculty_runtime.studio_sessions(db, user)}


@router.get("/faculty/question-studio/sessions/{session_id}")
def studio_session(session_id: str, db: DbDep, user: FacultyDep):
    from app.models.assessment import QuestionStudioSession

    row = db.get(QuestionStudioSession, session_id)
    if not row or row.institution_id != user.institution_id:
        raise HTTPException(404, "Session not found.")
    return {"session": studio_lifecycle.serialize_session(db, user, row)}


@router.post("/faculty/question-studio/sessions/{session_id}/questions/{qid}/regenerate")
def studio_regenerate(session_id: str, qid: str, body: dict, db: DbDep, user: FacultyDep):
    return studio_lifecycle.regenerate_question(db, user, session_id, qid, body or {})


@router.post("/faculty/question-studio/sessions/{session_id}/questions/{qid}/edit")
def studio_edit(session_id: str, qid: str, body: dict, db: DbDep, user: FacultyDep):
    return studio_lifecycle.edit_question(db, user, session_id, qid, body or {})


@router.post("/faculty/question-studio/sessions/{session_id}/questions/{qid}/delete")
def studio_delete(session_id: str, qid: str, db: DbDep, user: FacultyDep):
    return studio_lifecycle.delete_question(db, user, session_id, qid)


@router.post("/faculty/question-studio/sessions/{session_id}/questions/{qid}/approve")
def studio_approve(session_id: str, qid: str, db: DbDep, user: FacultyDep):
    return faculty_runtime.approve_studio_question(db, user, qid)


@router.post("/faculty/question-studio/sessions/{session_id}/questions/{qid}/reject")
def studio_reject(session_id: str, qid: str, db: DbDep, user: FacultyDep):
    return studio_lifecycle.reject_question(db, user, session_id, qid)


@router.get("/faculty/question-studio/approved")
def studio_approved(db: DbDep, user: FacultyDep):
    bank = list_question_bank(db, user, limit=50)
    items = [q for q in bank.get("questions") or [] if str(q.get("source") or "").lower() == "ai"]
    return {"items": items, "count": len(items)}


@router.get("/faculty/micro-assessments/sources")
def micro_sources(db: DbDep, user: FacultyDep, search: str | None = None, domain: str | None = None, examFamily: str | None = None, subject: str | None = None):
    return micro_assessments.list_sources(db, user, {"search": search, "domain": domain, "examFamily": examFamily, "subject": subject})


@router.get("/faculty/micro-assessments/sources/{source_id}")
def micro_source(source_id: str, db: DbDep, user: FacultyDep):
    return micro_assessments.get_source(db, user, source_id)


@router.get("/faculty/micro-assessments/participants")
def micro_participants(db: DbDep, user: FacultyDep, sourceId: str | None = None, domain: str | None = None, examFamily: str | None = None):
    return micro_assessments.participants(db, user, domain=domain, exam_family=examFamily)


@router.post("/faculty/micro-assessments/process")
def micro_process(body: dict, db: DbDep, user: FacultyDep):
    return micro_assessments.process_source(db, user, body or {})


@router.post("/faculty/micro-assessments/generate")
def micro_generate(body: dict, db: DbDep, user: FacultyDep):
    return micro_assessments.generate_from_source(db, user, body or {})


@router.post("/faculty/micro-assessments/regenerate")
def micro_regenerate(body: dict, db: DbDep, user: FacultyDep):
    return micro_assessments.regenerate_one(db, user, body or {})


@router.post("/faculty/micro-assessments/missing-coverage")
def micro_missing(body: dict, db: DbDep, user: FacultyDep):
    return micro_assessments.missing_coverage(db, user, body or {})


@router.get("/faculty/micro-assessments")
def list_micro(db: DbDep, user: FacultyDep):
    return micro_assessments.list_faculty(db, user)


@router.post("/faculty/micro-assessments")
def create_micro(body: dict, db: DbDep, user: FacultyDep):
    if (body or {}).get("questions") or (body or {}).get("studentIds") or (body or {}).get("batchIds"):
        return micro_assessments.create_and_send(db, user, body or {})
    return micro_assessments.create(db, user, body or {})


@router.get("/faculty/micro-assessments/{assessment_id}")
def get_micro(assessment_id: str, db: DbDep, user: FacultyDep):
    return micro_assessments.get_faculty(db, user, assessment_id)


@router.post("/faculty/micro-assessments/{assessment_id}/generate")
def generate_micro(assessment_id: str, body: dict, db: DbDep, user: FacultyDep):
    return micro_assessments.generate_questions(db, user, assessment_id, body or {})


@router.post("/faculty/micro-assessments/{assessment_id}/assign")
def assign_micro(assessment_id: str, body: dict, db: DbDep, user: FacultyDep):
    return micro_assessments.assign_students(db, user, assessment_id, body or {})


@router.post("/faculty/micro-assessments/{assessment_id}/send")
def send_micro(assessment_id: str, body: dict | None, db: DbDep, user: FacultyDep):
    return micro_assessments.send_assessment(db, user, assessment_id, body or {})


@router.get("/faculty/micro-assessments/{assessment_id}/analytics")
def micro_analytics(assessment_id: str, db: DbDep, user: FacultyDep):
    return micro_assessments.analytics(db, user, assessment_id)


@router.get("/faculty/micro-assessments/{assessment_id}/results")
def micro_results(assessment_id: str, db: DbDep, user: FacultyDep):
    return micro_assessments.results(db, user, assessment_id)


@router.post("/faculty/micro-assessments/{assessment_id}/intervention")
def micro_intervention(assessment_id: str, body: dict, db: DbDep, user: FacultyDep):
    return micro_assessments.create_intervention_from_assessment(db, user, assessment_id, body or {})


@router.get("/faculty/students/weak-topic-questions")
def weak_topic_questions(db: DbDep, user: FacultyDep, subject: str | None = None, chapter: str | None = None):
    return faculty_runtime.weak_topic_questions(db, user, subject=subject, chapter=chapter)


@router.get("/faculty/students/{student_id}/360")
def student_360(student_id: str, db: DbDep, user: FacultyDep):
    return faculty_runtime.student_360(db, user, student_id)


@router.get("/faculty/students/{student_id}/exams/{attempt_id}/analysis")
def faculty_attempt_analysis(student_id: str, attempt_id: str, db: DbDep, user: FacultyDep):
    row = db.get(ExamAttempt, attempt_id)
    if not row or row.student_id != student_id:
        raise HTTPException(404, "Attempt not found.")
    return analysis_from_attempt(attempt_to_dict(row, db))


@router.get("/faculty/similar-issues")
def similar_issues(db: DbDep, user: FacultyDep, scope: str = "all"):
    packed, _ = _groups(db, user)
    return {**packed, "scope": scope}


@router.get("/faculty/similar-issues/{group_id}")
def similar_issue_group(group_id: str, db: DbDep, user: FacultyDep):
    packed, _ = _groups(db, user)
    group = find_group(packed, group_id)
    if not group:
        raise HTTPException(404, "Issue group not found.")
    return {"group": group}


@router.get("/faculty/similar-issues/{group_id}/evidence")
def similar_issue_evidence(group_id: str, db: DbDep, user: FacultyDep):
    packed, _ = _groups(db, user)
    group = find_group(packed, group_id)
    if not group:
        raise HTTPException(404, "Issue group not found.")
    return {"group": group, "evidence": group.get("evidence"), "whyDetected": group.get("whyDetected")}


@router.get("/faculty/similar-issues/{group_id}/intervention-preflight")
def similar_issue_preflight(group_id: str, db: DbDep, user: FacultyDep):
    packed, _ = _groups(db, user)
    group = find_group(packed, group_id)
    if not group:
        raise HTTPException(404, "Issue group not found.")
    questions = faculty_runtime.faculty_practice_questions(db, user, subject=group.get("subject"), chapter=group.get("chapter"), count=8)
    return {"ok": True, "group": group, "yield": len(questions), "sufficient": len(questions) >= 5, "questions": len(questions)}


@router.post("/faculty/similar-issues/{group_id}/interventions")
def create_from_group(group_id: str, body: dict, db: DbDep, user: FacultyDep):
    packed, _ = _groups(db, user)
    group = find_group(packed, group_id)
    if not group:
        raise HTTPException(404, "Issue group not found.")
    return interventions_sql.create_from_group_sql(db, user, group, body or {})


@router.get("/faculty/interventions")
def list_interventions(db: DbDep, user: FacultyDep):
    items = interventions_sql.list_sql(db, user)
    return {"items": items, "interventions": items, "count": len(items)}


@router.get("/faculty/interventions/related-resources")
def related_resources(db: DbDep, user: FacultyDep, subject: str | None = None, chapter: str | None = None):
    questions = faculty_runtime.faculty_practice_questions(db, user, subject=subject, chapter=chapter, count=6)
    return {"items": questions, "count": len(questions), "subject": subject, "chapter": chapter}


@router.get("/faculty/interventions/{intervention_id}")
def get_intervention(intervention_id: str, db: DbDep, user: FacultyDep):
    row = interventions_sql.get_sql(db, user, intervention_id)
    if row:
        return {"intervention": interventions_sql.serialize_sql(db, row)}
    packed, _ = _groups(db, user)
    group = find_group(packed, intervention_id)
    if not group:
        raise HTTPException(404, "Intervention not found.")
    return {"intervention": derived_intervention(group)}


@router.get("/faculty/interventions/{intervention_id}/practice")
def faculty_intervention_practice(intervention_id: str, db: DbDep, user: FacultyDep):
    row = interventions_sql.get_sql(db, user, intervention_id)
    if row:
        iv = interventions_sql.serialize_sql(db, row)
    else:
        packed, _ = _groups(db, user)
        group = find_group(packed, intervention_id)
        if not group:
            raise HTTPException(404, "Intervention not found.")
        iv = derived_intervention(group)
    questions = faculty_runtime.faculty_practice_questions(db, user, subject=iv.get("subject"), chapter=iv.get("chapter"), count=8)
    return {"items": questions, "questions": questions, "count": len(questions), "interventionId": iv["id"]}


@router.get("/faculty/interventions/{intervention_id}/effectiveness")
def intervention_effectiveness(intervention_id: str, db: DbDep, user: FacultyDep):
    row = interventions_sql.get_sql(db, user, intervention_id)
    if row:
        return interventions_sql.effectiveness_sql(db, user, intervention_id)
    packed, _ = _groups(db, user)
    group = find_group(packed, intervention_id)
    if not group:
        raise HTTPException(404, "Intervention not found.")
    return {
        "interventionId": intervention_id,
        "before": group.get("avgAccuracy"),
        "after": None,
        "delta": None,
        "outcome": "Pending",
        "practiceCount": 0,
        "retestCount": 0,
        "source": "derived",
    }


@router.post("/faculty/interventions/{group_id}/status")
def transition(group_id: str, body: dict, db: DbDep, user: UserDep):
    row = interventions_sql.get_sql(db, user, group_id)
    if not row:
        raise HTTPException(404, "Intervention not found")
    to = interventions_sql.normalize_status_label(body.get("status"))
    return interventions_sql.transition_sql(db, user, row.id, to, body.get("action"))


@router.post("/faculty/interventions/{group_id}/modify")
def modify_intervention(group_id: str, body: dict, db: DbDep, user: FacultyDep):
    row = interventions_sql.get_sql(db, user, group_id)
    if not row:
        raise HTTPException(404, "Intervention not found.")
    return interventions_sql.modify_sql(db, user, row.id, body or {})


@router.post("/faculty/interventions/{group_id}/assign")
def assign_intervention(group_id: str, db: DbDep, user: FacultyDep):
    return transition(group_id, {"status": "Assigned", "action": "assign"}, db, user)


@router.post("/faculty/interventions/{group_id}/retest")
def create_retest(group_id: str, body: dict, db: DbDep, user: FacultyDep):
    row = interventions_sql.get_sql(db, user, group_id)
    if not row:
        raise HTTPException(404, "Intervention not found.")
    return interventions_sql.create_retest_sql(db, user, row.id, body or {})


@router.get("/faculty/students/{student_id}/interventions")
def student_interventions(student_id: str, db: DbDep, user: FacultyDep):
    items = [row for row in interventions_sql.list_sql(db, user) if student_id in (row.get("studentIds") or [])]
    return {"items": items, "count": len(items)}


@router.post("/faculty/students/{student_id}/interventions")
def create_student_intervention(student_id: str, body: dict, db: DbDep, user: FacultyDep):
    _, directory = _groups(db, user)
    student = next((s for s in directory.get("students") or [] if s["id"] == student_id), None)
    if not student:
        raise HTTPException(404, "Student not found.")
    return interventions_sql.create_for_student(db, user, student_id, body or {}, student)
