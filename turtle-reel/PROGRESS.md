# PROGRESS – turtle-reel "The Last Try"   (updated 2026-11-12)
Phase: DONE (v1 delivered, awaiting feedback)
Current version: v1 → renders/final/turtle_last_try_v1.mp4 (1080×1920, 30 fps, 84.0 s, -14.0 LUFS, -1.2 dBTP; full render took 37 min)
Look: hybrid — Three.js 3D world (procedural sand, animated ocean, curling breaker, moon + glitter path, rocks, cookie, underwater rays/bubbles/sparkles, real shadows, BokehPass DOF) with flat 2D outlined character cards (turtle, crab, gull, baby turtles) + contact shadows. Captions + 1,000-icon grid + Subscribe/bell on a 2D overlay.
VO: no file attached → Kokoro af_heart; scenes land within 0.5 s of the script timestamps.
Render: src/render.js serves the project over local HTTP (ES modules) and uses SwiftShader WebGL; ~2 s/frame/worker at full res.
Rebuild: python3 scripts/make_vo.py && node src/render.js --cues plan/cues.json && python3 scripts/mix.py && node src/render.js --to 84 --pipe cache/video_noaudio.mp4 && bash scripts/finish.sh renders/final/turtle_last_try_v1.mp4
