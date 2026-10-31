"""Reconnaissance vocale locale et gratuite (Whisper-small), sans carte graphique.

- Français : openai/whisper-small (licence MIT).
- Wolof : M9and2M/whisper-small-wolof (Whisper-small affiné sur 57 h de wolof, licence MIT).

L'audio est décodé en mémoire, jamais écrit sur le disque ni journalisé (CDC §6.4).
Les modèles sont téléchargés une fois depuis Hugging Face puis gardés en cache local.
"""
from __future__ import annotations

import io
import threading
import time

MODELS = {
    "fr": "openai/whisper-small",
    "wo": "M9and2M/whisper-small-wolof",
}
SAMPLE_RATE = 16000
MAX_SECONDS = 60

_pipelines: dict = {}
_lock = threading.Lock()


class VoiceUnavailable(RuntimeError):
    """Les dépendances vocales (torch, transformers, av) ne sont pas installées."""


def _decode(audio: bytes):
    """Décode m4a / webm / wav / mp3 en mono 16 kHz (float32) avec PyAV, sans fichier temporaire."""
    import av
    import numpy as np

    chunks = []
    with av.open(io.BytesIO(audio)) as container:
        stream = next((s for s in container.streams if s.type == "audio"), None)
        if stream is None:
            raise ValueError("Aucune piste audio")
        resampler = av.AudioResampler(format="flt", layout="mono", rate=SAMPLE_RATE)
        for frame in container.decode(stream):
            for out in resampler.resample(frame):
                chunks.append(out.to_ndarray().reshape(-1))
        for out in resampler.resample(None):
            chunks.append(out.to_ndarray().reshape(-1))
    if not chunks:
        raise ValueError("Audio vide")
    samples = np.concatenate(chunks).astype("float32")
    return samples[: SAMPLE_RATE * MAX_SECONDS]


def _pipeline(lang: str):
    with _lock:
        if lang not in _pipelines:
            try:
                from transformers import pipeline
            except ImportError as exc:  # pragma: no cover
                raise VoiceUnavailable(str(exc)) from exc
            _pipelines[lang] = pipeline("automatic-speech-recognition", model=MODELS[lang], device="cpu")
        return _pipelines[lang]


class WhisperSTT:
    """Implémente l'interface SpeechToText de ce paquet."""

    def transcribe(self, audio: bytes, lang_hint: str | None = None) -> dict:
        lang = lang_hint if lang_hint in MODELS else "fr"
        samples = _decode(audio)
        duration = len(samples) / SAMPLE_RATE
        if duration < 0.3:
            return {"text": "", "language": lang, "duration": duration, "seconds": 0.0}
        asr = _pipeline(lang)
        started = time.perf_counter()
        if lang == "fr":
            generate = {"language": "french", "task": "transcribe"}
        else:
            # Le modèle wolof ne s'arrête pas toujours de lui-même : sans plafond, il génère jusqu'à
            # 448 jetons (~80 s sur processeur). On le borne à la durée parlée (~9 jetons par seconde).
            generate = {"max_new_tokens": min(440, int(duration * 9) + 12), "num_beams": 1, "do_sample": False}
        result = asr({"raw": samples, "sampling_rate": SAMPLE_RATE}, generate_kwargs=generate)
        text = (result.get("text") or "").strip()
        return {"text": text, "language": lang, "duration": round(duration, 1), "seconds": round(time.perf_counter() - started, 1)}


def warm_up(langs: tuple[str, ...] = ("fr", "wo")) -> None:
    """Télécharge et charge les modèles (à lancer en arrière-plan au démarrage)."""
    for lang in langs:
        _pipeline(lang)
