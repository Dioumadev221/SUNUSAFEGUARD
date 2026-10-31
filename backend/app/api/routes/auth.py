from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from jwt import PyJWTError
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.core import totp
from app.core.config import get_settings
from app.core.permissions import MFA_REQUIRED_ROLES, dashboards_for
from app.core.security import create_access_token, decode_token, hash_password, password_problems, verify_password
from app.db.session import get_db
from app.models import User
from app.schemas import LoginIn, MfaCodeIn, MfaVerifyIn, PasswordChangeIn, TokenOut, UserOut
from app.services.audit import audit, security_event

router = APIRouter(prefix="/auth", tags=["Authentication API"])


def user_out(user: User) -> UserOut:
    out = UserOut.model_validate(user)
    out.dashboards = dashboards_for(user.role)
    out.mfa_active = bool(user.mfa_secret)
    out.mfa_setup_required = user.role in MFA_REQUIRED_ROLES and not user.mfa_secret
    return out


def _issue(db: Session, user: User) -> TokenOut:
    user.last_login_at = datetime.now(timezone.utc)
    audit(db, user, "login")
    db.commit()
    token, expires = create_access_token(str(user.id), user.role)
    return TokenOut(access_token=token, expires_in=expires, user=user_out(user))


@router.post("/login", response_model=TokenOut)
def login(data: LoginIn, db: Session = Depends(get_db)):
    s = get_settings()
    user = db.scalar(select(User).where(User.email == data.email.strip().lower()))
    now = datetime.now(timezone.utc)
    if user and user.locked_until and user.locked_until.replace(tzinfo=timezone.utc) > now:
        raise HTTPException(status.HTTP_429_TOO_MANY_REQUESTS, "Compte temporairement verrouillé. Réessayez plus tard.")
    if not user or not user.is_active or not verify_password(data.password, user.password_hash):
        if user:
            user.failed_logins += 1
            if user.failed_logins >= s.max_failed_logins:
                user.locked_until = now + timedelta(minutes=s.lockout_minutes)
                security_event(db, "account_locked", "warning", user_id=user.id)
        security_event(db, "login_failed", "info")
        db.commit()
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Identifiants invalides")
    user.failed_logins = 0
    user.locked_until = None
    if user.mfa_secret:
        # Deuxième facteur requis : jeton intermédiaire de 5 minutes, inutilisable ailleurs.
        db.commit()
        token, _ = create_access_token(str(user.id), user.role, scope="mfa", minutes=5)
        return TokenOut(mfa_required=True, mfa_token=token)
    return _issue(db, user)


@router.post("/mfa/verify", response_model=TokenOut)
def mfa_verify(data: MfaVerifyIn, db: Session = Depends(get_db)):
    try:
        payload = decode_token(data.mfa_token, scope="mfa")
    except PyJWTError:
        raise HTTPException(401, "Session de connexion expirée, recommencez.")
    user = db.get(User, int(payload["sub"]))
    if not user or not user.is_active:
        raise HTTPException(401, "Compte inactif")
    if not totp.verify(user.mfa_secret, data.code):
        security_event(db, "mfa_failed", "warning", user_id=user.id)
        db.commit()
        raise HTTPException(401, "Code invalide")
    return _issue(db, user)


@router.get("/me", response_model=UserOut)
def me(user: User = Depends(get_current_user)):
    return user_out(user)


@router.post("/mfa/setup")
def mfa_setup(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Génère un secret provisoire ; il n'est actif qu'après confirmation par un code."""
    if user.mfa_secret:
        raise HTTPException(409, "La double authentification est déjà active")
    secret = totp.generate_secret()
    token, _ = create_access_token(f"{user.id}:{secret}", user.role, scope="mfa_setup", minutes=10)
    return {"secret": secret, "otpauth_uri": totp.provisioning_uri(secret, user.email), "setup_token": token}


@router.post("/mfa/enable", response_model=UserOut)
def mfa_enable(data: MfaCodeIn, setup_token: str, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    try:
        uid, secret = decode_token(setup_token, scope="mfa_setup")["sub"].split(":")
    except (PyJWTError, ValueError):
        raise HTTPException(400, "Configuration expirée, recommencez.")
    if int(uid) != user.id or not totp.verify(secret, data.code):
        raise HTTPException(400, "Code invalide")
    user.mfa_secret, user.mfa_enabled = secret, True
    audit(db, user, "mfa_enabled", f"user:{user.id}")
    db.commit()
    return user_out(user)


@router.post("/password", response_model=UserOut)
def change_password(data: PasswordChangeIn, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if not verify_password(data.current_password, user.password_hash):
        raise HTTPException(400, "Mot de passe actuel incorrect")
    if problems := password_problems(data.new_password):
        raise HTTPException(422, "Mot de passe trop faible : " + ", ".join(problems))
    user.password_hash = hash_password(data.new_password)
    user.must_change_password = False
    audit(db, user, "password_changed", f"user:{user.id}")
    db.commit()
    return user_out(user)
