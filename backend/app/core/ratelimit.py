"""Limitation de débit en mémoire (un processus). Les adresses IP ne sont jamais
stockées en clair : seule une empreinte salée et éphémère sert de clé.
Pour plusieurs instances, remplacer par un compteur Redis (même interface)."""
import hashlib
import os
import time
from collections import defaultdict, deque

from fastapi import Request
from starlette.responses import JSONResponse

from .config import get_settings

_SALT = os.urandom(16)
_hits: dict[str, deque] = defaultdict(deque)


def _parse(rule: str) -> tuple[int, int]:
    count, window = rule.split("/")
    return int(count), int(window)


def _rules() -> dict[str, tuple[int, int]]:
    s = get_settings()
    return {"/api/chat": _parse(s.rate_limit_chat), "/api/auth/login": _parse(s.rate_limit_login),
            "/api/auth/mfa/verify": _parse(s.rate_limit_login), "/api/referrals": _parse(s.rate_limit_login)}


def client_ip(request: Request) -> str:
    return request.headers.get("x-real-ip") or (request.client.host if request.client else "inconnu")


def check(request: Request) -> JSONResponse | None:
    rule = _rules().get(request.url.path) if request.method == "POST" else None
    if not rule:
        return None
    limit, window = rule
    key = hashlib.sha256(_SALT + f"{client_ip(request)}|{request.url.path}".encode()).hexdigest()
    now = time.monotonic()
    q = _hits[key]
    while q and q[0] <= now - window:
        q.popleft()
    if len(q) >= limit:
        return JSONResponse({"detail": "Trop de requêtes. Patientez un instant avant de réessayer."},
                            status_code=429, headers={"Retry-After": str(window)})
    q.append(now)
    if len(_hits) > 50_000:  # garde-fou mémoire
        _hits.clear()
    return None


def reset() -> None:
    _hits.clear()
