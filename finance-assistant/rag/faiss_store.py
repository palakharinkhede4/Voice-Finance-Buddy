"""
FAISS + Sentence Transformers vector store.

Replaces the TF-IDF SimpleVectorStore with dense semantic embeddings.
Uses 'all-MiniLM-L6-v2' (~22 MB) for embeddings and FAISS IndexFlatIP
(inner-product cosine) for retrieval.

Auto-detects availability at import time; caller catches ImportError and
falls back to SimpleVectorStore.
"""
from __future__ import annotations

import time
from typing import Optional

import numpy as np
from logs.logger import get_logger

_log = get_logger("faiss_store")

# These two imports will raise ImportError if packages are absent —
# the retriever catches this and falls back gracefully.
from sentence_transformers import SentenceTransformer   # type: ignore
import faiss                                             # type: ignore


_DEFAULT_MODEL = "all-MiniLM-L6-v2"


class FAISSVectorStore:
    """
    Dense semantic vector store backed by FAISS.

    Usage:
        store = FAISSVectorStore()
        store.add("id1", "text about FD rates")
        store.build()
        results = store.search("fixed deposit interest", top_k=3)
    """

    def __init__(self, model_name: str = _DEFAULT_MODEL):
        _log.info(f"Loading SentenceTransformer: {model_name} …")
        t0 = time.perf_counter()
        self._encoder  = SentenceTransformer(model_name)
        self._dim      = self._encoder.get_sentence_embedding_dimension()
        ms = (time.perf_counter() - t0) * 1_000
        _log.info(f"SentenceTransformer loaded | dim={self._dim} | {ms:.0f}ms")

        self._index:     Optional[faiss.Index] = None
        self._docs:      list[dict]            = []  # [{id, text, metadata}]
        self._built:     bool                  = False

    def add(self, doc_id: str, text: str, metadata: Optional[dict] = None) -> None:
        self._docs.append({"id": doc_id, "text": text, "metadata": metadata or {}})
        self._built = False

    def build(self) -> None:
        if not self._docs:
            return

        t0 = time.perf_counter()
        texts      = [d["text"] for d in self._docs]
        embeddings = self._encoder.encode(
            texts,
            convert_to_numpy=True,
            normalize_embeddings=True,   # L2-normalise → inner product = cosine
            show_progress_bar=False,
        ).astype(np.float32)

        self._index = faiss.IndexFlatIP(self._dim)   # cosine via normalised IP
        self._index.add(embeddings)
        self._built = True

        ms = (time.perf_counter() - t0) * 1_000
        _log.info(f"FAISS index built | docs={len(self._docs)} | {ms:.0f}ms")

    def search(self, query: str, top_k: int = 3) -> list[dict]:
        if not self._built:
            self.build()
        if self._index is None or self._index.ntotal == 0:
            return []

        q_emb = self._encoder.encode(
            [query],
            convert_to_numpy=True,
            normalize_embeddings=True,
            show_progress_bar=False,
        ).astype(np.float32)

        k    = min(top_k, self._index.ntotal)
        D, I = self._index.search(q_emb, k)

        results = []
        for score, idx in zip(D[0], I[0]):
            if idx < 0:
                continue
            results.append({
                "score":    float(score),
                "id":       self._docs[idx]["id"],
                "text":     self._docs[idx]["text"],
                "metadata": self._docs[idx]["metadata"],
            })
        return results

    def __len__(self) -> int:
        return len(self._docs)
