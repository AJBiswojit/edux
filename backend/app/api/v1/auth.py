from datetime import datetime, timedelta, timezone
import json
import hashlib

from fastapi import APIRouter, HTTPException, status
from jose import JWTError
from sqlalchemy import select
from sqlalchemy.orm import joinedload

from app.core.deps import DbDep, SettingsDep, UserDep
from app.core.logging import log_event
from app.core.security import decode_token, hash_password
from app.models.identity import OtpChallenge, RegistrationDraft, Role, User, UserRole
from app.models.people import StudentProfile
from app.schemas.auth import LoginRequest, LoginResponse, OtpRequest, RefreshRequest, RegisterRequest, ResendOtpRequest, ResetPasswordRequest, TokenPair
from app.services.live_catalog import registration_options as live_registration_options
from app.services.seed import DEMO_INSTITUTION_ID, authenticate, issue_tokens, user_public

router = APIRouter(prefix="/auth", tags=["auth"])


def _otp_hash(code: str) -> str:
    return hashlib.sha256(code.encode()).hexdigest()


@router.post("/login", response_model=LoginResponse)
def login(body: LoginRequest, db: DbDep):
    user = authenticate(db, body.email, body.password, body.role)
    if not user:
        log_event("medixo.auth", "warning", "login_failed", email=body.email, role=body.role)
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid email, password, or role")
    tokens = issue_tokens(user)
    log_event("medixo.auth", "info", "login_ok", user_id=user.id, email=user.email, role=body.role)
    return {**tokens, "user": user_public(db, user)}


@router.get("/me")
def me(db: DbDep, user: UserDep):
    return user_public(db, user)


@router.post("/refresh", response_model=TokenPair)
def refresh(body: RefreshRequest, db: DbDep):
    try:
        payload = decode_token(body.refreshToken)
        if payload.get("typ") != "refresh":
            raise JWTError("not refresh")
        user = db.get(User, payload["sub"])
    except (JWTError, KeyError, ValueError):
        user = None
    if not user:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid refresh token")
    user = db.scalars(select(User).options(joinedload(User.role_links).joinedload(UserRole.role)).where(User.id == user.id)).unique().one()
    return issue_tokens(user)


@router.post("/forgot-password")
def forgot_password(body: dict, db: DbDep):
    email = str(body.get("email") or "").lower()
    code = "482193"
    db.add(
        OtpChallenge(
            email=email,
            purpose="reset",
            code_hash=_otp_hash(code),
            expires_at=datetime.now(timezone.utc) + timedelta(minutes=10),
        )
    )
    db.commit()
    return {"ok": True, "message": "If an account exists for that email, a reset link has been sent.", "verificationId": "otp_reset", "demoOtp": code}


@router.post("/verify-otp")
def verify_otp(body: OtpRequest, db: DbDep):
    q = select(OtpChallenge).where(OtpChallenge.consumed_at.is_(None)).order_by(OtpChallenge.created_at.desc())
    if body.email:
        q = q.where(OtpChallenge.email == body.email.lower())
    rows = db.scalars(q).all()
    row = next((r for r in rows if r.code_hash == _otp_hash(body.otp)), None)
    if not row:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Invalid OTP. Check the code and try again.")
    expires = row.expires_at if row.expires_at.tzinfo else row.expires_at.replace(tzinfo=timezone.utc)
    if expires < datetime.now(timezone.utc):
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "OTP expired")
    row.consumed_at = datetime.now(timezone.utc)
    db.commit()
    return {"ok": True, "token": "otp_verified"}


@router.post("/resend-otp")
def resend_otp(body: ResendOtpRequest, db: DbDep):
    """Re-issue a fresh OTP for the given email and purpose."""
    email = (body.email or "").lower().strip()
    if not email:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "email is required to resend an OTP")
    purpose = (body.purpose or "register").strip()
    code = "482193"
    db.add(
        OtpChallenge(
            email=email,
            purpose=purpose,
            code_hash=_otp_hash(code),
            expires_at=datetime.now(timezone.utc) + timedelta(minutes=10),
        )
    )
    db.commit()
    return {"ok": True, "message": "OTP re-sent.", "demoOtp": code}


