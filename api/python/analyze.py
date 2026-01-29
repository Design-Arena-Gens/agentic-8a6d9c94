"""
Serverless text analysis endpoint deployed via Vercel.

Accepts a JSON body with a `text` field and responds with basic analytics:
word counts, estimated reading time and a lightweight sentiment heuristic.
"""

from __future__ import annotations

import json
import math
import re
from http import HTTPStatus
from http.server import BaseHTTPRequestHandler
from typing import Any, Dict, Mapping

POSITIVE_WORDS = {
    "excellent",
    "great",
    "good",
    "positive",
    "love",
    "fantastic",
    "happy",
    "efficient",
    "improve",
    "success",
    "win",
    "helpful",
    "clear",
    "confident",
}

NEGATIVE_WORDS = {
    "bad",
    "poor",
    "negative",
    "hate",
    "terrible",
    "sad",
    "confusing",
    "angry",
    "frustrated",
    "issue",
    "problem",
    "fail",
    "loss",
    "unclear",
}


def _tokenize(text: str) -> list[str]:
    """Return lowercase word tokens excluding punctuation."""
    return re.findall(r"\b[\w'-]+\b", text.lower())


def _sentence_count(text: str) -> int:
    """Estimate sentence count using punctuation boundaries."""
    sentences = re.split(r"[.!?]+", text)
    return max(1, len([s for s in sentences if s.strip()]))


def _sentiment_score(tokens: list[str]) -> float:
    """Calculate a naive sentiment score in the range [-1.0, 1.0]."""
    if not tokens:
        return 0.0

    positives = sum(token in POSITIVE_WORDS for token in tokens)
    negatives = sum(token in NEGATIVE_WORDS for token in tokens)
    total = positives + negatives
    if total == 0:
        return 0.0

    score = (positives - negatives) / total
    # Clamp to [-1, 1] for safety
    return max(-1.0, min(1.0, score))


def _sentiment_label(score: float) -> str:
    """Convert the score into a friendly label."""
    if score >= 0.35:
        return "positive"
    if score <= -0.35:
        return "negative"
    return "neutral"


def _analyze(text: str) -> Dict[str, Any]:
    tokens = _tokenize(text)
    words = len(tokens)
    characters = len(text)
    unique_words = len(set(tokens))
    sentences = _sentence_count(text)

    words_per_minute = 200  # average reading speed
    reading_minutes = words / words_per_minute
    estimated_read_time = max(0.2, reading_minutes)

    sentiment = _sentiment_score(tokens)

    return {
        "characters": characters,
        "words": words,
        "uniqueWords": unique_words,
        "sentences": sentences,
        "estimatedReadMinutes": round(estimated_read_time, 2),
        "sentimentScore": round(sentiment, 2),
        "sentimentLabel": _sentiment_label(sentiment),
        "keywords": sorted(
            {token for token in tokens if len(token) > 5},
            key=lambda token: (-tokens.count(token), token),
        )[:8],
}


def _json_response(
    handler: BaseHTTPRequestHandler,
    payload: Mapping[str, Any],
    *,
    status: HTTPStatus = HTTPStatus.OK,
) -> None:
    body = json.dumps(payload).encode("utf-8")
    handler.send_response(int(status))
    handler.send_header("Content-Type", "application/json; charset=utf-8")
    handler.send_header("Content-Length", str(len(body)))
    handler.end_headers()
    handler.wfile.write(body)


class Handler(BaseHTTPRequestHandler):
    """
    HTTP entry point for the Vercel Python runtime.

    The runtime instantiates this class for every request and delegates to the
    appropriate `do_*` method based on the HTTP verb.
    """

    server_version = "TextInsight/1.0"

    def log_message(self, format: str, *args: Any) -> None:  # noqa: A003
        """Silence default stdout logging to avoid cluttering function logs."""
        return

    def do_OPTIONS(self) -> None:  # noqa: N802
        self.send_response(HTTPStatus.NO_CONTENT)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()

    def do_POST(self) -> None:  # noqa: N802
        if self.headers.get("content-type", "").split(";")[0].strip() != "application/json":
            _json_response(
                self,
                {"error": "Content-Type must be application/json."},
                status=HTTPStatus.UNSUPPORTED_MEDIA_TYPE,
            )
            return

        try:
            length = int(self.headers.get("content-length", "0"))
        except ValueError:
            length = 0

        raw_body = self.rfile.read(length) if length > 0 else b"{}"
        try:
            payload = json.loads(raw_body.decode("utf-8"))
        except json.JSONDecodeError:
            _json_response(
                self,
                {"error": "Request body must be valid JSON."},
                status=HTTPStatus.BAD_REQUEST,
            )
            return

        text = payload.get("text")
        if not isinstance(text, str) or not text.strip():
            _json_response(
                self,
                {"error": "The `text` field is required and must be a non-empty string."},
                status=HTTPStatus.BAD_REQUEST,
            )
            return

        analysis = _analyze(text.strip())
        _json_response(self, {"result": analysis})
