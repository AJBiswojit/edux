"""Real AI question generation service — no templates, no mocks, no fallbacks.

Faculty configures paper
  -> POST /faculty/question-bank/generate
  -> QuestionGeneration row (GENERATING) — the generation identity
  -> request sent to the DEPLOYED AI generation microservice
     (app.services.ai_paper_client -> POST /api/generate/async)
  -> the AI service writes ai_generated_papers / ai_generated_paper_questions
     into the shared DB keyed on the paper_id EduX passes
  -> EduX reads those REAL AI question rows back and materialises them into
     the `questions` table (EduX-owned), linking every row to the generation
     via question_generation_items
  -> status READY
  -> GET /faculty/question-bank/generations/{id}/questions returns ONLY the
     question_generation_items for that exact generation.

There is deliberately NO deterministic template/stem generator and NO
"latest AI questions" fallback here. If the AI service cannot be reached the
generation is marked FAILED and an error is surfaced — the UI never sees
unrelated or fabricated questions.
"""

from __future__ import annotations

import json
from datetime import datetime, timezone
from typing import Any
from uuid import uuid4

from fastapi import HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.ai_papers import AiGeneratedPaperQuestion
from app.models.assessment import Question, QuestionGeneration, QuestionGenerationItem
from app.models.catalog import Chapter, Subject, Topic
from app.models.identity import User
from app.services import ai_paper_client

# Status lifecycle — real backend values
STATUS_GENERATING = "GENERATING"
STATUS_PROCESSING = "PROCESSING"
STATUS_READY = "READY"
STATUS_FAILED = "FAILED"
STATUS_COMPLETED = "COMPLETED"  # alias for READY for frontend compatibility

TERMINAL_STATUSES = {STATUS_READY, STATUS_COMPLETED, STATUS_FAILED}

# AI microservice job statuses -> EduX generation statuses.
_JOB_RUNNING = {"queued", "running", "processing", "pending"}
_JOB_DONE = {"completed", "ready", "done"}
_JOB_FAILED = {"failed", "cancelled", "error"}

_ALL_SUBJECTS = {"All subjects", "All Subjects", "all subjects", "All", "All Subjects"}
_ALL_CHAPTERS = {"All chapters", "All", "all chapters", "All Chapters"}


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def _parse_int(value: Any, default: int = 0) -> int:
    try:
        return int(value)
    except Exception:
        return default


def _parse_json(raw: Any, default: Any) -> Any:
    if isinstance(raw, (dict, list)):
        return raw
    if not raw:
        return default
    if isinstance(raw, str):
        try:
            return json.loads(raw)
        except (ValueError, TypeError):
            return default
    return default


def _normalize_mode(raw: Any) -> str:
    if not raw:
        return "university"
    s = str(raw).strip().lower()
    if s in {"competitive"}:
        return "competitive"
    return "university"


def _normalize_family(raw: Any, mode: str) -> str | None:
    if mode == "university":
        return None
    if not raw:
        return None
    s = str(raw).strip().lower()
    if s in {"jee", "jee main", "jee-main", "jee_main"}:
        return "jee"
    if s in {"neet", "neet ug", "neet-ug", "neet_ug"}:
        return "neet"
    return None


def _family_bucket(raw: Any) -> str | None:
    """Normalise a subject.exam_family label to the JEE/NEET buckets."""
    token = str(raw or "").strip().lower().replace("_", " ").replace("-", " ")
    if not token:
        return None
    if token.startswith("jee"):
        return "JEE"
    if token.startswith("neet"):
        return "NEET"
    return None


def _resolve_subject_rows(
    db: Session,
    institution_id: str,
    subject_name: str | None,
    *,
    family: str | None,
) -> list[Subject]:
    """Resolve the generation scope to concrete Subject rows (never fabricates).

    Scoped to the institution and, for Competitive, to the selected exam
    family bucket — JEE and NEET share names like "Physics", so the family is
    ALWAYS part of resolution. "All subjects" returns the full family subject
    set (the intended distribution source, never an arbitrary single subject).
    """
    query = select(Subject).where(Subject.institution_id == institution_id)
    if not subject_name or subject_name in _ALL_SUBJECTS:
        rows = list(db.scalars(query).all())
    else:
        rows = list(
            db.scalars(
                query.where(
                    (Subject.code == subject_name) | (Subject.name == subject_name)
                )
            ).all()
        )
    if not rows:
        label = subject_name if subject_name and subject_name not in _ALL_SUBJECTS else "subjects"
        raise HTTPException(status.HTTP_400_BAD_REQUEST, f"Unknown {label} '{subject_name}' for this institution.")

    if family:
        bucket = "JEE" if family == "jee" else "NEET"
        family_rows = [row for row in rows if _family_bucket(row.exam_family) == bucket]
        if family_rows:
            rows = family_rows
    return rows


