from fastapi import APIRouter, File, Form, HTTPException, UploadFile

router = APIRouter(prefix="/voice", tags=["Voice API"])

MAX_BYTES = 10 * 1024 * 1024


@router.post("/transcribe")
def transcribe(audio: UploadFile = File(...), language: str = Form("fr")):
    """Transcrit un court message vocal (français ou wolof) avec Whisper-small, en local.
    L'audio est traité en mémoire puis oublié : ni fichier, ni journal, ni base de données."""
    from voice.whisper_stt import VoiceUnavailable, WhisperSTT

    if language not in {"fr", "wo"}:
        raise HTTPException(400, "Langue non prise en charge (fr ou wo).")
    data = audio.file.read(MAX_BYTES + 1)
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
