"""Commandes d'administration : python -m app.cli <commande>

  seed [--no-synthetic]   charge les données de démonstration de data/
  evaluate                lance l'évaluation RAG et affiche le rapport
  reindex                 réindexe tous les documents (après changement d'embedder)
  create-admin EMAIL      crée un super administrateur (mot de passe demandé)
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
    with SessionLocal() as db:
        if cmd == "seed":
            from app.services.seed import seed_all

            print(seed_all(db, synthetic="--no-synthetic" not in args))
        elif cmd == "evaluate":
            from evaluation import evaluate_retrieval

            from app.core.config import get_settings
            from app.services.knowledge import get_pipeline
            from pathlib import Path

            s = get_settings()
            testset = json.loads((Path(s.data_dir) / "evaluation" / "rag_testset.json").read_text(encoding="utf-8"))
            print(json.dumps(evaluate_retrieval(get_pipeline(), testset, k=s.rag_top_k), ensure_ascii=False, indent=2))
        elif cmd == "reindex":
            from app.models import KnowledgeDocument
            from app.services.knowledge import index_document

            for doc in db.scalars(select(KnowledgeDocument)):
                if doc.status not in {"archive", "rejete", "expire"}:
                    print(doc.title, index_document(db, doc))
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
