"""Découpage en segments (chunks) respectant les paragraphes et les titres."""
import re


def chunk_text(text: str, max_chars: int = 900, overlap: int = 150) -> list[dict]:
    """Retourne une liste de {"text", "section", "position"}.

    Les titres Markdown (#, ##) sont conservés comme `section` pour afficher des
    références lisibles ; les paragraphes sont regroupés jusqu'à `max_chars`.
    """
    chunks: list[dict] = []
    section = ""
    buffer = ""

    def flush():
        nonlocal buffer
        if buffer.strip():
            chunks.append({"text": buffer.strip(), "section": section, "position": len(chunks)})
        buffer = buffer[-overlap:] if overlap and len(buffer) > max_chars else ""

    for block in re.split(r"\n\s*\n", text):
        block = block.strip()
        if not block:
            continue
        heading = re.match(r"^#{1,6}\s+(.*)", block)
        if heading and "\n" not in block:
            flush()
            buffer = ""
            section = heading.group(1).strip()
            continue
        if len(buffer) + len(block) + 2 > max_chars:
            flush()
        while len(block) > max_chars:
            cut = block.rfind(". ", 0, max_chars)
            cut = cut + 1 if cut > max_chars // 2 else max_chars
            buffer += block[:cut]
            flush()
            block = block[cut:].strip()
        buffer = f"{buffer}\n\n{block}" if buffer else block
    flush()
    return chunks
