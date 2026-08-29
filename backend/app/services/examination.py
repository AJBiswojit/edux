"""Canonical examination workflow: questions → papers → publish → attempts → scoring."""

from __future__ import annotations

import json
import re
from collections import defaultdict
from datetime import datetime, timedelta, timezone
from typing import Any, Iterable
from uuid import uuid4

from fastapi import HTTPException, status
from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session

from app.models.assessment import Paper, PaperQuestion, Question
from app.models.catalog import Chapter, Subject, Topic
from app.models.exams import ExamAttempt, ExamQuestionAttempt, ExamSitting
from app.models.identity import User
from app.models.people import StudentProfile

STATUS_DRAFT = "draft"
STATUS_PUBLISHED = "published"
STATUS_ARCHIVED = "archived"
LETTER = "ABCD"


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


def parse_json(raw: str | None, default: Any = None) -> Any:
    if not raw:
        return {} if default is None else default
    try:
        return json.loads(raw)
    except json.JSONDecodeError:
        return {} if default is None else default


def normalize_exam_mode(raw: Any) -> str | None:
    if raw is None or raw == "":
        return None
    value = str(raw).strip().lower()
    if value in {"university", "uni"}:
        return "university"
    if value in {"competitive"}:
        return "competitive"
    return None


def normalize_exam_family(raw: Any, *, mode: str | None = None) -> str | None:
    if mode == "university":
        return None
    if raw is None or raw == "":
        return None
    value = str(raw).strip().lower()
    if value in {"jee", "jee main", "jee-main"}:
        return "jee"
    if value in {"neet", "neet ug", "neet-ug"}:
        return "neet"
    return None


def title_domain(mode: str | None) -> str:
    return "Competitive" if mode == "competitive" else "University"


def title_family(family: str | None) -> str | None:
    if family == "jee":
        return "JEE"
    if family == "neet":
        return "NEET"
    return None


def title_status(raw: str | None) -> str:
    mapping = {STATUS_DRAFT: "Draft", STATUS_PUBLISHED: "Published", STATUS_ARCHIVED: "Archived"}
    key = (raw or STATUS_DRAFT).lower()
    return mapping.get(key, (raw or "Draft").title())


def title_type(q_type: str | None) -> str:
    value = (q_type or "mcq").lower()
    if value == "mcq":
        return "MCQ"
    return value.upper()


def parse_options(raw: Any) -> list:
    if isinstance(raw, list):
        return raw
    data = parse_json(raw if isinstance(raw, str) else None, [])
    return data if isinstance(data, list) else []


def parse_answer_index(value: Any) -> int | None:
    if value is None or value == "":
        return None
    if isinstance(value, bool):
        return None
    if isinstance(value, int):
        return value if value >= 0 else None
    if isinstance(value, float) and value.is_integer():
        return int(value)
    text = str(value).strip()
    if not text:
        return None
    if len(text) == 1 and text.upper() in LETTER:
        return LETTER.index(text.upper())
    if text.isdigit():
        return int(text)
    match = re.match(r"^([A-Da-d])\b", text)
    if match:
        return LETTER.index(match.group(1).upper())
    try:
        return int(float(text))
    except (TypeError, ValueError):
        return None


def question_correct_index(question: Question) -> int | None:
    return parse_answer_index(question.correct_answer)


def is_admin(user: User) -> bool:
    return user.primary_role == "admin"


def is_faculty(user: User) -> bool:
    return user.primary_role in {"faculty", "admin"}


def assert_same_institution(user: User, institution_id: str | None) -> None:
    if not user.institution_id or user.institution_id != institution_id:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Cross-institution access is not allowed")


def can_manage_paper(user: User, paper: Paper) -> bool:
    if paper.institution_id != user.institution_id:
        return False
    if is_admin(user):
        return True
    return paper.created_by == user.id


def require_paper_manager(user: User, paper: Paper) -> None:
    if not can_manage_paper(user, paper):
        raise HTTPException(status.HTTP_403_FORBIDDEN, "You do not have access to this paper")


def mode_family_from_body(body: dict) -> tuple[str, str | None]:
    mode = normalize_exam_mode(body.get("domain") or body.get("mode") or body.get("examMode")) or "university"
    family = normalize_exam_family(body.get("examFamily") or body.get("exam") or body.get("exam_family"), mode=mode)
    if mode == "competitive" and family not in {"jee", "neet"}:
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_ENTITY, "Competitive papers require examFamily JEE or NEET")
    if mode == "university":
        family = None
    return mode, family


def question_compatible(question: Question, mode: str, family: str | None) -> bool:
    q_mode = normalize_exam_mode(question.exam_mode) or "university"
    q_family = normalize_exam_family(question.exam_family, mode=q_mode)
    if q_mode != mode:
        return False
    return q_family == family


