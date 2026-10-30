"""Recherche vectorielle sur les segments indexés.

Le prototype calcule la similarité cosinus en Python sur les segments chargés
depuis la base (volume de démonstration). Pour la production : déléguer à
pgvector (`ORDER BY embedding <=> :q`) ou Qdrant via la même interface.
"""
from dataclasses import dataclass, field

from embeddings.base import cosine


@dataclass
class Chunk:
    id: int
    document_id: int
    text: str
    embedding: list[float]
    metadata: dict = field(default_factory=dict)


@dataclass
class ScoredChunk:
    chunk: Chunk
    score: float


def search(query_vec: list[float], chunks: list[Chunk], top_k: int = 4, min_score: float = 0.0) -> list[ScoredChunk]:
    scored = [ScoredChunk(c, round(cosine(query_vec, c.embedding), 4)) for c in chunks]
    scored = [s for s in scored if s.score >= min_score]
    scored.sort(key=lambda s: s.score, reverse=True)
    # Diversité : au plus 2 segments par document.
    per_doc: dict[int, int] = {}
    selected = []
    for s in scored:
        if per_doc.get(s.chunk.document_id, 0) >= 2:
            continue
        per_doc[s.chunk.document_id] = per_doc.get(s.chunk.document_id, 0) + 1
        selected.append(s)
        if len(selected) >= top_k:
            break
    return selected
