# PROGRESS – pigwar-reel "The Pig War"   (updated 2026-11-12)
Phase: DONE (v1 delivered to the user, awaiting feedback)
Current version: v1 → renders/final/pig_war_v1.mp4 (local only; 1080×1920, 30 fps, 80.7 s, -13.9 LUFS, -1.2 dBTP)
Privacy: the VO is the user's own ElevenLabs recording; it and the rendered video are NOT committed (repo is public). assets/vo/ and renders/ are gitignored.
VO timing: scripts/align.py aligns the recording to the script (Kokoro reference + MFCC DTW, sentence starts snapped to silences).
Rebuild (needs assets/vo/user_vo.wav): python3 scripts/align.py && node src/render.js --cues plan/cues.json && python3 scripts/mix.py && node src/render.js --to 80.7 --pipe cache/video_noaudio.mp4 && bash scripts/finish.sh renders/final/pig_war_v1.mp4