def _catalog_maps(db: Session, institution_id: str) -> tuple[dict, dict, dict]:
    subjects = {row.id: row for row in db.scalars(select(Subject).where(Subject.institution_id == institution_id)).all()}
    chapters = {row.id: row for row in db.scalars(select(Chapter)).all()}
    topics = {row.id: row for row in db.scalars(select(Topic)).all()}
    return subjects, chapters, topics


def serialize_question_faculty(question: Question, subjects: dict, chapters: dict, topics: dict) -> dict:
    subject = subjects.get(question.subject_id)
    chapter = chapters.get(question.chapter_id) if question.chapter_id else None
    topic = topics.get(question.topic_id) if question.topic_id else None
    mode = normalize_exam_mode(question.exam_mode) or "university"
    family = normalize_exam_family(question.exam_family, mode=mode)
    return {
        "id": question.id,
        "subject": (subject.code if subject else None) or question.exam_mode,
        "subjectName": subject.name if subject else None,
        "chapter": (chapter.name if chapter else None) or question.concept,
        "topic": (topic.name if topic else None) or question.concept,
        "type": title_type(question.q_type),
        "questionType": title_type(question.q_type),
        "difficulty": (question.difficulty or "medium").title(),
        "text": question.stem,
        "question": question.stem,
        "options": parse_options(question.options),
        "status": (question.status or "approved").title(),
        "source": question.source or "Bank",
        "usage": 0,
        "bloom": (question.bloom or "Apply").title() if question.bloom else "Apply",
        "tags": [],
        "domain": title_domain(mode),
        "examFamily": title_family(family),
        "examMode": title_domain(mode),
        "isPyq": bool(question.is_pyq),
        "pyqYear": question.pyq_year,
        "marks": question.marks,
        "negativeMarks": question.negative_marks,
        "correctAnswer": question_correct_index(question),
        "explanation": question.explanation,
    }


def list_question_bank(
    db: Session,
    user: User,
    *,
    domain: str | None = None,
    exam_family: str | None = None,
    subject: str | None = None,
    chapter: str | None = None,
    topic: str | None = None,
    difficulty: str | None = None,
    question_type: str | None = None,
    search: str | None = None,
    page: int = 1,
    limit: int = 50,
) -> dict:
    if not user.institution_id:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Institution required")
    page = max(1, int(page or 1))
    limit = min(200, max(1, int(limit or 50)))

    query = select(Question).where(Question.institution_id == user.institution_id)
    mode = normalize_exam_mode(domain)
    family = normalize_exam_family(exam_family, mode=mode)
    if mode:
        query = query.where(Question.exam_mode == mode)
        if mode == "university":
            query = query.where(or_(Question.exam_family.is_(None), Question.exam_family == ""))
        elif family:
            query = query.where(func.lower(Question.exam_family) == family)
    elif family:
        query = query.where(func.lower(Question.exam_family) == family)

    if difficulty and difficulty.lower() not in {"mixed", "all"}:
        query = query.where(func.lower(Question.difficulty) == difficulty.strip().lower())
    if question_type and question_type.lower() not in {"all"}:
        qtype = question_type.strip().lower()
        if qtype == "mcq":
            query = query.where(func.lower(Question.q_type) == "mcq")
        else:
            query = query.where(func.lower(Question.q_type) == qtype)
    if search:
        needle = f"%{search.strip()}%"
        query = query.where(or_(Question.stem.ilike(needle), Question.concept.ilike(needle)))

    subject_ids = None
    if subject and subject not in {"All", "All subjects"}:
        rows = db.scalars(
            select(Subject).where(
                Subject.institution_id == user.institution_id,
                or_(Subject.code == subject, Subject.name == subject),
            )
        ).all()
        subject_ids = [row.id for row in rows] or ["__none__"]
        query = query.where(Question.subject_id.in_(subject_ids))

    if chapter and chapter not in {"All", "All chapters"}:
        chapter_ids = [row.id for row in db.scalars(select(Chapter).where(Chapter.name == chapter)).all()]
        if chapter_ids:
            query = query.where(or_(Question.chapter_id.in_(chapter_ids), Question.concept == chapter))
        else:
            query = query.where(Question.concept == chapter)

    if topic and topic not in {"All", "All topics"}:
        topic_ids = [row.id for row in db.scalars(select(Topic).where(Topic.name == topic)).all()]
        if topic_ids:
            query = query.where(or_(Question.topic_id.in_(topic_ids), Question.concept == topic))
        else:
            query = query.where(Question.concept == topic)

    total = db.scalar(select(func.count()).select_from(query.subquery())) or 0
    rows = db.scalars(query.order_by(Question.created_at.desc()).offset((page - 1) * limit).limit(limit)).all()
    subjects, chapters, topics = _catalog_maps(db, user.institution_id)
    items = [serialize_question_faculty(row, subjects, chapters, topics) for row in rows]
    by_subject: dict[str, int] = defaultdict(int)
    for item in items:
        by_subject[item.get("subject") or "General"] += 1
    return {
        "summary": {"total": int(total), "bySubject": dict(by_subject), "page": page, "limit": limit},
        "questions": items,
        "total": int(total),
        "page": page,
        "limit": limit,
    }