@router.post("/reset-password")
def reset_password(body: ResetPasswordRequest, db: DbDep):
    """
    Change a user's password.  Requires a valid, unconsumed 'reset' OTP
    (issued by /forgot-password) passed as `token` in the request body.
    """
    email = body.email.lower().strip()

    # --- validate the reset OTP before touching any password ---
    q = (
        select(OtpChallenge)
        .where(
            OtpChallenge.email == email,
            OtpChallenge.purpose == "reset",
            OtpChallenge.consumed_at.is_(None),
            OtpChallenge.code_hash == _otp_hash(body.token),
        )
        .order_by(OtpChallenge.created_at.desc())
    )
    otp_row = db.scalars(q).first()
    if not otp_row:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Invalid or expired reset code")
    expires = otp_row.expires_at if otp_row.expires_at.tzinfo else otp_row.expires_at.replace(tzinfo=timezone.utc)
    if expires < datetime.now(timezone.utc):
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Reset code has expired — request a new one")

    # Mark the OTP consumed *before* committing the password change
    otp_row.consumed_at = datetime.now(timezone.utc)

    user = db.scalars(select(User).where(User.email == email)).first()
    if user:
        user.password_hash = hash_password(body.password)
    db.commit()
    return {"ok": True, "message": "Password updated. You can now sign in."}


@router.post("/verify-email")
def verify_email(body: OtpRequest, db: DbDep):
    """Verify an email address using an OTP challenge (purpose='register' or 'email')."""
    email = (body.email or "").lower().strip()
    q = (
        select(OtpChallenge)
        .where(
            OtpChallenge.consumed_at.is_(None),
            OtpChallenge.code_hash == _otp_hash(body.otp),
        )
        .order_by(OtpChallenge.created_at.desc())
    )
    if email:
        q = q.where(OtpChallenge.email == email)
    otp_row = db.scalars(q).first()
    if not otp_row:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Verification code incorrect.")
    expires = otp_row.expires_at if otp_row.expires_at.tzinfo else otp_row.expires_at.replace(tzinfo=timezone.utc)
    if expires < datetime.now(timezone.utc):
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Verification code has expired — request a new one")
    otp_row.consumed_at = datetime.now(timezone.utc)
    db.commit()
    return {"ok": True, "verified": True}


@router.get("/registration/options")
def registration_options(db: DbDep):
    return live_registration_options(db)


@router.get("/registration/status")
def registration_status(email: str, db: DbDep):
    email = email.lower().strip()
    user = db.scalars(select(User).where(User.email == email)).first()
    if user:
        return {"registered": True, "verified": True}
    draft = db.scalars(select(RegistrationDraft).where(RegistrationDraft.email == email).order_by(RegistrationDraft.created_at.desc())).first()
    if not draft:
        return {"registered": False}
    return {"registered": True, "verified": bool(draft.verified_at)}


def _extract_first_name(full_name: str, fallback: str = "Student") -> str:
    """Return the first whitespace-separated token of full_name, or fallback."""
    parts = (full_name or "").strip().split()
    return parts[0] if parts else fallback


@router.post("/register")
def register(body: RegisterRequest, db: DbDep):
    email = body.email.lower().strip()

    # Block if a verified account already exists for this email
    if db.scalars(select(User).where(User.email == email)).first():
        raise HTTPException(status.HTTP_409_CONFLICT, "An account already exists for this email — try signing in instead.")

    # Invalidate any previous unverified drafts so only the latest one counts
    stale_drafts = db.scalars(
        select(RegistrationDraft).where(
            RegistrationDraft.email == email,
            RegistrationDraft.verified_at.is_(None),
        )
    ).all()
    for stale in stale_drafts:
        db.delete(stale)

    # Invalidate any previous unconsumed register OTPs for this email
    stale_otps = db.scalars(
        select(OtpChallenge).where(
            OtpChallenge.email == email,
            OtpChallenge.purpose == "register",
            OtpChallenge.consumed_at.is_(None),
        )
    ).all()
    for stale in stale_otps:
        stale.consumed_at = datetime.now(timezone.utc)

    # Only store the explicitly declared fields — extra="forbid" on the schema
    # already blocks unknown fields from arriving, but we whitelist here too.
    safe_payload = {
        "fullName": body.fullName,
        "email": email,
        "phone": body.phone,
        "password": body.password,
        "university": body.university,
        "competitive": body.competitive,
    }
    draft = RegistrationDraft(
        institution_id=DEMO_INSTITUTION_ID,
        email=email,
        phone=body.phone,
        payload=json.dumps(safe_payload),
    )
    db.add(draft)
    code = "482193"
    db.add(
        OtpChallenge(
            email=email,
            purpose="register",
            code_hash=_otp_hash(code),
            expires_at=datetime.now(timezone.utc) + timedelta(minutes=10),
        )
    )
    db.commit()
    log_event("medixo.auth", "info", "register_draft_created", email=email, draft_id=draft.id)
    return {"ok": True, "verificationId": "otp_demo_4821", "demoOtp": code, "draftId": draft.id}


