import base64
import hashlib
import hmac
import os
from datetime import datetime, timedelta, timezone

import jwt
from cryptography.fernet import Fernet

from .config import get_settings

_ITERATIONS = 390_000


def hash_password(password: str) -> str:
    salt = os.urandom(16)
    digest = hashlib.pbkdf2_hmac("sha256", password.encode(), salt, _ITERATIONS)
    return f"pbkdf2_sha256${_ITERATIONS}${base64.b64encode(salt).decode()}${base64.b64encode(digest).decode()}"


def verify_password(password: str, stored: str) -> bool:
    try:
        _, iterations, salt, digest = stored.split("$")
        candidate = hashlib.pbkdf2_hmac("sha256", password.encode(), base64.b64decode(salt), int(iterations))
        return hmac.compare_digest(candidate, base64.b64decode(digest))
    except ValueError:
        return False


def create_access_token(subject: str, role: str) -> tuple[str, int]:
    s = get_settings()
    expires = datetime.now(timezone.utc) + timedelta(minutes=s.jwt_expire_minutes)
    token = jwt.encode({"sub": subject, "role": role, "exp": expires}, s.jwt_secret, algorithm="HS256")
    return token, s.jwt_expire_minutes * 60


def decode_token(token: str) -> dict:
    return jwt.decode(token, get_settings().jwt_secret, algorithms=["HS256"])


def _fernet() -> Fernet:
    key = get_settings().data_encryption_key
    if not key:
        # Dérivée du secret JWT en développement uniquement. En production : DATA_ENCRYPTION_KEY obligatoire.
        key = base64.urlsafe_b64encode(hashlib.sha256(get_settings().jwt_secret.encode()).digest()).decode()
    return Fernet(key.encode())


def encrypt(value: str) -> str:
    return _fernet().encrypt(value.encode()).decode() if value else ""


def decrypt(value: str) -> str:
    return _fernet().decrypt(value.encode()).decode() if value else ""