def _paper_questions(db: Session, paper_id: str) -> list[PaperQuestion]:
    return db.scalars(select(PaperQuestion).where(PaperQuestion.paper_id == paper_id).order_by(PaperQuestion.sort_order)).all()


def snapshot_question(question: Question, subjects: dict, chapters: dict, topics: dict) -> dict:
    subject = subjects.get(question.subject_id)
    chapter = chapters.get(question.chapter_id) if question.chapter_id else None
    topic = topics.get(question.topic_id) if question.topic_id else None
    mode = normalize_exam_mode(question.exam_mode) or "university"
    family = normalize_exam_family(question.exam_family, mode=mode)
    return {
        "id": question.id,
        "questionId": question.id,
        "stem": question.stem,
        "question": question.stem,
        "text": question.stem,
        "options": parse_options(question.options),
        "type": title_type(question.q_type),
        "difficulty": (question.difficulty or "medium").title(),
        "subject": (subject.code if subject else None) or question.concept,
        "chapter": (chapter.name if chapter else None) or question.concept,
        "topic": (topic.name if topic else None) or question.concept,
        "marks": question.marks,
        "negativeMarks": question.negative_marks,
        "examMode": mode,
        "examFamily": family,
        "concept": question.concept,
        "qType": question.q_type,
    }


def serialize_delivery_question(link: PaperQuestion, question: Question | None, *, include_answer: bool = False) -> dict:
    snap = parse_json(link.snapshot, {})
    options = snap.get("options")
    if options is None and question:
        options = parse_options(question.options)
    stem = snap.get("stem") or snap.get("question") or (question.stem if question else "")
    qid = (question.id if question else None) or snap.get("questionId") or snap.get("id") or link.question_id
    payload = {
        "id": qid,
        "questionId": qid,
        "subject": snap.get("subject") or (question.concept if question else ""),
        "chapter": snap.get("chapter") or "",
        "topic": snap.get("topic") or (question.concept if question else ""),
        "difficulty": (snap.get("difficulty") or (question.difficulty if question else "medium") or "medium").title(),
        "question": stem,
        "text": stem,
        "options": options or [],
        "type": snap.get("type") or title_type(question.q_type if question else "mcq"),
        "marks": snap.get("marks") if snap.get("marks") is not None else (question.marks if question else 1),
        "negativeMarks": snap.get("negativeMarks") if snap.get("negativeMarks") is not None else (question.negative_marks if question else 0),
    }
    if include_answer and question is not None:
        payload["correctAnswer"] = question_correct_index(question)
    return payload


def serialize_paper_faculty(db: Session, paper: Paper, *, include_questions: bool = True) -> dict:
    links = _paper_questions(db, paper.id)
    ids = [link.question_id for link in links]
    blueprint = parse_json(paper.blueprint, {})
    owner = db.get(User, paper.created_by) if paper.created_by else None
    mode = normalize_exam_mode(paper.exam_mode) or "university"
    family = normalize_exam_family(paper.exam_family, mode=mode)
    item = {
        "id": paper.id,
        "paperCode": paper.paper_code,
        "title": paper.title,
        "course": blueprint.get("course"),
        "mode": title_domain(mode),
        "domain": title_domain(mode),
        "examType": paper.paper_type or blueprint.get("examType"),
        "paperType": paper.paper_type or blueprint.get("paperType"),
        "exam": title_family(family),
        "examFamily": title_family(family),
        "subject": blueprint.get("subject"),
        "chapter": blueprint.get("chapter"),
        "topic": blueprint.get("topic"),
        "program": blueprint.get("program"),
        "faculty": owner.full_name if owner else None,
        "createdBy": paper.created_by,
        "totalMarks": paper.total_marks,
        "duration": paper.duration_minutes,
        "durationMinutes": paper.duration_minutes,
        "difficulty": blueprint.get("difficulty") or "Mixed",
        "questions": len(links),
        "selectedQuestionIds": ids,
        "status": title_status(paper.status),
        "generated": paper.created_at.date().isoformat() if paper.created_at else None,
        "created": paper.created_at.isoformat() if paper.created_at else None,
        "modified": paper.updated_at.isoformat() if paper.updated_at else None,
        "coverage": blueprint.get("coverage") or 90,
        "sets": blueprint.get("sets") or 1,
        "archived": paper.status == STATUS_ARCHIVED,
        "versions": paper.version,
        "negativeMarking": "Enabled" if paper.negative_marking else "Disabled",
        "interventionId": paper.intervention_id,
        "questionList": [],
    }
    if include_questions:
        questions = {row.id: row for row in db.scalars(select(Question).where(Question.id.in_(ids))).all()} if ids else {}
        item["questionList"] = [serialize_delivery_question(link, questions.get(link.question_id), include_answer=False) for link in links]
    return item