def _subject_chapters(db: Session, subject_id: str) -> list[Chapter]:
    return list(
        db.scalars(
            select(Chapter)
            .where(Chapter.subject_id == subject_id)
            .order_by(Chapter.sort_order, Chapter.name)
        ).all()
    )


def _subject_scope_chapters(db: Session, subject_id: str, chapter_name: str | None) -> list[Chapter]:
    """Chapters for a subject under the requested chapter scope (may be empty)."""
    all_chapters = _subject_chapters(db, subject_id)
    if not chapter_name or chapter_name in _ALL_CHAPTERS:
        return all_chapters
    return [row for row in all_chapters if row.name == chapter_name]


def _subject_topics(db: Session, subject_id: str, chapter_ids: list[str]) -> dict[str, list[str]]:
    if not chapter_ids:
        return {}
    rows = db.scalars(select(Topic).where(Topic.chapter_id.in_(chapter_ids)).order_by(Topic.sort_order, Topic.name)).all()
    out: dict[str, list[str]] = {}
    for row in rows:
        out.setdefault(row.chapter_id, []).append(row.name)
    return out


def _resolve_chapter_id(db: Session, subject_id: str | None, chapter_name: str | None) -> str | None:
    if not chapter_name:
        return None
    if subject_id:
        row = db.scalars(
            select(Chapter).where(Chapter.subject_id == subject_id, Chapter.name == chapter_name)
        ).first()
        if row:
            return row.id
    row = db.scalars(select(Chapter).where(Chapter.name == chapter_name)).first()
    return row.id if row else None


def _resolve_topic_id(db: Session, chapter_id: str | None, topic_name: str | None) -> str | None:
    if not topic_name or not chapter_id:
        return None
    row = db.scalars(select(Topic).where(Topic.chapter_id == chapter_id, Topic.name == topic_name)).first()
    if row:
        return row.id
    row = db.scalars(select(Topic).where(Topic.name == topic_name)).first()
    return row.id if row else None


def _normalize_q_type(raw: Any) -> str:
    value = str(raw or "MCQ").strip().lower()
    if value in {"mcq", "multiple choice", "multiple-choice"}:
        return "mcq"
    if "short" in value:
        return "short_answer"
    if "long" in value:
        return "long_answer"
    if "numerical" in value or "numeric" in value:
        return "numerical"
    if "assertion" in value:
        return "assertion_reason"
    if "case" in value:
        return "case_based"
    if "integer" in value:
        return "integer"
    return "mcq"


def _normalize_difficulty(value: Any, fallback: str = "medium") -> str:
    raw = str(value or "").strip().lower()
    if raw in {"easy", "medium", "hard"}:
        return raw
    if raw in {"mixed", "all"}:
        return str(fallback or "medium").strip().lower()
    return raw or str(fallback or "medium").strip().lower()


# --------------------------------------------------------------------------- #
# Request assembly — the EXACT config is sent to the deployed AI agent.       #
# --------------------------------------------------------------------------- #

def _build_ai_request(
    *,
    paper_id: str,
    mode: str,
    family: str | None,
    subject: Subject,
    chapters: list[Chapter],
    topics_by_chapter: dict[str, list[str]],
    total_questions: int,
    difficulty: str,
    question_types: list[str],
    bloom: str | None,
    weightage: str | None,
    co_preset: str | None,
    pyq_pref: str | None,
    negative_marking: str | None,
    exam_pattern: str | None,
    paper_title: str | None,
    course: str | None,
) -> dict:
    """Build the AI service request body — one job per subject scope."""
    chapter_entries = []
    for chapter in chapters:
        entry: dict[str, Any] = {"name": chapter.name}
        topics = topics_by_chapter.get(chapter.id, [])
        if topics:
            entry["notes"] = ", ".join(topics)
        chapter_entries.append(entry)

    scope_notes = json.dumps(
        {
            "mode": mode,
            "examFamily": family.upper() if family else None,
            "subject": subject.name,
            "chapters": [c.name for c in chapters],
            "difficulty": difficulty,
            "questionTypes": question_types,
            "bloomPreset": bloom,
            "weightagePreset": weightage,
            "coPreset": co_preset,
            "pyqPreference": pyq_pref,
            "negativeMarking": negative_marking,
            "examPattern": exam_pattern,
            "course": course,
        }
    )

    exam_family = family.upper() if family else None
    if exam_family is None:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Competitive generation requires an exam family (JEE or NEET).")

    return ai_paper_client.build_generate_request(
        paper_id=paper_id,
        exam_family=exam_family,
        subject=subject.name,
        chapters=chapter_entries,
        total_questions=total_questions,
        difficulty=difficulty,
        test_name=paper_title,
        institution="",
        question_type=question_types[0] if len(question_types) == 1 else None,
        scope_notes=scope_notes,
    )


