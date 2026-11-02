"""Évaluation du RAG sur un jeu de tests documenté (CDC §6.2, §15.2).

Jeu de tests : `data/evaluation/rag_testset.json` — chaque cas indique la
question, la langue, et les mots-clés attendus dans le titre des documents
pertinents (ou `expect_no_source`). Les métriques calculées ici sont
techniques (rappel@k, MRR, taux de repli) ; la fidélité des réponses générées
doit être évaluée séparément, avec annotation humaine.
"""
from __future__ import annotations


def evaluate_retrieval(pipeline, testset: list[dict], k: int = 4) -> dict:
    hits, rr, cases = 0, 0.0, []
    for case in testset:
        lang = case.get("lang", "fr")
        _, results = pipeline.retrieve(case["question"], lang, top_k=k)
        relevant_results = [r for r in results if r.score >= pipeline.min_score]
        titles = [(r.chunk.metadata.get("title") or "").lower() for r in relevant_results]
        expected = [e.lower() for e in case.get("expected_titles", [])]
        rank = next((i + 1 for i, t in enumerate(titles) if any(e in t for e in expected)), None)
        if case.get("expect_no_source"):
            ok = not relevant_results or relevant_results[0].score < pipeline.min_score + 0.05
        else:
            ok = rank is not None
            rr += 1 / rank if rank else 0
        hits += ok
        cases.append({"id": case["id"], "ok": ok, "rank": rank,
                      "top_score": results[0].score if results else 0.0, "top_title": titles[0] if titles else None})
    n = len(testset) or 1
    # MRR calculé sur les seules questions qui attendent une source.
    n_inside = sum(not c.get("expect_no_source") for c in testset) or 1
    return {"n": len(testset), "recall_at_k": round(hits / n, 3), "mrr": round(rr / n_inside, 3), "k": k, "cases": cases}
