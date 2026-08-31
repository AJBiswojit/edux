"""Phase 1 examination spine — sqlite verification. Does not claim live PostgreSQL."""

from __future__ import annotations

from app.models.assessment import Paper, PaperQuestion, Question
from app.models.catalog import Chapter, Course, Subject, Topic
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


def test_paper_generator_config_returns_real_catalog(client, world, db):
    faculty = world["faculty"]
    inst = world["inst_a"]

    subject = Subject(id="subj_catalog_test", institution_id=inst.id, code="CAT101", name="Catalog Subject", exam_mode="university")
    course = Course(id="course_catalog_test", institution_id=inst.id, code="CAT101", name="Catalog Course", subject_id=subject.id)
    chapter = Chapter(id="ch_catalog_test", subject_id=subject.id, course_id=course.id, name="Catalog Chapter", sort_order=1)
    topic = Topic(id="topic_catalog_test", chapter_id=chapter.id, name="Catalog Topic", sort_order=1)
    db.add_all([subject, course, chapter, topic])
    db.commit()
    try:
        payload = client.get("/v1/faculty/paper-generator", headers=auth_header(faculty)).json()
        config = payload["config"]
        course_row = next((row for row in config["courseCatalog"] if row["code"] == "CAT101"), None)
        assert course_row == {
            "id": course.id,
            "code": "CAT101",
            "name": "Catalog Course",
            "subjectId": subject.id,
            "subjectCode": "CAT101",
            "subjectName": "Catalog Subject",
        }
        assert "CAT101 — Catalog Course" in config["courses"]
        subject_row = next((row for row in config["subjectCatalog"] if row["code"] == "CAT101"), None)
        assert subject_row["chapters"] == [{"id": chapter.id, "name": "Catalog Chapter", "courseId": course.id, "topics": ["Catalog Topic"]}]
        assert config["chapters"]["Catalog Subject"] == ["Catalog Chapter"]
        assert config["topics"]["Catalog Chapter"] == ["Catalog Topic"]
    finally:
        db.delete(topic)
        db.delete(chapter)
        db.delete(course)
        db.delete(subject)
        db.commit()


def test_question_bank_course_filter_uses_real_catalog_hierarchy(client, world, db):
    faculty = world["faculty"]
    inst = world["inst_a"]

    subject = Subject(id="subj_course_test_a", institution_id=inst.id, code="CS_TEST", name="Test CS", exam_mode="university")
    course = Course(id="course_test_a", institution_id=inst.id, code="CS900", name="Test Course", subject_id=subject.id)
    chapter = Chapter(id="ch_course_test_a", subject_id=subject.id, course_id=course.id, name="Test Chapter", sort_order=1)
    question = Question(
        id="q_course_test_1",
        institution_id=inst.id,
        exam_mode="university",
        exam_family=None,
        subject_id=subject.id,
        chapter_id=chapter.id,
        stem="Course-filtered question?",
        options='["A","B","C","D"]',
        correct_answer="0",
        marks=1,
        negative_marks=0,
        difficulty="easy",
        q_type="mcq",
        concept="Test",
        status="approved",
    )
    db.add_all([subject, course, chapter, question])
    db.commit()

    matched = client.get(
        "/v1/faculty/question-bank",
        params={"domain": "University", "course": "CS900"},
        headers=auth_header(faculty),
    ).json()
    assert "q_course_test_1" in {q["id"] for q in matched["questions"]}

    missing = client.get(
        "/v1/faculty/question-bank",
        params={"domain": "University", "course": "CS-NOT-A-REAL-CODE"},
        headers=auth_header(faculty),
    ).json()
    assert "q_course_test_1" not in {q["id"] for q in missing["questions"]}

    db.delete(question)
    db.delete(chapter)
    db.delete(course)
    db.delete(subject)
    db.commit()


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


# ---------------------------------------------------------------------------
# Paper Library regression tests — AI-generated papers ONLY
# ---------------------------------------------------------------------------

_AI_TEST_SUBJECT_ID = "t_exam_core_ai_subject"
_AI_TEST_CHAPTER_ID = "t_exam_core_ai_chapter"
_AI_TEST_TOPIC_ID = "t_exam_core_ai_topic"


