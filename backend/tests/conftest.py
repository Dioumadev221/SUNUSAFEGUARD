import os
import tempfile

_db = tempfile.NamedTemporaryFile(suffix=".db", delete=False)
os.environ["DATABASE_URL"] = f"sqlite:///{_db.name}"
os.environ["LLM_PROVIDER"] = "none"   # Tests déterministes, sans LLM.
os.environ["ENVIRONMENT"] = "development"

import pytest  # noqa: E402
from fastapi.testclient import TestClient  # noqa: E402

from app.main import app  # noqa: E402

PASSWORD = "SunuDemo2026!"


@pytest.fixture(scope="session")
def client():
    with TestClient(app) as c:
        yield c


@pytest.fixture(scope="session")
def login(client):
    cache = {}

    def _login(email: str) -> dict:
        if email not in cache:
            r = client.post("/api/auth/login", json={"email": email, "password": PASSWORD})
            assert r.status_code == 200, r.text
            cache[email] = {"Authorization": f"Bearer {r.json()['access_token']}"}
        return cache[email]

    return _login
