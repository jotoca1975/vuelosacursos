"""Sincroniza el catálogo público de centros desde el directorio oficial dhamma.org.

Se ejecuta en GitHub Actions al principio de cada mes. No borra registros: así, si
el directorio cambia temporalmente de formato, el último catálogo válido sigue útil.
"""
from __future__ import annotations

import os
import re
import sys
import unicodedata
from dataclasses import dataclass

import requests
from bs4 import BeautifulSoup

DIRECTORY_URL = "https://www.dhamma.org/en/locations/mobile_directory"
MINIMUM_EXPECTED_CENTRES = 150


@dataclass(frozen=True)
class Centre:
    name: str
    country: str


def text(value: str) -> str:
    return " ".join(value.split())


def search_name(value: str) -> str:
    return "".join(
        char for char in unicodedata.normalize("NFD", value.lower())
        if unicodedata.category(char) != "Mn"
    )


def is_country_heading(value: str) -> bool:
    return bool(re.fullmatch(r".+?\s+\d+\s+Centre\(s\)(?:,\s*\d+\s+Non-Centre\(s\))?", value))


def country_from_heading(value: str) -> str:
    return re.sub(r"\s+\d+\s+Centre\(s\).*$", "", value).strip()


def parse_directory(html: str) -> list[Centre]:
    """Extract official centre names and their enclosing country heading.

    The mobile directory is deliberately used because it has server-rendered text.
    The checks below make the task fail safely if dhamma.org changes its layout.
    """
    soup = BeautifulSoup(html, "html.parser")
    country = None
    in_non_centre_section = False
    centres: set[Centre] = set()

    for node in soup.find_all(["h1", "h2", "h3", "h4", "h5", "h6", "p", "li", "a"]):
        value = text(node.get_text(" ", strip=True))
        if not value:
            continue
        if is_country_heading(value):
            country = country_from_heading(value)
            in_non_centre_section = False
            continue
        if value.startswith("Non-Centres") or "Non-centre Vipassana" in value:
            in_non_centre_section = True
            continue
        if not country or in_non_centre_section or " · " not in value:
            continue

        _, name = (part.strip() for part in value.rsplit(" · ", 1))
        # Entries in the public directory are followed by course/website/map links.
        # A centre name may begin with Dhamma or use a local official designation.
        if len(name) < 3 or name in {"Courses", "Website", "Map", "Directions"}:
            continue
        if "Vipassana" not in name and not name.startswith("Dhamma") and not name.startswith("Dhamm"):
            continue
        centres.add(Centre(name=name, country=country))

    return sorted(centres, key=lambda centre: (centre.country, centre.name))


def fetch_centres() -> list[Centre]:
    response = requests.get(DIRECTORY_URL, headers={"User-Agent": "Vuelos-a-Cursos catalogue sync/1.0"}, timeout=45)
    response.raise_for_status()
    centres = parse_directory(response.text)
    if len(centres) < MINIMUM_EXPECTED_CENTRES:
        raise RuntimeError(f"Solo se han reconocido {len(centres)} centros; se aborta para no sustituir un catálogo válido.")
    return centres


def upload(centres: list[Centre]) -> None:
    url, key = os.environ.get("SUPABASE_URL"), os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
    if not url or not key:
        raise RuntimeError("Faltan SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en los secretos de GitHub.")
    rows = [{"name": item.name, "country": item.country, "search_name": search_name(f"{item.name} {item.country}"), "source_url": DIRECTORY_URL} for item in centres]
    response = requests.post(f"{url.rstrip('/')}/rest/v1/centres?on_conflict=name,country", headers={"apikey": key, "Authorization": f"Bearer {key}", "Content-Type": "application/json", "Prefer": "resolution=merge-duplicates,return=minimal"}, json=rows, timeout=45)
    response.raise_for_status()


if __name__ == "__main__":
    try:
        found = fetch_centres()
        upload(found)
        print(f"Catálogo sincronizado: {len(found)} centros oficiales.")
    except Exception as error:
        print(f"Error de sincronización: {error}", file=sys.stderr)
        raise SystemExit(1)
