"""Chaîne vocale (Phase 4) : STT → … → TTS.

Interfaces seulement. Les implémentations (ex. Whisper fine-tuné wolof, TTS
wolof) seront choisies après évaluation ; aucune transcription ne doit être
journalisée (CDC §6.4).
"""
from typing import Protocol


class SpeechToText(Protocol):
    def transcribe(self, audio: bytes, lang_hint: str | None = None) -> dict: ...


class TextToSpeech(Protocol):
    def synthesize(self, text: str, lang: str) -> bytes: ...
