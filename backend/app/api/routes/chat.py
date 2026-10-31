import json
from pathlib import Path

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.db.session import get_db
from app.schemas import ChatIn, ChatOut
from app.services.audit import security_event
from app.services.knowledge import get_pipeline
from app.services.metrics import record_usage

router = APIRouter(tags=["Chat API"])

DISCLAIMER = (
    "Assistant d'information automatisé. Il ne remplace pas un·e professionnel·le "
    "et ne contacte personne à votre place."
)


@router.post("/chat", response_model=ChatOut)
def chat(data: ChatIn, db: Session = Depends(get_db)):
    """Assistant conversationnel. Le message n'est NI stocké NI journalisé :
    seuls des indicateurs anonymes (langue, catégorie, qualité) sont enregistrés."""
    result = get_pipeline().run(data.message)
    record_usage(db, result, channel=data.channel, region=data.region)
    if result.safety_action != "allow":
        # On trace la règle déclenchée, jamais le contenu.
        security_event(db, f"safety_{result.safety_action}",
                       "warning" if result.safety_action == "refuse_injection" else "info",
                       rule=";".join(result.safety_reasons)[:200], language=result.language)
    db.commit()
    return ChatOut(
        answer=result.answer, language=result.language, category=result.category, sources=result.sources,
        grounded=result.grounded, show_emergency=result.show_emergency,
        suggest_directory=result.suggest_directory, safety_action=result.safety_action, disclaimer=DISCLAIMER,
        generated=result.used_llm,
    )


@router.get("/emergency-contacts")
def emergency_contacts():
    path = Path(get_settings().data_dir) / "seed" / "emergency_contacts.json"
    return json.loads(path.read_text(encoding="utf-8"))["contacts"]
