"""Exam-agent, analysis, and practice helpers for the SPA contract."""

from __future__ import annotations

import json
from typing import Any

from sqlalchemy.orm import Session

from app.models.exams import ExamAttempt, ExamQuestionAttempt
from app.services.spa_payloads import payload


def exam_catalogue(db: Session | None = None) -> list[dict]:
    from app.db.session import current_db
    from app.services.live_catalog import exam_agent_bundle

    session = db or current_db()
    if session is not None:
        return exam_agent_bundle(session).get("items") or []
    return payload("exam-agent-exams").get("items") or []


def exam_by_id(exam_id: str) -> dict | None:
    for item in exam_catalogue():
        if item.get("id") == exam_id:
            return item
    return None


def attempt_to_dict(row: ExamAttempt, db: Session, *, include_questions: bool = True) -> dict:
    scoring = json.loads(row.scoring or "{}")
    timing = json.loads(row.timing or "{}")
    snapshot = json.loads(row.exam_snapshot or "{}")
    interactions = json.loads(row.interactions or "{}")
    summary = json.loads(row.summary or "{}") if row.summary else {}
    exam_mode = (row.exam_mode or "university").title()
    if exam_mode.lower() == "competitive":
        exam_mode = "Competitive"
    elif exam_mode.lower() == "university":
        exam_mode = "University"
    family = row.exam_family.upper() if row.exam_family in {"jee", "neet"} else row.exam_family
    out: dict[str, Any] = {
        "id": row.id,
        "studentId": row.student_id,
        "roll": row.roll_no,
        "examId": row.exam_id,
        "examName": row.exam_name,
        "examTitle": row.exam_name,
        "shortTitle": snapshot.get("shortTitle") or row.exam_name,
        "examMode": exam_mode,
        "examFamily": family,
        "examType": snapshot.get("type") or exam_mode,
        "category": snapshot.get("category") or exam_mode,
        "subject": snapshot.get("subject"),
        "mode": "demo" if row.is_demo else (row.attempt_kind or "manual"),
        "source": row.source or "exam-agent",
        "attemptKind": row.attempt_kind,
        "isDemo": row.is_demo,
        "startedAt": row.started_at.isoformat() if row.started_at else None,
        "submittedAt": row.submitted_at.isoformat() if row.submitted_at else None,
        "completedAt": row.submitted_at.isoformat() if row.submitted_at else None,
        "batchId": row.batch_id,
        "sectionId": row.section_id,
        "interventionId": row.intervention_id,
        "exam": snapshot or None,
        "timing": timing,
        "scoring": scoring,
        "elapsedSeconds": timing.get("elapsedSeconds") or 0,
        "interactions": interactions,
        "summary": summary,
        "mock": False,
    }
    if include_questions:
        qas = db.query(ExamQuestionAttempt).filter(ExamQuestionAttempt.attempt_id == row.id).order_by(ExamQuestionAttempt.question_number).all()
        out["questionAttempts"] = [
            {
                "questionId": q.question_id,
                "questionNumber": q.question_number,
                "question": json.loads(q.question_snapshot or "{}"),
                "academicContext": json.loads(q.academic_context or "{}"),
                "response": json.loads(q.response or "{}"),
                "timing": json.loads(q.timing or "{}"),
                "behaviour": json.loads(q.behaviour or "{}"),
                "evaluation": json.loads(q.evaluation or "{}"),
            }
            for q in qas
        ]
    return out


def analysis_from_attempt(attempt: dict) -> dict:
    scoring = attempt.get("scoring") or {}
    summary = attempt.get("summary") or {}
    questions = attempt.get("questionAttempts") or []
    by_chapter: dict[str, dict] = {}
    for qa in questions:
        ctx = qa.get("academicContext") or {}
        chapter = ctx.get("chapter") or "Unspecified"
        ev = qa.get("evaluation") or {}
        row = by_chapter.setdefault(chapter, {"chapter": chapter, "n": 0, "correct": 0})
        row["n"] += 1
        if ev.get("isCorrect"):
            row["correct"] += 1
    chapters = [
        {"chapter": v["chapter"], "accuracy": round(100 * v["correct"] / v["n"], 1) if v["n"] else 0, "questions": v["n"]}
        for v in by_chapter.values()
    ]
    return {
        "attempt": attempt,
        "attemptId": attempt.get("id"),
        "examId": attempt.get("examId"),
        "examTitle": attempt.get("examTitle") or attempt.get("examName"),
        "examMode": attempt.get("examMode"),
        "examFamily": attempt.get("examFamily"),
        "scoring": scoring,
        "summary": summary,
        "chapters": chapters,
        "accuracy": scoring.get("accuracy") or summary.get("accuracy"),
        "source": "exam-agent",
    }


def practice_questions(*, subject: str | None, chapter: str | None, count: int = 8) -> list[dict]:
    items: list[dict] = []
    needle = (chapter or subject or "").lower()
    for exam in exam_catalogue():
        for q in exam.get("questions") or []:
            blob = f"{q.get('chapter', '')} {q.get('subject', '')} {q.get('topic', '')}".lower()
            if needle and needle not in blob:
                continue
            items.append(
                {
                    "id": q.get("id"),
                    "question": q.get("question") or q.get("text"),
                    "options": q.get("options"),
                    "answer": q.get("correctAnswer"),
                    "subject": q.get("subject"),
                    "chapter": q.get("chapter"),
                    "topic": q.get("topic"),
                    "difficulty": q.get("difficulty"),
                    "questionType": q.get("type") or "MCQ",
                    "isPyq": False,
                    "source": "exam-agent",
                }
            )
            if len(items) >= count:
                return items
    if items:
        return items[:count]
    for exam in exam_catalogue():
        for q in exam.get("questions") or []:
            items.append(
                {
                    "id": q.get("id"),
                    "question": q.get("question") or q.get("text"),
                    "options": q.get("options"),
                    "answer": q.get("correctAnswer"),
                    "subject": q.get("subject"),
                    "chapter": q.get("chapter"),
                    "topic": q.get("topic"),
                    "difficulty": q.get("difficulty"),
                    "questionType": q.get("type") or "MCQ",
                    "isPyq": False,
                    "source": "exam-agent",
                }
            )
            if len(items) >= count:
                return items
    return items