def _distribute(total: int, buckets: int) -> list[int]:
    """Balanced whole-number distribution of `total` across `buckets`."""
    if buckets <= 0:
        return []
    base = total // buckets
    remainder = total % buckets
    return [base + (1 if i < remainder else 0) for i in range(buckets)]


def _build_jobs(
    db: Session,
    generation: QuestionGeneration,
    config: dict,
) -> list[dict]:
    """Plan one or more AI-service jobs for the generation.

    One job per resolved subject. A user-selected subject keeps exactly one
    job; every request carries the exact chapter/topic/difficulty/type config.
    """
    mode = config["mode"]
    family = config["exam_family"]
    subject_name = config["subject"]
    chapter_name = config["chapter"]
    topic_name = config["topic"]
    total = config["questionCount"]

    candidates = _resolve_subject_rows(db, generation.institution_id, subject_name, family=family)
    # Duplicate subject names exist across exam families / catalog snapshots;
    # use only the rows that actually own the requested chapters.
    subjects = []
    for subject in candidates:
        if _subject_scope_chapters(db, subject.id, chapter_name):
            subjects.append(subject)
    if not subjects:
        if chapter_name and chapter_name not in _ALL_CHAPTERS:
            raise HTTPException(
                status.HTTP_400_BAD_REQUEST,
                f"Chapter '{chapter_name}' is not available for '{subject_name}' in this institution.",
            )
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST,
            f"No chapters are available for '{subject_name}'. Select a chapter in the paper studio.",
        )

    subject_counts = _distribute(total, len(subjects)) if len(subjects) > 1 else [total]

    jobs: list[dict] = []
    for subject, subject_count in zip(subjects, subject_counts):
        if subject_count <= 0:
            continue
        chapters = _subject_scope_chapters(db, subject.id, chapter_name)
        topics_by_chapter = _subject_topics(db, subject.id, [c.id for c in chapters])
        paper_id = str(uuid4())
        request_body = _build_ai_request(
            paper_id=paper_id,
            mode=mode,
            family=family,
            subject=subject,
            chapters=chapters,
            topics_by_chapter=topics_by_chapter,
            total_questions=subject_count,
            difficulty=config["difficulty"],
            question_types=config["questionTypes"],
            bloom=config.get("bloomPreset"),
            weightage=config.get("weightagePreset"),
            co_preset=config.get("coPreset"),
            pyq_pref=config.get("pyqPreference"),
            negative_marking=config.get("negativeMarking"),
            exam_pattern=config.get("examPattern"),
            paper_title=config.get("paperTitle"),
            course=config.get("course"),
        )
        job = {
            "paper_id": paper_id,
            "subject": subject.name,
            "subject_id": subject.id,
            "chapter": chapter_name,
            "chapter_id": None,
            "topic": topic_name,
            "requested": subject_count,
            "request_body": request_body,
        }
        jobs.append(job)
    return jobs


