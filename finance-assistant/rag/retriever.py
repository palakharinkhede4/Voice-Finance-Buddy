"""
RAG retriever: finds relevant financial knowledge for a given query
and returns it as a formatted context string.

Backend auto-selection:
  1. FAISS + sentence-transformers — dense semantic embeddings (better quality)
  2. TF-IDF SimpleVectorStore    — fallback when FAISS/ST not installed
"""
from __future__ import annotations
from logs.logger import get_logger

_log = get_logger("rag")

# Try to import FAISS store; fall back to TF-IDF
try:
    from .faiss_store import FAISSVectorStore as _StoreClass
    _BACKEND = "FAISS + sentence-transformers"
    _log.info("RAG backend: FAISS + sentence-transformers")
except ImportError:
    from .vector_store import SimpleVectorStore as _StoreClass  # type: ignore
    _BACKEND = "TF-IDF (SimpleVectorStore)"
    _log.info(f"RAG backend: {_BACKEND} (install faiss-cpu + sentence-transformers for better retrieval)")

from .ingest import build_knowledge_base

RAG_BACKEND = _BACKEND
_store = None


def _get_store():
    global _store
    if _store is None:
        use_faiss = _BACKEND.startswith("FAISS")
        _store = build_knowledge_base(use_faiss=use_faiss)
    return _store


class RAGRetriever:
    """
    Retrieves relevant financial knowledge passages for a query.
    Results are formatted for injection into agent system prompts.
    """

    def __init__(self, top_k: int = 2):
        self.top_k = top_k
        self._store = _get_store()

    def retrieve(self, query: str) -> str:
        """
        Retrieve top-k relevant passages and return as formatted string.
        Returns empty string if no relevant passages found.
        """
        results = self._store.search(query, top_k=self.top_k)
        if not results:
            return ""

        parts = []
        for r in results:
            if r["score"] > 0.05:
                parts.append(r["text"].strip())

        if not parts:
            return ""

        context = "\n\n---\n".join(parts)
        return f"\n\nRelevant financial knowledge:\n{context}\n"

    def retrieve_raw(self, query: str) -> list[dict]:
        """Return raw search results with scores."""
        return self._store.search(query, top_k=self.top_k)
