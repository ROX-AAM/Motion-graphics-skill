# PROGRESS – final-reel "2026 World Cup final"   (updated 2026-11-14)
Phase: final render
Current version: v1 → renders/final/world_cup_final_v1.mp4 (1080×1920, 30 fps, 21.8 s)
Facts verified by web search before building (see manifest.json).
VO: no file attached → Kokoro am_fenrir (deep male); dense script, so scenes run up to ~1.5 s behind the given marks; total 21.8 s.
Rebuild: python3 scripts/make_vo.py && node src/render.js --cues plan/cues.json && python3 scripts/mix.py && node src/render.js --to 21.8 --pipe cache/video_noaudio.mp4 && bash scripts/finish.sh renders/final/world_cup_final_v1.mp4