def list_faculty_papers(db: Session, user: User) -> list[dict]:
    query = select(Paper).where(Paper.institution_id == user.institution_id)
    if not is_admin(user):
        query = query.where(Paper.created_by == user.id)
    rows = db.scalars(query.order_by(Paper.created_at.desc())).all()
    return [serialize_paper_faculty(db, paper, include_questions=False) for paper in rows]


def get_faculty_paper(db: Session, user: User, paper_id: str) -> dict:
    paper = db.get(Paper, paper_id)
    if not paper:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Paper not found")
    require_paper_manager(user, paper)
    return serialize_paper_faculty(db, paper, include_questions=True)


def _load_selected_questions(db: Session, user: User, ids: list[str], mode: str, family: str | None) -> list[Question]:
    if not ids:
        return []
    unique: list[str] = []
    seen = set()
    for qid in ids:
        if not qid or qid in seen:
            continue
        seen.add(qid)
        unique.append(str(qid))
    rows = db.scalars(select(Question).where(Question.id.in_(unique), Question.institution_id == user.institution_id)).all()
    by_id = {row.id: row for row in rows}
    ordered = []
    missing = []
    incompatible = []
    for qid in unique:
        question = by_id.get(qid)
        if question is None:
            missing.append(qid)
            continue
        if not question_compatible(question, mode, family):
            incompatible.append(qid)
            continue
        ordered.append(question)
    if missing:
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_ENTITY, f"Unknown or unauthorized question ids: {', '.join(missing[:8])}")
    if incompatible:
        raise HTTPException(
            status.HTTP_422_UNPROCESSABLE_ENTITY,
            "Selected questions are not compatible with this paper's domain/exam family",
        )
    return ordered


def create_sql_paper(db: Session, user: User, body: dict) -> dict:
    title = str(body.get("title") or "").strip()
    if not title:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Paper name is required.")
    if not user.institution_id:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Institution required")
    exists = db.scalars(
        select(Paper).where(Paper.institution_id == user.institution_id, func.lower(Paper.title) == title.lower())
    ).first()
    if exists:
        raise HTTPException(status.HTTP_409_CONFLICT, f'A paper named "{title}" already exists — choose a different name.')
    mode, family = mode_family_from_body(body)
    ids = body.get("selectedQuestionIds") or []
    if not isinstance(ids, list):
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_ENTITY, "selectedQuestionIds must be an array of question ids")
    questions = _load_selected_questions(db, user, ids, mode, family)
    duration = int(body.get("duration") or body.get("durationMinutes") or 120)
    total_marks = body.get("totalMarks")
    if total_marks is None:
        total_marks = sum(q.marks or 0 for q in questions) or 0
    negative = body.get("negativeMarking")
    if isinstance(negative, str):
        negative_marking = negative.lower() in {"enabled", "true", "yes", "1"}
    else:
        negative_marking = bool(negative) if negative is not None else mode == "competitive"
    paper = Paper(
        institution_id=user.institution_id,
        paper_code=body.get("paperCode") or f"PAPER-{uuid4().hex[:8].upper()}",
        title=title,
        exam_mode=mode,
        exam_family=family,
        paper_type=body.get("paperType") or body.get("examType"),
        duration_minutes=duration,
        total_marks=float(total_marks or 0),
        negative_marking=negative_marking,
        blueprint=json.dumps(
            {
                "course": body.get("course"),
                "subject": body.get("subject"),
                "chapter": body.get("chapter"),
                "topic": body.get("topic"),
                "program": body.get("program"),
                "difficulty": body.get("difficulty") or "Mixed",
                "examType": body.get("examType"),
                "paperType": body.get("paperType"),
                "bloomPreset": body.get("bloomPreset"),
                "weightagePreset": body.get("weightagePreset"),
                "coPreset": body.get("coPreset"),
                "pyqPreference": body.get("pyqPreference"),
                "examPattern": body.get("examPattern"),
                "coverage": body.get("coverage") or 90,
                "sets": body.get("sets") or 1,
                "config": body.get("config"),
            }
        ),
        status=STATUS_DRAFT,
        version=1,
        intervention_id=body.get("interventionId"),
        created_by=user.id,
    )
    try:
        db.add(paper)
        db.flush()
        subjects, chapters, topics = _catalog_maps(db, user.institution_id)
        for index, question in enumerate(questions, start=1):
            db.add(
                PaperQuestion(
                    paper_id=paper.id,
                    question_id=question.id,
                    sort_order=index,
                    marks_override=None,
                    snapshot=json.dumps(snapshot_question(question, subjects, chapters, topics)),
                )
            )
        db.commit()
    except HTTPException:
        db.rollback()
        raise
    except Exception:
        db.rollback()
        raise
    db.refresh(paper)
    return {"ok": True, "paper": serialize_paper_faculty(db, paper)}