@router.post("/register/verify")
def register_verify(body: OtpRequest, db: DbDep, settings: SettingsDep):
    email = (body.email or "").lower().strip()
    if not email:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "email is required")

    # --- validate OTP against the database row (expiry + consume) ---
    otp_row = db.scalars(
        select(OtpChallenge)
        .where(
            OtpChallenge.email == email,
            OtpChallenge.purpose == "register",
            OtpChallenge.consumed_at.is_(None),
            OtpChallenge.code_hash == _otp_hash(body.otp),
        )
        .order_by(OtpChallenge.created_at.desc())
    ).first()
    if not otp_row:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Invalid verification code")
    expires = otp_row.expires_at if otp_row.expires_at.tzinfo else otp_row.expires_at.replace(tzinfo=timezone.utc)
    if expires < datetime.now(timezone.utc):
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Verification code has expired — request a new one")
    otp_row.consumed_at = datetime.now(timezone.utc)

    # Idempotent: if the user was already created return tokens immediately
    existing = db.scalars(
        select(User)
        .options(joinedload(User.role_links).joinedload(UserRole.role))
        .where(User.email == email)
    ).unique().first()
    if existing:
        db.commit()
        return {"ok": True, **issue_tokens(existing), "user": user_public(db, existing)}

    draft = db.scalars(
        select(RegistrationDraft)
        .where(RegistrationDraft.email == email, RegistrationDraft.verified_at.is_(None))
        .order_by(RegistrationDraft.created_at.desc())
    ).first()
    if not draft:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "No pending registration draft for this email")

    draft.verified_at = datetime.now(timezone.utc)
    payload = json.loads(draft.payload)

    role = db.scalars(
        select(Role).where(Role.code == "student", Role.institution_id == DEMO_INSTITUTION_ID)
    ).first()

    full_name = (payload.get("fullName") or "Student").strip() or "Student"
    user = User(
        institution_id=DEMO_INSTITUTION_ID,
        email=email,
        phone=draft.phone,
        password_hash=hash_password(payload.get("password") or settings.demo_password),
        full_name=full_name,
        first_name=_extract_first_name(full_name),  # task #7 — safe split
        status="active",
        email_verified_at=datetime.now(timezone.utc),
    )
    db.add(user)
    db.flush()

    if role:
        db.add(UserRole(user_id=user.id, role_id=role.id, institution_id=DEMO_INSTITUTION_ID))

    uni = payload.get("university") or {}
    db.add(
        StudentProfile(
            user_id=user.id,
            institution_id=DEMO_INSTITUTION_ID,
            roll_no=f"REG-{user.id[:8].upper()}",
            extra=json.dumps(
                {
                    "program": uni.get("degree"),
                    "semester": uni.get("semester"),
                    "university": uni,
                    "competitive": payload.get("competitive"),
                }
            ),
        )
    )
    db.commit()

    user = db.scalars(
        select(User)
        .options(joinedload(User.role_links).joinedload(UserRole.role))
        .where(User.id == user.id)
    ).unique().one()
    log_event("medixo.auth", "info", "register_verified", user_id=user.id, email=email)
    return {"ok": True, **issue_tokens(user), "user": user_public(db, user)}


@router.post("/profile-setup")
def profile_setup(body: dict, db: DbDep):
    from app.models.people import StudentProfile
    from app.services.seed import user_public

    email = str(body.get("email") or "").lower().strip()
    user = None
    if email:
        user = db.scalars(select(User).options(joinedload(User.role_links).joinedload(UserRole.role)).where(User.email == email)).unique().first()
    if user is None:
        return {"ok": True, "user": body}
    if body.get("fullName"):
        user.full_name = body["fullName"]
        user.first_name = _extract_first_name(body["fullName"], fallback=user.first_name or "Student")
    if body.get("phone"):
        user.phone = body["phone"]
    profile = db.get(StudentProfile, user.id)
    if profile:
        extra = json.loads(profile.extra or "{}")
        extra.update({k: v for k, v in body.items() if k not in {"password", "email"}})
        profile.extra = json.dumps(extra)
    db.commit()
    db.refresh(user)
    return {"ok": True, "user": user_public(db, user)}


@router.post("/logout")
def logout():
    return {"ok": True}