def _ensure_ai_test_catalog(db, institution_id: str) -> None:
    """Seed the AI test subject/chapter/topic used by the fake agent flow."""
    from app.models.catalog import Chapter, Subject, Topic

    if db.get(Subject, _AI_TEST_SUBJECT_ID) is None:
        db.add(Subject(
            id=_AI_TEST_SUBJECT_ID, institution_id=institution_id, code="AI-TEST",
            name="AI Test Subject", exam_mode="competitive", exam_family="NEET",
        ))
    if db.get(Chapter, _AI_TEST_CHAPTER_ID) is None:
        db.add(Chapter(id=_AI_TEST_CHAPTER_ID, subject_id=_AI_TEST_SUBJECT_ID, name="AI Test Chapter", sort_order=1))
    if db.get(Topic, _AI_TEST_TOPIC_ID) is None:
        db.add(Topic(id=_AI_TEST_TOPIC_ID, chapter_id=_AI_TEST_CHAPTER_ID, name="AI Test Topic", sort_order=1))
    db.commit()


def _remove_ai_test_catalog(db) -> None:
    from app.models.catalog import Chapter, Subject, Topic

    db.query(Topic).filter(Topic.id == _AI_TEST_TOPIC_ID).delete()
    db.query(Chapter).filter(Chapter.id == _AI_TEST_CHAPTER_ID).delete()
    db.query(Subject).filter(Subject.id == _AI_TEST_SUBJECT_ID).delete()
    db.commit()


def _generate_and_create_ai_paper(client, faculty, db, ai_service, *, title):
    """Helper: generate AI questions via the deployed-agent flow, then create a
    paper from the persisted generation questions.

    The AI agent is simulated by `ai_service` (conftest fixture); its question
    rows are written into the shared ai_generated_* tables before the
    generation is settled, exactly like the deployed pipeline.

    Returns (paper_dict, generation_id).
    """
    from test.conftest import settle_generation

    body = {
        "domain": "Competitive",
        "examFamily": "NEET",
        "subject": "AI Test Subject",
        "chapter": "AI Test Chapter",
        "topic": "AI Test Topic",
        "questionCount": 2,
        "difficulty": "Medium",
        "questionTypes": ["MCQ"],
    }
    gen_res = client.post("/v1/faculty/question-bank/generate", json=body, headers=auth_header(faculty))
    assert gen_res.status_code == 200, gen_res.text
    generation_id = gen_res.json()["generationId"]

    ai_service["write_output"]()
    settled = settle_generation(client, faculty, generation_id)
    assert settled["status"] == "READY", settled
    q_res = client.get(
        f"/v1/faculty/question-bank/generations/{generation_id}/questions", headers=auth_header(faculty)
    ).json()
    q_ids = [q["id"] for q in q_res["questions"]]
    assert len(q_ids) == 2

    paper_body = {
        "title": title,
        "domain": "Competitive",
        "examFamily": "NEET",
        "selectedQuestionIds": q_ids,
        "duration": 60,
        "totalMarks": 8,
        "generationId": generation_id,
    }
    paper_res = client.post("/v1/faculty/paper-generator/papers", json=paper_body, headers=auth_header(faculty))
    assert paper_res.status_code == 200, paper_res.text
    return paper_res.json()["paper"], generation_id


def _create_manual_paper(client, faculty, *, title, question_ids):
    """Helper: create a paper WITHOUT a generationId (simulates non-AI / manual assembly)."""
    paper_body = {
        "title": title,
        "domain": "University",
        "selectedQuestionIds": question_ids,
        "duration": 60,
        "totalMarks": 4,
        # Deliberately omit generationId — this is the non-AI case
    }
    res = client.post("/v1/faculty/paper-generator/papers", json=paper_body, headers=auth_header(faculty))
    assert res.status_code == 200, res.text
    return res.json()["paper"]


