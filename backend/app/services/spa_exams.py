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
    """Full AnalysisDashboard shape from a live attempt. Never SPA. Missing cohort stats stay null."""
    scoring = attempt.get("scoring") or {}
    summary = attempt.get("summary") or {}
    questions = attempt.get("questionAttempts") or []
    snapshot = attempt.get("exam") or {}
    mode = attempt.get("examMode") or snapshot.get("category") or "University"
    is_university = str(mode).lower() != "competitive"
    max_score = scoring.get("maxScore") or snapshot.get("totalMarks") or 0
    score = scoring.get("score")
    if score is None:
        score = summary.get("score") or 0
    try:
        percentage = round(float(scoring.get("percentage") if scoring.get("percentage") is not None else summary.get("pct") or 0), 1)
    except (TypeError, ValueError):
        percentage = 0.0
    attempted_n = 0
    correct_n = 0
    incorrect_n = 0
    skipped_n = 0
    guess_n = 0
    negative = scoring.get("negativeMarks") or scoring.get("negative") or 0
    by_chapter: dict[str, dict] = {}
    by_subject: dict[str, dict] = {}
    by_topic: dict[str, dict] = {}
    by_diff: dict[str, dict] = {}
    mistake_cats: dict[str, int] = {}
    mistake_list = []
    question_review = []
    times: list[tuple[str, float]] = []
    subjects_seen: list[str] = []

    def _num(value, default=0.0):
        try:
            return float(value)
        except (TypeError, ValueError):
            return default

    for qa in questions:
        ctx = qa.get("academicContext") or {}
        qsnap = qa.get("question") or {}
        ev = qa.get("evaluation") or {}
        timing = qa.get("timing") or {}
        behaviour = qa.get("behaviour") or {}
        response = qa.get("response") or {}
        chapter = ctx.get("chapter") or qsnap.get("chapter") or "Unspecified"
        subject = ctx.get("subject") or qsnap.get("subject") or attempt.get("subject") or "General"
        topic = ctx.get("topic") or qsnap.get("topic") or chapter
        difficulty = (ctx.get("difficulty") or qsnap.get("difficulty") or "Medium")
        difficulty = str(difficulty).title()
        qn = qa.get("questionNumber") or len(question_review) + 1
        selected = response.get("selected")
        skipped = selected in (None, "", [])
        is_correct = bool(ev.get("isCorrect"))
        guessed = bool(behaviour.get("guess") or behaviour.get("guessed") or behaviour.get("isGuess"))
        marks = ev.get("marks")
        if marks is None:
            marks = ev.get("score") or 0
        time_min = _num(timing.get("seconds") or timing.get("elapsedSeconds") or timing.get("time"), 0) / 60
        if time_min == 0 and timing.get("minutes") is not None:
            time_min = _num(timing.get("minutes"))
        times.append((f"Q{qn}", round(time_min, 2)))
        if skipped:
            skipped_n += 1
            status = "Skipped"
        else:
            attempted_n += 1
            if is_correct:
                correct_n += 1
                status = "Correct"
            else:
                incorrect_n += 1
                status = "Incorrect"
                cat = behaviour.get("errorType") or ev.get("errorType") or "Concept error"
                mistake_cats[cat] = mistake_cats.get(cat, 0) + 1
                mistake_list.append({"q": f"Q{qn}", "topic": topic, "subject": subject, "detail": ev.get("reason") or f"{status} · {topic}"})
        if guessed:
            guess_n += 1
        ch = by_chapter.setdefault(chapter, {"chapter": chapter, "subject": subject, "n": 0, "correct": 0, "marks": 0, "time": 0.0, "attempted": 0})
        ch["n"] += 1
        ch["time"] += time_min
        ch["marks"] += _num(marks)
        if not skipped:
            ch["attempted"] += 1
            if is_correct:
                ch["correct"] += 1
        sub = by_subject.setdefault(subject, {"name": subject, "n": 0, "correct": 0, "score": 0.0, "maxMarks": 0.0, "time": 0.0, "strong": [], "weak": []})
        sub["n"] += 1
        sub["time"] += time_min
        sub["score"] += _num(marks)
        sub["maxMarks"] += _num(qsnap.get("marks") or ev.get("maxMarks") or 1)
        if is_correct:
            sub["correct"] += 1
            if topic not in sub["strong"]:
                sub["strong"].append(topic)
        elif not skipped:
            if topic not in sub["weak"]:
                sub["weak"].append(topic)
        if subject not in subjects_seen:
            subjects_seen.append(subject)
        top = by_topic.setdefault(topic, {"topic": topic, "subject": subject, "n": 0, "correct": 0})
        top["n"] += 1
        if is_correct:
            top["correct"] += 1
        diff = by_diff.setdefault(difficulty, {"level": difficulty, "n": 0, "correct": 0, "attempted": 0, "time": 0.0})
        diff["n"] += 1
        diff["time"] += time_min
        if not skipped:
            diff["attempted"] += 1
            if is_correct:
                diff["correct"] += 1
        question_review.append(
            {
                "q": f"Q{qn}",
                "subject": subject,
                "topic": topic,
                "type": (qsnap.get("type") or ctx.get("type") or "MCQ"),
                "status": status,
                "marks": marks,
                "time": round(time_min, 2),
            }
        )

    total_q = max(len(questions), 1)
    attempt_ratio = round(100 * attempted_n / total_q, 1)
    success_rate = round(100 * correct_n / attempted_n, 1) if attempted_n else 0
    chapters = []
    for v in by_chapter.values():
        acc = round(100 * v["correct"] / v["n"], 1) if v["n"] else 0
        mastery = "Strong" if acc >= 75 else "Average" if acc >= 60 else "Weak" if acc >= 40 else "Critical"
        chapters.append(
            {
                "chapter": v["chapter"],
                "subject": v["subject"],
                "accuracy": acc,
                "marks": round(v["marks"], 1),
                "time": round(v["time"], 1),
                "attempted": round(100 * v["attempted"] / v["n"], 1) if v["n"] else 0,
                "mastery": mastery,
                "questions": v["n"],
            }
        )
    subjects = []
    for v in by_subject.values():
        acc = round(100 * v["correct"] / v["n"], 1) if v["n"] else 0
        subjects.append(
            {
                "name": v["name"],
                "score": round(v["score"], 1),
                "maxMarks": round(v["maxMarks"], 1) or 0,
                "accuracy": acc,
                "time": round(v["time"], 1),
                "rank": None,
                "difficulty": "Medium",
                "strongAreas": v["strong"][:3] or ["—"],
                "weakAreas": v["weak"][:3] or ["—"],
            }
        )
    topics = []
    for v in by_topic.values():
        mastery = round(100 * v["correct"] / v["n"], 1) if v["n"] else 0
        level = "Strong" if mastery >= 75 else "Average" if mastery >= 60 else "Weak" if mastery >= 40 else "Critical"
        topics.append({"topic": v["topic"], "subject": v["subject"], "level": level, "mastery": mastery})
    difficulty = []
    for level in ("Easy", "Medium", "Hard"):
        v = by_diff.get(level) or {"n": 0, "correct": 0, "attempted": 0, "time": 0.0}
        difficulty.append(
            {
                "level": level,
                "accuracy": round(100 * v["correct"] / v["n"], 1) if v["n"] else 0,
                "attempted": v["attempted"],
                "time": round(v["time"], 1),
            }
        )
    timed = [t for t in times if t[1] > 0]
    fastest = min(timed, key=lambda t: t[1]) if timed else ("—", 0)
    slowest = max(timed, key=lambda t: t[1]) if timed else ("—", 0)
    avg_time = round(sum(t[1] for t in times) / total_q, 2) if questions else 0
    duration = snapshot.get("durationMinutes") or snapshot.get("duration") or 0
    try:
        duration = float(str(duration).replace(" hrs", "").replace("hr", "").replace("min", "").strip() or 0)
    except (TypeError, ValueError):
        duration = 0
    used_total = sum(t[1] for t in times)
    time_distribution = []
    for sub in subjects:
        allocated = (duration / max(len(subjects), 1)) if duration else max(sub["time"], 1)
        used = sub["time"]
        time_distribution.append(
            {
                "section": sub["name"],
                "used": round(used, 1),
                "allocated": round(allocated, 1) or 1,
                "efficiency": round(100 * min(used / allocated, 2), 1) if allocated else 0,
            }
        )
    weak_chapters = [c["chapter"] for c in chapters if c["accuracy"] < 65]
    weak_topics = [t["topic"] for t in topics if t["mastery"] < 65]
    grade = None
    if percentage >= 90:
        grade = "A+"
    elif percentage >= 80:
        grade = "A"
    elif percentage >= 70:
        grade = "B+"
    elif percentage >= 60:
        grade = "B"
    elif percentage >= 50:
        grade = "C"
    else:
        grade = "D" if questions else "—"
    dash = "—"
    comparison_cell = {"label": dash, "score": dash, "percentile": dash, "name": dash}
    hero = {
        "score": score,
        "maxScore": max_score,
        "percentage": percentage,
        "percentile": None,
        "grade": grade,
        "rank": None,
        "batchRank": None,
        "cohortSize": None,
        "confidenceIndex": round(success_rate, 1),
        "badge": "Completed" if attempt.get("submittedAt") else "In progress",
        "aiSummary": f"{correct_n} correct of {len(questions)} questions ({percentage}%)." if questions else "No question-level evidence for this attempt.",
        "readinessScore": round(percentage, 1),
        "healthScore": round(percentage, 1),
    }
    meta = {
        "examId": attempt.get("examId"),
        "examName": attempt.get("examTitle") or attempt.get("examName"),
        "pattern": attempt.get("examFamily") or ("University" if is_university else "Competitive"),
        "hallNumber": snapshot.get("hallNumber"),
        "course": snapshot.get("subject") or attempt.get("subject"),
        "faculty": snapshot.get("faculty"),
        "semester": snapshot.get("semester"),
        "academicYear": snapshot.get("academicYear"),
        "date": (attempt.get("submittedAt") or "")[:10] or None,
        "duration": snapshot.get("durationMinutes") or snapshot.get("duration"),
        "venue": snapshot.get("venue"),
        "seatNumber": snapshot.get("seatNumber"),
        "totalMarks": max_score,
        "passingMarks": snapshot.get("passingMarks"),
        "resultStatus": "Declared" if attempt.get("submittedAt") else "Pending",
        "examStatus": "Completed" if attempt.get("submittedAt") else "In progress",
        "admitCard": None,
    }
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
        "accuracy": scoring.get("accuracy") or summary.get("accuracy") or success_rate,
        "source": "exam-agent",
        "hero": hero,
        "meta": meta,
        "questionIntelligence": {
            "attempted": attempted_n,
            "attemptRatio": attempt_ratio,
            "correct": correct_n,
            "successRate": success_rate,
            "incorrect": incorrect_n,
            "guessAttempts": guess_n,
            "skipped": skipped_n,
            "negativeMarks": negative,
        },
        "timeIntelligence": {
            "distribution": time_distribution,
            "avgTimePerQuestion": avg_time,
            "fastestQuestion": {"q": fastest[0], "time": fastest[1]},
            "slowestQuestion": {"q": slowest[0], "time": slowest[1]},
            "navigationCount": 0,
            "timeManagementScore": round(min(100, percentage), 1),
        },
        "subjects": subjects,
        "topics": topics,
        "questionReview": question_review,
        "mistakeList": mistake_list,
        "mistakes": [{"category": k, "count": v} for k, v in mistake_cats.items()] or [],
        "difficulty": difficulty,
        "comparison": {
            "previousTest": {**comparison_cell, "label": "Previous test"},
            "previousMonth": {**comparison_cell, "label": "Previous month"},
            "batchAverage": {**comparison_cell, "label": "Batch average"},
            "instituteAverage": {**comparison_cell, "label": "Institute average", "score": None, "percentile": None},
            "topPerformer": {**comparison_cell, "label": "Top performer", "name": None, "score": None},
            "deltas": [],
        },
        "recommendations": {
            "weakChapters": weak_chapters,
            "weakTopics": weak_topics,
            "priorityRevision": [{"topic": t, "timeframe": "This week", "priority": "High"} for t in weak_topics[:4]],
            "suggestedPYQs": [],
            "practiceQuestions": [],
            "mockTests": [],
            "lectures": [],
        },
        "prediction": {
            "riskLevel": "Low" if percentage >= 70 else "Moderate" if percentage >= 50 else "High",
            "university": is_university,
            "expectedCGPA": None,
            "expectedGrade": grade if is_university else None,
            "classRank": None,
            "targetProbability": None,
            "jeePercentile": None,
            "expectedAIR": None,
            "expectedImprovement": None,
            "neetScore": None,
            "trajectory": [],
        },
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
