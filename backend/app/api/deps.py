from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jwt import PyJWTError
from sqlalchemy.orm import Session

from app.core.permissions import has_permission
from app.core.security import decode_token
from app.db.session import get_db
from app.models import RevokedToken, User

bearer = HTTPBearer(auto_error=False)


def token_payload(creds: HTTPAuthorizationCredentials | None = Depends(bearer), db: Session = Depends(get_db)) -> dict:
    if creds is None:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Authentification requise")
    try:
        payload = decode_token(creds.credentials)
    except PyJWTError:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Session expirée ou invalide")
    # Une session fermée (déconnexion) ne donne plus accès, même si le jeton n'a pas expiré.
    if payload.get("jti") and db.get(RevokedToken, payload["jti"]):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Session fermée. Reconnectez-vous.")
    return payload


def get_current_user(payload: dict = Depends(token_payload), db: Session = Depends(get_db)) -> User:
    user = db.get(User, int(payload["sub"]))
    if user is None or not user.is_active:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Compte inactif")
    return user


def get_optional_user(creds: HTTPAuthorizationCredentials | None = Depends(bearer), db: Session = Depends(get_db)) -> User | None:
    """Pour les routes publiques : un jeton valide associe l'action au compte, sinon usage anonyme."""
    if creds is None:
        return None
    return get_current_user(token_payload(creds, db), db)


def require(permission: str):
    def checker(user: User = Depends(get_current_user)) -> User:
        if not has_permission(user.role, permission):
            raise HTTPException(status.HTTP_403_FORBIDDEN, "Permission insuffisante")
        return user

    return checker
