from .retriever import ScoredChunk


def build_context(results: list[ScoredChunk], max_chars: int = 3500) -> tuple[str, list[dict]]:
    """Construit le contexte transmis au LLM et la liste des références numérotées."""
    parts, refs, used = [], [], 0
    for i, r in enumerate(results, start=1):
        meta = r.chunk.metadata
        block = f"[{i}] {meta.get('title', 'Document')} — {meta.get('section') or 'extrait'}\n{r.chunk.text}"
        if used + len(block) > max_chars:
            break
        parts.append(block)
        used += len(block)
        refs.append({
            "ref": i,
            "document_id": r.chunk.document_id,
            "chunk_id": r.chunk.id,
            "title": meta.get("title"),
            "source": meta.get("source"),
            "section": meta.get("section"),
            "score": r.score,
        })
    return "\n\n".join(parts), refs
