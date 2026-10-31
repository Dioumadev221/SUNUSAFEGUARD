from .retriever import ScoredChunk


def build_context(results: list[ScoredChunk], max_chars: int = 3500) -> tuple[str, list[dict]]:
    """Construit le contexte transmis au LLM et la liste des références numérotées.

    Une référence = un document : deux extraits du même document portent le même numéro,
    pour que la liste des sources ne contienne pas de doublon.
    """
    parts, refs, used = [], [], 0
    by_doc: dict[int, dict] = {}
    for r in results:
        meta = r.chunk.metadata
        ref = by_doc.get(r.chunk.document_id)
        n = ref["ref"] if ref else len(refs) + 1
        block = f"[{n}] {meta.get('title', 'Document')} — {meta.get('section') or 'extrait'}\n{r.chunk.text}"
        if used + len(block) > max_chars:
            break
        parts.append(block)
        used += len(block)
        if ref is None:
            ref = by_doc[r.chunk.document_id] = {
                "ref": n,
                "document_id": r.chunk.document_id,
                "chunk_id": r.chunk.id,
                "chunk_ids": [],
                "title": meta.get("title"),
                "source": meta.get("source"),
                "section": meta.get("section"),
                "score": r.score,
            }
            refs.append(ref)
        else:
            sections = ref["section"].split(" · ") if ref["section"] else []
            if meta.get("section") and meta["section"] not in sections:
                ref["section"] = " · ".join(sections + [meta["section"]])
        ref["chunk_ids"].append(r.chunk.id)
    return "\n\n".join(parts), refs
