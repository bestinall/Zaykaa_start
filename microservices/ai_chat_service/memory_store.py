from threading import Lock
from collections import defaultdict


class MemoryStore:
    """In-memory conversation history keyed by session_id. Keeps last 20 turns."""

    MAX_TURNS = 20

    def __init__(self):
        self._store = defaultdict(list)
        self._lock = Lock()

    def get(self, session_id: str) -> list:
        with self._lock:
            return list(self._store.get(session_id, []))

    def append(self, session_id: str, role: str, content: str):
        if role not in ("user", "model"):
            return
        with self._lock:
            self._store[session_id].append({"role": role, "content": content})
            # trim to last N turns
            if len(self._store[session_id]) > self.MAX_TURNS * 2:
                self._store[session_id] = self._store[session_id][-self.MAX_TURNS * 2:]

    def clear(self, session_id: str):
        with self._lock:
            self._store.pop(session_id, None)