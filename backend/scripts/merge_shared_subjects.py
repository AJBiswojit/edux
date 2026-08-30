"""Option A migration: make Physics & Chemistry shared across JEE and NEET.

Current state: separate subject rows per family
  sub_jee_physics / sub_neet_physics
  sub_jee_chemistry / sub_neet_chemistry

Target: one canonical shared subject per name (exam_family = NULL to mean
"shared across competitive families"), with all questions/chapters/topics
consolidated. Mathematics stays JEE-only, Biology stays NEET-only.

Steps:
  1. For each shared subject name (Physics, Chemistry): pick a canonical
     subject row, repoint all other same-name competitive subjects'
     questions + chapters to it, delete the emptied duplicate subjects,
     set canonical.exam_family = NULL.
  2. Deduplicate chapters within each subject (same name -> one row);
     repoint questions.chapter_id and topics.chapter_id, delete extras.
  3. Deduplicate topics within each chapter (same name -> one row);
     repoint questions.topic_id, delete extras.

Idempotent: re-running is safe (already-merged rows are skipped because the
duplicates no longer exist).
"""

from __future__ import annotations

from collections import defaultdict

from sqlalchemy import func, select

from app.db.session import SessionLocal
from app.models.assessment import Question
from app.models.catalog import Chapter, Subject, Topic

MERIDIAN = "inst_mit_p"
SHARED_SUBJECT_NAMES = {"physics", "chemistry"}  # shared across jee/neet


def _norm(x: str | None) -> str:
    return (x or "").strip().lower()


def merge_shared_subjects(db) -> int:
    """Collapse same-named competitive subjects into one canonical row."""
    comp_subjects = db.scalars(
        select(Subject).where(
            Subject.institution_id == MERIDIAN,
            Subject.exam_mode == "competitive",
        )
    ).all()

    by_name: dict[str, list[Subject]] = defaultdict(list)
    for s in comp_subjects:
        by_name[_norm(s.name)].append(s)

    merged = 0
    for name, rows in by_name.items():
        if name not in SHARED_SUBJECT_NAMES:
            continue
        # Canonical = the one with the most questions (stable, keeps the richer id)
        rows.sort(
            key=lambda s: db.scalar(
                select(func.count()).select_from(Question).where(Question.subject_id == s.id)
            ) or 0,
            reverse=True,
        )
        canonical = rows[0]
        for dup in rows[1:]:
            # repoint questions
            for q in db.scalars(select(Question).where(Question.subject_id == dup.id)).all():
                q.subject_id = canonical.id
            # repoint chapters
            for ch in db.scalars(select(Chapter).where(Chapter.subject_id == dup.id)).all():
                ch.subject_id = canonical.id
            db.flush()
            db.delete(dup)
            merged += 1
        # Mark canonical as shared across families
        canonical.exam_family = None
    return merged


def dedup_chapters(db) -> int:
    """Within each Meridian subject, merge same-named chapters into one."""
    subject_ids = [s.id for s in db.scalars(select(Subject).where(Subject.institution_id == MERIDIAN)).all()]
    chapters = db.scalars(select(Chapter).where(Chapter.subject_id.in_(subject_ids))).all()

    by_key: dict[tuple[str, str], list[Chapter]] = defaultdict(list)
    for c in chapters:
        by_key[(c.subject_id, _norm(c.name))].append(c)

    removed = 0
    for (_sid, _name), rows in by_key.items():
        if len(rows) < 2:
            continue
        # Canonical = most questions, then most topics
        rows.sort(
            key=lambda c: (
                db.scalar(select(func.count()).select_from(Question).where(Question.chapter_id == c.id)) or 0,
                db.scalar(select(func.count()).select_from(Topic).where(Topic.chapter_id == c.id)) or 0,
            ),
            reverse=True,
        )
        canonical = rows[0]
        for dup in rows[1:]:
            for q in db.scalars(select(Question).where(Question.chapter_id == dup.id)).all():
                q.chapter_id = canonical.id
            for t in db.scalars(select(Topic).where(Topic.chapter_id == dup.id)).all():
                t.chapter_id = canonical.id
            db.flush()
            db.delete(dup)
            removed += 1
    return removed


def dedup_topics(db) -> int:
    """Within each chapter, merge same-named topics into one."""
    subject_ids = [s.id for s in db.scalars(select(Subject).where(Subject.institution_id == MERIDIAN)).all()]
    chapter_ids = [c.id for c in db.scalars(select(Chapter).where(Chapter.subject_id.in_(subject_ids))).all()]
    topics = db.scalars(select(Topic).where(Topic.chapter_id.in_(chapter_ids))).all()

    by_key: dict[tuple[str, str], list[Topic]] = defaultdict(list)
    for t in topics:
        by_key[(t.chapter_id, _norm(t.name))].append(t)

    removed = 0
    for (_cid, _name), rows in by_key.items():
        if len(rows) < 2:
            continue
        rows.sort(
            key=lambda t: db.scalar(
                select(func.count()).select_from(Question).where(Question.topic_id == t.id)
            ) or 0,
            reverse=True,
        )
        canonical = rows[0]
        for dup in rows[1:]:
            for q in db.scalars(select(Question).where(Question.topic_id == dup.id)).all():
                q.topic_id = canonical.id
            db.flush()
            db.delete(dup)
            removed += 1
    return removed


def report(db) -> None:
    subs = db.scalars(
        select(Subject).where(Subject.institution_id == MERIDIAN, Subject.exam_mode == "competitive")
    ).all()
    print("Competitive subjects now:")
    for s in subs:
        cnt = db.scalar(select(func.count()).select_from(Question).where(Question.subject_id == s.id))
        chs = db.scalar(select(func.count()).select_from(Chapter).where(Chapter.subject_id == s.id))
        print(f"  {s.name:<12} family={str(s.exam_family):<5} questions={cnt} chapters={chs}")


def main():
    db = SessionLocal()
    try:
        print("=== BEFORE ===")
        report(db)
        print()

        m = merge_shared_subjects(db)
        print(f"Merged {m} duplicate subject rows into canonical shared subjects")

        c = dedup_chapters(db)
        print(f"Removed {c} duplicate chapter rows")

        t = dedup_topics(db)
        print(f"Removed {t} duplicate topic rows")

        db.commit()
        print()
        print("=== AFTER ===")
        report(db)
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    main()
