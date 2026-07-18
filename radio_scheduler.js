// =========================================================
// ISLAND SPICE RADIO SCHEDULER
// Temporary browser-based automation
// =========================================================

const station = {
  am: {
    music: "media/block/am/",
    drops: "media/block/drop/am/",
    news: "media/block/news/"
  },

  day: {
    music: "media/block/music/",
    drops: "media/block/drop/lunch/",
    news: "media/block/news/"
  },

  late: {
    music: "media/block/l8/",
    drops: "media/block/drop/pm/",
    news: "media/block/news/"
  }
};


// Pick random item
function randomPick(list) {
  return list[Math.floor(Math.random() * list.length)];
}


// Determine current programming block
function getCurrentBlock() {

  const hour = new Date().getHours();

  if (hour >= 6 && hour < 12) {
    return "am";
  }

  if (hour >= 12 && hour < 20) {
    return "day";
  }

  return "late";
}


console.log(
  "Now playing block:",
  getCurrentBlock()
);
