# PROGRESS – roman-reel "Cerussa: the slowest assassin"   (updated 2026-11-11)
Phase: DONE (v1 delivered, awaiting feedback)
Current version: v1 → renders/final/roman_cerussa_v1.mp4 (1080×1920, 30 fps, 60.0 s, -14.0 LUFS, -1.4 dBTP)
Done: VO on the 4 × 15 s slots (narration ends 54.8 s, 5 s title outro) · 9 shots · 37 SFX cues · 72 BPM lyre/drone score ~12 dB under VO
Next step: user feedback → v2
Rebuild: python3 scripts/make_vo.py && node src/render.js --cues plan/cues.json && python3 scripts/mix.py && node src/render.js --pipe cache/video_noaudio.mp4 && bash scripts/finish.sh renders/final/roman_cerussa_v1.mp4
Needs (not in git): models/kokoro/* (symlink to ../sharing-reel/models); npm i; pip install kokoro-onnx soundfile scipy
