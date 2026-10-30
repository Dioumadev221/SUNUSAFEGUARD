"""Réponses de repli et messages déterministes (bilingues fr / wo).

⚠️ Les formulations wolof sont des propositions à faire valider par des
spécialistes avant toute ouverture au public (CDC §9.4).
"""
from rag.retriever import ScoredChunk

MESSAGES = {
    "urgent": {
        "fr": (
            "Ce que vous vivez semble très grave et votre sécurité compte avant tout. "
            "Si vous êtes en danger immédiat, contactez maintenant les secours ci-dessous. "
            "Si vous le pouvez, rapprochez-vous d'une personne de confiance ou d'un lieu sûr. "
            "Vous n'êtes pas responsable de ce qui vous arrive, et vous n'êtes pas seule. "
            "Je suis un assistant d'information : je ne peux pas intervenir ni prévenir quelqu'un à votre place."
        ),
        "wo": (
            "Li ngay dund dafa metti lool te sa kaaraange moo jëkk. "
            "Su fekkee ne yaa ngi ci musiba leegi, woolal ndimbal yi nekk ci suuf. "
            "Jéemal a jegesi nit ku ngay wóolu walla bérab bu wóor. "
            "Du sa tooñ, te yaa ngi wéet. Man maa ngi lay may xibaar rekk, mënuma la wallu ci sa place."
        ),
    },
    "refuse_injection": {
        "fr": "Je ne peux pas modifier mes règles de fonctionnement. Je suis là pour vous informer et vous orienter "
              "sur le bien-être, vos droits et les structures d'aide. Comment puis-je vous aider ?",
        "wo": "Mënuma soppi sama sàrt yi. Maa ngi fi ngir la xibaar ak la jublu ci ndimbal yi. Naka laa la mëna dimbali ?",
    },
    "out_of_scope": {
        "fr": "Cette question sort de mon domaine. Je peux vous aider sur le bien-être psychosocial, les violences, "
              "vos droits, la santé reproductive et les structures d'aide au Sénégal.",
        "wo": "Laaj boobu bokkul ci li ma xam. Mën naa la dimbali ci sa xel, ay fitna, sa yoon ak bérab yi di dimbali.",
    },
    "redirect_professional": {
        "fr": "Je ne peux pas poser de diagnostic ni conseiller de traitement : seul·e un·e professionnel·le de santé "
              "peut le faire après vous avoir rencontrée. Je peux en revanche vous indiquer où consulter.",
        "wo": "Mënuma xamle sa feebar walla may garab. Doktoor rekk a ko mën. Waaye mën naa la won fan nga mëna dem.",
    },
    "no_source": {
        "fr": "Je n'ai pas trouvé d'information validée pour répondre précisément à votre question. "
              "Plutôt que de risquer une réponse inexacte, je vous propose de consulter l'annuaire des structures "
              "d'aide, où des professionnel·les pourront vous répondre.",
        "wo": "Gisuma xibaar bu wóor ngir tontu sa laaj. Ngir bañ a la nax, seetal annuaire bi ngir gis "
              "bérab yu am ñu xam-xam ñuy mëna tontu.",
    },
    "fallback_intro": {
        "fr": "Voici ce que disent les ressources validées de la plateforme :",
        "wo": "Lii la téere yi ñu wóorlu wax :",
    },
    "fallback_outro": {
        "fr": "Ces informations ne remplacent pas l'avis d'un·e professionnel·le. Vous pouvez consulter "
              "l'annuaire pour trouver une structure proche de vous.",
        "wo": "Xibaar yii du wuutu kàddug ku xam-xam. Mën ngaa seet annuaire bi ngir gis bérab bu la jege.",
    },
}


def template_message(key: str, lang: str) -> str:
    entry = MESSAGES[key]
    return entry.get(lang) or entry["fr"]


def extractive_answer(results: list[ScoredChunk], lang: str, max_sentences: int = 4) -> str:
    """Réponse de repli sans LLM : phrases-clés des meilleurs segments, avec références."""
    lines = [template_message("fallback_intro", lang)]
    for i, r in enumerate(results[:3], start=1):
        sentences = [s.strip() for s in r.chunk.text.replace("\n", " ").split(". ") if len(s.strip()) > 30]
        excerpt = ". ".join(sentences[: max(1, max_sentences // 2)]).rstrip(".") + "."
        lines.append(f"• {excerpt} [{i}]")
    lines.append(template_message("fallback_outro", lang))
    return "\n\n".join(lines)
