from urllib.parse import urljoin

import requests

from src.config import Config
from src.utils.exceptions import UpstreamServiceError
from src.utils.logger import get_logger


class ServiceClient:
    def __init__(self, service_name, base_url):
        self.service_name = service_name
        self.base_url = base_url
        self.config = Config()
        self.logger = get_logger(f"booking_service.client.{service_name}")

    def get(self, path, headers=None, params=None):
        return self._request("GET", path, headers=headers, params=params)

    def _request(self, method, path, headers=None, params=None, json=None):
        url = urljoin(f"{self.base_url.rstrip('/')}/", path.lstrip("/"))
        last_exception = None
        for attempt in range(1, self.config.upstream_max_retries + 1):
            try:
                response = requests.request(
                    method=method,
                    url=url,
                    headers=headers or {},
                    params=params,
                    json=json,
                    timeout=self.config.upstream_timeout_seconds,
                )
                if response.status_code >= 500 and attempt < self.config.upstream_max_retries:
                    self.logger.warning(
                        "upstream_retry service=%s method=%s url=%s attempt=%s status=%s",
                        self.service_name,
                        method,
                        url,
                        attempt,
                        response.status_code,
                    )
                    continue
                return self._handle_response(response)
            except requests.RequestException as exc:
                last_exception = exc
                if attempt >= self.config.upstream_max_retries:
                    break
                self.logger.warning(
                    "upstream_request_exception_retry service=%s method=%s url=%s attempt=%s error=%s",
                    self.service_name,
                    method,
                    url,
                    attempt,
                    exc,
                )
        raise UpstreamServiceError(
            f"{self.service_name} is unavailable",
            self.service_name,
            502,
            {"error": str(last_exception) if last_exception else "request_failed"},
        )

    def _handle_response(self, response):
        try:
            payload = response.json()
        except ValueError:
            payload = {}
        if response.status_code >= 400:
            message = payload.get("error", {}).get("message") or payload.get("message") or (
                f"{self.service_name} request failed"
            )
            details = payload.get("error", {}).get("details") or {}
            raise UpstreamServiceError(
                message,
                self.service_name,
                response.status_code,
                details,
            )
        if isinstance(payload, dict) and "data" in payload:
            return payload["data"]
        return payload
