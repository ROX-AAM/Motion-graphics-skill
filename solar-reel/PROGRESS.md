# PROGRESS – solar-reel "Why solar homes go dark in a blackout"   (updated 2026-11-14)
Phase: final render
Current version: v1 → renders/final/solar_blackout_v1.mp4 (1080×1920, 30 fps, 80 s)
Look: Three.js street/houses/panels on rails/poles+wires/inverter/battery/meter/switch/AC unit, living room, exploded panel macro; flat 2D cards for homeowner, Sun, workers, inverter + appliance faces. Electricity = glowing particles (yellow DC, blue AC waves, red danger, green battery).
VO: no file attached → Kokoro af_bella @1.1; scenes land within 0.25 s of the script timestamps.
Rebuild: python3 scripts/make_vo.py && node src/render.js --cues plan/cues.json && python3 scripts/mix.py && node src/render.js --to 80 --pipe cache/video_noaudio.mp4 && bash scripts/finish.sh renders/final/solar_blackout_v1.mp4
