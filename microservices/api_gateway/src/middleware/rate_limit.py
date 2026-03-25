import threading
import time
from collections import defaultdict, deque

from flask import request

from src.config import Config
from src.utils.responses import error_response


class InMemoryRateLimiter:
    def __init__(self):
        config = Config()
        self.window_seconds = config.rate_limit_window_seconds
        self.max_requests = config.rate_limit_max_requests
        self.requests = defaultdict(deque)
        self.lock = threading.Lock()

    def check_limit(self):
        if request.path == "/health" or request.method == "OPTIONS":
            return None

        client_ip = request.headers.get("X-Forwarded-For", request.remote_addr or "unknown")
        now = time.time()
        with self.lock:
            bucket = self.requests[client_ip]
            while bucket and now - bucket[0] > self.window_seconds:
                bucket.popleft()
            if len(bucket) >= self.max_requests:
                return error_response(
                    "Rate limit exceeded. Please retry later.",
                    429,
                    "rate_limit_exceeded",
                    {
                        "window_seconds": self.window_seconds,
                        "max_requests": self.max_requests,
                    },
                )
            bucket.append(now)
        return None
