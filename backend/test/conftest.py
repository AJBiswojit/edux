"""Isolation: sqlite file DB for examination tests. Never touches live PostgreSQL."""

from __future__ import annotations

import os
import sys
from pathlib import Path

BACKEND_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(BACKEND_ROOT))

TEST_DB = Path(__file__).resolve().parent / "_exam_core.sqlite"
os.environ["DB_SCHEMA"] = ""
os.environ["DATABASE_URL"] = f"sqlite:///{TEST_DB}"

if TEST_DB.exists():
    TEST_DB.unlink()

from app.core.config import get_settings  # noqa: E402

get_settings.cache_clear()

import app.models.ai  # noqa: E402,F401
import app.models.assessment  # noqa: E402,F401
import app.models.catalog  # noqa: E402,F401
import app.models.exams  # noqa: E402,F401
import app.models.identity  # noqa: E402,F401
import app.models.intelligence  # noqa: E402,F401
import app.models.interventions  # noqa: E402,F401
import app.models.ops  # noqa: E402,F401
import app.models.people  # noqa: E402,F401
import app.models.teaching  # noqa: E402,F401
import app.models.capabilities  # noqa: E402,F401
from app.core.security import create_access_token, hash_password  # noqa: E402
from app.db.base import Base  # noqa: E402
from app.db.session import SessionLocal, engine, get_db  # noqa: E402
from app.main import create_app  # noqa: E402
from app.models.assessment import Question  # noqa: E402
from app.models.identity import Institution, Role, User, UserRole  # noqa: E402
from app.models.people import StudentProfile  # noqa: E402

import pytest  # noqa: E402
from starlette.testclient import TestClient  # noqa: E402


@pytest.fixture(scope="session")
def app():
    Base.metadata.create_all(bind=engine)
    application = create_app()

    def _db():
        db = SessionLocal()
        try:
            yield db
        finally:
            db.close()

    application.dependency_overrides[get_db] = _db
    yield application
    Base.metadata.drop_all(bind=engine)
    if TEST_DB.exists():
        TEST_DB.unlink()


@pytest.fixture
def db():
    session = SessionLocal()
    try:
        yield session
    finally:
        session.close()


@pytest.fixture
def client(app):
    return TestClient(app, raise_server_exceptions=True)


def _user(db, *, inst_id: str, email: str, name: str, role: str, user_id: str) -> User:
    user = User(
        id=user_id,
        institution_id=inst_id,
        email=email,
        password_hash=hash_password("aurora123"),
        full_name=name,
        status="active",
        legacy_role=role,
    )
    db.add(user)
    role_row = db.query(Role).filter(Role.institution_id == inst_id, Role.code == role).first()
    if role_row is None:
        role_row = Role(institution_id=inst_id, code=role, name=role.title())
        db.add(role_row)
        db.flush()
    db.add(UserRole(user_id=user.id, role_id=role_row.id, institution_id=inst_id))
    db.flush()
    return user


@pytest.fixture(scope="session")
def world(app):
    db = SessionLocal()
    inst_a = Institution(id="inst_a", slug="alpha", name="Alpha University")
    inst_b = Institution(id="inst_b", slug="beta", name="Beta University")
    db.add_all([inst_a, inst_b])
    db.flush()
    faculty = _user(db, inst_id=inst_a.id, email="faculty.a@test.edu", name="Fac A", role="faculty", user_id="u_fac_a")
    faculty_b = _user(db, inst_id=inst_b.id, email="faculty.b@test.edu", name="Fac B", role="faculty", user_id="u_fac_b")
    student = _user(db, inst_id=inst_a.id, email="stu.a@test.edu", name="Stu A", role="student", user_id="u_stu_a")
    student_b = _user(db, inst_id=inst_b.id, email="stu.b@test.edu", name="Stu B", role="student", user_id="u_stu_b")
    db.add(StudentProfile(user_id=student.id, institution_id=inst_a.id, roll_no="A001"))
    db.add(StudentProfile(user_id=student_b.id, institution_id=inst_b.id, roll_no="B001"))

    questions = [
        Question(
            id="q_uni_1",
            institution_id=inst_a.id,
            exam_mode="university",
            exam_family=None,
            stem="University Q1?",
            options='["A","B","C","D"]',
            correct_answer="0",
            marks=2,
            negative_marks=0,
            difficulty="easy",
            q_type="mcq",
            concept="OS",
            status="approved",
        ),
        Question(
            id="q_uni_2",
            institution_id=inst_a.id,
            exam_mode="university",
            exam_family=None,
            stem="University Q2?",
            options='["A","B","C","D"]',
            correct_answer="1",
            marks=2,
            negative_marks=0,
            difficulty="medium",
            q_type="mcq",
            concept="DBMS",
            status="approved",
        ),
        Question(
            id="q_jee_phy",
            institution_id=inst_a.id,
            exam_mode="competitive",
            exam_family="jee",
            stem="JEE Physics?",
            options='["A","B","C","D"]',
            correct_answer="0",
            marks=4,
            negative_marks=1,
            difficulty="hard",
            q_type="mcq",
            concept="Kinematics",
            status="approved",
        ),
        Question(
            id="q_neet_phy",
            institution_id=inst_a.id,
            exam_mode="competitive",
            exam_family="neet",
            stem="NEET Physics?",
            options='["A","B","C","D"]',
            correct_answer="2",
            marks=4,
            negative_marks=1,
            difficulty="hard",
            q_type="mcq",
            concept="Kinematics",
            status="approved",
        ),
        Question(
            id="q_other_inst",
            institution_id=inst_b.id,
            exam_mode="university",
            exam_family=None,
            stem="Other institution?",
            options='["A","B","C","D"]',
            correct_answer="0",
            marks=1,
            negative_marks=0,
            difficulty="easy",
            q_type="mcq",
            concept="Other",
            status="approved",
        ),
    ]
    db.add_all(questions)
    db.commit()
    for user in (faculty, faculty_b, student, student_b):
        _ = user.primary_role
        _ = user.id
        _ = user.institution_id
        _ = user.email
        _ = user.full_name
    snapshot = {
        "inst_a": inst_a,
        "inst_b": inst_b,
        "faculty": faculty,
        "faculty_b": faculty_b,
        "student": student,
        "student_b": student_b,
    }
    db.close()
    yield snapshot


def auth_header(user: User) -> dict[str, str]:
    token = create_access_token(sub=user.id, institution_id=user.institution_id, roles=[user.primary_role])
    return {"Authorization": f"Bearer {token}"}
