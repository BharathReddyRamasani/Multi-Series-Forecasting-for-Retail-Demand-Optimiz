import time
from typing import Any, Optional

class TTLCache:
    def __init__(self, default_ttl: float = 300):
        self._default_ttl = default_ttl
        self._store: dict = {}
        self._expires: dict = {}

    def _key(self, *args) -> str:
        return ":".join(str(a) for a in args)

    def get(self, *args) -> Optional[Any]:
        k = self._key(*args)
        expires = self._expires.get(k)
        if expires is None or time.monotonic() > expires:
            self._store.pop(k, None)
            self._expires.pop(k, None)
            return None
        return self._store.get(k)

    def set(self, value: Any, ttl: Optional[float] = None, *args):
        k = self._key(*args)
        self._store[k] = value
        self._expires[k] = time.monotonic() + (ttl if ttl is not None else self._default_ttl)

    def clear(self):
        self._store.clear()
        self._expires.clear()
