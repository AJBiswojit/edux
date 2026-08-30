"""Backfill topic_id for questions that have a free-text `concept` but no
topic_id foreign key.

For each such question:
  - Look up an existing Topic under the question's chapter whose name matches
    the concept (case-insensitive).
  - If none exists, create a new Topic under that chapter using the concept text.
  - Set question.topic_id to that topic.

After this, every question with a concept has a real topic_id, so the
concept-matching fallback in the question-bank filter can be dropped.

Idempotent: re-running is a no-op (already-linked questions are skipped).
"""

from __future__ import annotations

import uuid

from sqlalchemy import func, select

from app.db.session import SessionLocal
from app.models.assessment import Question
from app.models.catalog import Chapter, Subject, Topic

MERIDIAN = "inst_mit_p"


def _norm(x: str | None) -> str:
    return (x or "").strip().lower()


def main():
    db = SessionLocal()
    try:
        before = db.scalar(
            select(func.count()).select_from(Question).where(
                Question.institution_id == MERIDIAN, Question.topic_id.is_(None)
            )
        )
        print(f"Questions without topic_id before: {before}")

        untagged = db.scalars(
            select(Question).where(
                Question.institution_id == MERIDIAN,
                Question.topic_id.is_(None),
                Question.chapter_id.isnot(None),
            )
        ).all()

        # Cache existing topics per chapter: {chapter_id: {norm_name: topic}}
        topic_cache: dict[str, dict[str, Topic]] = {}

        linked = 0
        created = 0
        skipped = 0
        for q in untagged:
            concept = (q.concept or "").strip()
            if not concept:
                skipped += 1
                continue

            if q.chapter_id not in topic_cache:
                topic_cache[q.chapter_id] = {
                    _norm(t.name): t
                    for t in db.scalars(select(Topic).where(Topic.chapter_id == q.chapter_id)).all()
                }

            existing = topic_cache[q.chapter_id].get(_norm(concept))
            if existing is None:
                # Determine sort order (append after current max)
                max_sort = db.scalar(
                    select(func.max(Topic.sort_order)).where(Topic.chapter_id == q.chapter_id)
                ) or 0
                existing = Topic(
                    id=str(uuid.uuid4()),
                    chapter_id=q.chapter_id,
                    name=concept,
                    sort_order=max_sort + 1,
                )
                db.add(existing)
                db.flush()
                topic_cache[q.chapter_id][_norm(concept)] = existing
                created += 1

            q.topic_id = existing.id
            linked += 1

        db.commit()

        after = db.scalar(
            select(func.count()).select_from(Question).where(
                Question.institution_id == MERIDIAN, Question.topic_id.is_(None)
            )
        )
        total_topics = db.scalar(
            select(func.count()).select_from(Topic)
            .join(Chapter).join(Subject)
            .where(Subject.institution_id == MERIDIAN)
        )
        print(f"Linked {linked} questions to topics ({created} new topics created)")
        print(f"Skipped (no concept text): {skipped}")
        print(f"Questions without topic_id after: {after}")
        print(f"Total topics under Meridian now: {total_topics}")
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    main()
