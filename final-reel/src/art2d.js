// 2D cartoon characters for the final (generic players — no real faces, crests or logos) + overlays.
const F2 = { ink: '#14182e', skin: ['#ffd2ac', '#e8b48a', '#c98e62', '#8d5a3a'], red: '#d8202a', redD: '#a8141c', gold: '#ffd23f', sky: '#7ec8f2', white: '#ffffff', navy: '#1b2a5a', keeper: '#3ccf7a' };
function pt(ctx, fill, lw = 9) { if (fill) { ctx.fillStyle = fill; ctx.fill(); } if (lw) { ctx.lineWidth = lw; ctx.strokeStyle = F2.ink; ctx.lineJoin = 'round'; ctx.lineCap = 'round'; ctx.stroke(); } }
function rbx(ctx, x, y, w, h, r, fill, lw = 9) { ctx.beginPath(); ctx.roundRect(x, y, w, h, r); pt(ctx, fill, lw); }
function ell(ctx, x, y, rx, ry, fill, lw = 9) { ctx.beginPath(); ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2); pt(ctx, fill, lw); }
function cface(ctx, x, y, s, mood, t, ph = 0) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  for (const sx of [-1, 1]) { const ex = sx * 22;
    if (mood === 'joy' || mood === 'happy') { ctx.beginPath(); ctx.arc(ex, -6, 10, 1.1 * Math.PI, 1.9 * Math.PI); pt(ctx, null, 6); }
    else { ell(ctx, ex, -6, 10, mood === 'focus' ? 8 : 12, '#fff', 5); ell(ctx, ex + 2, -4, 5, 6, F2.ink, 0); }
    if (mood === 'focus' || mood === 'sad') { ctx.beginPath(); ctx.moveTo(ex - 12, -24 + (mood === 'focus' ? (sx < 0 ? -4 : 4) : (sx < 0 ? 4 : -4))); ctx.lineTo(ex + 12, -24 + (mood === 'focus' ? (sx < 0 ? 4 : -4) : (sx < 0 ? -4 : 4))); pt(ctx, null, 6); }
  }
  ctx.beginPath();
  if (mood === 'joy') { ctx.ellipse(0, 22, 18, 16, 0, 0, Math.PI * 2); pt(ctx, '#b02a3a', 6); }
  else if (mood === 'happy') { ctx.arc(0, 14, 16, 0.15 * Math.PI, 0.85 * Math.PI); pt(ctx, null, 6); }
  else if (mood === 'sad') { ctx.arc(0, 30, 14, 1.15 * Math.PI, 1.85 * Math.PI); pt(ctx, null, 6); }
  else { ctx.moveTo(-12, 20); ctx.lineTo(12, 20); pt(ctx, null, 6); }
  ctx.restore();
}
// player (front view; origin = feet). o: team 'esp'|'arg'|'gk', num, pose 'stand'|'run'|'kick'|'cheer'|'lift'|'dive'|'sad', mood, skin
function drawPlayer(ctx, t, o = {}) {
  const team = o.team || 'esp', pose = o.pose || 'stand', skin = F2.skin[o.skin || 0];
  const shirt = team === 'esp' ? F2.red : team === 'gk' ? F2.keeper : F2.sky, shorts = team === 'esp' ? F2.navy : team === 'gk' ? '#1a1a1a' : F2.navy, socks = team === 'esp' ? F2.navy : team === 'gk' ? '#1a1a1a' : F2.white;
  const ph = (o.ph || 0) + t * 9, run = pose === 'run' ? Math.sin(ph) : 0;
  if (pose === 'dive') { ctx.rotate(-1.2); ctx.translate(-60, -60); }
  const bob = pose === 'cheer' || pose === 'lift' ? Math.abs(Math.sin(t * 7 + (o.ph || 0))) * 16 : pose === 'run' ? Math.abs(Math.cos(ph)) * 10 : 0;
  ctx.translate(0, -bob);
  // legs
  const leg = (sx, ang) => { ctx.save(); ctx.translate(sx * 26, -200); ctx.rotate(ang); rbx(ctx, -18, 0, 36, 110, 16, skin, 7); rbx(ctx, -20, 100, 40, 80, 14, socks, 7); rbx(ctx, -26, 172, 56, 24, 12, '#111', 7); ctx.restore(); };
  if (pose === 'kick') { leg(-1, 0.15); leg(1, -1.1 - Math.min(1, (o.kick || 0)) * 0.4); } else { leg(-1, run * 0.5); leg(1, -run * 0.5); }
  rbx(ctx, -66, -250, 132, 80, 22, shorts);
  // shirt
  ctx.beginPath(); ctx.roundRect(-74, -430, 148, 200, 40); pt(ctx, shirt);
  if (team === 'arg') { ctx.save(); ctx.beginPath(); ctx.roundRect(-74, -430, 148, 200, 40); ctx.clip(); ctx.fillStyle = F2.white; for (let x = -60; x < 80; x += 40) ctx.fillRect(x, -440, 20, 220); ctx.restore(); ctx.beginPath(); ctx.roundRect(-74, -430, 148, 200, 40); pt(ctx, null); }
  if (team === 'esp') { rbx(ctx, -74, -300, 148, 14, 0, F2.gold, 0); }
  if (o.num) text(ctx, String(o.num), 0, -340, 76, team === 'esp' ? F2.gold : F2.navy, { lw: 10, stroke: F2.ink });
  // arms
  const arm = (sx, ang, len = 150) => { ctx.save(); ctx.translate(sx * 66, -410); ctx.rotate(ang); rbx(ctx, -18, 0, 36, 60, 16, shirt, 7); rbx(ctx, -16, 54, 32, len - 54, 14, skin, 7); if (team === 'gk') ell(ctx, 0, len + 4, 26, 26, '#ff8a1c', 7); else ell(ctx, 0, len + 2, 18, 18, skin, 6); ctx.restore(); };
  if (pose === 'cheer') { arm(-1, 2.6 + Math.sin(t * 10) * 0.15); arm(1, -2.6 - Math.sin(t * 10) * 0.15); }
  else if (pose === 'lift') { arm(-1, 2.95); arm(1, -2.95); }
  else if (pose === 'dive') { arm(-1, 2.9); arm(1, -2.9); }
  else if (pose === 'sad') { arm(-1, 0.05); arm(1, -0.05); }
  else { arm(-1, 0.25 - run * 0.6); arm(1, -0.25 - run * 0.6); }
  // head
  ell(ctx, 0, -500, 62, 66, skin);
  ctx.beginPath(); ctx.arc(0, -512, 64, Math.PI * 1.05, Math.PI * 1.95); ctx.quadraticCurveTo(30, -556, -30, -546); pt(ctx, ['#2a1a10', '#5a3a1a', '#111', '#3a2a1a'][o.hair || 0], 7);
  cface(ctx, 0, -494, 1.15, o.mood || 'focus', t);
}
// a painted crowd strip (2D fans), used as a texture on the 3D stands
function drawCrowd(ctx, w, h, seed, t = 0) {
  const r = rng(seed); ctx.fillStyle = '#1a1d2e'; ctx.fillRect(0, 0, w, h);
  const rows = 9, rh = h / rows;
  for (let j = 0; j < rows; j++) for (let i = 0; i < 46; i++) {
    const x = (i + (j % 2) * 0.5) * (w / 45), y = j * rh + rh * 0.8, side = r() < 0.5, col = side ? (r() < 0.8 ? '#d8202a' : '#ffd23f') : (r() < 0.6 ? '#7ec8f2' : '#ffffff'), sk = F2.skin[Math.floor(r() * 4)];
    ctx.fillStyle = col; ctx.beginPath(); ctx.roundRect(x - 14, y - 26, 28, 30, 8); ctx.fill();
    ctx.fillStyle = sk; ctx.beginPath(); ctx.arc(x, y - 36, 11, 0, Math.PI * 2); ctx.fill();
    if (r() < 0.35) { ctx.strokeStyle = sk; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(x - 10, y - 24); ctx.lineTo(x - 18, y - 52); ctx.moveTo(x + 10, y - 24); ctx.lineTo(x + 18, y - 52); ctx.stroke(); }
    if (r() < 0.06) { ctx.fillStyle = side ? '#d8202a' : '#7ec8f2'; ctx.fillRect(x - 4, y - 90, 40, 26); ctx.fillStyle = side ? '#ffd23f' : '#fff'; ctx.fillRect(x - 4, y - 81, 40, 8); }
  }
}
function subscribeBtn(ctx, t, t0) {
  const k = E.outBack(seg(t, t0, t0 + 0.35), 1.6), click = t0 + 0.9, done = t > click;
  if (k <= 0) return;
  ctx.save(); ctx.translate(540, 1050); ctx.scale(1.35 * k * (done && t < click + 0.15 ? 0.92 : 1), 1.35 * k);
  ctx.beginPath(); ctx.roundRect(-300, -80, 600, 160, 80); ctx.fillStyle = done ? '#3a3f4a' : '#e62117'; ctx.fill(); ctx.lineWidth = 8; ctx.strokeStyle = '#fff'; ctx.stroke();
  text(ctx, done ? 'SUBSCRIBED' : 'SUBSCRIBE', -40, 6, 66, '#fff', { lw: 0 });
  ctx.save(); ctx.translate(220, 0); ctx.rotate(done ? Math.sin((t - click) * 30) * 0.4 * Math.max(0, 1 - (t - click) * 1.2) : 0);
  ctx.beginPath(); ctx.moveTo(-34, 30); ctx.quadraticCurveTo(-34, -40, 0, -44); ctx.quadraticCurveTo(34, -40, 34, 30); ctx.lineTo(44, 40); ctx.lineTo(-44, 40); ctx.closePath(); ctx.fillStyle = '#fff'; ctx.fill();
  ctx.beginPath(); ctx.arc(0, 48, 11, 0, Math.PI * 2); ctx.fill(); ctx.beginPath(); ctx.arc(0, -48, 7, 0, Math.PI * 2); ctx.fill(); ctx.restore();
  if (done) { const f = seg(t, click, click + 0.6); ctx.globalAlpha = 1 - f; for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4; sparkle(ctx, 220 + Math.cos(a) * 110 * f, Math.sin(a) * 110 * f, 18, '#ffd166'); } ctx.globalAlpha = 1; }
  ctx.restore();
  if (t < click + 0.5) { const m = E.outCubic(seg(t, t0 + 0.2, click)); ctx.save(); ctx.translate(lerp(960, 860, m), lerp(1400, 1090, m) + (t > click && t < click + 0.15 ? 10 : 0)); ctx.rotate(-0.4);
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, 90); ctx.lineTo(24, 68); ctx.lineTo(42, 104); ctx.lineTo(58, 96); ctx.lineTo(40, 60); ctx.lineTo(70, 60); ctx.closePath(); ctx.fillStyle = '#fff'; ctx.fill(); ctx.lineWidth = 6; ctx.strokeStyle = '#14213d'; ctx.stroke(); ctx.restore(); }
}
function titleCard(ctx, s1, s2, k, y = 720) { if (k <= 0) return; ctx.save(); ctx.translate(540, y); ctx.scale(k, k); ctx.font = '70px Lilita'; const w = Math.max(ctx.measureText(s1).width, ctx.measureText(s2).width * 0.8) + 90; ctx.beginPath(); ctx.roundRect(-w / 2, -110, w, 220, 30); ctx.fillStyle = 'rgba(10,14,30,0.85)'; ctx.fill(); ctx.lineWidth = 6; ctx.strokeStyle = '#ffd23f'; ctx.stroke(); text(ctx, s1, 0, -36, 70, '#ffd23f', { lw: 0 }); text(ctx, s2, 0, 48, 58, '#fff', { lw: 0 }); ctx.restore(); }
