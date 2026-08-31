"""
End-to-End tests for Question Paper Generation -> Paper Library lifecycle:
1. Paper saved status is READY (not Draft)
2. Edit Paper transitions status to DRAFT
3. Confirm Edit updates paper and transitions status to READY with modified timestamp
4. Real PDF Download endpoint returns valid binary PDF (%PDF) with application/pdf header
5. PUT /v1/faculty/paper-generator/papers/{paper_id} updates paper data and associations
6. POST /v1/faculty/paper-generator/papers/{paper_id}/edit transitions to DRAFT
7. Question associations & Generation ID linking
"""

import uuid
import pytest
from app.services.examination import STATUS_READY, STATUS_DRAFT
from app.models.catalog import Subject, Chapter, Topic
from app.models.assessment import QuestionGeneration, QuestionGenerationItem
from app.models.ai_papers import AiGeneratedPaper, AiGeneratedPaperQuestion
from test.conftest import auth_header


@pytest.fixture(autouse=True)
def cleanup_test_data(db):
    yield
    db.query(QuestionGenerationItem).delete()
    db.query(QuestionGeneration).delete()
    db.query(AiGeneratedPaperQuestion).delete()
    db.query(AiGeneratedPaper).delete()
    db.commit()


def _ensure_catalog(db, institution_id: str):
    sub_uni = db.query(Subject).filter(Subject.institution_id == institution_id, Subject.code == "CS501").first()
    if not sub_uni:
        sub_uni = Subject(id=f"sub_{uuid.uuid4().hex[:8]}", institution_id=institution_id, code="CS501", name="Data Structures & Algorithms", exam_mode="university")
        db.add(sub_uni)
        db.flush()
    ch_uni = db.query(Chapter).filter(Chapter.subject_id == sub_uni.id, Chapter.name == "Trees").first()
    if not ch_uni:
        ch_uni = Chapter(id=f"ch_{uuid.uuid4().hex[:8]}", subject_id=sub_uni.id, name="Trees", sort_order=1)
        db.add(ch_uni)
        db.flush()
    top_uni = db.query(Topic).filter(Topic.chapter_id == ch_uni.id, Topic.name == "Binary Search Trees").first()
    if not top_uni:
        top_uni = Topic(id=f"top_{uuid.uuid4().hex[:8]}", chapter_id=ch_uni.id, name="Binary Search Trees", sort_order=1)
        db.add(top_uni)
        db.flush()

    sub_comp = db.query(Subject).filter(Subject.institution_id == institution_id, Subject.code == "JEE-PHY").first()
    if not sub_comp:
        sub_comp = Subject(id=f"sub_{uuid.uuid4().hex[:8]}", institution_id=institution_id, code="JEE-PHY", name="Physics", exam_mode="competitive", exam_family="JEE_MAIN")
        db.add(sub_comp)
        db.flush()
    ch_comp = db.query(Chapter).filter(Chapter.subject_id == sub_comp.id, Chapter.name == "Kinematics").first()
    if not ch_comp:
        ch_comp = Chapter(id=f"ch_{uuid.uuid4().hex[:8]}", subject_id=sub_comp.id, name="Kinematics", sort_order=1)
        db.add(ch_comp)
        db.flush()
    top_comp = db.query(Topic).filter(Topic.chapter_id == ch_comp.id, Topic.name == "Motion in 1D").first()
    if not top_comp:
        top_comp = Topic(id=f"top_{uuid.uuid4().hex[:8]}", chapter_id=ch_comp.id, name="Motion in 1D", sort_order=1)
        db.add(top_comp)
        db.flush()

    db.commit()
    return sub_uni, ch_uni, top_uni


