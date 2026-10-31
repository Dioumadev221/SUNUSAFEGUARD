"""TOTP (RFC 6238) sans dépendance — compatible Google Authenticator, Aegis, FreeOTP…"""
import base64
import hashlib
import hmac
import os
import struct
import time
from urllib.parse import quote


def generate_secret() -> str:
    return base64.b32encode(os.urandom(20)).decode().rstrip("=")


def _code(secret: str, counter: int) -> str:
    key = base64.b32decode(secret + "=" * (-len(secret) % 8))
    digest = hmac.new(key, struct.pack(">Q", counter), hashlib.sha1).digest()
    offset = digest[-1] & 0x0F
    value = struct.unpack(">I", digest[offset : offset + 4])[0] & 0x7FFFFFFF
    return f"{value % 1_000_000:06d}"


def now_code(secret: str, at: float | None = None) -> str:
    return _code(secret, int((at or time.time()) // 30))


def verify(secret: str, code: str, window: int = 1) -> bool:
    code = code.strip().replace(" ", "")
    if not secret or len(code) != 6 or not code.isdigit():
        return False
    counter = int(time.time() // 30)
    return any(hmac.compare_digest(_code(secret, counter + d), code) for d in range(-window, window + 1))


def provisioning_uri(secret: str, account: str, issuer: str = "SunuSafeguard") -> str:
    return f"otpauth://totp/{quote(issuer)}:{quote(account)}?secret={secret}&issuer={quote(issuer)}&digits=6&period=30"
