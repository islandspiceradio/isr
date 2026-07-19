// =========================================================
// ISLAND SPICE RADIO - CLIENT-SIDE PLAYER
// Runs entirely in the listener's browser (no Icecast/
// Liquidsoap server). Reads playlist.json for the real file
// lists (GitHub Pages can't list folders at runtime), then:
//   - loops the hero video reel by default
//   - on "Listen live": stops the reel, plays audio picked by
//     time-of-day daypart, and shows a looping "vingle" video
//     in its place - COMMERCIAL BREAK.mp4 during the sponsor
//     break, DJ MACKINTHEDARK.mp4 the rest of the time - since
//     that audio has no video of its own.
// =========================================================

const PATHS = {
  am:      "../media/block/am/",
  day:     "../media/block/music/",
  late:    "../media/block/l8/",
  dropAm:  "../media/block/drop/am/",
  dropDay: "../media/block/drop/lunch/",
  dropLate:"../media/block/drop/pm/",
  news:    "../media/block/news/",
  sponsor: "../media/block/sponsor/",
  vingle:  "../video/vingle/"
};

let manifest = null;
let sponsorIndex = 0;
let isListening = false;
let currentVingleFile = null;

function encodePath(path) {
  return path.split('/').map(encodeURIComponent).join('/');
}

function cleanLabel(filename) {
  return filename.replace(/\.(mp3|mp4)$/i, '').trim();
}

function pick(list) {
  return list[Math.floor(Math.random() * list.length)];
}

function daypart() {
  const h = new Date().getHours();
  if (h >= 6 && h < 12) return "am";
  if (h >= 12 && h < 20) return "day";
  return "late";
}

// Minutes 55-59 of every clock hour = sponsor break,
// matching the original 55-min block / 5-min break design.
function inSponsorWindow() {
  return new Date().getMinutes() >= 55;
}

async function loadManifest() {
  if (manifest) return manifest;
  const res = await fetch('../playlist.json');
  manifest = await res.json();
  return manifest;
}

function nextTrack() {
  if (inSponsorWindow() && manifest.sponsor_order.length) {
    const file = manifest.sponsor_order[sponsorIndex % manifest.sponsor_order.length];
    sponsorIndex++;
    return {
      type: 'sponsor',
      url: PATHS.sponsor + encodePath(file),
      label: cleanLabel(file)
    };
  }

  const part = daypart();
  const pools = manifest[part];
  const musicPath = part === 'am' ? PATHS.am : part === 'day' ? PATHS.day : PATHS.late;
  const dropPath  = part === 'am' ? PATHS.dropAm : part === 'day' ? PATHS.dropDay : PATHS.dropLate;

  const roll = Math.random();

  if (roll < 0.10 && manifest.news.length) {
    const file = pick(manifest.news);
    return { type: 'news', url: PATHS.news + encodePath(file), label: cleanLabel(file) };
  }
  if (roll < 0.20 && pools.drops.length) {
    const file = pick(pools.drops);
    return { type: 'drop', url: dropPath + encodePath(file), label: cleanLabel(file) };
  }
  const file = pick(pools.music);
  return { type: 'music', url: musicPath + encodePath(file), label: cleanLabel(file) };
}

document.addEventListener('DOMContentLoaded', () => {

  // -------------------------------------------------------
  // HERO REEL
  // -------------------------------------------------------
  const heroSection = document.getElementById('heroSection');
  const videos = Array.from(document.querySelectorAll('.reel video.hero-clip'));
  const dots = Array.from(document.querySelectorAll('.reel-index button'));
  let current = 0;

  function showVideo(i) {
    videos.forEach((v, idx) => v.classList.toggle('is-active', idx === i));
    dots.forEach((d, idx) => d.classList.toggle('is-active', idx === i));
    const v = videos[i];
    v.currentTime = 0;
    v.play().catch(() => {});
    current = i;
  }

  videos.forEach((v, i) => {
    v.addEventListener('ended', () => {
      if (isListening) return;
      showVideo((i + 1) % videos.length);
    });
  });

  dots.forEach(d => {
    d.addEventListener('click', () => {
      if (isListening) return;
      showVideo(parseInt(d.dataset.i, 10));
    });
  });

  showVideo(0);

  // sound toggle - unmutes the active hero clip only
  const soundBtn = document.getElementById('soundBtn');
  let muted = true;
  soundBtn.addEventListener('click', () => {
    muted = !muted;
    videos.forEach(v => v.muted = muted);
    soundBtn.setAttribute('data-muted', String(muted));
    soundBtn.setAttribute('aria-pressed', String(!muted));
    soundBtn.setAttribute('aria-label', muted ? 'Unmute reel audio' : 'Mute reel audio');
  });

  // -------------------------------------------------------
  // MENU - fully separate from playback, opening/closing it
  // never touches video or audio.
  // -------------------------------------------------------
  const menu = document.getElementById('menu');
  const menuBtn = document.getElementById('menuBtn');

  function setMenuOpen(open) {
    menu.classList.toggle('is-open', open);
    menuBtn.setAttribute('aria-expanded', String(open));
  }

  menuBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    setMenuOpen(!menu.classList.contains('is-open'));
  });

  document.addEventListener('click', (e) => {
    if (!menu.contains(e.target)) setMenuOpen(false);
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') setMenuOpen(false);
  });

  // -------------------------------------------------------
  // AUDIO ENGINE + VINGLE SWAP
  // -------------------------------------------------------
  const audioEl = document.getElementById('audioEl');
  const vingleVideo = document.getElementById('vingleVideo');
  const listenBtn = document.getElementById('listenBtn');
  const listenLabel = document.getElementById('listenLabel');
  const nowPlayingText = document.getElementById('nowPlayingText');

  function updateVingle(type) {
    const file = type === 'sponsor' ? manifest.vingle.sponsor : manifest.vingle.programming;
    if (file !== currentVingleFile) {
      vingleVideo.src = PATHS.vingle + encodePath(file);
      currentVingleFile = file;
    }
    vingleVideo.classList.add('is-active');
    vingleVideo.play().catch(() => {});
  }

  function updateNowPlaying(track) {
    const prefix = track.type === 'sponsor' ? 'Sponsor break'
                 : track.type === 'news' ? 'News'
                 : track.type === 'drop' ? 'Station drop'
                 : 'Now playing';
    nowPlayingText.textContent = prefix + ' \u00b7 ' + track.label;
  }

  function playTrack(track) {
    audioEl.src = track.url;
    audioEl.play().catch(() => {});
    updateVingle(track.type);
    updateNowPlaying(track);
  }

  audioEl.addEventListener('ended', () => {
    if (!isListening) return;
    playTrack(nextTrack());
  });

  async function startListening() {
    await loadManifest();
    isListening = true;
    heroSection.setAttribute('data-mode', 'listen');
    videos.forEach(v => v.pause());
    listenBtn.setAttribute('data-playing', 'true');
    listenBtn.setAttribute('aria-pressed', 'true');
    listenLabel.textContent = 'Stop';
    playTrack(nextTrack());
  }

  function stopListening() {
    isListening = false;
    audioEl.pause();
    audioEl.removeAttribute('src');
    vingleVideo.classList.remove('is-active');
    vingleVideo.pause();
    heroSection.setAttribute('data-mode', 'reel');
    listenBtn.setAttribute('data-playing', 'false');
    listenBtn.setAttribute('aria-pressed', 'false');
    listenLabel.textContent = 'Listen live';
    showVideo(current);
  }

  listenBtn.addEventListener('click', () => {
    if (isListening) stopListening();
    else startListening();
  });

});