def test_paper_library_shows_only_ai_generated_papers(client, world, db, fake_ai_service):
    """Regression: Paper Library (GET /faculty/paper-generator) must return only
    papers whose blueprint contains a valid generationId.

    - AI-generated paper  → present in library
    - Manual/non-AI paper → absent from library
    - Empty AI set        → returns []
    """
    from app.models.assessment import Paper, PaperQuestion, QuestionGeneration, QuestionGenerationItem
    from app.models.assessment import Question as Q

    faculty = world["faculty"]
    _ensure_ai_test_catalog(db, faculty.institution_id)

    # --- Create an AI-generated paper -----------------------------------------
    ai_paper, generation_id = _generate_and_create_ai_paper(
        client, faculty, db, fake_ai_service, title="AI Paper Library Regression"
    )
    ai_paper_id = ai_paper["id"]

    # --- Create a manual paper (no generationId) --------------------------------
    manual_paper = _create_manual_paper(
        client, faculty,
        title="Manual Paper Library Regression",
        question_ids=["q_uni_1"],
    )
    manual_paper_id = manual_paper["id"]

    try:
        # Fetch Paper Library via the primary endpoint
        res = client.get("/v1/faculty/paper-generator", headers=auth_header(faculty))
        assert res.status_code == 200, res.text
        data = res.json()
        papers = data.get("generatedPapers") or data.get("items") or []
        paper_ids = {p["id"] for p in papers}

        # AI paper MUST appear
        assert ai_paper_id in paper_ids, (
            f"AI-generated paper {ai_paper_id!r} missing from Paper Library. "
            f"Library contains: {paper_ids}"
        )

        # Manual paper MUST NOT appear
        assert manual_paper_id not in paper_ids, (
            f"Non-AI manual paper {manual_paper_id!r} incorrectly appeared in Paper Library. "
            f"Library contains: {paper_ids}"
        )

        # The AI paper must carry its generationId in the serialized response
        ai_entry = next(p for p in papers if p["id"] == ai_paper_id)
        assert ai_entry.get("generationId") == generation_id, (
            f"generationId not surfaced on Paper Library entry: {ai_entry}"
        )

        # Also verify via the /papers list endpoint
        list_res = client.get("/v1/faculty/paper-generator/papers", headers=auth_header(faculty))
        assert list_res.status_code == 200
        list_ids = {p["id"] for p in list_res.json().get("generatedPapers", [])}
        assert ai_paper_id in list_ids
        assert manual_paper_id not in list_ids

    finally:
        # Clean up test papers and their AI questions / generation records
        for paper_id in (ai_paper_id, manual_paper_id):
            row = db.get(Paper, paper_id)
            if row:
                db.query(PaperQuestion).filter(PaperQuestion.paper_id == paper_id).delete()
                db.delete(row)
        items = db.query(QuestionGenerationItem).filter(
            QuestionGenerationItem.generation_id == generation_id
        ).all()
        q_ids_cleanup = [i.question_id for i in items]
        db.query(QuestionGenerationItem).filter(
            QuestionGenerationItem.generation_id == generation_id
        ).delete()
        if q_ids_cleanup:
            db.query(Q).filter(Q.id.in_(q_ids_cleanup)).delete()
        gen = db.get(QuestionGeneration, generation_id)
        if gen:
            db.delete(gen)
        _remove_ai_test_catalog(db)
        db.commit()


def test_paper_library_empty_when_no_ai_papers_exist(client, world, db):
    """Regression: when a faculty has only non-AI papers, Paper Library returns [].

    Uses a fresh institution with no prior state to avoid cross-test pollution.
    """
    from app.models.assessment import Paper, PaperQuestion
    from app.models.identity import Institution, Role, User, UserRole
    from app.core.security import hash_password

    inst = Institution(id="inst_lib_empty_test", slug="empty-lib", name="Empty Lib University")
    db.add(inst)
    db.flush()

    role_row = Role(institution_id=inst.id, code="faculty", name="Faculty")
    db.add(role_row)
    db.flush()

    faculty_user = User(
        id="u_fac_lib_empty",
        institution_id=inst.id,
        email="lib_empty@test.edu",
        password_hash=hash_password("pass123"),
        full_name="Empty Lib Faculty",
        status="active",
        legacy_role="faculty",
    )
    db.add(faculty_user)
    db.flush()
    db.add(UserRole(user_id=faculty_user.id, role_id=role_row.id, institution_id=inst.id))
    db.commit()

    from app.models.assessment import Question as Q

    q = Q(
        id="q_lib_empty_test",
        institution_id=inst.id,
        exam_mode="university",
        stem="Empty test?",
        options='["A","B"]',
        correct_answer="0",
        marks=1,
        negative_marks=0,
        difficulty="easy",
        q_type="mcq",
        concept="Test",
        status="approved",
    )
    db.add(q)
    db.commit()

    try:
        # Create a manual paper (no generationId)
        manual_paper = _create_manual_paper(
            client, faculty_user,
            title="Only Manual Paper",
            question_ids=["q_lib_empty_test"],
        )
        manual_paper_id = manual_paper["id"]

        res = client.get("/v1/faculty/paper-generator", headers=auth_header(faculty_user))
        assert res.status_code == 200
        papers = res.json().get("generatedPapers") or []
        assert papers == [], (
            f"Expected empty Paper Library but got {[p['id'] for p in papers]}"
        )

    finally:
        row = db.get(Paper, manual_paper.get("id") if "id" in manual_paper else "")
        if row:
            db.query(PaperQuestion).filter(PaperQuestion.paper_id == row.id).delete()
            db.delete(row)
        qi = db.get(Q, "q_lib_empty_test")
        if qi:
            db.delete(qi)
        from app.models.identity import UserRole as UR
        db.query(UR).filter(UR.user_id == "u_fac_lib_empty").delete()
        db.query(User).filter(User.id == "u_fac_lib_empty").delete()
        db.query(Role).filter(Role.institution_id == "inst_lib_empty_test").delete()
        db.query(Institution).filter(Institution.id == "inst_lib_empty_test").delete()
        db.commit()


