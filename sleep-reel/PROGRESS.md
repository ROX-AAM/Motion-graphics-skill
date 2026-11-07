# PROGRESS – sleep-reel "One quick check"   (updated 2026-11-07)
Phase: DONE (v1 delivered, awaiting feedback)
Current version: v1 → renders/final/one_quick_check_v1.mp4 (1080×1920, 30 fps, 60.0 s, H.264 + AAC 48 kHz, -14.0 LUFS, -1.1 dBTP)
Done:
- VO: Kokoro TTS (af_bella, 1.05×), generated phrase by phrase on the user's timestamps → assets/vo/vo_v1.wav + plan/beats.json
- 6 scenes in code (src/scenes.js), word-synced kinetic captions (src/lib.js), cartoon art (src/art.js)
- 69 synthesized SFX cues (plan/cues.json) + synthesized 120 BPM music, ducked under VO
Next step: user feedback → v2 (voice swap, pacing, gags)
Open issues: - Word timing inside a phrase is estimated from phoneme counts (whisper model download blocked here); phrase starts/ends are exact
Key decisions: - No approval gates per user ("generate the complete video"); colorful 2D cartoon, intensity 4
Rebuild: python3 scripts/make_vo.py && node src/render.js --cues plan/cues.json && python3 scripts/mix.py && node src/render.js --pipe cache/video_noaudio.mp4 && bash scripts/finish.sh
Needs (not in git): models/kokoro/{kokoro-v1.0.onnx,voices-v1.0.bin} from github.com/thewh1teagle/kokoro-onnx releases (model-files-v1.0); npm i; pip install kokoro-onnx soundfile scipy
