import json
from pathlib import Path

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import require
from app.core.config import get_settings
from app.db.session import get_db
from app.models import RAGEvaluation, User
from app.schemas import PlaygroundIn
from app.services.ai_state import state
from app.services.audit import audit
from app.services.knowledge import get_pipeline
from app.services.metrics import knowledge_gaps

from evaluation import evaluate_retrieval  # noqa: E402
from multilingual import detect_language  # noqa: E402
from rag import build_context  # noqa: E402

router = APIRouter(prefix="/rag", tags=["RAG API"])


@router.post("/playground")
def playground(data: PlaygroundIn, user: User = Depends(require("rag:playground"))):
    """Banc d'essai (CDC §5.3) : langue, requête étendue, segments, scores, contexte, réponse."""
    pipeline = get_pipeline()
    lang_info = detect_language(data.question)
    lang = lang_info["lang"] if lang_info["lang"] != "unknown" else "fr"
    query, results = pipeline.retrieve(data.question, lang, top_k=data.top_k, min_score=data.min_score)
    context, refs = build_context([r for r in results if r.score >= pipeline.min_score])
    response = pipeline.run(data.question, debug=True) if data.generate else None
    return {
        "language": lang_info,
        "expanded_query": query,
        "embedder": state.embedder_name,
        "retrieval_mode": pipeline.mode,
        "min_score_threshold": pipeline.min_score,
        "candidates": [
            {"chunk_id": r.chunk.id, "document_id": r.chunk.document_id, "title": r.chunk.metadata.get("title"),
             "section": r.chunk.metadata.get("section"), "status": r.chunk.metadata.get("status"),
             "score": r.score, "semantic": r.semantic, "lexical": r.lexical, "above_threshold": r.score >= pipeline.min_score, "text": r.chunk.text}
            for r in results
        ],
        "context": context,
        "references": refs,
        "response": None if response is None else {
            "answer": response.answer, "used_llm": response.used_llm, "grounded": response.grounded,
            "safety_action": response.safety_action, "safety_reasons": response.safety_reasons,
            "category": response.category, "timings_ms": response.timings_ms,
        },
        "warning": "Un score de similarité ne prouve pas, à lui seul, la pertinence ou la justesse d'une réponse.",
    }


@router.post("/evaluate")
def run_evaluation(user: User = Depends(require("rag:playground")), db: Session = Depends(get_db)):
    s = get_settings()
    testset = json.loads((Path(s.data_dir) / "evaluation" / "rag_testset.json").read_text(encoding="utf-8"))
    report = evaluate_retrieval(get_pipeline(), testset, k=s.rag_top_k)
    config = {"embedder": state.embedder_name, "top_k": s.rag_top_k, "min_score": state.threshold,
              "llm": s.ollama_model if state.llm_ready() else None}
    db.add(RAGEvaluation(config=config, recall_at_k=report["recall_at_k"], mrr=report["mrr"], results=report))
    audit(db, user, "rag_evaluation", recall=report["recall_at_k"])
    db.commit()
    return {"config": config, **report}


@router.get("/evaluations")
def evaluations(user: User = Depends(require("rag:playground")), db: Session = Depends(get_db)):
    rows = db.scalars(select(RAGEvaluation).order_by(RAGEvaluation.id.desc()).limit(20))
    return [{"id": r.id, "created_at": r.created_at, "config": r.config, "recall_at_k": r.recall_at_k, "mrr": r.mrr}
            for r in rows]


@router.get("/gaps")
def gaps(days: int = 30, user: User = Depends(require("knowledge:read")), db: Session = Depends(get_db)):
    return knowledge_gaps(db, days)
