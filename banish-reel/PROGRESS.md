# PROGRESS – banish-reel "The Banishment Room"   (updated 2026-11-10)
Phase: DONE (v1 delivered, awaiting feedback)
Current version: v1 → renders/final/banishment_room_v1.mp4 (1080×1920, 30 fps, 63.4 s, -14.1 LUFS, -1.0 dBTP)
Timing: script is ~3.7 words/s, so scenes follow the real VO: S1 0–21.0, S2 21.0–34.4, S3 34.4–50.3, S4 50.3–63.4 (1.2 s end hold)
Done: 3-voice VO · 17 shots in code · 68 SFX cues · moody 84 BPM score with silences on "worse", "gone" and the ending
Next step: user feedback → v2
Rebuild: python3 scripts/make_vo.py && node src/render.js --cues plan/cues.json && python3 scripts/mix.py && node src/render.js --to 63.4 --pipe cache/video_noaudio.mp4 && bash scripts/finish.sh renders/final/banishment_room_v1.mp4
Needs (not in git): models/kokoro/* (symlink to ../sharing-reel/models); npm i; pip install kokoro-onnx soundfile scipy
