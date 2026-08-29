"""Phase 1 examination spine — sqlite verification. Does not claim live PostgreSQL."""

from __future__ import annotations

from app.models.assessment import Paper, PaperQuestion
from app.models.exams import ExamAttempt

from test.conftest import auth_header


def _create_paper(client, faculty, *, title, domain, exam_family, question_ids, extra=None):
    body = {
        "title": title,
        "domain": domain,
        "examFamily": exam_family,
        "selectedQuestionIds": question_ids,
        "duration": 60,
        "totalMarks": 8,
    }
    if extra:
        body.update(extra)
    return client.post("/v1/faculty/paper-generator/papers", json=body, headers=auth_header(faculty))


def test_question_bank_sql_filters_isolate_families(client, world):
    faculty = world["faculty"]
    uni = client.get("/v1/faculty/question-bank", params={"domain": "University"}, headers=auth_header(faculty)).json()
    jee = client.get(
        "/v1/faculty/question-bank",
        params={"domain": "Competitive", "examFamily": "JEE"},
        headers=auth_header(faculty),
    ).json()
    neet = client.get(
        "/v1/faculty/question-bank",
        params={"domain": "Competitive", "examFamily": "NEET"},
        headers=auth_header(faculty),
    ).json()
    uni_ids = {q["id"] for q in uni["questions"]}
    jee_ids = {q["id"] for q in jee["questions"]}
    neet_ids = {q["id"] for q in neet["questions"]}
    assert "q_uni_1" in uni_ids and "q_jee_phy" not in uni_ids and "q_neet_phy" not in uni_ids
    assert jee_ids == {"q_jee_phy"}
    assert neet_ids == {"q_neet_phy"}
    assert "q_other_inst" not in uni_ids
    paged = client.get("/v1/faculty/question-bank", params={"domain": "University", "page": 1, "limit": 1}, headers=auth_header(faculty)).json()
    assert paged["total"] == 2
    assert paged["limit"] == 1
    assert len(paged["questions"]) == 1


def test_student_cannot_access_faculty_bank(client, world):
    res = client.get("/v1/faculty/question-bank", headers=auth_header(world["student"]))
    assert res.status_code == 403


def test_paper_persists_selected_ids_on_sql_not_kv(client, world, db):
    faculty = world["faculty"]
    res = _create_paper(client, faculty, title="Uni Midterm", domain="University", exam_family=None, question_ids=["q_uni_1", "q_uni_2"])
    assert res.status_code == 200, res.text
    paper = res.json()["paper"]
    assert paper["selectedQuestionIds"] == ["q_uni_1", "q_uni_2"]
    row = db.get(Paper, paper["id"])
    assert row is not None
    assert row.created_by == faculty.id
    links = db.query(PaperQuestion).filter(PaperQuestion.paper_id == paper["id"]).all()
    assert {link.question_id for link in links} == {"q_uni_1", "q_uni_2"}
    fetched = client.get(f"/v1/faculty/paper-generator/papers/{paper['id']}", headers=auth_header(faculty))
    assert fetched.status_code == 200
    assert fetched.json()["selectedQuestionIds"] == ["q_uni_1", "q_uni_2"]


def test_cannot_mix_jee_and_neet_on_one_paper(client, world):
    res = _create_paper(
        client,
        world["faculty"],
        title="Mixed Physics",
        domain="Competitive",
        exam_family="JEE",
        question_ids=["q_jee_phy", "q_neet_phy"],
    )
    assert res.status_code == 422


def test_competitive_requires_family(client, world):
    res = _create_paper(
        client,
        world["faculty"],
        title="No Family",
        domain="Competitive",
        exam_family=None,
        question_ids=["q_jee_phy"],
    )
    assert res.status_code == 422