def delete_sql_paper(db: Session, user: User, paper_id: str) -> dict:
    paper = db.get(Paper, paper_id)
    if not paper:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Paper not found")
    require_paper_manager(user, paper)
    if paper.status == STATUS_PUBLISHED:
        taken = db.scalar(select(func.count()).select_from(ExamAttempt).where(ExamAttempt.exam_id == paper.id)) or 0
        if taken:
            raise HTTPException(status.HTTP_409_CONFLICT, "Published papers with attempts cannot be deleted")
    db.query(PaperQuestion).filter(PaperQuestion.paper_id == paper.id).delete()
    db.delete(paper)
    db.commit()
    return {"ok": True, "deleted": paper_id}


def duplicate_sql_paper(db: Session, user: User, paper_id: str) -> dict:
    paper = db.get(Paper, paper_id)
    if not paper:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Paper not found")
    require_paper_manager(user, paper)
    copy = Paper(
        institution_id=paper.institution_id,
        paper_code=f"PAPER-{uuid4().hex[:8].upper()}",
        title=f"{paper.title} (copy)",
        exam_mode=paper.exam_mode,
        exam_family=paper.exam_family,
        subject_id=paper.subject_id,
        course_id=paper.course_id,
        paper_type=paper.paper_type,
        duration_minutes=paper.duration_minutes,
        total_marks=paper.total_marks,
        negative_marking=paper.negative_marking,
        blueprint=paper.blueprint,
        status=STATUS_DRAFT,
        version=1,
        parent_paper_id=paper.id,
        intervention_id=paper.intervention_id,
        created_by=user.id,
    )
    db.add(copy)
    db.flush()
    for link in _paper_questions(db, paper.id):
        db.add(
            PaperQuestion(
                paper_id=copy.id,
                question_id=link.question_id,
                sort_order=link.sort_order,
                marks_override=link.marks_override,
                snapshot=link.snapshot,
            )
        )
    db.commit()
    db.refresh(copy)
    return {"ok": True, "paper": serialize_paper_faculty(db, copy, include_questions=False)}


def archive_sql_paper(db: Session, user: User, paper_id: str, archived: bool | None) -> dict:
    paper = db.get(Paper, paper_id)
    if not paper:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Paper not found")
    require_paper_manager(user, paper)
    if archived is None:
        archived = paper.status != STATUS_ARCHIVED
    if archived:
        paper.status = STATUS_ARCHIVED
    elif paper.status == STATUS_ARCHIVED:
        paper.status = STATUS_DRAFT
    db.commit()
    db.refresh(paper)
    return {"ok": True, "paper": serialize_paper_faculty(db, paper, include_questions=False)}


def regenerate_sql_paper(db: Session, user: User, paper_id: str) -> dict:
    paper = db.get(Paper, paper_id)
    if not paper:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Paper not found")
    require_paper_manager(user, paper)
    if paper.status == STATUS_PUBLISHED:
        raise HTTPException(status.HTTP_409_CONFLICT, "Published papers cannot be regenerated")
    paper.version = (paper.version or 1) + 1
    db.commit()
    db.refresh(paper)
    return {"ok": True, "paper": serialize_paper_faculty(db, paper, include_questions=False)}


def publish_sql_paper(db: Session, user: User, paper_id: str) -> dict:
    paper = db.get(Paper, paper_id)
    if not paper:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Paper not found")
    require_paper_manager(user, paper)
    if paper.status == STATUS_PUBLISHED:
        raise HTTPException(status.HTTP_409_CONFLICT, "Paper is already published")
    if paper.status == STATUS_ARCHIVED:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Archived papers cannot be published")
    links = _paper_questions(db, paper.id)
    if not links:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Paper has no questions")
    mode = normalize_exam_mode(paper.exam_mode) or "university"
    family = normalize_exam_family(paper.exam_family, mode=mode)
    ids = [link.question_id for link in links]
    questions = {row.id: row for row in db.scalars(select(Question).where(Question.id.in_(ids))).all()}
    missing = [qid for qid in ids if qid not in questions]
    if missing:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Paper references questions that no longer exist")
    for question in questions.values():
        if question.institution_id != paper.institution_id or not question_compatible(question, mode, family):
            raise HTTPException(status.HTTP_400_BAD_REQUEST, "Paper contains questions incompatible with its domain/exam family")
    paper.status = STATUS_PUBLISHED
    db.commit()
    db.refresh(paper)
    return {"ok": True, "paper": serialize_paper_faculty(db, paper)}


def exam_type_of(paper: Paper) -> str:
    family = normalize_exam_family(paper.exam_family, mode=normalize_exam_mode(paper.exam_mode))
    if family == "jee":
        return "JEE"
    if family == "neet":
        return "NEET"
    return "University"


