# AI Micro-Assessment Studio

## Purpose

AI Micro-Assessment Studio is a faculty-side formative-assessment prototype inside Faculty → Question Intelligence. A faculty member supplies a teaching paragraph or selects one of ten curated academic sources, reviews EduX's structured understanding, generates a short question set, reviews it, sends it to a context-appropriate audience, and reads concept-level results.

The feature is intentionally educational-product oriented: source understanding, concept coverage, question metadata, source grounding, faculty review, student response and suggested intervention are visible in one progressive workspace.

This is prototype/mock functionality and is not backend-integrated.

## Faculty Workflow

The canonical route is `/faculty/question-intelligence/micro-assessment`.

1. **Choose Source** — browse or filter the Source Library, use a sample, or paste custom material. The editor includes title, content, domain, exam family, subject, chapter, topic and source type.
2. **Process Content** — a short deterministic sequence shows Reading source → Identifying concepts → Finding question opportunities → Preparing assessment.
3. **Review AI Understanding** — the source chapter, topic, detected concepts, important-fact prompts and question opportunities are shown before generation.
4. **Generate Questions** — choose 5, 10, 15 or 20 questions and a preferred difficulty. The default path is 10.
5. **Review Assessment** — each question exposes chapter, topic, concept, difficulty, question type, answer, explanation and Prototype AI Validation. Faculty can edit, regenerate one question, delete, change difficulty/type, inspect concept coverage and request missing coverage.
6. **Send to Students** — configure title, description, question count, difficulty, duration, audience, deadline and optional instructions. Existing faculty batches/students are filtered by canonical domain and exam family.
7. **Results / Insights** — after the prototype response set is available, the workspace shows completion, average accuracy, most difficult concept, most missed question, concept performance, question-level insight and a suggested intervention.

The steps remain in one progressive workspace rather than becoming unrelated pages.

## Source Model

Each source in `src/datasets/faculty/micro-assessments.js` contains:

- `id`
- `title`
- `domain`
- `examFamily`
- `subject`
- `chapter`
- `topic`
- `sourceType`
- `content`
- `wordCount`
- `estimatedReadingTime`
- `detectedConcepts`
- `questionOpportunities`
- `generatedQuestions`

There are exactly ten original passages, each approximately 200 words:

- 5 University sources: Graph Traversal, Normalization, First Law of Thermodynamics, Logic Gates, and Wave–Particle Duality.
- 3 JEE sources: Torque and Angular Momentum, Equilibrium Constant, and Properties of Definite Integrals.
- 2 NEET sources: Cardiac Cycle and Coordination Number and Ligands.

Supported prototype source labels include Textbook, NCERT, Lecture Notes, PDF, Faculty Notes, Custom Text, Study Material and NCERT / Study Material. PDF is a label only; no file parser is included.

## Question Model

Generated questions contain:

- `id`
- `question`
- `questionType`
- `difficulty`
- `chapter`
- `topic`
- `concept`
- `options`
- `correctAnswer`
- `explanation`
- `sourceId`

The ten curated questions per source are deterministic. Stable source-pool extensions make the 15- and 20-question controls usable without random refreshes or a real model.

## Question Types

The prototype supports:

- Short Answer
- Fill in the Blank
- Direct MCQ
- Statement Based
- Multiple Statement
- Application Based
- Conceptual
- Why / Reasoning
- Match the Following
- Diagram Based

Each source has an intentionally mixed, subject-appropriate set rather than random type assignment.

## Metadata

Question cards visibly show Chapter, Topic, Concept, Difficulty and Question Type. The same metadata is retained through generation, review, assessment creation and results. The review card also shows the expected answer and explanation.

## Domain Isolation

Context is canonical and explicit:

```js
{ domain: 'university', examFamily: null }
{ domain: 'competitive', examFamily: 'JEE' }
{ domain: 'competitive', examFamily: 'NEET' }
```

