"""Checks for TASK-003 diagnostic tooling, not tests of the future application."""

import io
import json
import queue
import sys
import time
import unittest
import urllib.error
from pathlib import Path
from unittest.mock import patch
from types import SimpleNamespace

sys.path.insert(0, str(Path(__file__).resolve().parents[2] / "scripts" / "probes"))
import check_integrations as checks
from codex_rpc_probe import Rpc, RpcError, final_json, mcp_disabled
from serve_map_probe import validate_receipt


class SourceChecks(unittest.TestCase):
    def test_closed_or_malformed_coordinates_are_not_valid(self):
        for coords in ({"lat": True, "lon": 37.6}, {"lat": float("nan"), "lon": 37.6},
                       {"lat": 0, "lon": 0}, None, {"lat": 55.7}):
            self.assertFalse(checks.has_coordinates(coords))
        self.assertTrue(checks.has_coordinates({"lat": 55.75, "lon": 37.6}))

    def test_only_public_source_urls(self):
        for url in ("javascript:alert(1)", "https://kudago.com.evil.test/x", "https://private:secret@kudago.com/x", None):
            self.assertFalse(checks.valid_source(url))
        self.assertTrue(checks.valid_source("https://kudago.com/msk/event/example/"))

    def test_expired_and_missing_dates_are_not_current(self):
        self.assertFalse(checks.event_is_current({"dates": [{"start": 10, "end": 20}]}, 30))
        self.assertFalse(checks.event_is_current({"dates": None}, 30))
        self.assertTrue(checks.event_is_current({"dates": [{"start": 40, "end": 50}]}, 30))

    def test_http_denial_is_not_a_pass(self):
        error = urllib.error.HTTPError("https://kudago.com/", 403, "Forbidden", {}, None)
        with patch.object(checks, "fetch_page", side_effect=error):
            result = checks.probe_kudago()
        self.assertEqual(result["status"], "failed")
        self.assertEqual(result["http_status"], 403)

    def test_empty_api_results_do_not_pass(self):
        with patch.object(checks, "fetch_page", return_value=[]):
            self.assertEqual(checks.probe_kudago()["status"], "failed")

    def test_live_sample_requires_places_and_events(self):
        place = {"id": 1, "title": "Example", "coords": {"lat": 55.75, "lon": 37.6}, "site_url": "https://kudago.com/msk/place/example/", "is_closed": False}
        event = {"id": 2, "title": "Example", "dates": [{"start": 200, "end": 300}], "place": place, "site_url": "https://kudago.com/msk/event/example/"}
        with patch.object(checks.time, "time", return_value=100), patch.object(checks, "fetch_page", side_effect=[[place], [event]]):
            self.assertEqual(checks.probe_kudago()["status"], "passed")


class ReceiptChecks(unittest.TestCase):
    def receipt(self):
        return {"device": "computer", "viewport_width": 900, "physical_phone_confirmed": False,
                "free_tariff_confirmed": True, "map_loaded": True, "pedestrian": "passed", "masstransit": "passed"}

    def test_keys_and_provider_responses_cannot_be_recorded(self):
        for key in ("api_key", "geometry", "duration", "passed", "raw_response"):
            value = {**self.receipt(), key: "must-not-be-stored"}
            with self.assertRaises(ValueError):
                validate_receipt(value)

    def test_phone_needs_physical_attestation(self):
        value = {**self.receipt(), "device": "phone"}
        self.assertFalse(validate_receipt(value)["passed"])
        value["physical_phone_confirmed"] = True
        self.assertTrue(validate_receipt(value)["passed"])

    def test_unconfirmed_map_or_tariff_never_passes(self):
        for field in ("map_loaded", "free_tariff_confirmed"):
            value = {**self.receipt(), field: False}
            self.assertFalse(validate_receipt(value)["passed"])

    def test_failed_route_never_passes(self):
        for field in ("pedestrian", "masstransit"):
            for status in ("failed", "not_run"):
                self.assertFalse(validate_receipt({**self.receipt(), field: status})["passed"])

    def test_string_true_is_not_a_boolean(self):
        with self.assertRaises(ValueError):
            validate_receipt({**self.receipt(), "map_loaded": "true"})


class RpcChecks(unittest.TestCase):
    def test_cli_summary_reflects_live_probe_without_raw_output(self):
        auth = {"status": "passed", "live_search_verified": False, "restrictions_verified": False}
        live = {"status": "passed", "search_observed": True}
        output = io.StringIO()
        with patch.object(sys, "argv", ["probe", "--codex-live"]), patch.object(checks, "probe_codex_status", return_value=auth), patch("codex_rpc_probe.probe_codex_live", return_value=live), patch("sys.stdout", output):
            code = checks.main()
        report = json.loads(output.getvalue())
        self.assertEqual(code, 2)
        self.assertTrue(report["checks"]["codex_auth"]["live_search_verified"])
        self.assertTrue(report["checks"]["codex_auth"]["restrictions_verified"])
        self.assertFalse(report["gate_passed"])

    def test_api_key_login_does_not_enable_paid_fallback(self):
        version = SimpleNamespace(returncode=0, stdout="codex-cli test", stderr="")
        login = SimpleNamespace(returncode=0, stdout="Logged in using an API key: SECRET_MARKER", stderr="")
        with patch.object(checks.shutil, "which", return_value="codex.exe"), patch.object(checks.subprocess, "run", side_effect=[version, login]):
            result = checks.probe_codex_status()
        self.assertEqual(result["status"], "needs_action")
        self.assertFalse(result["chatgpt_login"])
        self.assertNotIn("SECRET_MARKER", json.dumps(result))

    def test_no_live_query_without_chatgpt_login(self):
        with patch.object(sys, "argv", ["probe", "--codex-live"]), patch.object(checks, "probe_codex_status", return_value={"status": "needs_action"}), patch("codex_rpc_probe.probe_codex_live") as live, patch("sys.stdout", io.StringIO()):
            self.assertEqual(checks.main(), 2)
        live.assert_not_called()

    def test_disabled_connectors_not_empty_table_assumption(self):
        self.assertTrue(mcp_disabled({"mcp_servers": {}}))
        self.assertTrue(mcp_disabled({"mcp_servers": {"test": {"enabled": False}}}))
        self.assertFalse(mcp_disabled({"mcp_servers": {"test": {"url": "https://example.test"}}}))
        self.assertFalse(mcp_disabled({"mcp_servers": {"test": {"enabled": True}}}))

    def test_server_permission_requests_are_never_executed(self):
        rpc = object.__new__(Rpc)
        rpc.messages = queue.Queue()
        rpc.messages.put({"id": 9, "method": "item/commandExecution/requestApproval", "params": {}})
        rpc.messages.put({"id": 1, "result": {"ok": True}})
        rpc.denied_requests = 0
        sent = []
        rpc.send = sent.append
        self.assertEqual(rpc.receive(time.monotonic() + 1), {"id": 1, "result": {"ok": True}})
        self.assertEqual(rpc.denied_requests, 1)
        self.assertIn("error", sent[0])

    def test_closed_protocol_is_not_success(self):
        rpc = object.__new__(Rpc)
        rpc.messages = queue.Queue()
        rpc.messages.put({"probe_error": "protocol_closed"})
        with self.assertRaises(RpcError):
            rpc.receive(time.monotonic() + 1)

    def test_missing_or_invalid_structured_result(self):
        self.assertEqual(final_json([]), {})
        with self.assertRaises(ValueError):
            final_json([{"method": "item/completed", "params": {"item": {"type": "agentMessage", "text": "not JSON"}}}])


if __name__ == "__main__":
    unittest.main()
