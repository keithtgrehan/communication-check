"""Source acquisition contract tests with local fixtures; no network/model calls."""
import hashlib
import json
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch

import external_data as external


def fixtures(count=90):
    return [{"URL": "https://example.invalid/report.pdf", "page_number": str(i),
             "data": f"Fictional published benchmark schema fixture {i}.",
             "promise_status": "Yes" if i % 2 else "No"} for i in range(count)]


class ExternalSourceTests(unittest.TestCase):
    def prepare(self, rows, expected_hash=None):
        raw = json.dumps(rows).encode()
        temp = tempfile.TemporaryDirectory()
        self.addCleanup(temp.cleanup)
        run = Path(temp.name)
        digest = hashlib.sha256(raw).hexdigest()
        with patch.object(external, "_download", return_value=(raw, "test fixture")), \
             patch.object(external, "EXPECTED_SHA256", expected_hash or digest):
            result = external.prepare_external(run)
        return result, run, raw

    def test_preserves_raw_hash_native_labels_and_restricted_location(self):
        result, run, raw = self.prepare(fixtures())
        self.assertEqual(result["status"], "prepared")
        root = run / "external" / "research-only"
        self.assertEqual((root / "English_test.json").read_bytes(), raw)
        self.assertEqual(result["sources"][0]["sha256"], hashlib.sha256(raw).hexdigest())
        self.assertEqual(len(result["rows"]), 64)
        for row in result["rows"]:
            self.assertEqual(row["label"], int(row["nativeLabel"] == "Yes"))
            self.assertEqual(row["category"], "published_promise" if row["label"] else "published_no_promise")
            self.assertFalse(row["trainingEligible"])
            self.assertNotEqual(row["labelTask"], "firm_delivery")

    def test_selection_does_not_depend_on_labels(self):
        first, _, _ = self.prepare(fixtures())
        modified = fixtures()
        for row in modified:
            row["promise_status"] = "No" if row["promise_status"] == "Yes" else "Yes"
        second, _, _ = self.prepare(modified)
        self.assertEqual([r["sourceId"] for r in first["rows"]], [r["sourceId"] for r in second["rows"]])
        hashes = [r["selectionHash"] for r in first["rows"]]
        self.assertEqual(hashes, sorted(hashes))

    def test_unknown_label_is_excluded_without_backfill(self):
        first, _, _ = self.prepare(fixtures())
        modified = fixtures()
        index = first["rows"][0]["sourceIndex"]
        modified[index]["promise_status"] = "maybe"
        second, _, _ = self.prepare(modified)
        self.assertEqual(len(second["rows"]), 63)
        self.assertEqual(len(second["exclusions"]), 1)
        self.assertEqual(second["exclusions"][0]["sourceId"], f"English_test.json:{index}")

    def test_changed_release_hash_fails_closed_preserving_download(self):
        result, run, raw = self.prepare(fixtures(), expected_hash="0" * 64)
        self.assertEqual(result["status"], "unavailable")
        self.assertEqual(result["rows"], [])
        self.assertEqual((run / "external" / "research-only" / "English_test.json").read_bytes(), raw)

    def test_unsupported_text_schema_is_not_skipped_for_convenience(self):
        data = fixtures()
        data[5].pop("data")
        result, _, _ = self.prepare(data)
        self.assertEqual(result["status"], "unavailable")
        self.assertEqual(result["rows"], [])

    def test_download_failure_is_terminal_without_training_or_fallback(self):
        with tempfile.TemporaryDirectory() as tmp, \
             patch.object(external, "_download", side_effect=TimeoutError("fixture timeout")):
            result = external.prepare_external(Path(tmp))
        self.assertEqual(result["status"], "unavailable")
        self.assertEqual(result["rows"], [])
        self.assertFalse(result["trainingEligible"])
        self.assertTrue(result["excludedFromTargetRanking"])


if __name__ == "__main__":
    unittest.main()
