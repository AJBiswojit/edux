"""One-shot idempotent merge of the shared competitive question bank
(institution `d9939b5b-...`, "Eduox Competitive Question Bank") into the real
faculty institution `inst_mit_p` ("Meridian Institute of Technology").

Why: faculty live in Meridian and every query is scoped by the faculty's own
institution_id. Consolidating all questions into Meridian makes them accessible
to Dr. Meera and every Meridian faculty, and filterable by subject/chapter/topic
in the paper-generator catalog — without breaking institution isolation.

Steps:
  1. Map each bank subject -> Meridian subject by (exam_family, name).
  2. Copy chapters/topics that are missing in Meridian so remapped questions
     keep valid, filterable chapter/topic references.
  3. Repoint the 994 bank questions to Meridian: institution_id + subject_id +
     chapter_id + topic_id, and normalize exam_mode/exam_family casing.
  4. Remove the 10 internal duplicate questions already in Meridian's 126
     (keep the copy that has chapter_id populated).

Idempotent: re-running skips already-migrated rows (questions whose
institution_id is already Meridian) and reuses chapters/topics matched by name.
"""

from __future__ import annotations

import uuid

from sqlalchemy import func, select

from app.db.session import SessionLocal
from app.models.assessment import Paper, PaperQuestion, Question
from app.models.catalog import Chapter, Subject, Topic

MERIDIAN = "inst_mit_p"
BANK = "d9939b5b-de3d-4290-acaa-f4c317fbe8f1"


def _norm(x: str | None) -> str:
    return (x or "").strip().lower()


def build_subject_map(db) -> dict[str, Subject]:
    """bank subject_id -> Meridian Subject (matched by exam_family + name)."""
    mer = {
        (_norm(s.exam_family), _norm(s.name)): s
        for s in db.scalars(
            select(Subject).where(
                Subject.institution_id == MERIDIAN,
                Subject.exam_mode == "competitive",
            )
        ).all()
    }
    mapping: dict[str, Subject] = {}
    for bs in db.scalars(select(Subject).where(Subject.institution_id == BANK)).all():
        ms = mer.get((_norm(bs.exam_family), _norm(bs.name)))
        if ms is None:
            raise RuntimeError(f"No Meridian subject match for bank subject {bs.name}/{bs.exam_family}")
        mapping[bs.id] = ms
    return mapping


def ensure_chapters_and_topics(db, subject_map: dict[str, Subject]):
    """Copy chapters/topics missing in Meridian. Returns
    (chapter_id_map, topic_id_map) from bank id -> Meridian id."""
    chapter_map: dict[str, str] = {}
    topic_map: dict[str, str] = {}

    for bank_sid, mer_subject in subject_map.items():
        # existing Meridian chapters for this subject, keyed by normalized name
        mer_chapters = {
            _norm(c.name): c
            for c in db.scalars(select(Chapter).where(Chapter.subject_id == mer_subject.id)).all()
        }
        bank_chapters = db.scalars(select(Chapter).where(Chapter.subject_id == bank_sid)).all()
        for bc in bank_chapters:
            mc = mer_chapters.get(_norm(bc.name))
            if mc is None:
                mc = Chapter(
                    id=str(uuid.uuid4()),
                    subject_id=mer_subject.id,
                    course_id=None,
                    name=bc.name,
                    unit_no=bc.unit_no,
                    sort_order=bc.sort_order or 0,
                )
                db.add(mc)
                db.flush()
                mer_chapters[_norm(bc.name)] = mc
            chapter_map[bc.id] = mc.id

            # topics under this chapter
            mer_topics = {
                _norm(t.name): t
                for t in db.scalars(select(Topic).where(Topic.chapter_id == mc.id)).all()
            }
            for bt in db.scalars(select(Topic).where(Topic.chapter_id == bc.id)).all():
                mt = mer_topics.get(_norm(bt.name))
                if mt is None:
                    mt = Topic(
                        id=str(uuid.uuid4()),
                        chapter_id=mc.id,
                        name=bt.name,
                        sort_order=bt.sort_order or 0,
                    )
                    db.add(mt)
                    db.flush()
                    mer_topics[_norm(bt.name)] = mt
                topic_map[bt.id] = mt.id

    return chapter_map, topic_map


def repoint_questions(db, subject_map, chapter_map, topic_map) -> int:
    bank_questions = db.scalars(select(Question).where(Question.institution_id == BANK)).all()
    moved = 0
    for q in bank_questions:
        q.institution_id = MERIDIAN
        # normalize casing to Meridian schema
        q.exam_mode = "competitive"
        if q.exam_family:
            q.exam_family = q.exam_family.strip().lower()
        # remap catalog refs
        if q.subject_id in subject_map:
            q.subject_id = subject_map[q.subject_id].id
        if q.chapter_id in chapter_map:
            q.chapter_id = chapter_map[q.chapter_id]
        if q.topic_id in topic_map:
            q.topic_id = topic_map[q.topic_id]
        moved += 1
    return moved


def remove_internal_duplicates(db) -> int:
    """Within Meridian, remove duplicate stems. Keep the copy whose chapter_id is
    populated; delete the other. Re-link any paper_questions to the survivor."""
    dup_stems = [
        r[0]
        for r in db.execute(
            select(Question.stem, func.count())
            .where(Question.institution_id == MERIDIAN)
            .group_by(Question.stem)
            .having(func.count() > 1)
        ).all()
    ]
    removed = 0
    for stem in dup_stems:
        copies = db.scalars(
            select(Question).where(
                Question.institution_id == MERIDIAN, Question.stem == stem
            )
        ).all()
        if len(copies) < 2:
            continue
        # survivor: prefer one with chapter_id set, else the first
        copies.sort(key=lambda q: (q.chapter_id is None, q.topic_id is None))
        survivor = copies[0]
        for dead in copies[1:]:
            # re-link paper_questions from dead -> survivor (avoid PK collision)
            links = db.scalars(
                select(PaperQuestion).where(PaperQuestion.question_id == dead.id)
            ).all()
            for link in links:
                exists = db.get(PaperQuestion, (link.paper_id, survivor.id))
                if exists is None:
                    link.question_id = survivor.id
                else:
                    db.delete(link)
            db.delete(dead)
            removed += 1
    return removed


def main():
    db = SessionLocal()
    try:
        before_mer = db.scalar(
            select(func.count()).select_from(Question).where(Question.institution_id == MERIDIAN)
        )
        before_bank = db.scalar(
            select(func.count()).select_from(Question).where(Question.institution_id == BANK)
        )
        print(f"Before: Meridian={before_mer}  Bank={before_bank}")

        subject_map = build_subject_map(db)
        print(f"Subject map: {len(subject_map)} bank subjects mapped to Meridian")

        chapter_map, topic_map = ensure_chapters_and_topics(db, subject_map)
        print(f"Catalog ready: {len(chapter_map)} chapters, {len(topic_map)} topics mapped/created")

        moved = repoint_questions(db, subject_map, chapter_map, topic_map)
        print(f"Repointed {moved} bank questions -> Meridian")

        removed = remove_internal_duplicates(db)
        print(f"Removed {removed} internal duplicate questions")

        db.commit()

        after_mer = db.scalar(
            select(func.count()).select_from(Question).where(Question.institution_id == MERIDIAN)
        )
        after_bank = db.scalar(
            select(func.count()).select_from(Question).where(Question.institution_id == BANK)
        )
        print(f"After : Meridian={after_mer}  Bank={after_bank}")
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    main()
