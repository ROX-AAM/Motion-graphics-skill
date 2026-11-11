# PROGRESS – nyos-reel "Lake Nyos, 1986"   (updated 2026-11-11)
Phase: DONE (v1 delivered, awaiting feedback)
Current version: v1 → renders/final/lake_nyos_v1.mp4 (1080×1920, 30 fps, 63.5 s, -14.2 LUFS, -1.1 dBTP)
Timing: hook runs 0–9.2 s (script slot 7 s; 9.5 s of speech), then S1 9.2–20, S2 20–34, S3 34–49, S4 49–63.5
Done: VO (am_fenrir) · 11 shots · 41 SFX cues · dark ambient score, silent on the eruption
Next step: user feedback → v2
Rebuild: python3 scripts/make_vo.py && node src/render.js --cues plan/cues.json && python3 scripts/mix.py && node src/render.js --to 63.5 --pipe cache/video_noaudio.mp4 && bash scripts/finish.sh renders/final/lake_nyos_v1.mp4