def serialize_student_exam(db: Session, paper: Paper, *, include_questions: bool = False, include_answers: bool = False) -> dict:
    mode = normalize_exam_mode(paper.exam_mode) or "university"
    family = normalize_exam_family(paper.exam_family, mode=mode)
    links = _paper_questions(db, paper.id)
    questions_payload = []
    if include_questions:
        qmap = {row.id: row for row in db.scalars(select(Question).where(Question.id.in_([link.question_id for link in links]))).all()} if links else {}
        questions_payload = [serialize_delivery_question(link, qmap.get(link.question_id), include_answer=include_answers) for link in links]
        for q in questions_payload:
            if "correctAnswer" in q or "correct_answer" in q:
                raise RuntimeError("correctAnswer leaked into student delivery serializer")
    item = {
        "id": paper.id,
        "title": paper.title,
        "type": exam_type_of(paper),
        "category": title_domain(mode),
        "domain": title_domain(mode),
        "examFamily": title_family(family),
        "examMode": title_domain(mode),
        "status": "Upcoming",
        "paperStatus": title_status(paper.status),
        "duration": paper.duration_minutes,
        "durationMinutes": paper.duration_minutes,
        "totalMarks": paper.total_marks,
        "negativeMarking": paper.negative_marking,
        "questionCount": len(links),
        "description": "",
        "subject": parse_json(paper.blueprint, {}).get("subject"),
    }
    if include_questions:
        item["questions"] = questions_payload
        if questions_payload:
            item["marksPerQuestion"] = questions_payload[0].get("marks") or 0
            item["negativeMarksPerQuestion"] = questions_payload[0].get("negativeMarks") or 0
    else:
        item["questions"] = len(links)
    return item


def list_published_exams(db: Session, user: User, *, include_questions: bool = False) -> dict:
    if not user.institution_id:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Institution required")
    papers = db.scalars(
        select(Paper)
        .where(Paper.institution_id == user.institution_id, Paper.status == STATUS_PUBLISHED)
        .order_by(Paper.created_at.desc())
    ).all()
    items = [serialize_student_exam(db, paper, include_questions=include_questions, include_answers=False) for paper in papers]
    return {"items": items, "groupLabels": {}}


def get_published_exam(db: Session, user: User, exam_id: str, *, include_questions: bool = True) -> dict:
    paper = db.get(Paper, exam_id)
    if not paper or paper.institution_id != user.institution_id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Exam not found")
    if paper.status != STATUS_PUBLISHED:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Exam not found")
    return {"exam": serialize_student_exam(db, paper, include_questions=include_questions, include_answers=False)}


def _require_student(db: Session, user: User) -> StudentProfile:
    profile = db.get(StudentProfile, user.id)
    if not profile:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Student profile required")
    if profile.institution_id != user.institution_id:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Cross-institution access is not allowed")
    return profile


def start_exam(db: Session, user: User, exam_id: str, *, attempt_kind: str = "practice", is_demo: bool = False) -> dict:
    profile = _require_student(db, user)
    paper = db.get(Paper, exam_id)
    if not paper or paper.institution_id != user.institution_id or paper.status != STATUS_PUBLISHED:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Exam not found")
    existing = db.scalars(
        select(ExamAttempt).where(
            ExamAttempt.student_id == user.id,
            ExamAttempt.exam_id == paper.id,
            ExamAttempt.submitted_at.is_(None),
        )
    ).first()
    exam_payload = serialize_student_exam(db, paper, include_questions=True, include_answers=False)
    if existing:
        return {"ok": True, "id": existing.id, "attemptId": existing.id, "exam": exam_payload, "questions": exam_payload["questions"]}
    started = utcnow()
    sitting = ExamSitting(
        institution_id=user.institution_id,
        paper_id=paper.id,
        student_id=user.id,
        attempt_kind=attempt_kind,
        started_at=started,
        expires_at=started + timedelta(minutes=paper.duration_minutes or 120),
    )
    db.add(sitting)
    db.flush()
    mode = normalize_exam_mode(paper.exam_mode) or "university"
    family = normalize_exam_family(paper.exam_family, mode=mode)
    attempt = ExamAttempt(
        institution_id=user.institution_id,
        sitting_id=sitting.id,
        student_id=user.id,
        roll_no=profile.roll_no,
        batch_id=profile.batch_id,
        exam_id=paper.id,
        exam_name=paper.title,
        exam_mode=mode,
        exam_family=family,
        source="exam_agent",
        attempt_kind=attempt_kind,
        is_demo=is_demo,
        started_at=started,
        submitted_at=None,
        exam_snapshot=json.dumps({k: v for k, v in exam_payload.items() if k != "questions"}),
        timing=json.dumps({}),
        scoring=json.dumps({}),
        interactions=json.dumps({}),
        summary=json.dumps({}),
    )
    db.add(attempt)
    db.commit()
    db.refresh(attempt)
    return {"ok": True, "id": attempt.id, "attemptId": attempt.id, "exam": exam_payload, "questions": exam_payload["questions"]}


