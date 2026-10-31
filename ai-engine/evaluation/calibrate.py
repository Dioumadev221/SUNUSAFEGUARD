"""Calibrage automatique du seuil de pertinence.

Chaque modèle d'embeddings a sa propre échelle de scores. On mesure le meilleur
score obtenu pour les questions du jeu de tests qui DOIVENT trouver une source et
pour celles qui ne le doivent pas (hors périmètre), puis on place le seuil entre
les deux. Résultat indicatif : à revoir par l'équipe à chaque changement de modèle.
"""
from __future__ import annotations


def calibrate_threshold(pipeline, testset: list[dict], default: float) -> dict:
    inside, outside = [], []
    for case in testset:
        _, results = pipeline.retrieve(case["question"], case.get("lang", "fr"), top_k=1)
        top = results[0].score if results else 0.0
        (outside if case.get("expect_no_source") else inside).append(top)
    if not inside or not outside:
        return {"threshold": default, "method": "défaut", "inside_min": None, "outside_max": None}
    inside.sort()
    # On tolère que 10 % des questions « dans le périmètre » soient sous le seuil.
    low_inside = inside[max(0, int(len(inside) * 0.1) - 1)] if len(inside) >= 10 else inside[0]
    high_outside = max(outside)
    if low_inside > high_outside:
        threshold = round((low_inside + high_outside) / 2, 3)
        method = "milieu entre hors périmètre et pertinent"
    else:
        # Recouvrement : seuil qui classe correctement le plus de questions ; à égalité, le plus
        # bas (mieux vaut une source de trop, filtrée ensuite par le seuil relatif, qu'aucune).
        scores = sorted(set(inside + outside))
        cuts = [(a + b) / 2 for a, b in zip(scores, scores[1:])] or scores
        def correct(t):
            return sum(x >= t for x in inside) + sum(x < t for x in outside)
        best = max(correct(t) for t in cuts)
        threshold = round(min(t for t in cuts if correct(t) == best), 3)
        method = f"recouvrement : {best}/{len(inside) + len(outside)} questions bien classées"
    return {"threshold": threshold, "method": method, "inside_min": round(low_inside, 3),
            "outside_max": round(high_outside, 3)}