def create_generation(db: Session, user: User, body: dict) -> dict:
    """Create a generation identity and submit it to the deployed AI agent.

    Returns immediately with the generationId; the frontend polls the status
    endpoint, which drives job-status checks and materialisation.
    """
    if not user.institution_id:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Institution required")

    domain_raw = body.get("domain") or body.get("mode") or "University"
    mode = _normalize_mode(domain_raw)
    family_raw = body.get("examFamily") or body.get("exam") or body.get("exam_family")
    family = _normalize_family(family_raw, mode)

    if mode == "university":
        # The deployed AI generation agent is configured for Competitive
        # (JEE / NEET) only. No template/fallback generator may produce
        # University questions — surface the real limitation instead.
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST,
            "AI question generation currently supports Competitive (JEE / NEET) papers.",
        )
    if family not in {"jee", "neet"}:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Competitive generation requires exam family JEE or NEET.")
    if not body.get("subject"):
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Select a subject before generating questions.")

    subject = body.get("subject")
    chapter = body.get("chapter")
    topic = body.get("topic")
    question_count = _parse_int(body.get("questionCount") or body.get("count") or body.get("questions") or 10, 10)
    question_count = max(1, min(100, question_count))

    question_types = body.get("questionTypes") or body.get("qTypes") or ["MCQ"]
    if isinstance(question_types, str):
        question_types = [question_types]
    difficulty = (body.get("difficulty") or "Medium").strip().lower() or "medium"

    config = {
        "domain": domain_raw,
        "mode": mode,
        "examFamily": family_raw,
        "exam_family": family,
        "subject": subject,
        "chapter": chapter,
        "topic": topic,
        "questionCount": question_count,
        "difficulty": difficulty,
        "questionTypes": question_types,
        "bloomPreset": body.get("bloomPreset"),
        "weightagePreset": body.get("weightagePreset"),
        "coPreset": body.get("coPreset"),
        "pyqPreference": body.get("pyqPreference"),
        "negativeMarking": body.get("negativeMarking"),
        "examPattern": body.get("examPattern"),
        "paperTitle": body.get("paperTitle") or body.get("title") or "Generated Paper",
        "paperType": body.get("paperType") or body.get("examType"),
        "totalMarks": _parse_int(body.get("totalMarks") or body.get("marks") or 0, 0),
        "duration": _parse_int(body.get("duration") or 0, 0),
        "program": body.get("program"),
        "course": body.get("course"),
        "requestedAt": _now_iso(),
        "requestedBy": user.id,
    }

    gen = QuestionGeneration(
        institution_id=user.institution_id,
        faculty_id=user.id,
        status=STATUS_GENERATING,
        config=json.dumps(config),
        requested_count=question_count,
        generated_count=0,
    )
    db.add(gen)
    db.flush()

    # Plan the exact AI-service jobs (validates subject/chapter scope first).
    try:
        jobs = _build_jobs(db, gen, config)
    except HTTPException:
        db.rollback()
        raise

    config["jobs"] = jobs
    gen.config = json.dumps(config)
    gen.status = STATUS_PROCESSING
    db.flush()

    # Submit every job to the deployed AI agent. Any submission failure is a
    # REAL error state — no questions are fabricated or reused.
    submitted = []
    try:
        for job in jobs:
            response = ai_paper_client.generate_async(job["request_body"])
            job["job_id"] = response.get("job_id")
            job["ai_status"] = response.get("status", "queued")
            submitted.append(job)
    except ai_paper_client.AiPaperClientError as exc:
        gen.status = STATUS_FAILED
        gen.error_message = str(exc)[:1000]
        config["jobs"] = submitted
        gen.config = json.dumps(config)
        db.commit()
        raise HTTPException(status.HTTP_502_BAD_GATEWAY, f"Question generation failed: {exc}") from exc

    gen.config = json.dumps(config)
    db.commit()
    db.refresh(gen)

    return {
        "ok": True,
        "generationId": gen.id,
        "id": gen.id,
        "status": gen.status,
        "requestedCount": gen.requested_count,
        "generatedCount": gen.generated_count,
        "questions": [],
        "questionIds": [],
        "jobs": [
            {"paper_id": job["paper_id"], "job_id": job.get("job_id"), "subject": job["subject"], "status": job.get("ai_status")}
            for job in submitted
        ],
        "config": config,
        "createdAt": gen.created_at.isoformat() if gen.created_at else _now_iso(),
        "message": "AI generation job submitted — questions will be available when the agent completes.",
    }


# --------------------------------------------------------------------------- #
# Job progress + materialisation.                                             #
# --------------------------------------------------------------------------- #

def _paper_question_count(db: Session, paper_id: str) -> int:
    return int(db.scalar(select(func.count(AiGeneratedPaperQuestion.id)).where(AiGeneratedPaperQuestion.paper_id == paper_id)) or 0)


