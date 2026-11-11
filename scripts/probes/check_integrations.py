"""TASK-003 probes. Standard library only; never prints credentials or raw model output."""

from __future__ import annotations

import argparse
import json
import os
import shutil
import subprocess
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from datetime import datetime, timezone
from pathlib import Path


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def has_coordinates(value: object) -> bool:
    if not isinstance(value, dict):
        return False
    lat, lon = value.get("lat"), value.get("lon")
    return (
        isinstance(lat, (int, float)) and not isinstance(lat, bool)
        and isinstance(lon, (int, float)) and not isinstance(lon, bool)
        and 55.0 <= lat <= 57.0 and 36.0 <= lon <= 39.0
    )


def valid_source(value: object) -> bool:
    if not isinstance(value, str):
        return False
    parsed = urllib.parse.urlparse(value)
    return (parsed.scheme in ("http", "https") and parsed.hostname in ("kudago.com", "www.kudago.com")
            and parsed.username is None and parsed.password is None)


def event_is_current(event: dict, timestamp: float) -> bool:
    for interval in event.get("dates") or []:
        if not isinstance(interval, dict):
            continue
        start, end = interval.get("start"), interval.get("end")
        if isinstance(end, (int, float)) and end >= timestamp:
            return True
        if isinstance(start, (int, float)) and start >= timestamp:
            return True
    return False


def fetch_page(resource: str, extra: dict | None = None) -> list:
    parameters = {"location": "msk", "page_size": 10, "lang": "ru", **(extra or {})}
    url = "https://kudago.com/public-api/v1.4/" + resource + "/?" + urllib.parse.urlencode(parameters)
    request = urllib.request.Request(url, headers={"User-Agent": "WeekendSearch-IntegrationProbe/0.1", "Accept": "application/json"})
    with urllib.request.urlopen(request, timeout=25) as response:
        payload = json.loads(response.read(2_000_001))
    if not isinstance(payload, dict) or not isinstance(payload.get("results"), list):
        raise ValueError("unexpected_api_shape")
    return payload["results"]


def probe_kudago() -> dict:
    stamp = time.time()
    try:
        places = fetch_page("places", {"fields": "id,title,coords,site_url,is_closed,location"})
        events = fetch_page("events", {
            "actual_since": int(stamp), "actual_until": int(stamp + 30 * 86400),
            "fields": "id,title,dates,place,site_url", "expand": "place",
        })
        good_places = [p for p in places if isinstance(p, dict) and p.get("id") and p.get("title")
                       and has_coordinates(p.get("coords")) and valid_source(p.get("site_url"))
                       and p.get("is_closed") is False]
        good_events = [e for e in events if isinstance(e, dict) and e.get("id") and e.get("title")
                       and valid_source(e.get("site_url")) and event_is_current(e, stamp)
                       and isinstance(e.get("place"), dict) and has_coordinates(e["place"].get("coords"))]
        return {
            "status": "passed" if good_places and good_events else "failed",
            "sample_places": len(places), "valid_places": len(good_places),
            "sample_events": len(events), "valid_current_events_with_coordinates": len(good_events),
            "scope": "live API sample, not the application importer",
        }
    except urllib.error.HTTPError as exc:
        code = exc.code
        exc.close()
        return {"status": "failed", "reason": "http_error", "http_status": code}
    except (urllib.error.URLError, TimeoutError, OSError) as exc:
        return {"status": "failed", "reason": "network_or_environment", "error_type": type(exc).__name__}
    except (ValueError, KeyError, TypeError) as exc:
        return {"status": "failed", "reason": "invalid_source_response", "error_type": type(exc).__name__}


def probe_codex_status() -> dict:
    binary = shutil.which("codex")
    if not binary:
        return {"status": "needs_action", "reason": "codex_not_installed"}
    try:
        version = subprocess.run([binary, "--version"], capture_output=True, text=True, timeout=15)
        login = subprocess.run([binary, "login", "status"], capture_output=True, text=True, timeout=15)
        message = (login.stdout + login.stderr).lower()
        logged_in = login.returncode == 0 and "chatgpt" in message and "not logged" not in message
        return {
            "status": "passed" if logged_in else "needs_action",
            "cli_version": version.stdout.strip() if version.returncode == 0 else "unknown",
            "chatgpt_login": logged_in,
            "reason": "chatgpt_login_detected" if logged_in else "run_codex_login_with_chatgpt",
            "live_search_verified": False,
            "restrictions_verified": False,
        }
    except (OSError, subprocess.TimeoutExpired) as exc:
        return {"status": "failed", "reason": "cli_unavailable", "error_type": type(exc).__name__}


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--kudago", action="store_true", help="Make live read-only KudaGo requests")
    parser.add_argument("--codex", action="store_true", help="Inspect CLI login without printing account details")
    parser.add_argument("--codex-live", action="store_true", help="Run the App Server probe using the signed-in ChatGPT allowance")
    parser.add_argument("--output", type=Path, help="Optional local JSON report; must be inside .local/")
    args = parser.parse_args()
    output = None
    if args.output:
        local_root = Path(__file__).resolve().parents[2] / ".local"
        output = args.output.resolve()
        if not output.is_relative_to(local_root.resolve()):
            parser.error("--output must be inside this project's .local/ directory")
    report = {"checked_at_utc": now_iso(), "task": "TASK-003", "checks": {}}
    if args.kudago:
        report["checks"]["kudago"] = probe_kudago()
    if args.codex or args.codex_live:
        auth = probe_codex_status()
        report["checks"]["codex_auth"] = auth
        if args.codex_live:
            if auth["status"] != "passed":
                report["checks"]["codex_live"] = {"status": "needs_action", "reason": "chatgpt_login_required"}
            else:
                from codex_rpc_probe import probe_codex_live
                report["checks"]["codex_live"] = probe_codex_live()
                live = report["checks"]["codex_live"]
                auth["live_search_verified"] = bool(live.get("search_observed"))
                auth["restrictions_verified"] = live.get("status") == "passed"
    report["checks"]["maps"] = {
        "status": "needs_action", "reason": "run_browser_probe_on_computer_and_physical_phone",
        "key_in_named_environment_variable": bool(os.environ.get("YANDEX_MAPS_API_KEY")),
    }
    report["gate_passed"] = False  # A CLI check cannot attest a physical phone or free tariff.
    encoded = json.dumps(report, ensure_ascii=False, indent=2)
    if output:
        output.parent.mkdir(parents=True, exist_ok=True)
        output.write_text(encoded + "\n", encoding="utf-8")
    print(encoded)
    return 0 if report["checks"] and all(c["status"] == "passed" for c in report["checks"].values()) else 2


if __name__ == "__main__":
    sys.stdout.reconfigure(encoding="utf-8")
    raise SystemExit(main())
