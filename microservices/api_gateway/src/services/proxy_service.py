from urllib.parse import urljoin

import requests
from flask import Response, g, request

from src.config import Config
from src.utils.logger import get_logger


HOP_BY_HOP_HEADERS = {
    "connection",
    "keep-alive",
    "proxy-authenticate",
    "proxy-authorization",
    "te",
    "trailers",
    "transfer-encoding",
    "upgrade",
}

logger = get_logger("api_gateway.proxy")


class ProxyService:
    def __init__(self):
        self.config = Config()

    def proxy(self, target_base_url, target_path):
        url = urljoin(f"{target_base_url.rstrip('/')}/", target_path.lstrip("/"))
        json_payload = request.get_json(silent=True)
        try:
            response = requests.request(
                method=request.method,
                url=url,
                params=request.args,
                json=json_payload,
                data=None if json_payload is not None else request.get_data(),
                headers=self._build_headers(),
                timeout=self.config.upstream_timeout_seconds,
            )
        except requests.RequestException as exc:
            logger.exception("proxy_failure upstream=%s error=%s", url, exc)
            return Response(
                response='{"success": false, "error": {"code": "upstream_unavailable", "message": "Upstream service is unavailable", "details": {}}}',
                status=502,
                mimetype="application/json",
            )
        logger.info(
            "proxy_complete method=%s upstream=%s status=%s request_id=%s",
            request.method,
            url,
            response.status_code,
            getattr(g, "request_id", None),
        )
        return self._to_flask_response(response)

    def _build_headers(self):
        headers = {}
        for key, value in request.headers.items():
            if key.lower() in HOP_BY_HOP_HEADERS or key.lower() == "host":
                continue
            headers[key] = value
        if getattr(g, "request_id", None):
            headers["X-Request-ID"] = g.request_id
        return headers

    def _to_flask_response(self, upstream_response):
        headers = [
            (key, value)
            for key, value in upstream_response.headers.items()
            if key.lower() not in HOP_BY_HOP_HEADERS
        ]
        return Response(upstream_response.content, upstream_response.status_code, headers)