def _sync_ai_generation(db: Session, gen: QuestionGeneration) -> None:
    """Poll the deployed agent for every job and materialise completed AI
    question rows into the questions table (once, linked to the generation)."""
    if gen.status in TERMINAL_STATUSES or not gen.institution_id:
        return

    config = _parse_json(gen.config, {})
    jobs = config.get("jobs") or []
    if not jobs:
        gen.status = STATUS_FAILED
        gen.error_message = "Generation has no AI jobs — the agent was never invoked."
        db.commit()
        return

    # Serialize concurrent status polls: materialisation must happen exactly once.
    db.execute(
        select(QuestionGeneration.id)
        .where(QuestionGeneration.id == gen.id)
        .with_for_update()
    )

    all_done = True
    errors: list[str] = []
    for job in jobs:
        paper_id = job.get("paper_id")
        requested = _parse_int(job.get("requested"), 0)
        if _paper_question_count(db, paper_id) >= requested:
            job["done"] = True
            continue

        job_id = job.get("job_id")
        if not job_id:
            errors.append("AI job id missing")
            all_done = False
            continue

        try:
            job_status = ai_paper_client.job_status(job_id)
        except ai_paper_client.AiPaperClientError as exc:
            gen.status = STATUS_FAILED
            gen.error_message = str(exc)[:1000]
            db.commit()
            return

        raw_status = str(job_status.get("status") or "").strip().lower()
        job["ai_status"] = raw_status
        if raw_status in _JOB_FAILED or job_status.get("error"):
            gen.status = STATUS_FAILED
            gen.error_message = str(job_status.get("error") or raw_status or "AI generation failed")[:1000]
            db.commit()
            return
        if raw_status in _JOB_DONE:
            if _paper_question_count(db, paper_id) == 0 and requested > 0:
                gen.status = STATUS_FAILED
                gen.error_message = "AI agent completed without generating any questions."
                db.commit()
                return
            job["done"] = True
            continue
        all_done = False

    if errors:
        gen.status = STATUS_FAILED
        gen.error_message = "; ".join(errors)[:1000]
        db.commit()
        return

    if not all_done:
        db.commit()
        return

    _materialize_generation_questions(db, gen, config)
    db.commit()


def _materialize_generation_questions(db: Session, gen: QuestionGeneration, config: dict) -> None:
    """Create REAL Question rows from the AI agent's written questions and link
    them to this exact generation. Idempotent — never duplicates existing links."""
    existing = db.scalars(
        select(QuestionGenerationItem).where(QuestionGenerationItem.generation_id == gen.id)
    ).all()
    if existing:
        gen.generated_count = len(existing)
        gen.status = STATUS_READY
        return

    mode = config.get("mode") or "university"
    family = config.get("exam_family")
    jobs = config.get("jobs") or []
    questions: list[Question] = []
    sort_order = 0

    for job in jobs:
        paper_id = job.get("paper_id")
        rows = db.scalars(
            select(AiGeneratedPaperQuestion)
            .where(AiGeneratedPaperQuestion.paper_id == paper_id)
            .order_by(AiGeneratedPaperQuestion.position)
        ).all()
        subject_id = job.get("subject_id")
        subject_name = job.get("subject")
        for row in rows:
            sort_order += 1
            extra = _parse_json(row.extra, {}) if row.extra else {}
            topic_name = extra.get("topic_name") or job.get("topic")
            chapter_name = extra.get("chapter_name") or job.get("chapter")
            chapter_id = _resolve_chapter_id(db, subject_id, chapter_name)
            topic_id = _resolve_topic_id(db, chapter_id, topic_name)
            concept = topic_name or chapter_name or subject_name or "General"

            options = _parse_json(row.options, []) if row.options else []
            q_type = _normalize_q_type(extra.get("question_type") or extra.get("q_type") or extra.get("type"))
            difficulty = _normalize_difficulty(row.level or config.get("difficulty"))

            negative_enabled = mode == "competitive"
            raw_negative = config.get("negativeMarking")
            if isinstance(raw_negative, str):
                negative_enabled = raw_negative.lower() in {"enabled", "true", "yes", "1"}
            elif raw_negative is not None:
                negative_enabled = bool(raw_negative)

            marks = row.marks if row.marks is not None else (4 if mode == "competitive" else 1)
            negative_marks = row.negative_marks if row.negative_marks is not None else (1 if negative_enabled else 0)

            correct_answer = row.correct_option or "0"
            question = Question(
                institution_id=gen.institution_id,
                exam_mode=mode,
                exam_family=family,
                subject_id=subject_id,
                chapter_id=chapter_id,
                topic_id=topic_id,
                concept=concept,
                stem=row.stem_text,
                q_type=q_type,
                options=json.dumps(options, default=str),
                correct_answer=str(correct_answer),
                explanation=row.explanation,
                marks=float(marks or 1),
                negative_marks=float(negative_marks or 0),
                difficulty=difficulty,
                bloom=str(extra.get("blooms") or config.get("bloomPreset") or "Apply").lower()
                if isinstance(extra.get("blooms") or config.get("bloomPreset"), str)
                else "apply",
                is_pyq=False,
                source="ai",
                quality_score=extra.get("quality_score"),
                status="approved",
                created_by=gen.faculty_id,
            )
            db.add(question)
            db.flush()
            questions.append(question)
            db.add(
                QuestionGenerationItem(
                    generation_id=gen.id,
                    question_id=question.id,
                    sort_order=sort_order,
                )
            )

    gen.generated_count = len(questions)
    gen.status = STATUS_READY
    gen.error_message = None


