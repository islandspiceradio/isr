# Station Scheduler

Automated radio scheduler built on Liquidsoap + Icecast. Runs a
55-minute programming block (music, drops, and old-time-radio
archive shows) followed by a 5-minute sponsor break, on repeat,
every hour - with a live override for Mixxx/mic whenever you want
to take the mic.

## Folder structure

```
config/
  archive_shows.json       Internet Archive show identifiers to pull
scripts/
  fetch_archive_playlist.py  Generates media/archive/*.m3u from Archive.org
media/
  block/                  Your 55-min music + drops/IDs mix (add files here)
  sponsor/                5-min commercial/sponsor spots (add files here)
  fallback/               Single safety file - prevents dead air if
                          everything else is empty (add one file here,
                          named please_stand_by.mp3)
  archive/                Generated .m3u playlists - do not edit by hand,
                          re-run the fetch script instead
radio_scheduler.liq       The Liquidsoap config that runs it all
```

## First-time setup

1. Install Liquidsoap and Icecast on your server/host.
2. Drop real audio files into `media/block/` and `media/sponsor/`.
   A single placeholder file in `media/fallback/` named
   `please_stand_by.mp3` covers you until those folders have content.
3. Run the archive fetch script to pull old-time-radio episodes:
   ```
   python3 scripts/fetch_archive_playlist.py
   ```
   This streams directly from archive.org - nothing gets downloaded
   or stored on your server, it just builds a playlist of direct URLs.
4. Open `radio_scheduler.liq` and replace:
   - `CHANGE_ME_LIVE_PASSWORD` - password Mixxx uses to connect live
   - `CHANGE_ME_ICECAST_SOURCE_PASSWORD` - must match your Icecast
     source password
   - `host`/`port`/`mount` under the Icecast output if you're using a
     hosted Icecast provider instead of self-hosting
5. Run it: `liquidsoap radio_scheduler.liq`

## Adding more archive shows

Find the show on archive.org (e.g. `archive.org/details/OTRR_Dragnet_Singles`)
- the identifier is the last part of that URL. Add an entry to
`config/archive_shows.json`:

```json
{ "identifier": "OTRR_Gunsmoke_Singles", "label": "Gunsmoke" }
```

Then re-run `fetch_archive_playlist.py`, and add the new .m3u to
`radio_scheduler.liq` the same way `OTRR_Dragnet_Singles.m3u` is
wired in. Double-check each collection is public domain / freely
redistributable before adding it - not everything on archive.org
is licensed the same way.

## Keeping episode lists fresh

Archive.org collections get new episodes added over time. Re-run
`fetch_archive_playlist.py` periodically (a weekly cron job, or a
scheduled GitHub Action) to pick up anything new.
