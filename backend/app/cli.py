"""Commandes d'administration : python -m app.cli <commande>

  seed [--no-synthetic]   charge les données de démonstration de data/
  evaluate                lance l'évaluation RAG et affiche le rapport
  reindex                 réindexe tous les documents (après changement d'embedder)
  ai-status               détecte Ollama, télécharge les modèles manquants et affiche l'état IA
  purge                   applique la politique de conservation (aussi lancée toutes les 24 h)
  create-admin EMAIL      crée un super administrateur (mot de passe demandé)
  import-orgs FICHIER [--hide-demo]   ajoute/met à jour des structures réelles (ex. data/seed/organizations_reelles.json)
"""
import getpass
import json
import sys

from sqlalchemy import select

from app.core import ai  # noqa: F401
from app.db.session import SessionLocal


def main(argv: list[str]) -> int:
    if not argv:
        print(__doc__)
        return 1
    cmd, args = argv[0], argv[1:]
    from app.db.session import Base, engine

    Base.metadata.create_all(engine)  # sans effet si les tables existent déjà
    if cmd in {"evaluate", "reindex", "ai-status"}:
        from app.models import KnowledgeDocument

        with SessionLocal() as db:
            if db.scalar(select(KnowledgeDocument.id).limit(1)) is None:
                print("Base documentaire vide : lancez d'abord  python -m app.cli seed")
                return 1
    with SessionLocal() as db:
        if cmd == "seed":
            from app.services.seed import seed_all

            print(seed_all(db, synthetic="--no-synthetic" not in args))
        elif cmd == "evaluate":
            from evaluation import evaluate_retrieval

            from app.services.ai_state import initialize, state

            initialize(background=False)
            print(f"Recherche {'hybride' if state.semantic else 'lexicale'} · {state.embedder_name} · seuil {state.threshold}")

            from app.core.config import get_settings
            from app.services.knowledge import get_pipeline
            from pathlib import Path

            s = get_settings()
            testset = json.loads((Path(s.data_dir) / "evaluation" / "rag_testset.json").read_text(encoding="utf-8"))
            print(json.dumps(evaluate_retrieval(get_pipeline(), testset, k=s.rag_top_k), ensure_ascii=False, indent=2))
        elif cmd == "reindex":
            from app.models import KnowledgeDocument
            from app.services.ai_state import initialize
            from app.services.knowledge import index_document

            initialize(background=False)

            for doc in db.scalars(select(KnowledgeDocument)):
                if doc.status not in {"archive", "rejete", "expire"}:
                    print(doc.title, index_document(db, doc))
            db.commit()
        elif cmd == "ai-status":
            from app.services.ai_state import initialize, state

            initialize(background=False)
            print(json.dumps(state.snapshot(), ensure_ascii=False, indent=2))
        elif cmd == "purge":
            from app.services.retention import purge

            print(purge(db))
        elif cmd == "import-orgs":
            # Ajoute ou met à jour des structures (par nom) depuis un fichier JSON ; --hide-demo retire
            # de l'annuaire public les exemples « (DÉMO) » sans les supprimer (l'historique reste).
            from pathlib import Path

            from app.models import Organization

            items = json.loads(Path(args[0]).read_text(encoding="utf-8"))
            for item in items:
                item = {k: v for k, v in item.items() if not k.startswith("_")}
                org = db.scalar(select(Organization).where(Organization.name == item["name"]))
                if org is None:
                    db.add(Organization(**item))
                    print("ajoutée :", item["name"])
                else:
                    for key, value in item.items():
                        setattr(org, key, value)
                    print("mise à jour :", item["name"])
            if "--hide-demo" in args:
                for org in db.scalars(select(Organization).where(Organization.name.contains("DÉMO"))):
                    org.validated = False
                    print("masquée :", org.name)
            db.commit()
        elif cmd == "create-admin":
            from app.core.security import hash_password
            from app.models import User

            email = args[0].lower()
            password = getpass.getpass("Mot de passe (12 caractères min.) : ")
            if len(password) < 12:
                print("Mot de passe trop court")
                return 1
            db.add(User(email=email, full_name="Super administrateur", role="super_admin",
                        password_hash=hash_password(password), mfa_enabled=True))
            db.commit()
            print("Compte créé :", email)
        else:
            print(__doc__)
            return 1
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