# --------------------------------------------------------------------------- #
# Read paths — strictly generation-scoped.                                     #
# --------------------------------------------------------------------------- #

def get_generation(db: Session, user: User, generation_id: str) -> QuestionGeneration:
    gen = db.get(QuestionGeneration, generation_id)
    if not gen:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Generation not found")
    if gen.institution_id != user.institution_id:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Cross-institution access denied")
    if user.primary_role != "admin" and gen.faculty_id != user.id:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "You can only access your own generations")
    _sync_ai_generation(db, gen)
    return gen


def get_current_generation(db: Session, user: User) -> QuestionGeneration | None:
    """The faculty's most recent generation — used to recover the current
    generation/paper state after a page refresh. Never synthesises one."""
    query = select(QuestionGeneration).where(QuestionGeneration.institution_id == user.institution_id)
    if user.primary_role != "admin":
        query = query.where(QuestionGeneration.faculty_id == user.id)
    row = db.scalars(query.order_by(QuestionGeneration.created_at.desc())).first()
    if row:
        _sync_ai_generation(db, row)
    return row


def list_generations(db: Session, user: User, limit: int = 20) -> list[QuestionGeneration]:
    query = select(QuestionGeneration).where(QuestionGeneration.institution_id == user.institution_id)
    if user.primary_role != "admin":
        query = query.where(QuestionGeneration.faculty_id == user.id)
    query = query.order_by(QuestionGeneration.created_at.desc()).limit(limit)
    return list(db.scalars(query).all())


def serialize_generation(gen: QuestionGeneration) -> dict:
    config = _parse_json(gen.config, {})
    jobs = config.get("jobs") or []
    return {
        "id": gen.id,
        "generationId": gen.id,
        "status": gen.status,
        "config": config,
        "requestedCount": gen.requested_count,
        "generatedCount": gen.generated_count,
        "error": gen.error_message,
        "errorMessage": gen.error_message,
        "paperIds": [job.get("paper_id") for job in jobs],
        "jobIds": [job.get("job_id") for job in jobs],
        "createdAt": gen.created_at.isoformat() if gen.created_at else None,
        "updatedAt": gen.updated_at.isoformat() if gen.updated_at else None,
        "facultyId": gen.faculty_id,
        "institutionId": gen.institution_id,
    }


def get_generation_questions(db: Session, user: User, generation_id: str) -> dict:
    """ONLY the questions linked to this exact generation — never the
    question bank, never 'latest AI questions', never another generation."""
    gen = get_generation(db, user, generation_id)
    items = db.scalars(
        select(QuestionGenerationItem)
        .where(QuestionGenerationItem.generation_id == generation_id)
        .order_by(QuestionGenerationItem.sort_order)
    ).all()
    q_ids = [item.question_id for item in items]
    questions = []
    if q_ids:
        rows = list(db.scalars(select(Question).where(Question.id.in_(q_ids))).all())
        by_id = {row.id: row for row in rows}
        # Resolution is still constrained to the generation's institution.
        for qid in q_ids:
            question = by_id.get(qid)
            if question is not None and question.institution_id == user.institution_id:
                questions.append(question)

    from app.services.examination import _catalog_maps, serialize_question_faculty

    subjects, chapters, topics = _catalog_maps(db, user.institution_id)
    serialized = [serialize_question_faculty(q, subjects, chapters, topics) for q in questions]

    return {
        "ok": True,
        "generation": serialize_generation(gen),
        "questions": serialized,
        "total": len(serialized),
        "status": gen.status,
        "requestedCount": gen.requested_count,
        "generatedCount": gen.generated_count,
    }


def retry_generation(db: Session, user: User, generation_id: str) -> dict:
    """Start a NEW generation with the same configuration (fresh identity)."""
    gen = get_generation(db, user, generation_id)
    if gen.status != STATUS_FAILED:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Only failed generations can be retried")
    config = _parse_json(gen.config, {})
    return create_generation(db, user, config)
