# Island Spice Radio

A browser-based radio site. No Liquidsoap, no Icecast, no server —
the listener's own browser assembles and plays the rotation.

Live at: https://islandspiceradio.github.io/isr/site/

## How it works

By default, the homepage hero shows a looping video reel
(`media/videos/`). Nothing is playing audio yet.

When someone clicks **Listen live**:

1. The hero reel pauses.
2. `site/player.js` picks a track based on the time of day and
   plays it through a hidden `<audio>` element.
3. Since that audio has no video of its own, a looping **vingle**
   clip (`video/vingle/`) plays in the hero's place instead — a
   different clip for sponsor breaks vs. regular programming.
4. A "Now playing" label shows what's on.
5. When the track ends, the next one plays automatically. Clicking
   **Stop** ends playback and brings the hero reel back.

**Scheduling logic** (all in `site/player.js`):
- **Daypart** — which folder to pull music/drops from — is based on
  the visitor's local clock: `am` (6am–12pm), `day` (12pm–8pm),
  `late` (8pm–6am).
- **Sponsor break** — minutes 55–59 of every clock hour play sponsor
  spots, in the exact order listed in `playlist.json`, then regular
  programming resumes at the top of the hour.
- Outside the sponsor window, each track is randomly picked: ~10%
  chance of a news item, ~10% chance of a station drop, otherwise
  music from the current daypart's folder.

Because GitHub Pages can't list folder contents on its own,
`playlist.json` at the repo root is a manifest of every actual
filename in each folder. **If you add or remove audio/vingle files,
you have to update `playlist.json` to match** — the player only
knows about what's listed there.

## Folder structure

```
site/
  index.html          The page itself - hero, menu, listen button
  player.js             All the JS: hero reel, sound toggle, menu,
                         and the audio/vingle scheduling engine
  styles.css             Currently unused - all CSS is inline in
                         index.html. Safe to delete or to move the
                         <style> block into later.
playlist.json           Manifest of every playable file. Update this
                         whenever you add/remove files in media/block/
                         or video/vingle/.
media/
  videos/                The 3 fixed hero reel clips (not dayparted)
  block/
    am/, music/, l8/      Daypart music pools (am / day / late)
    drop/am/, drop/lunch/, drop/pm/    Daypart station drops
    news/                  News items
    sponsor/                Sponsor spots - order comes from
                            playlist.json's "sponsor_order", not
                            folder order
video/
  vingle/                 The 2 clips shown during audio-only
                          playback: COMMERCIAL BREAK.mp4 (sponsor
                          breaks) and DJ MACKINTHEDARK.mp4
                          (everything else)
  am/, day/, l8/, 10at10/  Not wired into the site yet. Reserved for
                            a future dayparted-hero version - ask if
                            you want that built.
videos/
  loop/                   Not wired into the site yet (ambient loop
                          clips: Beach, Earth Running).
config/
  archive_shows.json      Internet Archive show identifiers, used by
                          scripts/fetch_archive_playlist.py. Not
                          currently wired into the JS player.
scripts/
  fetch_archive_playlist.py   Generates .m3u playlists from
                              archive.org. Leftover from the
                              Liquidsoap version - only useful again
                              if old-time-radio archive shows get
                              added to the JS player.
```

### Leftover files safe to delete

These were part of the old Liquidsoap/Icecast setup and aren't used
by the current site:
- `radio_scheduler.js` (repo root) — early draft, superseded by
  `site/player.js`
- `media/radio/scheduler.js` — empty, same reason

## Adding or changing content

**Music, drops, news:** drop files into the right `media/block/`
subfolder, then add the filename to the matching array in
`playlist.json`.

**Sponsors:** drop the file into `media/block/sponsor/`, then add
the filename to `playlist.json`'s `"sponsor_order"` array in the
exact position you want it to play.

**Vingle clips:** these are hardcoded to two specific files
(`COMMERCIAL BREAK.mp4` and `DJ MACKINTHEDARK.mp4`, referenced in
`playlist.json`'s `"vingle"` object). Replace those two files in
`video/vingle/` directly, or update both the files and the
`playlist.json` entries if you rename them.

**Hero reel:** the 3 clips are hardcoded in `site/index.html`
(inside `<div class="reel">`). Swap the `src` attributes to change
them.

## Known placeholders

`COMMERCIAL BREAK.mp4`, `DJ MACKINTHEDARK.mp4`, and
`FRAIDY CATS SAMPLE.mp3` are currently 2-byte stub files — they need
real content before Listen Live is actually listenable end to end.