def _answers_from_body(body: dict) -> dict[str, Any]:
    collected: dict[str, Any] = {}
    for row in body.get("answers") or []:
        if isinstance(row, dict) and row.get("questionId"):
            collected[str(row["questionId"])] = row.get("selected") if "selected" in row else row.get("answer")
    for row in body.get("questionAttempts") or []:
        if not isinstance(row, dict):
            continue
        qid = row.get("questionId") or (row.get("question") or {}).get("id")
        if not qid:
            continue
        response = row.get("response") or {}
        selected = response.get("selected") if isinstance(response, dict) else None
        if selected is None:
            selected = row.get("selected") or row.get("answer")
        collected[str(qid)] = selected
    interactions = body.get("interactions") or {}
    if isinstance(interactions, dict):
        per_q = interactions.get("questions") or interactions.get("byQuestion") or {}
        if isinstance(per_q, dict):
            for qid, payload in per_q.items():
                if isinstance(payload, dict):
                    collected.setdefault(str(qid), payload.get("selected") or payload.get("answer"))
                else:
                    collected.setdefault(str(qid), payload)
        elif isinstance(per_q, list):
            for payload in per_q:
                if isinstance(payload, dict) and payload.get("questionId"):
                    collected.setdefault(str(payload["questionId"]), payload.get("selected"))
    return collected


def score_paper_attempt(db: Session, paper: Paper, answers: dict[str, Any]) -> tuple[dict, list[dict]]:
    links = _paper_questions(db, paper.id)
    ids = [link.question_id for link in links]
    questions = {row.id: row for row in db.scalars(select(Question).where(Question.id.in_(ids))).all()} if ids else {}
    correct = incorrect = unanswered = 0
    score = 0.0
    max_score = 0.0
    details: list[dict] = []
    for index, link in enumerate(links, start=1):
        question = questions.get(link.question_id)
        snap = parse_json(link.snapshot, {})
        marks = float(link.marks_override if link.marks_override is not None else (snap.get("marks") if snap.get("marks") is not None else (question.marks if question else 1)) or 0)
        neg = float(snap.get("negativeMarks") if snap.get("negativeMarks") is not None else (question.negative_marks if question else 0) or 0)
        max_score += marks
        selected = parse_answer_index(answers.get(link.question_id) if link.question_id in answers else answers.get(str(link.question_id)))
        # also match by snapshot id
        if selected is None:
            selected = parse_answer_index(answers.get(snap.get("id")))
        key = question_correct_index(question) if question else None
        awarded = 0.0
        is_correct = None
        if selected is None:
            unanswered += 1
            is_correct = None
        elif key is None:
            unanswered += 1
        elif selected == key:
            correct += 1
            awarded = marks
            is_correct = True
        else:
            incorrect += 1
            awarded = -neg if paper.negative_marking else 0.0
            is_correct = False
        score += awarded
        delivery = serialize_delivery_question(link, question, include_answer=False)
        details.append(
            {
                "questionId": link.question_id,
                "questionNumber": index,
                "question": delivery,
                "academicContext": {
                    "subject": delivery.get("subject"),
                    "chapter": delivery.get("chapter"),
                    "topic": delivery.get("topic"),
                    "examMode": paper.exam_mode,
                    "examFamily": paper.exam_family,
                },
                "response": {"selected": selected},
                "timing": {},
                "behaviour": {},
                "evaluation": {
                    "isCorrect": is_correct,
                    "marksAwarded": awarded,
                    "maxMarks": marks,
                },
            }
        )
    percentage = round((score / max_score) * 100, 2) if max_score else 0.0
    accuracy = round((correct / (correct + incorrect) * 100), 2) if (correct + incorrect) else 0.0
    scoring = {
        "score": round(score, 2),
        "maxScore": round(max_score, 2),
        "percentage": percentage,
        "correct": correct,
        "incorrect": incorrect,
        "unanswered": unanswered,
        "skipped": unanswered,
        "accuracy": accuracy,
        "total": len(links),
    }
    return scoring, details


def _persist_question_rows(db: Session, attempt_id: str, details: list[dict], body: dict) -> None:
    incoming = {str(row.get("questionId")): row for row in (body.get("questionAttempts") or []) if isinstance(row, dict)}
    db.query(ExamQuestionAttempt).filter(ExamQuestionAttempt.attempt_id == attempt_id).delete()
    for row in details:
        extra = incoming.get(str(row["questionId"])) or {}
        timing = extra.get("timing") if isinstance(extra.get("timing"), dict) else row["timing"]
        behaviour = extra.get("behaviour") if isinstance(extra.get("behaviour"), dict) else row["behaviour"]
        db.add(
            ExamQuestionAttempt(
                attempt_id=attempt_id,
                question_id=row["questionId"],
                question_number=row["questionNumber"],
                question_snapshot=json.dumps(row["question"]),
                academic_context=json.dumps(row["academicContext"]),
                response=json.dumps(row["response"]),
                timing=json.dumps(timing or {}),
                behaviour=json.dumps(behaviour or {}),
                evaluation=json.dumps(row["evaluation"]),
            )
        )


