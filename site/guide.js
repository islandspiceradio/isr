// =========================================================
// ISLAND SPICE RADIO - CHANNEL GUIDE
// Shows what's actually airing right now (by the same rules
// as site/player.js) and a 24-hour breakdown of today.
//
// Blocks, by hour of day:
//   10at10   hour === 10 or hour === 22 (10am and 10pm)
//   am       6am-12pm
//   day      12pm-8pm
//   late     8pm-6am (except the 10pm 10at10 hour)
// Every hour's minutes 55-59 are a sponsor break, regardless
// of block, matching the 55-min-programming/5-min-break design.
// =========================================================

const PATHS = {
  am:      "../video/am/",
  day:     "../video/day/",
  late:    "../video/l8/",
  "10at10":"../video/10at10/",
  vingle:  "../video/vingle/"
};

const BLOCK_LABEL = {
  am: "AM block",
  day: "Day block",
  late: "Late block",
  "10at10": "10 at 10",
  sponsor: "Sponsor break"
};

let manifest = null;
let currentSegment = null; // { type, hour }
let currentPool = [];
let lastPlayedFile = null;

function encodePath(path) {
  return path.split('/').map(encodeURIComponent).join('/');
}

function cleanLabel(filename) {
  return filename.replace(/\.(mp3|mp4)$/i, '').trim();
}

function pick(list, avoid) {
  if (list.length === 1) return list[0];
  let choice;
  do {
    choice = list[Math.floor(Math.random() * list.length)];
  } while (choice === avoid);
  return choice;
}

function blockForHour(h) {
  if (h === 10 || h === 22) return "10at10";
  if (h >= 6 && h < 12) return "am";
  if (h >= 12 && h < 20) return "day";
  return "late";
}

function segmentNow(date) {
  const h = date.getHours();
  const m = date.getMinutes();
  if (m >= 55) return { type: "sponsor", hour: h };
  return { type: blockForHour(h), hour: h };
}

async function loadManifest() {
  if (manifest) return manifest;
  const res = await fetch('../playlist.json');
  manifest = await res.json();
  return manifest;
}

function poolFor(type) {
  if (type === "sponsor") return null; // single vingle clip, not a pool
  return manifest.video[type] || [];
}

document.addEventListener('DOMContentLoaded', async () => {
  await loadManifest();

  const video = document.getElementById('onNowVideo');
  const tag = document.getElementById('onNowTag');
  const tagText = document.getElementById('onNowTagText');
  const title = document.getElementById('onNowTitle');
  const nextEl = document.getElementById('onNowNext');

  function playFromCurrentPool() {
    if (currentSegment.type === "sponsor") {
      const file = manifest.vingle.sponsor;
      video.src = PATHS.vingle + encodePath(file);
      video.loop = true;
      title.textContent = "Commercial break";
      lastPlayedFile = file;
    } else {
      const file = pick(currentPool, lastPlayedFile);
      video.src = PATHS[currentSegment.type] + encodePath(file);
      video.loop = currentPool.length === 1;
      title.textContent = cleanLabel(file);
      lastPlayedFile = file;
    }
    video.play().catch(() => {});
  }

  function applySegment(seg) {
    currentSegment = seg;
    currentPool = poolFor(seg.type);
    tag.className = 'onnow-tag tag-' + seg.type;
    tagText.textContent = 'On now · ' + BLOCK_LABEL[seg.type];
    playFromCurrentPool();
  }

  video.addEventListener('ended', () => {
    if (currentSegment.type === "sponsor") return; // vingle loops on its own
    playFromCurrentPool();
  });

  function checkForSegmentChange() {
    const seg = segmentNow(new Date());
    if (!currentSegment || seg.type !== currentSegment.type || seg.hour !== currentSegment.hour) {
      applySegment(seg);
      renderLiveHighlight();
    }
  }

  function updateCountdown() {
    const now = new Date();
    const m = now.getMinutes();
    const s = now.getSeconds();
    let mins, secs, label;
    if (m < 55) {
      const totalSecs = (54 - m) * 60 + (60 - s);
      mins = Math.floor(totalSecs / 60);
      secs = totalSecs % 60;
      label = 'Sponsor break in';
    } else {
      const totalSecs = (59 - m) * 60 + (60 - s);
      mins = Math.floor(totalSecs / 60);
      secs = totalSecs % 60;
      label = 'Regular programming resumes in';
    }
    nextEl.innerHTML = label + ' <b>' + mins + 'm ' + String(secs).padStart(2, '0') + 's</b>';
  }

  // ---------------------------------------------------------
  // TIMELINE
  // ---------------------------------------------------------
  const timelineEl = document.getElementById('timeline');

  function buildTimeline() {
    let html = '';
    for (let h = 0; h < 24; h++) {
      const block = blockForHour(h);
      const label12 = ((h % 12) || 12) + (h < 12 ? ' AM' : ' PM');
      html += `<div class="timeline-row" data-hour="${h}">
        <div class="timeline-time">${label12}</div>
        <div class="timeline-bar">
          <div class="timeline-seg programming seg-${block}" data-hour="${h}" data-part="programming">
            <span>${BLOCK_LABEL[block]}</span>
          </div>
          <div class="timeline-seg sponsor" data-hour="${h}" data-part="sponsor"></div>
        </div>
      </div>`;
    }
    timelineEl.innerHTML = html;
  }

  function renderLiveHighlight() {
    const now = new Date();
    const h = now.getHours();
    const part = now.getMinutes() >= 55 ? 'sponsor' : 'programming';

    document.querySelectorAll('.timeline-seg.is-live').forEach(el => el.classList.remove('is-live'));
    document.querySelectorAll('.timeline-row.is-live-row').forEach(el => el.classList.remove('is-live-row'));

    const seg = document.querySelector(`.timeline-seg[data-hour="${h}"][data-part="${part}"]`);
    if (seg) {
      seg.classList.add('is-live');
      seg.closest('.timeline-row').classList.add('is-live-row');
    }
  }

  buildTimeline();
  applySegment(segmentNow(new Date()));
  renderLiveHighlight();
  updateCountdown();

  // scroll current hour into view
  const liveRow = document.querySelector('.timeline-row.is-live-row');
  if (liveRow) liveRow.scrollIntoView({ block: 'center', behavior: 'instant' });

  setInterval(updateCountdown, 1000);
  setInterval(checkForSegmentChange, 5000);
  setInterval(renderLiveHighlight, 15000);
});
