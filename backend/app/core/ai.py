"""Pont entre le backend et le dossier `ai-engine/`."""
import sys

from .config import get_settings

_path = get_settings().ai_engine_path
if _path not in sys.path:
    sys.path.insert(0, _path)
