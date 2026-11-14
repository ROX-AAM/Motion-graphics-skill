# LOG
- 2026-11-07 New brief from user: 60 s 9:16 cartoon reel with TTS on supplied script (replaces SaaS reel).
- Kokoro TTS installed (ElevenLabs blocked by network). VO generated per phrase, slots fitted, extra time spread into pauses.
- Fonts Lilita One + Fredoka (OFL) from google/fonts GitHub.
- Built render.js (CLI contract + --pipe), lib/art/scenes. Preview loops: fixed "right?" lookup bug (matched "right this second"), scene 2 framing, caption grouping (≤4 words, keep "2:00 AM"), clock/pillow gap, badge overlap.
- Mix: music raised to ~12 dB under VO; two-pass loudnorm → -14.0 LUFS, -1.1 dBTP. Final v1 rendered (51 s render).
