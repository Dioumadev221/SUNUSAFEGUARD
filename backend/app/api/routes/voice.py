import base64
import binascii

from fastapi import APIRouter, File, Form, HTTPException, UploadFile
from pydantic import BaseModel, Field

router = APIRouter(prefix="/voice", tags=["Voice API"])

MAX_BYTES = 10 * 1024 * 1024


class VoiceIn(BaseModel):
    audio: str = Field(max_length=MAX_BYTES * 4 // 3 + 8, description="Audio encodé en base64")
    language: str = "fr"


@router.post("/transcribe")
def transcribe(audio: UploadFile = File(...), language: str = Form("fr")):
    """Transcrit un court message vocal (français ou wolof) avec Whisper-small, en local.
    L'audio est traité en mémoire puis oublié : ni fichier, ni journal, ni base de données."""
    return _transcribe(audio.file.read(MAX_BYTES + 1), language)


@router.post("/transcribe-base64")
def transcribe_base64(data: VoiceIn):
    """Même chose, audio envoyé en base64 : l'envoi de fichiers en multipart échoue sur certains iPhone."""
    try:
        raw = base64.b64decode(data.audio, validate=True)
    except (binascii.Error, ValueError):
        raise HTTPException(400, "Audio illisible. Réessayez.")
    return _transcribe(raw, data.language)


def _transcribe(data: bytes, language: str) -> dict:
    from voice.whisper_stt import VoiceUnavailable, WhisperSTT

    if language not in {"fr", "wo"}:
        raise HTTPException(400, "Langue non prise en charge (fr ou wo).")
    if len(data) > MAX_BYTES:
        raise HTTPException(413, "Message vocal trop long.")
    try:
        result = WhisperSTT().transcribe(data, lang_hint=language)
    except VoiceUnavailable:
        raise HTTPException(503, "La reconnaissance vocale n'est pas installée sur ce serveur.")
    except ValueError:
        raise HTTPException(400, "Audio illisible. Réessayez.")
    finally:
        del data
    return result
