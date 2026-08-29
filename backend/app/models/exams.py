from datetime import datetime
from typing import Optional

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base, uuid_pk


class ExamSitting(Base):
    __tablename__ = "exam_sittings"

    id: Mapped[str] = uuid_pk()
    institution_id: Mapped[str] = mapped_column(String(36), ForeignKey("institutions.id"))
    paper_id: Mapped[str] = mapped_column(String(36), ForeignKey("papers.id"))
    student_id: Mapped[str] = mapped_column(String(36), ForeignKey("student_profiles.user_id"))
    attempt_kind: Mapped[str] = mapped_column(String(32), default="practice")
    started_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    submitted_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))
    server_seed: Mapped[Optional[str]] = mapped_column(String(64))


class ExamAttempt(Base):
    """Canonical exam attempt — matches frontend Phase 0 contract."""

    __tablename__ = "exam_attempts"

    id: Mapped[str] = uuid_pk()
    institution_id: Mapped[str] = mapped_column(String(36), ForeignKey("institutions.id"), index=True)
    sitting_id: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("exam_sittings.id"))
    student_id: Mapped[str] = mapped_column(String(36), ForeignKey("student_profiles.user_id"), index=True)
    roll_no: Mapped[str] = mapped_column(String(32))
    batch_id: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("batches.id"))
    section_id: Mapped[Optional[str]] = mapped_column(String(16))
    exam_id: Mapped[Optional[str]] = mapped_column(String(36))
    exam_name: Mapped[str] = mapped_column(String(255))
    exam_mode: Mapped[str] = mapped_column(String(32), index=True)
    exam_family: Mapped[Optional[str]] = mapped_column(String(16), index=True)
    source: Mapped[str] = mapped_column(String(32), default="exam_agent")
    attempt_kind: Mapped[str] = mapped_column(String(32), default="practice")
    is_demo: Mapped[bool] = mapped_column(Boolean, default=False)
    intervention_id: Mapped[Optional[str]] = mapped_column(String(36), index=True)
    started_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    submitted_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))
    exam_snapshot: Mapped[str] = mapped_column(Text)
    timing: Mapped[str] = mapped_column(Text)
    scoring: Mapped[str] = mapped_column(Text)
    interactions: Mapped[Optional[str]] = mapped_column(Text)
    summary: Mapped[Optional[str]] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)


class ExamQuestionAttempt(Base):
    __tablename__ = "exam_question_attempts"

    id: Mapped[str] = uuid_pk()
    attempt_id: Mapped[str] = mapped_column(String(36), ForeignKey("exam_attempts.id"), index=True)
    question_id: Mapped[Optional[str]] = mapped_column(String(36))
    question_number: Mapped[int] = mapped_column(Integer)
    question_snapshot: Mapped[str] = mapped_column(Text)
    academic_context: Mapped[str] = mapped_column(Text)
    response: Mapped[str] = mapped_column(Text)
    timing: Mapped[str] = mapped_column(Text)
    behaviour: Mapped[str] = mapped_column(Text)
    evaluation: Mapped[str] = mapped_column(Text)
