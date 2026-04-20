#!/usr/bin/env python3
"""Import one Serious Eats recipe into the Recipedia normalized shape."""

from __future__ import annotations

import argparse
import json
import re
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Any
from urllib.parse import urlparse


def fetch_html(url: str) -> str:
    import requests

    response = requests.get(
        url,
        timeout=25,
        headers={
            "User-Agent": "Recipedia MVP importer; stores attribution and source URL"
        },
    )
    response.raise_for_status()
    return response.text


def extract_with_recipe_scrapers(url: str) -> dict[str, Any] | None:
    try:
        from recipe_scrapers import scrape_me
    except Exception:
        return None

    try:
        scraper = scrape_me(url, wild_mode=True)
        ingredients = scraper.ingredients()
        instructions = scraper.instructions_list()
        if not instructions:
            instructions_text = scraper.instructions() or ""
            instructions = split_instructions(instructions_text)
        return normalize(
            source_url=url,
            title=scraper.title(),
            author_name=author_to_string(scraper.author()),
            ingredients=ingredients,
            instructions=instructions,
            yields=safe_call(scraper, "yields"),
            prep_time=safe_call(scraper, "prep_time"),
            cook_time=safe_call(scraper, "cook_time"),
            total_time=safe_call(scraper, "total_time"),
            image_url=safe_call(scraper, "image"),
            tags=safe_call(scraper, "category") or [],
            extraction_method="recipe-scrapers",
            extraction_confidence=0.92,
        )
    except Exception:
        return None


def extract_json_ld(url: str, html: str) -> dict[str, Any] | None:
    from bs4 import BeautifulSoup

    soup = BeautifulSoup(html, "html.parser")
    for script in soup.find_all("script", {"type": "application/ld+json"}):
        if not script.string:
            continue
        try:
            payload = json.loads(script.string)
        except json.JSONDecodeError:
            continue
        candidates = payload if isinstance(payload, list) else [payload]
        for candidate in flatten_graph(candidates):
            types = candidate.get("@type", [])
            if isinstance(types, str):
                types = [types]
            if "Recipe" not in types:
                continue
            ingredients = candidate.get("recipeIngredient") or []
            instructions = candidate.get("recipeInstructions") or []
            return normalize(
                source_url=url,
                title=candidate.get("name", "Imported Serious Eats recipe"),
                author_name=author_to_string(candidate.get("author")),
                ingredients=[str(item) for item in ingredients],
                instructions=normalize_instructions(instructions),
                yields=candidate.get("recipeYield"),
                prep_time=candidate.get("prepTime"),
                cook_time=candidate.get("cookTime"),
                total_time=candidate.get("totalTime"),
                image_url=image_to_string(candidate.get("image")),
                tags=candidate.get("recipeCategory") or [],
                extraction_method="json-ld",
                extraction_confidence=0.82,
            )
    return None


def extract_with_bs4(url: str, html: str) -> dict[str, Any]:
    from bs4 import BeautifulSoup

    soup = BeautifulSoup(html, "html.parser")
    title = text_or_default(soup.find("h1"), "Imported Serious Eats recipe")
    author = text_or_default(soup.select_one("[rel='author'], .mntl-attribution__item-name"), "Serious Eats")
    ingredients = [node.get_text(" ", strip=True) for node in soup.select("[class*='ingredient'] li, .structured-ingredients__list-item")]
    steps = [node.get_text(" ", strip=True) for node in soup.select("[class*='instruction'] li, .comp recipe__steps li, ol li")]
    return normalize(
        source_url=url,
        title=title,
        author_name=author,
        ingredients=ingredients[:80],
        instructions=steps[:40],
        yields=None,
        prep_time=None,
        cook_time=None,
        total_time=None,
        image_url=None,
        tags=[],
        extraction_method="beautiful-soup",
        extraction_confidence=0.55,
    )


