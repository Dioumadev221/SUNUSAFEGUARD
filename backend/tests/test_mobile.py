"""API utilisée par l'application mobile : canal « mobile » et reconnaissance vocale."""
import importlib.util
import io
import math
import struct
import wave

import pytest


def test_chat_accepts_mobile_channel(client):
    r = client.post("/api/chat", json={"message": "Je me sens stressée", "channel": "mobile"})
    assert r.status_code == 200
    assert r.json()["answer"]


def test_voice_rejects_unknown_language(client):
    r = client.post("/api/voice/transcribe", files={"audio": ("a.wav", b"x", "audio/wav")}, data={"language": "en"})
    assert r.status_code == 400


def test_voice_rejects_too_large_audio(client):
    big = b"0" * (10 * 1024 * 1024 + 1)
    r = client.post("/api/voice/transcribe", files={"audio": ("a.wav", big, "audio/wav")}, data={"language": "fr"})
    assert r.status_code == 413


@pytest.mark.skipif(importlib.util.find_spec("av") is None, reason="dépendances vocales non installées")
def test_voice_rejects_unreadable_audio(client):
    r = client.post("/api/voice/transcribe", files={"audio": ("a.wav", b"pas un son", "audio/wav")}, data={"language": "fr"})
    assert r.status_code == 400


@pytest.mark.skipif(importlib.util.find_spec("av") is None, reason="dépendances vocales non installées")
def test_voice_decodes_wav_without_loading_a_model():
    from voice.whisper_stt import SAMPLE_RATE, _decode

    buf = io.BytesIO()
    with wave.open(buf, "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(8000)
        w.writeframes(b"".join(struct.pack("<h", int(8000 * math.sin(i / 10))) for i in range(8000)))
    samples = _decode(buf.getvalue())
    assert abs(len(samples) - SAMPLE_RATE) < SAMPLE_RATE * 0.05  # 1 s rééchantillonnée en 16 kHz


def test_referral_only_to_structures_that_can_receive_it(client):
    orgs = client.get("/api/directory").json()
    assert all("accepts_referrals" in o for o in orgs)
    closed = [o for o in orgs if not o["accepts_referrals"]]
    if not closed:
        pytest.skip("toutes les structures de test ont un compte")
    r = client.post("/api/referrals", json={"organization_id": closed[0]["id"], "category": "autre", "consent": True})
    assert r.status_code == 409
