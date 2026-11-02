"""Extraction de texte des documents importés (PDF, DOCX, TXT, MD) — CDC §5.2."""
import io
import re


class UnsupportedFormat(ValueError):
    pass


def extract_text(filename: str, data: bytes) -> str:
    ext = filename.rsplit(".", 1)[-1].lower() if "." in filename else ""
    if ext in {"txt", "md"}:
        text = data.decode("utf-8", errors="replace")
    elif ext == "pdf":
        from pypdf import PdfReader

        reader = PdfReader(io.BytesIO(data))
        text = "\n\n".join(page.extract_text() or "" for page in reader.pages)
    elif ext == "docx":
        import docx

        document = docx.Document(io.BytesIO(data))
        text = "\n\n".join(p.text for p in document.paragraphs)
    else:
        raise UnsupportedFormat(f"Format non pris en charge : .{ext} (PDF, DOCX, TXT, MD acceptés)")
    return clean_text(text)


def clean_text(text: str) -> str:
    text = text.replace("\r\n", "\n").replace(" ", " ")
    text = re.sub(r"[ \t]+", " ", text)
    text = re.sub(r"\n{3,}", "\n\n", text)
    return text.strip()
