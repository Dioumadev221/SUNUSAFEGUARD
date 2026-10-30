from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.core.config import get_settings
from app.core.permissions import dashboards_for
from app.core.security import create_access_token, verify_password
from app.db.session import get_db
from app.models import User
from app.schemas import LoginIn, TokenOut, UserOut
from app.services.audit import audit, security_event

router = APIRouter(prefix="/auth", tags=["Authentication API"])


def user_out(user: User) -> UserOut:
    out = UserOut.model_validate(user)
    out.dashboards = dashboards_for(user.role)
    return out


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
    user.last_login_at = now
    audit(db, user, "login")
    db.commit()
    token, expires = create_access_token(str(user.id), user.role)
    return TokenOut(access_token=token, expires_in=expires, user=user_out(user))


@router.get("/me", response_model=UserOut)
def me(user: User = Depends(get_current_user)):
    return user_out(user)