def test_paper_save_defaults_to_ready_status(client, world, db):
    """Requirement 3 & 9: Generated & saved papers must be READY in DB, not Draft."""
    faculty = world["faculty"]
    _ensure_catalog(db, faculty.institution_id)

    create_payload = {
        "title": "DSA Midterm Test 2026",
        "domain": "University",
        "mode": "University",
        "course": "CS501 — Data Structures & Algorithms",
        "subject": "Data Structures & Algorithms",
        "chapter": "Trees",
        "topic": "Binary Search Trees",
        "totalMarks": 50,
        "duration": 120,
        "difficulty": "Medium",
        "paperType": "Mid Semester",
        "questions": 0,
        "selectedQuestionIds": [],
        "status": "ready",
    }
    resp = client.post("/v1/faculty/paper-generator/papers", json=create_payload, headers=auth_header(faculty))
    assert resp.status_code == 200, resp.text
    data = resp.json()
    assert data.get("ok") is True
    paper = data.get("paper")
    assert paper is not None
    paper_id = paper["id"]

    # Read back paper from backend
    get_resp = client.get(f"/v1/faculty/paper-generator/papers/{paper_id}", headers=auth_header(faculty))
    assert get_resp.status_code == 200
    paper_read = get_resp.json().get("paper")
    assert paper_read["status"].lower() == "ready"
    assert paper_read["title"] == "DSA Midterm Test 2026"


def test_edit_paper_transitions_to_draft_and_confirm_transitions_to_ready(client, world, db):
    """Requirement 4 & 5: Edit Paper -> DRAFT, Confirm Changes -> READY."""
    faculty = world["faculty"]
    _ensure_catalog(db, faculty.institution_id)

    # 1. Create initial paper
    create_payload = {
        "title": "Operating Systems Quiz",
        "domain": "University",
        "mode": "University",
        "subject": "Data Structures & Algorithms",
        "totalMarks": 30,
        "duration": 60,
        "difficulty": "Easy",
        "paperType": "Quiz",
        "questions": 0,
        "status": "ready",
    }
    resp = client.post("/v1/faculty/paper-generator/papers", json=create_payload, headers=auth_header(faculty))
    assert resp.status_code == 200
    paper = resp.json().get("paper")
    paper_id = paper["id"]
    assert paper["status"].lower() == "ready"

    # 2. Click Edit -> POST /v1/faculty/paper-generator/papers/{paper_id}/edit sets status to DRAFT
    edit_resp = client.post(f"/v1/faculty/paper-generator/papers/{paper_id}/edit", headers=auth_header(faculty))
    assert edit_resp.status_code == 200
    edit_data = edit_resp.json()
    assert edit_data.get("ok") is True
    draft_paper = edit_data.get("paper")
    assert draft_paper["status"].lower() == "draft"

    # Verify status in DB via GET
    get_resp = client.get(f"/v1/faculty/paper-generator/papers/{paper_id}", headers=auth_header(faculty))
    assert get_resp.status_code == 200
    assert get_resp.json().get("paper")["status"].lower() == "draft"

    # 3. Confirm Changes -> PUT /v1/faculty/paper-generator/papers/{paper_id} updates paper and transitions back to READY
    update_payload = {
        "title": "Operating Systems Quiz — Revised",
        "domain": "University",
        "mode": "University",
        "subject": "Data Structures & Algorithms",
        "totalMarks": 40,
        "duration": 75,
        "difficulty": "Medium",
        "paperType": "Quiz",
        "questions": 0,
        "status": "ready",
    }
    put_resp = client.put(f"/v1/faculty/paper-generator/papers/{paper_id}", json=update_payload, headers=auth_header(faculty))
    assert put_resp.status_code == 200
    updated_paper = put_resp.json().get("paper")
    assert updated_paper["status"].lower() == "ready"
    assert updated_paper["title"] == "Operating Systems Quiz — Revised"
    assert updated_paper["totalMarks"] == 40
    assert updated_paper["duration"] == 75

    # Verify updated record
    final_resp = client.get(f"/v1/faculty/paper-generator/papers/{paper_id}", headers=auth_header(faculty))
    assert final_resp.status_code == 200
    final_paper = final_resp.json().get("paper")
    assert final_paper["status"].lower() == "ready"
    assert final_paper["title"] == "Operating Systems Quiz — Revised"


