# =========================================================
# STV PROGRAMMING POOLS
# =========================================================
# Music is separated by daypart:
# - AM      -> Morning programming
# - DAY     -> Main rotation
# - LATE    -> Late night / overnight rotation
#
# Drops are inserted between music tracks.
# News breaks are inserted less frequently.
# =========================================================


# ---------------------------------------------------------
# MUSIC LIBRARIES
# ---------------------------------------------------------

morning_music = playlist(
  mode="randomize",
  reload=300,
  "media/block/am"
)

daytime_music = playlist(
  mode="randomize",
  reload=300,
  "media/block/music"
)

overnight_music = playlist(
  mode="randomize",
  reload=300,
  "media/block/l8"
)


# ---------------------------------------------------------
# STATION ELEMENTS
# ---------------------------------------------------------

station_drops = playlist(
  mode="randomize",
  reload=300,
  "media/block/drop"
)

news_updates = playlist(
  mode="randomize",
  reload=300,
  "media/block/news"
)


# ---------------------------------------------------------
# MUSIC ROTATION ENGINE
# ---------------------------------------------------------

music_rotation = random([
  morning_music,
  daytime_music,
  overnight_music
])


# ---------------------------------------------------------
# MUSIC + BRANDING
# 5 songs : 1 station drop
# ---------------------------------------------------------

programming_rotation = rotate(
  weights=[5,1],
  [
    music_rotation,
    station_drops
  ]
)


# ---------------------------------------------------------
# FULL HOUR CONTENT MIX
# 8 programming elements : 1 news update
# ---------------------------------------------------------

hourly_programming = rotate(
  weights=[8,1],
  [
    programming_rotation,
    news_updates
  ]
)
