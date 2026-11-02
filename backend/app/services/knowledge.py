"""Ingestion, indexation et accès aux segments publiés."""
import threading

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.db.session import SessionLocal
from app.models import KnowledgeChunk, KnowledgeDocument

from embeddings import HashingEmbedder  # noqa: E402  (ai-engine, chemin ajouté par app.core.ai)
from rag import Chunk, chunk_text  # noqa: E402
from pipeline import AssistantPipeline  # noqa: E402

_lexical = HashingEmbedder()

# Seuls ces statuts rendent un document accessible à l'assistant (CDC §5.2).
USABLE_STATUSES = {"publie"}
DOC_STATUSES = ["importe", "en_traitement", "a_verifier", "en_validation", "valide", "publie", "expire", "archive", "rejete"]

_cache: dict = {"chunks": None, "lexical": {}}
_lock = threading.Lock()


def invalidate_cache() -> None:
    with _lock:
        _cache["chunks"] = None


def _chunk_input(title: str, section: str, text: str) -> str:
    return f"{title}. {section}. {text}"


_ACTIVE = object()


def index_document(db: Session, doc: KnowledgeDocument, embedder=_ACTIVE) -> int:
    """Découpe + embeddings sémantiques (modèle actif par défaut) + indexation."""
    from app.services.ai_state import state

    if embedder is _ACTIVE:
        embedder = state.semantic
    doc.chunks.clear()
    db.flush()
    pieces = chunk_text(doc.content)
    inputs = [_chunk_input(doc.title, p["section"], p["text"]) for p in pieces]
    vectors: list = [[] for _ in pieces]
    name = "lexical"
    if embedder is not None and pieces:
        try:
            vectors, name = embedder.embed(inputs), embedder.name
        except Exception:  # noqa: BLE001 — modèle indisponible : index lexical, réindexé plus tard
            pass
    for piece, vec in zip(pieces, vectors):
        doc.chunks.append(KnowledgeChunk(
            position=piece["position"], section=piece["section"], text=piece["text"],
            embedding=vec, embedder=name,
        ))
    doc.index_status = "indexe" if pieces else "vide"
    invalidate_cache()
    return len(pieces)


def reindex_outdated(db: Session, embedder) -> int:
    """Réindexe les documents dont les segments n'ont pas été calculés avec `embedder`."""
    if embedder is None:
        return 0
    count = 0
    for doc in db.scalars(select(KnowledgeDocument).where(KnowledgeDocument.status.notin_(["archive", "rejete", "expire"]))):
        if any(c.embedder != embedder.name for c in doc.chunks):
            index_document(db, doc, embedder)
            count += 1
    db.commit()
    return count


def deindex_document(db: Session, doc: KnowledgeDocument) -> None:
    doc.chunks.clear()
    doc.index_status = "desindexe"
    invalidate_cache()


def load_usable_chunks() -> list[Chunk]:
    from app.services.ai_state import state

    with _lock:
        if _cache["chunks"] is not None:
            return _cache["chunks"]
    chunks = load_chunks(state.embedder_name)
    with _lock:
        _cache["chunks"] = chunks
    return chunks


def load_chunks(active: str) -> list[Chunk]:
    """Segments publiés, avec les vecteurs sémantiques du modèle `active` seulement."""
    with SessionLocal() as db:
        rows = db.execute(
            select(KnowledgeChunk, KnowledgeDocument)
            .join(KnowledgeDocument)
            .where(KnowledgeDocument.status.in_(USABLE_STATUSES))
        ).all()
        chunks = []
        for c, d in rows:
            # Vecteur lexical recalculé localement (rapide) et mis en cache.
            lex = _cache["lexical"].get(c.id)
            if lex is None:
                lex = _cache["lexical"][c.id] = _lexical.embed([_chunk_input(d.title, c.section, c.text)])[0]
            chunks.append(Chunk(
                id=c.id, document_id=d.id, text=c.text, lexical=lex,
                # Un vecteur calculé avec un autre modèle n'est pas comparable : ignoré.
                embedding=c.embedding if c.embedder == active and c.embedding else None,
                metadata={"title": d.title, "source": d.source, "section": c.section,
                          "category": d.category, "language": d.language, "status": d.status}))
    return chunks


def get_pipeline() -> AssistantPipeline:
    from app.services.ai_state import state

    s = get_settings()
    llm = state.llm if state.llm_ready() else None
    return AssistantPipeline(
        embedder=state.semantic, chunk_loader=load_usable_chunks, llm=llm,
        min_score=state.threshold if state.threshold is not None else (s.rag_min_score or 0.35),
        lexical_min_score=s.rag_lexical_min_score, top_k=s.rag_top_k,
    )
