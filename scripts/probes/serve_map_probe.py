"""Serve only the TASK-003 diagnostics, not the application or the repository."""

from __future__ import annotations

import argparse
import ipaddress
import json
import socket
import threading
import urllib.error
from datetime import datetime, timezone
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlparse

from check_otp_routes import request as request_otp_route


WEB_ROOT = Path(__file__).resolve().parent / "web"
ROUTES = {"/": ("index.html", "text/html"), "/probe.js": ("probe.js", "text/javascript"), "/probe.css": ("probe.css", "text/css"), "/osm/": ("osm.html", "text/html")}
BOOLEAN_FIELDS = ("physical_phone_confirmed", "free_tariff_confirmed", "map_loaded")


def validate_receipt(value):
    if not isinstance(value, dict):
        raise ValueError("receipt_must_be_object")
    fields = {"device", "viewport_width", "pedestrian", "masstransit", *BOOLEAN_FIELDS}
    if set(value) != fields:
        raise ValueError("unexpected_receipt_fields")
    if value["device"] not in ("computer", "phone"):
        raise ValueError("invalid_device")
    width = value["viewport_width"]
    if isinstance(width, bool) or not isinstance(width, int) or not 1 <= width <= 20000:
        raise ValueError("invalid_viewport")
    if any(type(value[field]) is not bool for field in BOOLEAN_FIELDS):
        raise ValueError("invalid_boolean")
    if any(value[field] not in ("passed", "failed", "not_run") for field in ("pedestrian", "masstransit")):
        raise ValueError("invalid_result")
    result = dict(value)
    result["received_at_utc"] = datetime.now(timezone.utc).isoformat()
    result["passed"] = bool(value["map_loaded"] and value["free_tariff_confirmed"]
                            and value["pedestrian"] == "passed" and value["masstransit"] == "passed"
                            and (value["device"] == "computer" or value["physical_phone_confirmed"]))
    return result


def local_addresses():
    result = {"127.0.0.1", "localhost"}
    try:
        for info in socket.getaddrinfo(socket.gethostname(), None, family=socket.AF_INET):
            address = ipaddress.ip_address(info[4][0])
            if address.is_private and not address.is_link_local:
                result.add(str(address))
    except OSError:
        pass
    return result


class Handler(BaseHTTPRequestHandler):
    def log_message(self, format, *args):
        # No query strings, keys, client IPs, or headers in logs.
        pass

    def allowed(self):
        host = self.headers.get("Host", "")
        if host not in self.server.allowed_hosts:
            return False
        origin = self.headers.get("Origin")
        return not origin or origin == "http://" + host

    def respond(self, status, body, content_type="application/json"):
        if isinstance(body, dict):
            body = json.dumps(body, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", content_type + "; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-store")
        self.send_header("X-Content-Type-Options", "nosniff")
        self.send_header("Referrer-Policy", "strict-origin-when-cross-origin")
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self):
        if not self.allowed():
            return self.respond(403, {"error": "origin_or_host_denied"})
        path = urlparse(self.path).path
        if path == "/health":
            return self.respond(200, {"ok": True, "task": "TASK-003", "application": False})
        if path == "/api/receipts":
            with self.server.receipt_lock:
                receipts = list(self.server.receipts)
            return self.respond(200, {"receipts": receipts, "gate_passed": False})
        if path == "/api/osm-routes":
            try:
                routes = [request_otp_route(False, True), request_otp_route(True, True)]
            except (OSError, ValueError, KeyError, urllib.error.URLError) as exc:
                return self.respond(503, {"error": "local_router_unavailable", "type": type(exc).__name__})
            return self.respond(200, {"routes": routes, "source": "local_opentripplanner_probe",
                                      "complete_moscow_transit": False})
        if path not in ROUTES:
            return self.respond(404, {"error": "not_found"})
        filename, content_type = ROUTES[path]
        self.respond(200, (WEB_ROOT / filename).read_bytes(), content_type)

    def do_POST(self):
        if not self.allowed():
            return self.respond(403, {"error": "origin_or_host_denied"})
        if urlparse(self.path).path != "/api/receipts":
            return self.respond(404, {"error": "not_found"})
        try:
            length = int(self.headers.get("Content-Length", "0"))
            if not 0 < length <= 4096:
                return self.respond(413, {"error": "invalid_size"})
            receipt = validate_receipt(json.loads(self.rfile.read(length)))
        except (ValueError, TypeError):
            return self.respond(400, {"error": "invalid_receipt"})
        with self.server.receipt_lock:
            self.server.receipts.append(receipt)
            self.server.receipts[:] = self.server.receipts[-20:]
        self.respond(200, {"receipt": receipt, "gate_passed": False})


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--lan", action="store_true", help="Explicitly bind on the home network")
    parser.add_argument("--port", type=int, default=8765)
    args = parser.parse_args()
    if not 1024 <= args.port <= 65535:
        parser.error("port must be between 1024 and 65535")
    addresses = local_addresses() if args.lan else {"127.0.0.1", "localhost"}
    server = ThreadingHTTPServer(("0.0.0.0" if args.lan else "127.0.0.1", args.port), Handler)
    server.allowed_hosts = {f"{address}:{args.port}" for address in addresses}
    server.receipts = []
    server.receipt_lock = threading.Lock()
    print(f"TASK-003 diagnostics only. Local: http://127.0.0.1:{args.port}/", flush=True)
    if args.lan:
        for address in sorted(addresses - {"127.0.0.1", "localhost"}):
            print(f"Home network: http://{address}:{args.port}/", flush=True)
    print("No API key, route response or geometry is persisted. Receipts remain in memory. Ctrl+C stops the server.", flush=True)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()


if __name__ == "__main__":
    main()
