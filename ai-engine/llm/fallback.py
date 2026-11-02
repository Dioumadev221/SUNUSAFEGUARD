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
    # Danger signalé pour un proche : on s'adresse à la personne qui aide, pas à la victime.
    "urgent_third_party": {
        "fr": (
            "Ce que vit votre proche semble très grave. S'il ou elle risque de passer à l'acte ou est en danger "
            "immédiat, contactez maintenant les secours ci-dessous et, si possible, ne la laissez pas seule. "
            "Vous avez bien fait d'en parler. Prenez aussi soin de vous : vous n'avez pas à porter cela seul·e. "
            "Je suis un assistant d'information : je ne peux pas intervenir ni prévenir quelqu'un à votre place."
        ),
    },
    "refuse_injection": {
        "fr": "Je ne peux pas modifier ma façon de fonctionner, ni partager d'informations sur d'autres personnes. "
              "Je suis là pour vous écouter et vous orienter : bien-être, violences, droits, santé, structures d'aide. "
              "Dites-moi ce qui vous préoccupe, je ferai de mon mieux pour vous aider.",
        "wo": "Mënuma soppi sama sàrt yi. Maa ngi fi ngir la xibaar ak la jublu ci ndimbal yi. Naka laa la mëna dimbali ?",
    },
    "out_of_scope": {
        "fr": "Je ne suis pas en mesure de répondre à cette question, car elle sort de mon domaine. "
              "En revanche, si quelque chose vous pèse (stress, tristesse, violences, droits, santé, besoin d'un abri), "
              "je suis là pour en parler avec vous et vous orienter vers des personnes qui peuvent vous aider.",
        "wo": "Laaj boobu bokkul ci li ma xam. Mën naa la dimbali ci sa xel, ay fitna, sa yoon ak bérab yi di dimbali.",
    },
    "redirect_professional": {
        "fr": "Je comprends que vous ayez besoin d'être rassurée sur votre santé. Je ne peux pas poser de diagnostic "
              "ni conseiller de traitement : seul·e un·e professionnel·le de santé peut le faire après vous avoir "
              "rencontrée. Je peux en revanche vous aider à trouver où consulter près de chez vous.",
        "wo": "Mënuma xamle sa feebar walla may garab. Doktoor rekk a ko mën. Waaye mën naa la won fan nga mëna dem.",
    },
    "no_source": {
        "fr": "Je n'ai pas encore d'information vérifiée pour répondre précisément à votre question, et je préfère "
              "ne pas vous donner une réponse inexacte. Vous pouvez reformuler votre question avec d'autres mots, "
              "ou ouvrir l'annuaire : des professionnel·les près de chez vous pourront vous écouter et vous répondre.",
        "wo": "Gisuma xibaar bu wóor ngir tontu sa laaj. Ngir bañ a la nax, seetal annuaire bi ngir gis "
              "bérab yu am ñu xam-xam ñuy mëna tontu.",
    },
    "wolof_intro": {
        "fr": "",
        "wo": "Maa ngi lay tontu ci français ngir xibaar bi wóor. Su la soxla, laajal ndimbal ci kenn ku xam wolof.",
    },
    "fallback_intro": {
        "fr": "Voici ce qui peut vous aider, d'après nos fiches d'information :",
        "wo": "Lii la téere yi ñu wóorlu wax :",
    },
    "fallback_outro": {
        "fr": "Vous pouvez avancer à votre rythme. Si vous souhaitez en parler à quelqu'un, l'annuaire vous indique "
              "les structures proches de chez vous, et vous pouvez continuer à me poser vos questions.",
        "wo": "Xibaar yii du wuutu kàddug ku xam-xam. Mën ngaa seet annuaire bi ngir gis bérab bu la jege.",
    },
}


# Phrase d'accueil selon le besoin : la personne se sent entendue avant de recevoir l'information.
OPENINGS = {
    "ecoute_psychosociale": "Merci d'avoir pris le temps d'en parler. Ce que vous ressentez compte, et demander de "
                            "l'aide est déjà un pas important.",
    "violences_physiques_verbales": "Merci de votre confiance. Ce que vous vivez n'est pas normal et ce n'est pas "
                                    "votre faute. Vous avez le droit d'être protégée.",
    "violences_economiques": "Merci d'en parler. Être privée de ses ressources est une forme de violence, et vous "
                             "avez des droits.",
    "cyberharcelement": "Merci de votre confiance. Ce qui vous arrive en ligne n'est pas votre faute, et il existe "
                        "des moyens d'agir.",
    "hebergement_protection": "Merci de nous avoir écrit. Votre sécurité et celle de vos proches passent avant tout, "
                              "et des lieux existent pour vous accueillir.",
    "information_juridique": "C'est une très bonne question, et vous avez raison de vous renseigner sur vos droits.",
    "sante_reproductive": "Merci pour votre question. Vous avez le droit d'être informée et soignée dans le respect "
                          "et la confidentialité.",
}


ACTION_WORDS = ("vous pouvez", "pouvez", "contactez", "appelez", "consultez", "adressez", "demandez", "signalez",
                "gardez", "conservez", "parlez", "rapprochez", "faites", "il est possible", "peut être déposée",
                "accompagner", "gratuit")


def opening_message(category: str, lang: str) -> str:
    return OPENINGS.get(category, "") if lang == "fr" else ""


def template_message(key: str, lang: str) -> str:
    entry = MESSAGES[key]
    return entry.get(lang) or entry["fr"]


def extractive_answer(results: list[ScoredChunk], lang: str, max_sentences: int = 4,
                      ref_of: dict[int, int] | None = None) -> str:
    """Réponse de repli sans LLM : phrases-clés des meilleurs segments, avec références.
    `ref_of` : numéro de référence de chaque segment (voir rag.build_context)."""
    lines = [template_message("fallback_intro", lang)]
    for i, r in enumerate(results[:3], start=1):
        i = ref_of.get(r.chunk.id, i) if ref_of else i
        sentences = [s.strip() for s in r.chunk.text.replace("\n", " ").split(". ") if len(s.strip()) > 30]
        # Les phrases qui disent quoi faire passent en premier (la personne cherche des solutions).
        ranked = sorted(sentences, key=lambda s: -sum(w in s.lower() for w in ACTION_WORDS))
        keep = set(ranked[: max(1, max_sentences // 2)])
        excerpt = ". ".join(s for s in sentences if s in keep).rstrip(".") + "."
        lines.append(f"• {excerpt}")  # les sources sont listées sous la réponse
    lines.append(template_message("fallback_outro", lang))
    return "\n\n".join(lines)