The source filters, participant endpoint, assessment target and result/intervention hand-off use `domain` and `examFamily`. Subject-name heuristics are not used. University Physics, JEE Physics and NEET Physics cannot be merged; JEE Chemistry and NEET Chemistry remain separate even though their subject names match.

## Assessment Lifecycle

Faculty sends a reviewed question array through the micro-assessment service. The prototype stores the resulting assessment under `EduX_micro_assessments` and its attempts under `EduX_micro_assessment_attempts`. A send confirmation shows title, question count, target, duration and deadline. No external notification is performed.

A small deterministic response subset is seeded on send so the results workspace is useful immediately. The first selected student is left `Not Started` so the student flow can be demonstrated.

## Student Flow

Students use `/student/micro-assessments` (also available as **Micro-Assessments** in the student Academics navigation). The page shows title, faculty, subject, chapter, question count, duration, deadline and Not Started / In Progress / Completed status. The runner supports MCQ selection, fill-in responses and short answers. Submission stores a formative attempt under the separate micro-assessment attempt store.

## Results

Results are derived from the assessment questions and formative attempts. The faculty view includes:

- Students completed
- Average accuracy
- Most difficult concept
- Most missed question
- Concept accuracy bars
- Expandable question-level accuracy, concept, difficulty and type

There is no large secondary analytics dashboard.

## Intervention Connection

A weak concept creates a **Suggested Intervention** card, not an automatic intervention. The recommendation includes Targeted Practice, five questions, Medium difficulty and the weak concept. Faculty must choose **Create Intervention**.

The explicit action uses the existing Intervention lifecycle builder and `EduX_faculty_interventions` store at `Recommended`; it does not create a second status engine, assign students, send messages or alter the existing intervention lifecycle rules. Faculty can then review/approve it through the existing Intervention Center. **View Students** links back to the existing Faculty My Students → Interventions surface.

## Mock Data

The source dataset is domain-organized under `src/datasets/faculty/`. Every source has ten pre-seeded questions with varied difficulty and question types. The micro engine adapts its curated pool into the existing AI Question Studio selection engine (with a pool override), adds deterministic extensions for the supported 15/20 controls, and calculates lightweight diversity and concept-coverage signals. It does not introduce a second generation algorithm.

## API/Service Architecture

The feature preserves the current EduX boundary:

```text
UI components/pages
  → src/services/micro-assessments.js
  → src/api/faculty/micro-assessments.js
  → src/intelligence/faculty/engine/micro-assessments.js
  → src/datasets/faculty/micro-assessments.js
```

The API module is registered through `src/api/index.js`. The service layer does not read localStorage or import datasets. Existing faculty batch/student data is reused from the Faculty directory, and existing intervention data/lifecycle is reused for the explicit hand-off. No `mock-*` files or legacy mock-server modules were added.

Prototype routes include source reads, context-aware participant reads, process, generation, one-question regeneration, missing coverage, assessment creation/results, student assignment/detail and student attempt submission. Only the routes needed by the workflow are present.

## Known Prototype Limitations

- No Python, FastAPI, PostgreSQL, SQLAlchemy, Alembic, Redis, Celery, WebSocket or backend code was added.
- AI processing, question generation, validation, diversity and results are deterministic mock intelligence; no real LLM call or claim of validated AI quality is made.
- Source upload/PDF parsing is not implemented; source types are UI/data labels.
- Persistence is browser-local and intended for a single prototype session.
- Prototype response rows are aggregate and intentionally avoid exposing unnecessary personal data.
- External email, SMS, push notifications and real deadlines are not sent/enforced.
- The student runner does not implement a separate official exam engine; formative attempts are deliberately stored separately from official `ExamAttempt` analytics.
- Browser automation was not available in this environment. Route/build checks and API/service tests were run; responsive behavior is implemented with the existing responsive utility classes and was not claimed as automated browser coverage.
