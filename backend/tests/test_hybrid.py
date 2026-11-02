"""Recherche hybride, repli lexical, calibrage du seuil et état du moteur IA."""
from evaluation import calibrate_threshold
from pipeline import AssistantPipeline
from rag import Chunk, search

from embeddings import HashingEmbedder

DOCS = [
    "Idées suicidaires : écouter sans juger et contacter une ligne d'écoute.",
    "Violences conjugales : démarches juridiques et dépôt de plainte.",
    "Gestion du stress au travail et sommeil.",
]


class FakeSemantic:
    """Embedder sémantique factice : rapproche « mourir » de « suicidaires »."""
    name = "fake"
    VOCAB = [("mourir", "suicid", "écoute"), ("frapp", "violence", "plainte"), ("stress", "sommeil", "fatigue")]

    def embed(self, texts):
        return [[float(any(w in t.lower() for w in group)) for group in self.VOCAB] for t in texts]


class BrokenSemantic(FakeSemantic):
    def embed(self, texts):
        raise ConnectionError("Ollama arrêté")


def _chunks(sem=None):
    lex = HashingEmbedder()
    return [Chunk(i, i, t, sem.embed([t])[0] if sem else None, {"title": f"doc{i}"}, lex.embed([t])[0])
            for i, t in enumerate(DOCS)]


def test_hybrid_search_combines_scores():
    sem, lex = FakeSemantic(), HashingEmbedder()
    q = "mon amie me parle de mourir"
    res = search(sem.embed([q])[0], _chunks(sem), top_k=3, query_lex=lex.embed([q])[0])
    assert res[0].chunk.id == 0
    top = res[0]
    assert top.semantic is not None and top.lexical is not None
    assert abs(top.score - (0.75 * top.semantic + 0.25 * top.lexical)) < 1e-3


def test_semantic_finds_paraphrase_lexical_misses():
    chunks = _chunks(FakeSemantic())
    hybrid = AssistantPipeline(FakeSemantic(), lambda: chunks, min_score=0.3)
    _, res = hybrid.retrieve("mon amie me parle de mourir", "fr")
    assert hybrid.mode == "hybride" and res[0].chunk.id == 0 and res[0].score > 0.5


def test_lexical_fallback_when_embedder_fails():
    chunks = _chunks(FakeSemantic())
    p = AssistantPipeline(BrokenSemantic(), lambda: chunks, min_score=0.5, lexical_min_score=0.12)
    _, res = p.retrieve("violences conjugales plainte", "fr")
    assert p.mode == "lexical" and p.min_score == 0.12
    assert res[0].chunk.id == 1 and res[0].semantic is None
    out = p.run("Comment porter plainte pour violences conjugales ?")
    assert out.grounded and not out.used_llm


def test_hashing_embedder_means_lexical_mode():
    p = AssistantPipeline(HashingEmbedder(), lambda: _chunks())
    assert p.embedder is None and p.mode == "lexical"


def test_calibrate_threshold_separates_in_and_out_of_scope():
    chunks = _chunks(FakeSemantic())
    p = AssistantPipeline(FakeSemantic(), lambda: chunks)
    testset = [
        {"question": "mon amie veut mourir", "lang": "fr"},
        {"question": "il me frappe, porter plainte", "lang": "fr"},
        {"question": "stress et sommeil", "lang": "fr"},
        {"question": "cours du bitcoin aujourd'hui", "lang": "fr", "expect_no_source": True},
    ]
    r = calibrate_threshold(p, testset, default=0.35)
    assert r["outside_max"] < r["threshold"] < r["inside_min"]
    assert calibrate_threshold(p, testset[:2], default=0.35)["threshold"] == 0.35


def test_ai_engine_status(client, login):
    r = client.get("/api/monitoring/ai-engine", headers=login("tech@sunusafeguard.local"))
    assert r.status_code == 200, r.text
    body = r.json()
    assert body["retrieval_mode"] == "lexical" and body["embedder"] == "lexical"
    assert body["threshold"] == 0.12 and body["llm_ready"] is False
    assert client.get("/api/monitoring/ai-engine").status_code == 401
    r = client.get("/api/monitoring/ai-engine", headers=login("impact@sunusafeguard.local"))
    assert r.status_code == 403


def test_playground_reports_scores(client, login):
    r = client.post("/api/rag/playground", headers=login("expert@sunusafeguard.local"),
                    json={"question": "Comment porter plainte pour violences ?", "top_k": 3, "generate": False})
    assert r.status_code == 200, r.text
    body = r.json()
    assert body["retrieval_mode"] == "lexical"
    assert body["candidates"] and body["candidates"][0]["lexical"] is not None


def test_calibrate_threshold_with_overlap():
    class Fixed:
        """Pipeline factice : renvoie le score indiqué dans la question."""
        def retrieve(self, question, lang, top_k=None):
            from types import SimpleNamespace
            return question, [SimpleNamespace(score=float(question))]

    inside = ["0.80", "0.75", "0.70", "0.52"]
    outside = ["0.55", "0.40"]
    testset = [{"question": q} for q in inside] + [{"question": q, "expect_no_source": True} for q in outside]
    r = calibrate_threshold(Fixed(), testset, default=0.35)
    # 0.46 et 0.625 classent 5/6 questions : le plus bas est retenu.
    assert r["threshold"] == 0.46 and "5/6" in r["method"]


def test_suicidal_thoughts_of_a_relative_are_urgent():
    from safety import check_input, classify_need

    d = check_input("Mon amie me parle de mourir, que faire ?")
    assert d.action == "urgent" and d.third_party
    assert check_input("Ma soeur a des idées noires").action == "urgent"
    assert check_input("il veut se suicider").action == "urgent"
    d = check_input("je veux mourir, ma mère ne le sait pas")
    assert d.action == "urgent" and not d.third_party
    assert classify_need("Mon amie me parle de mourir") == "ecoute_psychosociale"


def test_chat_urgent_for_relative(client):
    r = client.post("/api/chat", json={"message": "Mon amie me parle de mourir, que faire ?"})
    body = r.json()
    assert body["show_emergency"] and body["safety_action"] == "urgent"
    assert "votre proche" in body["answer"]


def test_sources_are_one_per_document():
    from rag import build_context
    from rag.retriever import ScoredChunk

    chunks = [Chunk(1, 10, "a", None, {"title": "Doc A", "section": "S1"}),
              Chunk(2, 10, "b", None, {"title": "Doc A", "section": "S2"}),
              Chunk(3, 20, "c", None, {"title": "Doc B", "section": "S1"})]
    context, refs = build_context([ScoredChunk(c, 0.9) for c in chunks])
    assert [r["ref"] for r in refs] == [1, 2] and refs[0]["section"] == "S1 · S2"
    assert context.count("[1]") == 2 and "[2] Doc B" in context


def test_localhost_is_rewritten_for_windows():
    from app.core.config import Settings

    assert Settings(ollama_url="http://localhost:11434").ollama_url == "http://127.0.0.1:11434"
    assert Settings(ollama_url="http://ollama:11434").ollama_url == "http://ollama:11434"