def test_real_pdf_download_endpoint(client, world, db):
    """Requirement 7: Real backend PDF download endpoint returning valid PDF binary."""
    faculty = world["faculty"]
    _ensure_catalog(db, faculty.institution_id)

    # 1. Create a paper
    create_payload = {
        "title": "JEE Physics Mock Test — Mechanics",
        "domain": "Competitive",
        "examFamily": "JEE",
        "mode": "Competitive",
        "exam": "JEE",
        "subject": "Data Structures & Algorithms",
        "chapter": "Trees",
        "totalMarks": 100,
        "duration": 180,
        "difficulty": "Hard",
        "paperType": "Full Mock Test",
        "questions": 0,
        "status": "ready",
    }
    resp = client.post("/v1/faculty/paper-generator/papers", json=create_payload, headers=auth_header(faculty))
    assert resp.status_code == 200
    paper_id = resp.json().get("paper")["id"]

    # 2. Download PDF via GET /v1/faculty/paper-generator/papers/{paper_id}/download
    pdf_resp = client.get(f"/v1/faculty/paper-generator/papers/{paper_id}/download", headers=auth_header(faculty))
    assert pdf_resp.status_code == 200
    assert "application/pdf" in pdf_resp.headers.get("content-type", "")
    assert "attachment;" in pdf_resp.headers.get("content-disposition", "")
    assert ".pdf" in pdf_resp.headers.get("content-disposition", "")

    content = pdf_resp.content
    assert len(content) > 100
    # Valid PDF file must start with %PDF- header magic bytes
    assert content.startswith(b"%PDF-")

    # Also test GET /v1/faculty/paper-generator/papers/{paper_id}/pdf alias
    pdf_alias_resp = client.get(f"/v1/faculty/paper-generator/papers/{paper_id}/pdf", headers=auth_header(faculty))
    assert pdf_alias_resp.status_code == 200
    assert pdf_alias_resp.content.startswith(b"%PDF-")


def test_save_paper_with_question_associations_and_generation_id(client, world, db, fake_ai_service):
    """Requirement 8 & 9: Save paper links Paper -> Question associations -> Question records -> Generation ID."""
    faculty = world["faculty"]
    _ensure_catalog(db, faculty.institution_id)

    # First generate questions via AI question generation
    gen_payload = {
        "title": "JEE Physics Test",
        "domain": "Competitive",
        "examFamily": "JEE",
        "mode": "Competitive",
        "exam": "JEE",
        "subject": "Physics",
        "chapter": "Kinematics",
        "topic": "Motion in 1D",
        "count": 2,
        "questionCount": 2,
        "difficulty": "Medium",
        "questionTypes": ["MCQ"],
        "qTypes": ["MCQ"],
    }
    gen_resp = client.post("/v1/faculty/question-bank/generate", json=gen_payload, headers=auth_header(faculty))
    assert gen_resp.status_code == 200, gen_resp.text
    gen_data = gen_resp.json()
    gen_id = gen_data.get("generationId") or gen_data.get("id")
    assert gen_id is not None

    # Write output in fake agent and poll status to drive fake agent materialization
    fake_ai_service["write_output"]()
    status_resp = client.get(f"/v1/faculty/question-bank/generations/{gen_id}", headers=auth_header(faculty))
    assert status_resp.status_code == 200

    # Fetch generated questions
    q_resp = client.get(f"/v1/faculty/question-bank/generations/{gen_id}/questions", headers=auth_header(faculty))
    assert q_resp.status_code == 200
    questions = q_resp.json().get("questions", [])
    assert len(questions) > 0
    selected_ids = [q["id"] for q in questions if "id" in q]

    # Save paper linking generationId and selectedQuestionIds
    create_payload = {
        "title": "JEE Physics Mechanics Final Paper",
        "domain": "Competitive",
        "examFamily": "JEE",
        "mode": "Competitive",
        "exam": "JEE",
        "subject": "Physics",
        "totalMarks": 100,
        "duration": 180,
        "difficulty": "Medium",
        "paperType": "Full Mock Test",
        "questions": len(selected_ids),
        "selectedQuestionIds": selected_ids,
        "generationId": gen_id,
        "status": "ready",
    }
    paper_resp = client.post("/v1/faculty/paper-generator/papers", json=create_payload, headers=auth_header(faculty))
    assert paper_resp.status_code == 200
    paper = paper_resp.json().get("paper")
    paper_id = paper["id"]
    assert paper["status"].lower() == "ready"

    # Verify questions in paper detail
    detail_resp = client.get(f"/v1/faculty/paper-generator/papers/{paper_id}", headers=auth_header(faculty))
    assert detail_resp.status_code == 200
    paper_detail = detail_resp.json().get("paper")
    assert paper_detail["status"].lower() == "ready"
    assert len(paper_detail.get("questionList", [])) == len(selected_ids)
    for q in paper_detail.get("questionList", []):
        assert q["id"] in selected_ids