def test_publish_then_student_delivery_omits_keys_and_scores_server_side(client, world, db):
    faculty = world["faculty"]
    student = world["student"]
    created = _create_paper(client, faculty, title="JEE Mock", domain="Competitive", exam_family="JEE", question_ids=["q_jee_phy"])
    paper_id = created.json()["paper"]["id"]
    pub = client.post(f"/v1/faculty/paper-generator/papers/{paper_id}/publish", headers=auth_header(faculty))
    assert pub.status_code == 200
    assert pub.json()["paper"]["status"] == "Published"

    listing = client.get("/v1/student/exam-agent/exams", headers=auth_header(student)).json()
    item = next(x for x in listing["items"] if x["id"] == paper_id)
    assert item["examFamily"] == "JEE"
    blob = str(item)
    assert "correctAnswer" not in blob
    assert "correct_answer" not in blob
    for q in item["questions"]:
        assert "correctAnswer" not in q

    hub = client.get("/v1/student/exams", headers=auth_header(student)).json()
    assert any(x["id"] == paper_id for x in hub["items"])
    detail = client.get(f"/v1/student/exams/{paper_id}", headers=auth_header(student)).json()
    assert "correctAnswer" not in str(detail)
    started = client.post(f"/v1/student/exams/{paper_id}/start", json={}, headers=auth_header(student))
    assert started.status_code == 200
    attempt_id = started.json()["attemptId"]
    for q in started.json()["questions"]:
        assert "correctAnswer" not in q

    wrong = client.post(
        "/v1/student/exam-agent/attempts",
        json={
            "examId": paper_id,
            "attemptId": attempt_id,
            "scoring": {"score": 999, "maxScore": 4, "percentage": 100},
            "studentId": "forged",
            "questionAttempts": [{"questionId": "q_jee_phy", "response": {"selected": 3}}],
        },
        headers=auth_header(student),
    )
    assert wrong.status_code == 200, wrong.text
    scoring = wrong.json()["attempt"]["scoring"]
    assert scoring["score"] == -1
    assert scoring["incorrect"] == 1
    assert scoring["maxScore"] == 4
    row = db.get(ExamAttempt, wrong.json()["id"])
    assert row.student_id == student.id
    assert row.submitted_at is not None

    again = client.post(
        "/v1/student/exam-agent/attempts",
        json={"examId": paper_id, "attemptId": attempt_id, "questionAttempts": [{"questionId": "q_jee_phy", "response": {"selected": 0}}]},
        headers=auth_header(student),
    )
    assert again.status_code == 409


def test_correct_answer_scores_positive(client, world):
    faculty = world["faculty"]
    student = world["student"]
    created = _create_paper(client, faculty, title="Uni Quiz", domain="University", exam_family=None, question_ids=["q_uni_1", "q_uni_2"])
    paper_id = created.json()["paper"]["id"]
    client.post(f"/v1/faculty/paper-generator/papers/{paper_id}/publish", headers=auth_header(faculty))
    res = client.post(
        "/v1/student/exam-agent/attempts",
        json={
            "examId": paper_id,
            "questionAttempts": [
                {"questionId": "q_uni_1", "response": {"selected": 0}},
                {"questionId": "q_uni_2", "response": {"selected": 1}},
            ],
            "scoring": {"score": 0},
        },
        headers=auth_header(student),
    )
    scoring = res.json()["attempt"]["scoring"]
    assert scoring["score"] == 4
    assert scoring["correct"] == 2
    assert scoring["percentage"] == 100


def test_other_institution_student_cannot_see_paper(client, world):
    faculty = world["faculty"]
    created = _create_paper(client, faculty, title="Hidden Uni", domain="University", exam_family=None, question_ids=["q_uni_1"])
    paper_id = created.json()["paper"]["id"]
    client.post(f"/v1/faculty/paper-generator/papers/{paper_id}/publish", headers=auth_header(faculty))
    listing = client.get("/v1/student/exam-agent/exams", headers=auth_header(world["student_b"])).json()
    assert all(item["id"] != paper_id for item in listing["items"])
    missing = client.get(f"/v1/student/exams/{paper_id}", headers=auth_header(world["student_b"]))
    assert missing.status_code == 404


def test_faculty_cannot_use_other_institution_questions(client, world):
    res = _create_paper(
        client,
        world["faculty"],
        title="Cross inst",
        domain="University",
        exam_family=None,
        question_ids=["q_other_inst"],
    )
    assert res.status_code == 422
