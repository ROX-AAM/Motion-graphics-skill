# PROGRESS – sharing-reel "Tutu & Misti: sharing"   (updated 2026-11-07)
Phase: DONE (v1 delivered, awaiting feedback)
Current version: v1 → renders/final/tutu_misti_sharing_v1.mp4 (1080×1920, 30 fps, 60.0 s, -14.1 LUFS, -1.4 dBTP)
Done: VO (Kokoro, 2 voices) on the 4 scene slots · 4 scenes in code · 61 SFX cues · storybook music 100 BPM · final render
Next step: user feedback → v2
Open issues: word timing inside phrases estimated from phoneme counts (whisper model download blocked here)
Rebuild: python3 scripts/make_vo.py && node src/render.js --cues plan/cues.json && python3 scripts/mix.py && node src/render.js --pipe cache/video_noaudio.mp4 && bash scripts/finish.sh renders/final/tutu_misti_sharing_v1.mp4
Needs (not in git): models/kokoro/* (github.com/thewh1teagle/kokoro-onnx releases, model-files-v1.0); npm i; pip install kokoro-onnx soundfile scipy
