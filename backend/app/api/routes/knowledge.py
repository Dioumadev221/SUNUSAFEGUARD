from datetime import datetime, timezone

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.api.deps import require
from app.core.permissions import has_permission
from app.db.session import get_db
from app.models import KnowledgeChunk, KnowledgeDocument, KnowledgeReview, KnowledgeVersion, User
from app.schemas import DocumentOut, DocumentStatusIn
from app.services.audit import audit
from app.services.knowledge import DOC_STATUSES, deindex_document, index_document, invalidate_cache

from rag import extract_text  # noqa: E402
from rag.extract import UnsupportedFormat  # noqa: E402

router = APIRouter(prefix="/knowledge", tags=["Knowledge API"])

MAX_UPLOAD = 10 * 1024 * 1024
# Transitions autorisées du workflow de validation (CDC §5.2).
TRANSITIONS = {
    "importe": {"a_verifier", "rejete"},
    "en_traitement": {"a_verifier"},
    "a_verifier": {"en_validation", "rejete"},
    "en_validation": {"valide", "rejete", "a_verifier"},
    "valide": {"publie", "archive"},
    "publie": {"archive", "expire", "en_validation"},
    "expire": {"en_validation", "archive"},
    "archive": {"en_validation"},
    "rejete": {"a_verifier", "archive"},
}


def _out(db: Session, doc: KnowledgeDocument) -> DocumentOut:
    out = DocumentOut.model_validate(doc)
    out.chunk_count = db.scalar(select(func.count()).select_from(KnowledgeChunk)
                                .where(KnowledgeChunk.document_id == doc.id)) or 0
    return out


@router.get("/documents", response_model=list[DocumentOut])
def list_documents(status: str | None = None, user: User = Depends(require("knowledge:read")),
                   db: Session = Depends(get_db)):
    q = select(KnowledgeDocument).order_by(KnowledgeDocument.updated_at.desc())
    if status:
        q = q.where(KnowledgeDocument.status == status)
    return [_out(db, d) for d in db.scalars(q)]


@router.get("/documents/{doc_id}")
def get_document(doc_id: int, user: User = Depends(require("knowledge:read")), db: Session = Depends(get_db)):
    doc = db.get(KnowledgeDocument, doc_id) or _404()
    reviews = db.scalars(select(KnowledgeReview).where(KnowledgeReview.document_id == doc_id)
                         .order_by(KnowledgeReview.id.desc()))
    return {
        "document": _out(db, doc),
        "content": doc.content,
        "chunks": [{"id": c.id, "position": c.position, "section": c.section, "text": c.text} for c in doc.chunks],
        "reviews": [{"decision": r.decision, "comment": r.comment, "created_at": r.created_at} for r in reviews],
        "allowed_transitions": sorted(TRANSITIONS.get(doc.status, set())),
    }


@router.post("/documents", response_model=DocumentOut, status_code=201)
async def upload_document(
    file: UploadFile = File(...),
    title: str = Form(...),
    category: str = Form(...),
    source: str = Form(""),
    language: str = Form("fr"),
    doc_type: str = Form("fiche"),
    user: User = Depends(require("knowledge:manage")),
    db: Session = Depends(get_db),
):
    data = await file.read()
    if len(data) > MAX_UPLOAD:
        raise HTTPException(413, "Fichier trop volumineux (10 Mo max)")
    try:
        text = extract_text(file.filename or "document.txt", data)
    except UnsupportedFormat as exc:
        raise HTTPException(415, str(exc))
    if len(text) < 50:
        raise HTTPException(422, "Texte extrait vide ou trop court (contrôle qualité)")
    doc = KnowledgeDocument(title=title, category=category, source=source, language=language, doc_type=doc_type,
                            filename=file.filename or "", content=text, status="a_verifier", created_by_id=user.id)
    db.add(doc)
    db.flush()
    db.add(KnowledgeVersion(document_id=doc.id, version=1, content=text, author_id=user.id))
    index_document(db, doc)
    audit(db, user, "document_upload", f"document:{doc.id}", filename=file.filename)
    db.commit()
    return _out(db, doc)


@router.patch("/documents/{doc_id}/status", response_model=DocumentOut)
def change_status(doc_id: int, data: DocumentStatusIn, user: User = Depends(require("knowledge:validate")),
                  db: Session = Depends(get_db)):
    doc = db.get(KnowledgeDocument, doc_id) or _404()
    if data.status not in DOC_STATUSES or data.status not in TRANSITIONS.get(doc.status, set()):
        raise HTTPException(409, f"Transition {doc.status} → {data.status} non autorisée")
    if data.status == "publie" and not has_permission(user.role, "knowledge:manage"):
        raise HTTPException(403, "La publication requiert un expert documentaire")
    now = datetime.now(timezone.utc)
    doc.status = data.status
    if data.status == "valide":
        doc.verified_at = now
    if data.status == "publie":
        doc.published_at = doc.published_at or now
        if doc.index_status != "indexe":
            index_document(db, doc)
    if data.status in {"archive", "expire", "rejete"}:
        deindex_document(db, doc)
    db.add(KnowledgeReview(document_id=doc.id, reviewer_id=user.id, decision=data.status, comment=data.comment))
    audit(db, user, "document_status", f"document:{doc.id}", status=data.status)
    invalidate_cache()
    db.commit()
    return _out(db, doc)


@router.post("/documents/{doc_id}/reindex", response_model=DocumentOut)
def reindex(doc_id: int, user: User = Depends(require("knowledge:manage")), db: Session = Depends(get_db)):
    doc = db.get(KnowledgeDocument, doc_id) or _404()
    index_document(db, doc)
    audit(db, user, "document_reindex", f"document:{doc.id}")
    db.commit()
    return _out(db, doc)


def _404():
    raise HTTPException(404, "Document introuvable")
