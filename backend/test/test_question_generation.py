"""Phase G — Question Generation real DB persistence."""

import pytest
from app.models.assessment import Question, QuestionGeneration, QuestionGenerationItem
from test.conftest import auth_header


@pytest.fixture(autouse=True)
def cleanup_ai_questions(db):
    """Ensure AI-generated questions from this module don't leak into other test modules."""
    yield
    # Cleanup after each test in this file
    db.query(QuestionGenerationItem).delete()
    db.query(Question).filter(Question.source == "ai").delete()
    db.query(QuestionGeneration).delete()
    db.commit()


def test_generate_questions_persists_real_db_records(client, world, db):
    faculty = world["faculty"]
    # Start with 0 AI questions? But world has 4, we count AI source
    body = {
        "domain": "University",
        "subject": "CS501",
        "chapter": "Graph Algorithms",
        "topic": "Dijkstra",
        "questionCount": 5,
        "difficulty": "Medium",
        "questionTypes": ["MCQ"],
        "bloomPreset": "Balanced",
        "examPattern": "Standard",
        "negativeMarking": "Disabled",
    }
    res = client.post("/v1/faculty/question-bank/generate", json=body, headers=auth_header(faculty))
    assert res.status_code == 200, res.text
    data = res.json()
    assert data["ok"] is True
    gen_id = data["generationId"]
    assert data["status"] in {"READY", "COMPLETED", "GENERATING", "PROCESSING"}
    assert data["requestedCount"] == 5
    assert data["generatedCount"] == 5
    assert len(data["questionIds"]) == 5

    # Verify generation record in DB
    gen = db.get(QuestionGeneration, gen_id)
    assert gen is not None
    assert gen.status == "READY"
    assert gen.requested_count == 5
    assert gen.generated_count == 5
    assert gen.institution_id == faculty.institution_id

    # Verify questions are real DB records
    items = db.query(QuestionGenerationItem).filter(QuestionGenerationItem.generation_id == gen_id).all()
    assert len(items) == 5
    q_ids = [i.question_id for i in items]
    questions = db.query(Question).filter(Question.id.in_(q_ids)).all()
    assert len(questions) == 5
    for q in questions:
        assert q.institution_id == faculty.institution_id
        assert q.source == "ai"
        assert q.stem
        assert q.id not in {"mock", "seed"}
        # Must have real IDs
        assert q.id

    # GET generation status
    status_res = client.get(f"/v1/faculty/question-bank/generations/{gen_id}", headers=auth_header(faculty))
    assert status_res.status_code == 200
    assert status_res.json()["status"] == "READY"

    # GET generation questions — real backend records
    q_res = client.get(f"/v1/faculty/question-bank/generations/{gen_id}/questions", headers=auth_header(faculty))
    assert q_res.status_code == 200
    assert q_res.json()["total"] == 5
    assert len(q_res.json()["questions"]) == 5
    for q in q_res.json()["questions"]:
        assert "id" in q
        assert q["id"] in q_ids
        # Faculty review may include correctAnswer, but check it exists for faculty
        assert "text" in q or "question" in q

    # Verify question bank now includes generated questions
    bank = client.get("/v1/faculty/question-bank", params={"domain": "University"}, headers=auth_header(faculty)).json()
    # Should have at least 5 + existing uni questions
    assert bank["total"] >= 5


def test_empty_bank_does_not_block_generation(client, world, db):
    faculty = world["faculty"]
    # Simulate empty bank for a new subject that has no questions
    body = {
        "domain": "University",
        "subject": "NewSubject123",
        "chapter": "NewChapter",
        "topic": "NewTopic",
        "questionCount": 3,
        "difficulty": "Easy",
        "questionTypes": ["MCQ"],
    }
    res = client.post("/v1/faculty/question-bank/generate", json=body, headers=auth_header(faculty))
    assert res.status_code == 200
    assert res.json()["generatedCount"] == 3


def test_generation_failure_handling(client, world):
    # Invalid count 0 should be clamped to min 1, not fail
    faculty = world["faculty"]
    res = client.post("/v1/faculty/question-bank/generate", json={"domain": "University", "questionCount": 0}, headers=auth_header(faculty))
    assert res.status_code == 200
    assert res.json()["generatedCount"] >= 1


def test_student_cannot_generate(client, world):
    student = world["student"]
    res = client.get("/v1/faculty/question-bank/generations", headers=auth_header(student))
    # Should be 403 because faculty role required
    assert res.status_code == 403

    res2 = client.post("/v1/faculty/question-bank/generate", json={"domain": "University", "questionCount": 2}, headers=auth_header(student))
    assert res2.status_code == 403


def test_paper_creation_uses_real_generated_ids(client, world, db):
    faculty = world["faculty"]
    # Generate
    gen_res = client.post("/v1/faculty/question-bank/generate", json={"domain": "University", "questionCount": 2, "subject": "CS501"}, headers=auth_header(faculty)).json()
    q_ids = gen_res["questionIds"]
    # Create paper with those real IDs
    paper_res = client.post("/v1/faculty/paper-generator/papers", json={
        "title": "Generated Paper Test",
        "domain": "University",
        "selectedQuestionIds": q_ids,
        "duration": 60,
        "totalMarks": 10,
    }, headers=auth_header(faculty))
    assert paper_res.status_code == 200
    paper = paper_res.json()["paper"]
    assert set(paper["selectedQuestionIds"]) == set(q_ids)
    # Publish
    pub = client.post(f"/v1/faculty/paper-generator/papers/{paper['id']}/publish", headers=auth_header(faculty))
    assert pub.status_code == 200
    # Student can see without correctAnswer
    student = world["student"]
    listing = client.get("/v1/student/exam-agent/exams", headers=auth_header(student)).json()
    item = next((x for x in listing["items"] if x["id"] == paper["id"]), None)
    assert item is not None
    assert "correctAnswer" not in str(item)
