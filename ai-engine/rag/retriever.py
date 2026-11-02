"""Recherche documentaire hybride : similarité sémantique (embeddings) + lexicale.

Score final = 0,75 × sémantique + 0,25 × lexical lorsque des embeddings sémantiques
sont disponibles ; lexical seul sinon (mode dégradé, sans modèle). La combinaison
rattrape à la fois les reformulations (sémantique) et les termes précis comme un
numéro de loi (lexical).

Le prototype calcule les similarités en Python (volume de démonstration). Pour un
grand corpus : déléguer la partie sémantique à pgvector ou Qdrant.
"""
from dataclasses import dataclass, field

from embeddings.base import cosine

SEMANTIC_WEIGHT = 0.75


@dataclass
class Chunk:
    id: int
    document_id: int
    text: str
    embedding: list[float] | None          # sémantique (None si indisponible)
    metadata: dict = field(default_factory=dict)
    lexical: list[float] | None = None     # vecteur lexical (hashing)


@dataclass
class ScoredChunk:
    chunk: Chunk
    score: float
    semantic: float | None = None
    lexical: float | None = None


def search(query_vec: list[float] | None, chunks: list[Chunk], top_k: int = 4, min_score: float = 0.0,
           query_lex: list[float] | None = None) -> list[ScoredChunk]:
    scored = []
    for c in chunks:
        sem = cosine(query_vec, c.embedding) if query_vec is not None and c.embedding else None
        lex = cosine(query_lex, c.lexical) if query_lex is not None and c.lexical else None
        if sem is not None and lex is not None:
            score = SEMANTIC_WEIGHT * sem + (1 - SEMANTIC_WEIGHT) * lex
        else:
            score = sem if sem is not None else (lex or 0.0)
        scored.append(ScoredChunk(c, round(score, 4), None if sem is None else round(sem, 4),
                                  None if lex is None else round(lex, 4)))
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
