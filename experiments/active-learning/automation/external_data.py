"""Acquire an isolated native-label benchmark; never produce target training data."""
from __future__ import annotations

import hashlib
import json
from pathlib import Path
import time
import urllib.request

URL = "https://drive.usercontent.google.com/download?id=1TonLbkuKLCrpsv7HMZdnS5oTFn7FREid&export=download&confirm=t"
EXPECTED_SHA256 = "94d60d386c772bb06681336c5351673de87e57f8b6d045a29ad9b1f1f0361d0d"
CACHE = Path("/tmp/communication-check-source-audit/English_test.json")
MAX_BYTES = 100_000_000
HYPOTHESIS = "This passage states a company principle, commitment, or strategy related to environmental, social, or governance criteria."


def _digest(blob: bytes) -> str:
    return hashlib.sha256(blob).hexdigest()


def _write(path: Path, value: object) -> None:
    path.write_text(json.dumps(value, indent=2, ensure_ascii=False) + "\n")


def _download() -> tuple[bytes, str]:
    if CACHE.is_file() and CACHE.stat().st_size <= MAX_BYTES:
        blob = CACHE.read_bytes()
        if _digest(blob) == EXPECTED_SHA256:
            return blob, "verified local source-audit cache"
    chunks: list[bytes] = []
    size = 0
    started = time.monotonic()
    with urllib.request.urlopen(URL, timeout=25) as response:
        declared = response.headers.get("Content-Length")
        if declared and int(declared) > MAX_BYTES:
            raise ValueError("external_file_size_limit")
        while True:
            if time.monotonic() - started > 90:
                raise TimeoutError("external_total_download_time_limit")
            chunk = response.read(min(65_536, MAX_BYTES + 1 - size))
            if not chunk:
                break
            size += len(chunk)
            if size > MAX_BYTES:
                raise ValueError("external_file_size_limit")
            chunks.append(chunk)
    return b"".join(chunks), "public author download"


def prepare_external(run: Path) -> dict:
    """Return rows with native `label`, never a firm_delivery label.

    A caller must have frozen its protocol before invoking this function. Failure
    is a terminal source status, not a reason to silently switch datasets.
    """
    folder = Path(run) / "external" / "research-only"
    folder.mkdir(parents=True, exist_ok=False)
    source = {
        "name": "ML-Promise / author-hosted PromiseEval English test release",
        "url": URL,
        "split": "author Test/English_test.json",
        "license": "CC-BY-NC-SA-4.0",
        "trainingEligible": False,
        "commercialTrainingEligible": False,
        "targetLabelMapping": None,
        "expectedSha256": EXPECTED_SHA256,
        "status": "pending",
    }
    result = {
        "rows": [],
        "status": "pending",
        "sources": [source, {
            "name": "MailEx",
            "status": "provenance_and_availability_only",
            "revision": "57507a458ce157378300d982914d7528448a381d",
            "url": "https://drive.google.com/file/d/1a336g4-wlEwsVbXLPB9wPQnBDRE933mb/view",
            "reason": "Native event taxonomy is not target firm delivery; no MailEx prediction benchmark frozen.",
            "trainingEligible": False,
            "targetLabelMapping": None,
        }],
        "task": "published Promise Identification Yes/No",
        "hypothesis": HYPOTHESIS,
        "threshold": 0.5,
        "trainingEligible": False,
        "excludedFromTargetRanking": True,
        "exclusions": [],
    }
    try:
        blob, method = _download()
        actual_hash = _digest(blob)
        (folder / "English_test.json").write_bytes(blob)
        source.update({"sha256": actual_hash, "bytes": len(blob), "acquisition": method})
        if actual_hash != EXPECTED_SHA256:
            raise ValueError("author_release_changed_from_audited_hash")
        data = json.loads(blob)
        if not isinstance(data, list) or not data:
            raise ValueError("unsupported_root_schema")
        candidates = []
        inventory = []
        for index, row in enumerate(data):
            # Missing text prevents the predeclared content-hash selection itself.
            if not isinstance(row, dict) or not isinstance(row.get("data"), str):
                raise ValueError(f"unsupported_text_schema_at_source_index_{index}")
            source_id = f"English_test.json:{index}"
            text = row["data"]
            canonical = json.dumps([source_id, text], ensure_ascii=False, separators=(",", ":"))
            selection_hash = _digest(canonical.encode("utf-8"))
            candidates.append((selection_hash, index, source_id, text))
            inventory.append({"sourceId": source_id, "sourceIndex": index,
                              "selectionHash": selection_hash,
                              "textSha256": _digest(text.encode("utf-8"))})
        selected = sorted(candidates)[:64]  # No labels consulted in selection.
        for selection_hash, index, source_id, text in selected:
            original = data[index]
            native_label = original.get("promise_status")
            if native_label not in {"Yes", "No"} or not text.strip():
                result["exclusions"].append({"sourceId": source_id,
                    "reason": "unsupported_native_label_or_empty_text", "selectionHash": selection_hash})
                continue
            result["rows"].append({
                "id": f"mlpromise-test-{index:04d}", "sourceId": source_id,
                "sourceIndex": index, "text": text,
                "label": int(native_label == "Yes"), "nativeLabel": native_label,
                "category": "published_promise" if native_label == "Yes" else "published_no_promise",
                "source": "ML-Promise author-hosted PromiseEval English test",
                "provenance": {"license": "CC-BY-NC-SA-4.0", "sha256": actual_hash},
                "labelTask": "published_promise_identification", "trainingEligible": False,
                "sourceUrl": original.get("URL"), "pageNumber": original.get("page_number"),
                "selectionHash": selection_hash, "split": "author English test",
            })
        source.update({"status": "prepared", "sourceRows": len(data),
            "selectedRows": len(selected), "scorableNativeLabels": len(result["rows"]),
            "schema": {key: type(value).__name__ for key, value in data[0].items()},
            "nativeLabelField": "promise_status", "textField": "data",
            "nativeMapping": {"Yes": 1, "No": 0},
            "versionCaveat": "Public file has 400 rows; the ML-Promise paper reports 200 English test rows. This benchmark uses the author-hosted PromiseEval release, not a reproduction of the paper's exact split.",
            "sourceIdDefinition": "English_test.json:<zero-based source index>",
            "selectionDefinition": "First64 ascending SHA256 of compact UTF-8 JSON [sourceId, full data text], ensure_ascii=False; no label filtering or balancing.",
            "sourceLabelCounts": {value: sum(row.get("promise_status") == value for row in data) for value in ("Yes", "No")},
            "selectedLabelCounts": {value: sum(row["nativeLabel"] == value for row in result["rows"]) for value in ("Yes", "No")},
        })
        _write(folder / "source-inventory.json", inventory)
        _write(folder / "selected-rows.json", result["rows"])
        result["status"] = "prepared"
    except Exception as error:
        source.update({"status": "unavailable_or_unsupported", "errorType": type(error).__name__, "error": str(error)})
        result["rows"] = []
        result["status"] = "unavailable"
    _write(folder / "manifest.json", {key: value for key, value in result.items() if key != "rows"})
    return result
