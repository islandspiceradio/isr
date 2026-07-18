#!/usr/bin/env python3
"""
Pulls episode file lists from Internet Archive items (old-time-radio
collections like OTRR_Dragnet_Singles) and writes .m3u playlists of
direct-stream mp3 URLs into media/archive/ for the Liquidsoap
scheduler to play from directly - no downloading required, Liquidsoap
streams straight from archive.org's servers.

Usage:
    python3 fetch_archive_playlist.py

Reads show identifiers from config/archive_shows.json, writes one
.m3u file per show into media/archive/. Re-run periodically (cron,
or a scheduled GitHub Action) to pick up newly added episodes -
Archive.org collections get episodes added over time.

To add more shows: find the item on archive.org (e.g.
archive.org/details/OTRR_Dragnet_Singles), the "identifier" is the
last part of that URL. Add it to config/archive_shows.json.
Other well-known public-domain crime/detective OTR collections worth
checking: OTRR_Gunsmoke_Singles, OTRR_The_Shadow_Singles,
OTRR_Suspense_Singles - verify each is public domain / freely
distributable before adding, some archive.org uploads are only
licensed for personal streaming, not redistribution.
"""

import json
import os
import urllib.request

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
CONFIG_PATH = os.path.join(SCRIPT_DIR, "..", "config", "archive_shows.json")
OUTPUT_DIR = os.path.join(SCRIPT_DIR, "..", "media", "archive")

ARCHIVE_METADATA_URL = "https://archive.org/metadata/{identifier}"
ARCHIVE_DOWNLOAD_URL = "https://archive.org/download/{identifier}/{filename}"


def fetch_metadata(identifier):
    url = ARCHIVE_METADATA_URL.format(identifier=identifier)
    req = urllib.request.Request(url, headers={"User-Agent": "station-scheduler/1.0"})
    with urllib.request.urlopen(req, timeout=30) as resp:
        return json.loads(resp.read().decode("utf-8"))


def build_urls(identifier):
    data = fetch_metadata(identifier)
    files = data.get("files", [])
    urls = []
    for f in files:
        name = f.get("name", "")
        fmt = f.get("format", "")
        if name.lower().endswith(".mp3") and "mp3" in fmt.lower():
            urls.append(ARCHIVE_DOWNLOAD_URL.format(identifier=identifier, filename=name))
    return urls


def write_m3u(path, urls):
    with open(path, "w") as f:
        f.write("#EXTM3U\n")
        for u in urls:
            f.write(u + "\n")


def main():
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    with open(CONFIG_PATH) as f:
        shows = json.load(f)

    for show in shows:
        identifier = show["identifier"]
        label = show.get("label", identifier)
        print(f"Fetching {label} ({identifier})...")
        try:
            urls = build_urls(identifier)
        except Exception as e:
            print(f"  failed: {e}")
            continue
        if not urls:
            print(f"  no mp3 files found for {identifier}")
            continue
        out_path = os.path.join(OUTPUT_DIR, f"{identifier}.m3u")
        write_m3u(out_path, urls)
        print(f"  wrote {len(urls)} episodes -> {out_path}")


if __name__ == "__main__":
    main()
