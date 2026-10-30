"""Ingestion, indexation et accès aux segments publiés."""
import threading

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.ai import get_ai_embedder, get_llm
from app.core.config import get_settings
from app.db.session import SessionLocal
from app.models import KnowledgeChunk, KnowledgeDocument

from rag import Chunk, chunk_text  # noqa: E402  (ai-engine, chemin ajouté par app.core.ai)
from pipeline import AssistantPipeline  # noqa: E402

# Seuls ces statuts rendent un document accessible à l'assistant (CDC §5.2).
USABLE_STATUSES = {"publie"}
DOC_STATUSES = ["importe", "en_traitement", "a_verifier", "en_validation", "valide", "publie", "expire", "archive", "rejete"]

_cache: dict = {"chunks": None}
_lock = threading.Lock()


def invalidate_cache() -> None:
    with _lock:
        _cache["chunks"] = None


def index_document(db: Session, doc: KnowledgeDocument) -> int:
    """Découpe + embeddings + indexation. Retourne le nombre de segments."""
    embedder = get_ai_embedder()
    doc.chunks.clear()
    db.flush()
    pieces = chunk_text(doc.content)
    vectors = embedder.embed([f"{doc.title}. {p['section']}. {p['text']}" for p in pieces]) if pieces else []
    for piece, vec in zip(pieces, vectors):
        doc.chunks.append(KnowledgeChunk(
            position=piece["position"], section=piece["section"], text=piece["text"],
            embedding=vec, embedder=embedder.name,
        ))
    doc.index_status = "indexe" if pieces else "vide"
    invalidate_cache()
    return len(pieces)


def deindex_document(db: Session, doc: KnowledgeDocument) -> None:
    doc.chunks.clear()
    doc.index_status = "desindexe"
    invalidate_cache()


def load_usable_chunks() -> list[Chunk]:
    with _lock:
        if _cache["chunks"] is not None:
            return _cache["chunks"]
    with SessionLocal() as db:
        rows = db.execute(
            select(KnowledgeChunk, KnowledgeDocument)
            .join(KnowledgeDocument)
            .where(KnowledgeDocument.status.in_(USABLE_STATUSES))
        ).all()
        chunks = [
            Chunk(id=c.id, document_id=d.id, text=c.text, embedding=c.embedding,
                  metadata={"title": d.title, "source": d.source, "section": c.section,
                            "category": d.category, "language": d.language, "status": d.status})
            for c, d in rows
        ]
    with _lock:
        _cache["chunks"] = chunks
    return chunks


def get_pipeline() -> AssistantPipeline:
    s = get_settings()
    return AssistantPipeline(
        embedder=get_ai_embedder(), chunk_loader=load_usable_chunks, llm=get_llm(),
        min_score=s.rag_min_score, top_k=s.rag_top_k,
    )
