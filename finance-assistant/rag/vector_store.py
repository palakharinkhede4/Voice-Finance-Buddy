"""
Simple TF-IDF in-memory vector store.
No external dependencies — pure Python.
"""
import math
import re
from collections import Counter
from typing import Optional


def _tokenize(text: str) -> list[str]:
    """Lowercase, remove punctuation, split into tokens."""
    text = re.sub(r"[^\w\s]", " ", text.lower())
    return [t for t in text.split() if len(t) > 1]


class SimpleVectorStore:
    """
    A minimal TF-IDF vector store for document retrieval.
    Documents are scored against a query using TF-IDF cosine similarity.
    """

    def __init__(self):
        self._docs:  list[dict]          = []   # [{id, text, metadata, tokens}]
        self._idf:   dict[str, float]    = {}
        self._built: bool                = False

    def add(self, doc_id: str, text: str, metadata: Optional[dict] = None) -> None:
        tokens = _tokenize(text)
        self._docs.append({
            "id":       doc_id,
            "text":     text,
            "metadata": metadata or {},
            "tokens":   tokens,
            "tf":       {},
        })
        self._built = False

    def build(self) -> None:
        """Compute IDF scores over all documents."""
        N = len(self._docs)
        if N == 0:
            return

        # Document frequency
        df: dict[str, int] = {}
        for doc in self._docs:
            token_set = set(doc["tokens"])
            for token in token_set:
                df[token] = df.get(token, 0) + 1
            # Compute TF for each doc
            counts = Counter(doc["tokens"])
            total  = max(len(doc["tokens"]), 1)
            doc["tf"] = {t: c / total for t, c in counts.items()}

        # IDF = log((N+1)/(df+1)) + 1  (smooth)
        self._idf = {t: math.log((N + 1) / (cnt + 1)) + 1.0 for t, cnt in df.items()}
        self._built = True

    def search(self, query: str, top_k: int = 3) -> list[dict]:
        """Return top_k most relevant documents for query."""
        if not self._built:
            self.build()

        q_tokens = _tokenize(query)
        if not q_tokens:
            return []

        # Query TF-IDF vector
        q_counts = Counter(q_tokens)
        q_total  = max(len(q_tokens), 1)
        q_vec    = {t: (c / q_total) * self._idf.get(t, 0) for t, c in q_counts.items()}
        q_norm   = math.sqrt(sum(v ** 2 for v in q_vec.values())) or 1.0

        scores = []
        for doc in self._docs:
            d_vec  = {t: doc["tf"].get(t, 0) * self._idf.get(t, 0) for t in q_vec}
            d_norm = math.sqrt(sum((doc["tf"].get(t, 0) * self._idf.get(t, 0)) ** 2
                                   for t in set(doc["tokens"]))) or 1.0
            dot    = sum(q_vec[t] * d_vec.get(t, 0) for t in q_vec)
            cosine = dot / (q_norm * d_norm)
            scores.append((cosine, doc))

        scores.sort(key=lambda x: x[0], reverse=True)
        return [{"score": s, "id": d["id"], "text": d["text"], "metadata": d["metadata"]}
                for s, d in scores[:top_k] if s > 0.01]

    def __len__(self) -> int:
        return len(self._docs)