def normalize(
    *,
    source_url: str,
    title: str,
    author_name: str,
    ingredients: list[str],
    instructions: list[str],
    yields: Any,
    prep_time: Any,
    cook_time: Any,
    total_time: Any,
    image_url: Any,
    tags: Any,
    extraction_method: str,
    extraction_confidence: float,
) -> dict[str, Any]:
    return {
        "source_url": source_url,
        "source_site": "Serious Eats",
        "title": clean(title),
        "author_name": clean(author_name) or "Serious Eats",
        "ingredients": [clean(item) for item in ingredients if clean(item)],
        "instructions": [clean(item) for item in instructions if clean(item)],
        "yields": yields,
        "prep_time": prep_time,
        "cook_time": cook_time,
        "total_time": total_time,
        "tags": tags if isinstance(tags, list) else [tags] if tags else [],
        "image_url": image_url,
        "extraction_method": extraction_method,
        "extraction_confidence": extraction_confidence,
        "imported_at": datetime.now(timezone.utc).isoformat(),
    }


def normalize_instructions(instructions: Any) -> list[str]:
    if isinstance(instructions, str):
        return split_instructions(instructions)
    normalized: list[str] = []
    for item in instructions or []:
        if isinstance(item, str):
            normalized.append(item)
        elif isinstance(item, dict):
            text = item.get("text") or item.get("name") or ""
            if text:
                normalized.append(str(text))
    return normalized


def flatten_graph(candidates: list[Any]) -> list[dict[str, Any]]:
    flattened: list[dict[str, Any]] = []
    for candidate in candidates:
        if not isinstance(candidate, dict):
            continue
        flattened.append(candidate)
        graph = candidate.get("@graph")
        if isinstance(graph, list):
            flattened.extend(item for item in graph if isinstance(item, dict))
    return flattened


def safe_call(obj: Any, name: str) -> Any:
    try:
        value = getattr(obj, name)()
    except Exception:
        return None
    return value


def author_to_string(author: Any) -> str:
    if not author:
        return "Serious Eats"
    if isinstance(author, str):
        return author
    if isinstance(author, list):
        return ", ".join(author_to_string(item) for item in author)
    if isinstance(author, dict):
        return str(author.get("name") or author.get("@id") or "Serious Eats")
    return str(author)


def image_to_string(image: Any) -> str | None:
    if isinstance(image, str):
        return image
    if isinstance(image, list) and image:
        return image_to_string(image[0])
    if isinstance(image, dict):
        return image.get("url")
    return None


def split_instructions(value: str) -> list[str]:
    return [part.strip() for part in re.split(r"(?:\n+|(?<=[.!?])\s+(?=[A-Z]))", value) if part.strip()]


def clean(value: Any) -> str:
    return re.sub(r"\s+", " ", str(value or "")).strip()


def text_or_default(node: Any, default: str) -> str:
    return node.get_text(" ", strip=True) if node else default


def validate_serious_eats(url: str) -> None:
    host = urlparse(url).hostname or ""
    if "seriouseats.com" not in host:
        raise ValueError("Only Serious Eats URLs are supported for the MVP importer.")


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--url", required=True)
    parser.add_argument("--stdout", action="store_true")
    parser.add_argument("--out", default="data/imports")
    args = parser.parse_args()

    validate_serious_eats(args.url)
    extracted = extract_with_recipe_scrapers(args.url)
    if extracted is None:
        html = fetch_html(args.url)
        extracted = extract_json_ld(args.url, html) or extract_with_bs4(args.url, html)

    if args.stdout:
        print(json.dumps(extracted, indent=2))
        return 0

    out_dir = Path(args.out)
    out_dir.mkdir(parents=True, exist_ok=True)
    slug = re.sub(r"[^a-z0-9]+", "-", extracted["title"].lower()).strip("-")
    out_path = out_dir / f"{slug}.json"
    out_path.write_text(json.dumps(extracted, indent=2), encoding="utf-8")
    print(out_path)
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except Exception as exc:
        print(str(exc), file=sys.stderr)
        raise SystemExit(1)