def submit_exam_attempt(db: Session, user: User, body: dict, *, exam_id: str | None = None, attempt_id: str | None = None) -> dict:
    profile = _require_student(db, user)
    paper_id = exam_id or body.get("examId") or (body.get("exam") or {}).get("id") or (body.get("examSnapshot") or {}).get("id")
    if not paper_id:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "examId is required")
    paper = db.get(Paper, paper_id)
    if not paper or paper.institution_id != user.institution_id or paper.status != STATUS_PUBLISHED:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Exam not found")

    attempt = None
    attempt_id = attempt_id or body.get("attemptId") or body.get("id")
    if attempt_id:
        attempt = db.get(ExamAttempt, attempt_id)
    if attempt is None:
        attempt = db.scalars(
            select(ExamAttempt).where(
                ExamAttempt.student_id == user.id,
                ExamAttempt.exam_id == paper.id,
                ExamAttempt.submitted_at.is_(None),
            )
        ).first()
    if attempt and attempt.student_id != user.id:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "You cannot access another student's attempt")
    if attempt and attempt.submitted_at is not None:
        raise HTTPException(status.HTTP_409_CONFLICT, "Attempt already submitted")

    answers = _answers_from_body(body)
    scoring, details = score_paper_attempt(db, paper, answers)
    submitted = utcnow()
    started = body.get("startedAt")
    try:
        started_at = datetime.fromisoformat(str(started).replace("Z", "+00:00")) if started else (attempt.started_at if attempt else submitted)
    except ValueError:
        started_at = attempt.started_at if attempt else submitted
    mode = normalize_exam_mode(paper.exam_mode) or "university"
    family = normalize_exam_family(paper.exam_family, mode=mode)
    snapshot = {k: v for k, v in serialize_student_exam(db, paper, include_questions=False).items()}
    summary = {
        "score": scoring["score"],
        "maxScore": scoring["maxScore"],
        "pct": scoring["percentage"],
        "accuracy": scoring["accuracy"],
        "correct": scoring["correct"],
        "incorrect": scoring["incorrect"],
        "skipped": scoring["unanswered"],
    }
    if attempt is None:
        attempt = ExamAttempt(
            institution_id=user.institution_id,
            student_id=user.id,
            roll_no=profile.roll_no,
            batch_id=profile.batch_id,
            exam_id=paper.id,
            exam_name=paper.title,
            exam_mode=mode,
            exam_family=family,
            source="exam_agent",
            attempt_kind=body.get("attemptKind") or ("demo" if body.get("isDemo") else "practice"),
            is_demo=bool(body.get("isDemo")),
            intervention_id=body.get("interventionId"),
            started_at=started_at,
            submitted_at=submitted,
            exam_snapshot=json.dumps(snapshot),
            timing=json.dumps(body.get("timing") or {"elapsedSeconds": body.get("elapsedSeconds") or 0}),
            scoring=json.dumps(scoring),
            interactions=json.dumps(body.get("interactions") or {}),
            summary=json.dumps(summary),
        )
        db.add(attempt)
        db.flush()
    else:
        if attempt.student_id != user.id:
            raise HTTPException(status.HTTP_403_FORBIDDEN, "You cannot access another student's attempt")
        attempt.submitted_at = submitted
        attempt.scoring = json.dumps(scoring)
        attempt.summary = json.dumps(summary)
        timing_payload = body.get("timing") or parse_json(attempt.timing, {}) or {}
        if not isinstance(timing_payload, dict):
            timing_payload = {}
        if body.get("elapsedSeconds") is not None:
            timing_payload = {**timing_payload, "elapsedSeconds": body.get("elapsedSeconds")}
        attempt.timing = json.dumps(timing_payload)
        attempt.interactions = json.dumps(body.get("interactions") or parse_json(attempt.interactions, {}))
        attempt.exam_snapshot = json.dumps(snapshot)
        attempt.is_demo = bool(body.get("isDemo")) if "isDemo" in body else attempt.is_demo
    _persist_question_rows(db, attempt.id, details, body)
    try:
        db.commit()
    except Exception:
        db.rollback()
        raise
    from app.workers.intelligence import rebuild_student_dna

    rebuild_student_dna(db, user.id)
    saved = db.get(ExamAttempt, attempt.id)
    from app.services.spa_exams import attempt_to_dict

    result = {"ok": True, "id": saved.id, "attempt": attempt_to_dict(saved, db)}
    # Never echo client-supplied score as authority.
    if result["attempt"].get("scoring") != scoring:
        result["attempt"]["scoring"] = scoring
        result["attempt"]["summary"] = summary
    return result


def strip_correct_from_mapping(value: Any) -> Any:
    if isinstance(value, dict):
        return {k: strip_correct_from_mapping(v) for k, v in value.items() if k not in {"correctAnswer", "correct_answer", "answer_key", "correct_option"}}
    if isinstance(value, list):
        return [strip_correct_from_mapping(v) for v in value]
    return value
