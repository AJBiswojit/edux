import json

from fastapi import APIRouter, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.ai.gateway import AiGateway
from app.ai.prompts import EXECUTIVE_SYSTEM, MENTOR_SYSTEM, QUESTION_STUDIO_SYSTEM, TEACHING_STUDIO_SYSTEM
from app.core.config import get_settings
from app.core.deps import DbDep, UserDep
from app.models.ai import AiConversation, AiMessage, AiTrace
from app.schemas.auth import MentorChatRequest
from app.services.spa_payloads import payload

router = APIRouter(tags=["ai"])


def _trace(db: Session, user, feature: str, request: dict, result: dict) -> None:
    db.add(
        AiTrace(
            institution_id=user.institution_id or "platform",
            user_id=user.id,
            feature=feature,
            request=json.dumps(request),
            response_meta=json.dumps({"model": result.get("model"), "prototype": result.get("prototype")}),
            latency_ms=result.get("latency_ms"),
            status="ok",
        )
    )
    db.commit()


def _reply(db: Session, user, *, channel: str, feature: str, system: str, text: str, thread_id: str | None = None) -> dict:
    gw = AiGateway(get_settings())
    conv_id = thread_id
    if not conv_id:
        conv = AiConversation(institution_id=user.institution_id or "platform", user_id=user.id, channel=channel, title=(text or "Chat")[:80])
        db.add(conv)
        db.flush()
        conv_id = conv.id
    db.add(AiMessage(conversation_id=conv_id, role="user", content=text))
    result = gw.complete(feature=feature, system=system, user=text)
    db.add(AiMessage(conversation_id=conv_id, role="assistant", content=result["text"], model_id=result.get("model")))
    _trace(db, user, feature, {"message": text, "threadId": conv_id}, result)
    return {"reply": result["text"], "threadId": conv_id, "conversationId": conv_id, "prototype": result.get("prototype", True), "model": result.get("model")}


@router.post("/ai/mentor/chat")
def mentor_chat(body: MentorChatRequest, db: DbDep, user: UserDep):
    return _reply(db, user, channel="mentor", feature="mentor", system=MENTOR_SYSTEM, text=body.message, thread_id=body.conversationId)


@router.post("/ai/tutor/respond")
def tutor_respond(body: dict, db: DbDep, user: UserDep):
    return _reply(db, user, channel="mentor", feature="mentor", system=MENTOR_SYSTEM, text=body.get("text") or "", thread_id=body.get("threadId"))


@router.post("/ai/assistant/respond")
def assistant_respond(body: dict, db: DbDep, user: UserDep):
    return _reply(db, user, channel="teaching_studio", feature="teaching_studio", system=TEACHING_STUDIO_SYSTEM, text=body.get("text") or "")


@router.post("/ai/executive/ask")
def executive_ask(body: MentorChatRequest, db: DbDep, user: UserDep):
    if user.primary_role != "admin":
        raise HTTPException(403, "Admin only")
    gw = AiGateway(get_settings())
    result = gw.complete(feature="executive", system=EXECUTIVE_SYSTEM, user=body.message, json_mode=gw.live)
    _trace(db, user, "executive", {"message": body.message}, result)
    return {"reply": result["text"], "prototype": result.get("prototype", True)}


@router.post("/ai/question-studio/generate")
def generate_questions(body: dict, db: DbDep, user: UserDep):
    gw = AiGateway(get_settings())
    excerpt = body.get("excerpt") or body.get("sourceText") or ""
    result = gw.complete(feature="question_studio", system=QUESTION_STUDIO_SYSTEM, user=excerpt, json_mode=True)
    _trace(db, user, "question_studio", body, result)
    return {"result": result["text"], "prototype": result.get("prototype", True)}


@router.post("/ai/teaching-studio/lesson")
def lesson_plan(body: dict, db: DbDep, user: UserDep):
    gw = AiGateway(get_settings())
    result = gw.complete(feature="teaching_studio", system=TEACHING_STUDIO_SYSTEM, user=json.dumps(body))
    _trace(db, user, "teaching_studio", body, result)
    return {"plan": result["text"], "prototype": result.get("prototype", True)}


@router.get("/ai/tutor/threads")
def tutor_threads(db: DbDep, user: UserDep):
    from app.models.ai import AiConversation, AiMessage

    convos = db.scalars(
        select(AiConversation)
        .where(AiConversation.user_id == user.id, AiConversation.channel == "mentor")
        .order_by(AiConversation.created_at.desc())
    ).all()
    if convos:
        threads = []
        for conv in convos:
            messages = db.scalars(select(AiMessage).where(AiMessage.conversation_id == conv.id).order_by(AiMessage.created_at)).all()
            threads.append(
                {
                    "id": conv.id,
                    "title": conv.title,
                    "messages": [{"id": m.id, "role": m.role, "text": m.content} for m in messages],
                }
            )
        data = payload("ai", db)
        return {"threads": threads, "quickPrompts": data.get("quickPrompts") or []}
    data = payload("ai", db)
    return {"threads": data.get("tutorThreads") or [], "quickPrompts": data.get("quickPrompts") or []}


@router.get("/ai/tutor/threads/{thread_id}")
def tutor_thread(thread_id: str, user: UserDep):
    threads = payload("ai")["tutorThreads"]
    thread = next((t for t in threads if t.get("id") == thread_id), threads[0] if threads else None)
    return {"thread": thread}


@router.get("/ai/copilot/suggestions")
def copilot_suggestions(user: UserDep, path: str | None = None):
    suggestions = payload("ai")["copilotSuggestions"]
    picked = suggestions.get(path) if isinstance(suggestions, dict) else None
    if picked is None and isinstance(suggestions, dict):
        picked = suggestions.get("/student") or next(iter(suggestions.values()), [])
    return {"suggestions": picked}


@router.get("/ai/learning-path")
def learning_path(user: UserDep):
    return payload("ai")["learningPath"]


@router.get("/ai/recommendations")
def recommendations(user: UserDep):
    return payload("ai")["recommendations"]


@router.get("/ai/weaknesses")
def weaknesses(user: UserDep):
    return payload("ai")["weaknesses"]


@router.get("/ai/prediction")
def prediction(user: UserDep):
    return payload("ai")["prediction"]


@router.get("/ai/graph-search")
def graph_search(user: UserDep, q: str | None = None):
    return {**payload("ai")["graphSearch"], "query": q or ""}


@router.get("/ai/assistant/threads")
def assistant_threads(user: UserDep):
    return {"threads": payload("ai")["assistantThreads"]}


@router.post("/ai/generate-quiz")
def generate_quiz(body: dict, user: UserDep):
    sample = payload("ai")["quizGeneratorSample"]
    return {"quiz": {**sample, "title": f"Generated: {body.get('topic') or 'General'} — {body.get('count') or 5} questions"}}


@router.post("/ai/generate-exam")
def generate_exam(body: dict, user: UserDep):
    return {"exam": payload("ai")["examGeneratorSample"]}


@router.get("/ai/stats")
def ai_stats(user: UserDep):
    return payload("ai")["stats"]