def test_ai_paper_blueprint_stores_generation_id(client, world, db, fake_ai_service):
    """Regression: creating a paper with generationId persists it in the blueprint JSON."""
    from app.models.assessment import Paper, PaperQuestion, QuestionGeneration, QuestionGenerationItem
    from app.models.assessment import Question as Q
    import json

    faculty = world["faculty"]
    _ensure_ai_test_catalog(db, faculty.institution_id)
    ai_paper, generation_id = _generate_and_create_ai_paper(
        client, faculty, db, fake_ai_service, title="Blueprint Gen ID Test"
    )
    paper_id = ai_paper["id"]

    try:
        row = db.get(Paper, paper_id)
        assert row is not None
        bp = json.loads(row.blueprint)
        assert bp.get("generationId") == generation_id, (
            f"blueprint.generationId expected {generation_id!r}, got {bp.get('generationId')!r}"
        )
    finally:
        for paper_id_ in (paper_id,):
            r = db.get(Paper, paper_id_)
            if r:
                db.query(PaperQuestion).filter(PaperQuestion.paper_id == paper_id_).delete()
                db.delete(r)
        items = db.query(QuestionGenerationItem).filter(
            QuestionGenerationItem.generation_id == generation_id
        ).all()
        q_ids_cleanup = [i.question_id for i in items]
        db.query(QuestionGenerationItem).filter(
            QuestionGenerationItem.generation_id == generation_id
        ).delete()
        if q_ids_cleanup:
            db.query(Q).filter(Q.id.in_(q_ids_cleanup)).delete()
        gen = db.get(QuestionGeneration, generation_id)
        if gen:
            db.delete(gen)
        _remove_ai_test_catalog(db)
        db.commit()


def test_invalid_generation_id_is_silently_rejected(client, world, db):
    """Regression: a fabricated / unknown generationId must not be stored —
    the paper is created successfully but WITHOUT the generationId in blueprint,
    so it remains excluded from the Paper Library.
    """
    from app.models.assessment import Paper, PaperQuestion
    import json

    faculty = world["faculty"]
    paper_body = {
        "title": "Fake Gen ID Paper",
        "domain": "University",
        "selectedQuestionIds": ["q_uni_1"],
        "duration": 60,
        "totalMarks": 2,
        "generationId": "00000000-0000-0000-0000-000000000000",  # does not exist
    }
    res = client.post("/v1/faculty/paper-generator/papers", json=paper_body, headers=auth_header(faculty))
    assert res.status_code == 200, res.text
    paper_id = res.json()["paper"]["id"]

    try:
        row = db.get(Paper, paper_id)
        assert row is not None
        bp = json.loads(row.blueprint)
        # generationId must be None — the fake ID was rejected
        assert bp.get("generationId") is None, (
            f"Fake generationId was stored: {bp.get('generationId')}"
        )

        # Paper must NOT appear in the Paper Library
        lib_res = client.get("/v1/faculty/paper-generator", headers=auth_header(faculty))
        lib_ids = {p["id"] for p in lib_res.json().get("generatedPapers", [])}
        assert paper_id not in lib_ids, "Paper with fake generationId appeared in Paper Library"

    finally:
        row = db.get(Paper, paper_id)
        if row:
            db.query(PaperQuestion).filter(PaperQuestion.paper_id == paper_id).delete()
            db.delete(row)
        db.commit()
