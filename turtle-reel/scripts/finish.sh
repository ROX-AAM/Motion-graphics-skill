#!/usr/bin/env bash
# Two-pass loudnorm (-14 LUFS, -1.5 dBTP) + mux → renders/final/<name>.mp4
set -e
OUT=${1:-renders/final/one_quick_check_v1.mp4}
J=$(ffmpeg -hide_banner -i cache/mix_premaster.wav -af loudnorm=I=-14:TP=-1.5:LRA=11:print_format=json -f null - 2>&1 | sed -n '/^{/,/^}/p')
g(){ echo "$J" | python3 -c "import json,sys;print(json.load(sys.stdin)['$1'])"; }
ffmpeg -v error -y -i cache/mix_premaster.wav -af "loudnorm=I=-14:TP=-1.5:LRA=11:measured_I=$(g input_i):measured_TP=$(g input_tp):measured_LRA=$(g input_lra):measured_thresh=$(g input_thresh):offset=$(g target_offset):linear=true,aresample=48000" -c:a pcm_s16le cache/mix_master.wav
mkdir -p "$(dirname "$OUT")"
ffmpeg -v error -y -i cache/video_noaudio.mp4 -i cache/mix_master.wav -map 0:v -map 1:a -c:v copy -c:a aac -b:a 192k -ar 48000 -shortest -movflags +faststart "$OUT"
echo "final: $OUT"
