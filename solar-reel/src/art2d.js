// 2D cartoon characters (drawn onto card textures) + 2D overlay graphics. Bold outlines, expressive faces.
const K2 = { ink: '#1b1f3b', skin: '#ffcfa6', skinD: '#e8a87c', shirt: '#4f8cff', pants: '#2f3a5a', hair: '#5a3a22', sun: '#ffd23f', sunD: '#ff9f1c', vest: '#ff8a1c', vestL: '#ffe15a', hat: '#ffd23f', red: '#ff4d4d', blue: '#3fa9ff', yellow: '#ffd23f', green: '#3ccf7a', white: '#ffffff' };
function pt(ctx, fill, lw = 9) { if (fill) { ctx.fillStyle = fill; ctx.fill(); } if (lw) { ctx.lineWidth = lw; ctx.strokeStyle = K2.ink; ctx.lineJoin = 'round'; ctx.lineCap = 'round'; ctx.stroke(); } }
function ell(ctx, x, y, rx, ry, rot, fill, lw = 9) { ctx.beginPath(); ctx.ellipse(x, y, rx, ry, rot, 0, Math.PI * 2); pt(ctx, fill, lw); }
function rbx(ctx, x, y, w, h, r, fill, lw = 9) { ctx.beginPath(); ctx.roundRect(x, y, w, h, r); pt(ctx, fill, lw); }
function face(ctx, x, y, s, mood, t, o = {}) { // shared cartoon face: mood 'happy'|'confused'|'shock'|'unimpressed'|'sleepy'|'calm'|'proud'|'worried'
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  const blink = Math.max(0, 1 - Math.abs(((t + (o.ph || 0)) % 3.2) - 1.6) * 12);
  for (const sx of [-1, 1]) {
    const ex = sx * 26, ey = -8;
    if (mood === 'happy' || mood === 'proud' || mood === 'calm') { ctx.beginPath(); ctx.arc(ex, ey + 4, 11, 1.1 * Math.PI, 1.9 * Math.PI); pt(ctx, null, 7); }
    else if (mood === 'sleepy') { ctx.beginPath(); ctx.moveTo(ex - 12, ey); ctx.lineTo(ex + 12, ey); pt(ctx, null, 7); }
    else if (mood === 'unimpressed') { ell(ctx, ex, ey, 13, 13, 0, '#fff', 6); ctx.fillStyle = K2.ink; ctx.fillRect(ex - 14, ey - 15, 28, 13); ell(ctx, ex, ey + 3, 6, 6, 0, K2.ink, 0); ctx.beginPath(); ctx.moveTo(ex - 14, ey - 2); ctx.lineTo(ex + 14, ey - 2); pt(ctx, null, 6); }
    else { const big = mood === 'shock' ? 1.3 : 1; ell(ctx, ex, ey, 13 * big, 15 * big * (1 - blink * 0.9), 0, '#fff', 6); ell(ctx, ex + (o.look || 0) * 4, ey + 2, 6, 7 * (1 - blink * 0.9), 0, K2.ink, 0); }
    if (mood === 'confused') { ctx.beginPath(); ctx.moveTo(ex - 14, ey - 26 + (sx < 0 ? -6 : 4)); ctx.lineTo(ex + 14, ey - 26 + (sx < 0 ? 2 : -8)); pt(ctx, null, 6); }
    if (mood === 'worried') { ctx.beginPath(); ctx.moveTo(ex - 14, ey - 24 + (sx < 0 ? 6 : -6)); ctx.lineTo(ex + 14, ey - 24 + (sx < 0 ? -6 : 6)); pt(ctx, null, 6); }
  }
  ctx.beginPath();
  if (mood === 'happy' || mood === 'proud') { ctx.moveTo(-20, 18); ctx.quadraticCurveTo(0, 42, 20, 18); ctx.closePath(); pt(ctx, '#c2334d', 6); }
  else if (mood === 'calm') { ctx.arc(0, 16, 14, 0.15 * Math.PI, 0.85 * Math.PI); pt(ctx, null, 6); }
  else if (mood === 'shock') { ctx.ellipse(0, 26, 10, 14, 0, 0, Math.PI * 2); pt(ctx, '#c2334d', 6); }
  else if (mood === 'sleepy') { ctx.ellipse(0, 24, 14 + Math.sin(t * 3) * 2, 16 + Math.sin(t * 3) * 4, 0, 0, Math.PI * 2); pt(ctx, '#c2334d', 6); }
  else if (mood === 'confused' || mood === 'worried') { ctx.moveTo(-16, 26); ctx.quadraticCurveTo(-4, 18, 4, 26); ctx.quadraticCurveTo(10, 32, 18, 24); pt(ctx, null, 6); }
  else { ctx.moveTo(-14, 24); ctx.lineTo(14, 24); pt(ctx, null, 6); }
  if (o.blush !== false) { ctx.globalAlpha = 0.45; ell(ctx, -40, 12, 9, 6, 0, '#ff7a9a', 0); ell(ctx, 40, 12, 9, 6, 0, '#ff7a9a', 0); ctx.globalAlpha = 1; }
  ctx.restore();
}
// ---------- homeowner (front view; origin = feet) ----------
// o: mood, pose 'stand'|'shrug'|'relax'|'point'|'cheer'
function drawHomeowner(ctx, t, o = {}) {
  const pose = o.pose || 'stand';
  ctx.globalAlpha = 1;
  if (pose === 'relax') { // lounging on an armchair (flat 2D chair)
    rbx(ctx, -150, -170, 300, 110, 30, '#ff7a59'); rbx(ctx, -180, -230, 60, 200, 26, '#ff7a59'); rbx(ctx, 120, -230, 60, 200, 26, '#ff7a59'); rbx(ctx, -150, -330, 300, 190, 40, '#ff9478');
    rbx(ctx, -60, -170, 50, 150, 20, K2.pants); rbx(ctx, 10, -170, 50, 150, 20, K2.pants); rbx(ctx, -75, -40, 70, 26, 12, '#222'); rbx(ctx, 5, -40, 70, 26, 12, '#222');
    rbx(ctx, -80, -330, 160, 170, 40, K2.shirt);
    ctx.save(); ctx.translate(-80, -300); ctx.rotate(2.6); rbx(ctx, -18, 0, 36, 120, 18, K2.shirt); ctx.restore(); ctx.save(); ctx.translate(80, -300); ctx.rotate(-2.6); rbx(ctx, -18, 0, 36, 120, 18, K2.shirt); ctx.restore();
    ell(ctx, 0, -390, 66, 70, 0, K2.skin); ctx.beginPath(); ctx.arc(0, -400, 68, Math.PI * 1.05, Math.PI * 1.95); pt(ctx, K2.hair, 8);
    face(ctx, 0, -385, 1.15, o.mood || 'happy', t); return;
  }
  const bob = pose === 'cheer' ? Math.abs(Math.sin(t * 6)) * 12 : 0;
  ctx.translate(0, -bob);
  rbx(ctx, -50, -190, 44, 190, 18, K2.pants); rbx(ctx, 6, -190, 44, 190, 18, K2.pants);
  rbx(ctx, -62, -20, 60, 24, 12, '#222'); rbx(ctx, 2, -20, 60, 24, 12, '#222');
  rbx(ctx, -80, -400, 160, 230, 50, K2.shirt);
  const arm = (sx, ang, len = 160) => { ctx.save(); ctx.translate(sx * 70, -380); ctx.rotate(ang); rbx(ctx, -20, 0, 40, len, 20, K2.shirt); ell(ctx, 0, len + 6, 22, 22, 0, K2.skin, 7); ctx.restore(); };
  if (pose === 'shrug') { arm(-1, 1.0, 120); arm(1, -1.0, 120); }
  else if (pose === 'cheer') { arm(-1, 2.7 + Math.sin(t * 10) * 0.15); arm(1, -2.7 - Math.sin(t * 10) * 0.15); }
  else if (pose === 'point') { arm(-1, 0.1); arm(1, -2.2); }
  else { arm(-1, 0.12); arm(1, -0.12); }
  ell(ctx, 0, -470, 76, 80, 0, K2.skin);
  ctx.beginPath(); ctx.arc(0, -484, 78, Math.PI * 1.02, Math.PI * 1.98); ctx.quadraticCurveTo(40, -520, -20, -510); ctx.quadraticCurveTo(-60, -505, -78, -476); pt(ctx, K2.hair, 8);
  face(ctx, 0, -462, 1.25, o.mood || 'confused', t, { look: o.look });
}
// ---------- cute Sun (origin = centre) ----------
// o: mood, walk 0..1 (legs + briefcase), wink
function drawSun(ctx, t, o = {}) {
  const rot = t * 0.4;
  if (o.walk) { // little legs + briefcase
    for (const sx of [-1, 1]) { ctx.save(); ctx.translate(sx * 40, 150); ctx.rotate(Math.sin(t * 10 + (sx > 0 ? Math.PI : 0)) * 0.4); rbx(ctx, -10, 0, 20, 90, 10, K2.sunD, 7); rbx(ctx, -16, 82, 40, 18, 8, '#3a2a1a', 6); ctx.restore(); }
    ctx.save(); ctx.translate(150, 100 + Math.sin(t * 10) * 6); rbx(ctx, -50, 0, 100, 70, 10, '#7a4a2a', 8); rbx(ctx, -20, -20, 40, 24, 8, null, 7); ctx.restore();
  }
  ctx.save(); ctx.rotate(rot);
  for (let i = 0; i < 12; i++) { ctx.rotate(Math.PI / 6); ctx.beginPath(); ctx.moveTo(-22, -150); ctx.lineTo(0, -205 - (i % 2) * 20); ctx.lineTo(22, -150); ctx.closePath(); pt(ctx, K2.sunD, 7); }
  ctx.restore();
  ell(ctx, 0, 0, 150, 150, 0, K2.sun);
  ctx.globalAlpha = 0.35; ell(ctx, -50, -60, 50, 30, -0.5, '#fff', 0); ctx.globalAlpha = 1;
  face(ctx, 0, 10, 1.9, o.mood || 'happy', t);
  if (o.mood === 'sleepy') { ctx.font = '60px Lilita'; ctx.fillStyle = '#fff'; ctx.lineWidth = 8; ctx.strokeStyle = K2.ink; const k = (t * 0.8) % 1; ctx.globalAlpha = Math.sin(k * Math.PI); ctx.strokeText('z', 120 + k * 40, -120 - k * 80); ctx.fillText('z', 120 + k * 40, -120 - k * 80); ctx.globalAlpha = 1; }
}
// ---------- utility worker (front view on a pole; origin = feet) ----------
function drawWorker(ctx, t, o = {}) {
  rbx(ctx, -44, -180, 40, 180, 16, '#2f4a7a'); rbx(ctx, 4, -180, 40, 180, 16, '#2f4a7a'); rbx(ctx, -54, -16, 54, 22, 10, '#222'); rbx(ctx, 4, -16, 54, 22, 10, '#222');
  rbx(ctx, -72, -380, 144, 220, 44, K2.vest); rbx(ctx, -72, -300, 144, 18, 0, K2.vestL, 0); rbx(ctx, -72, -250, 144, 18, 0, K2.vestL, 0);
  const wrench = o.work ? Math.sin(t * 9) * 0.35 : 0;
  ctx.save(); ctx.translate(-64, -360); ctx.rotate(0.3); rbx(ctx, -18, 0, 36, 140, 18, K2.vest); ell(ctx, 0, 146, 20, 20, 0, K2.skin, 7); ctx.restore();
  ctx.save(); ctx.translate(64, -360); ctx.rotate(-2.3 + wrench); rbx(ctx, -18, 0, 36, 140, 18, K2.vest); ell(ctx, 0, 146, 20, 20, 0, K2.skin, 7); rbx(ctx, -8, 150, 16, 80, 6, '#9aa3ad', 6); ctx.restore();
  ell(ctx, 0, -440, 66, 70, 0, K2.skin);
  ctx.beginPath(); ctx.ellipse(0, -478, 80, 26, 0, Math.PI, 0); ctx.lineTo(80, -470); ctx.lineTo(-80, -470); ctx.closePath(); pt(ctx, K2.hat); rbx(ctx, -84, -478, 168, 16, 8, K2.hat, 7);
  face(ctx, 0, -430, 1.05, o.mood || 'calm', t, { ph: o.ph || 0 });
}
// ---------- inverter face (drawn on the box front; origin = centre) ----------
// o: mood, shield 0..1, bow 0..1 (tie + bow), flip (back-and-forth arrows)
function drawInverterFace(ctx, t, o = {}) {
  rbx(ctx, -150, -150, 300, 300, 30, 'rgba(255,255,255,0.0)', 0);
  face(ctx, 0, -10, 1.6, o.mood || 'happy', t);
  if (o.bow) { ctx.save(); ctx.translate(0, 95); ctx.scale(o.bow, o.bow); ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(-48, -26); ctx.lineTo(-48, 26); ctx.closePath(); pt(ctx, K2.red, 7); ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(48, -26); ctx.lineTo(48, 26); ctx.closePath(); pt(ctx, K2.red, 7); ell(ctx, 0, 0, 12, 12, 0, '#c22', 6); ctx.restore(); }
  if (o.shield) { ctx.save(); ctx.translate(95, 30); ctx.rotate(-0.15); ctx.scale(o.shield, o.shield);
    ctx.beginPath(); ctx.moveTo(0, -80); ctx.lineTo(62, -56); ctx.quadraticCurveTo(62, 40, 0, 84); ctx.quadraticCurveTo(-62, 40, -62, -56); ctx.closePath(); pt(ctx, K2.green, 8);
    ctx.font = '30px Lilita'; ctx.textAlign = 'center'; ctx.fillStyle = '#fff'; ctx.fillText('SAFETY', 0, -6); ctx.fillText('OFF', 0, 28); ctx.restore(); }
}
// ---------- appliance faces ----------
function drawApplianceFace(ctx, t, o = {}) { face(ctx, 0, 0, 1.3, o.mood || 'unimpressed', t, { ph: o.ph || 0, blush: false }); }

// ================= overlays =================
function qmark(ctx, t, t0) { const k = E.outBack(seg(t, t0, t0 + 0.35), 2); if (k <= 0) return; ctx.save(); ctx.translate(780, 800 + Math.sin(t * 3) * 10); ctx.rotate(0.15 + Math.sin(t * 2) * 0.05); ctx.scale(k, k); text(ctx, '?', 0, 0, 320, K2.yellow, { lw: 30 }); ctx.restore(); }
function tag(ctx, s, x, y, k, bg = '#1b1f3b', fg = '#ffd23f', size = 64, rot = -0.04) { if (k <= 0) return; ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(k, k); ctx.font = `${size}px Lilita`; const w = ctx.measureText(s).width + 60; ctx.beginPath(); ctx.roundRect(-w / 2, -size * 0.8, w, size * 1.6, size * 0.4); ctx.fillStyle = bg; ctx.fill(); ctx.lineWidth = 6; ctx.strokeStyle = '#fff'; ctx.stroke(); text(ctx, s, 0, 4, size, fg, { lw: 0 }); ctx.restore(); }
function stampMk(ctx, s, x, y, k, col = '#ff4d4d') { if (k <= 0) return; ctx.save(); ctx.translate(x, y); ctx.rotate(-0.16); ctx.scale(k * (1 + (1 - Math.min(1, k)) * 0.5), k); ctx.font = '84px Lilita'; const w = ctx.measureText(s).width + 70; ctx.beginPath(); ctx.roundRect(-w / 2, -70, w, 140, 20); ctx.lineWidth = 12; ctx.strokeStyle = col; ctx.stroke(); text(ctx, s, 0, 6, 84, col, { lw: 0 }); ctx.restore(); }
function batteryStack(ctx, t, n, x, y) { // toy batteries stacking up + voltage bar
  for (let i = 0; i < n; i++) { const k = E.outBack(clamp((n - i) * 1), 1.6); ctx.save(); ctx.translate(x, y - i * 64); ctx.beginPath(); ctx.roundRect(-110, -26, 220, 52, 14); ctx.fillStyle = '#2b2b33'; ctx.fill(); ctx.lineWidth = 6; ctx.strokeStyle = '#fff'; ctx.stroke(); ctx.fillStyle = '#ffd23f'; ctx.fillRect(30, -24, 76, 48); ctx.fillStyle = '#ddd'; ctx.fillRect(110, -12, 14, 24); text(ctx, '+', 68, 2, 40, '#2b2b33', { lw: 0 }); text(ctx, '1.5V', -40, 2, 34, '#fff', { lw: 0 }); ctx.restore(); }
  text(ctx, `${(n * 1.5).toFixed(1)} V`, x, y - n * 64 - 40, 64, '#ffd23f', { lw: 12 });
}
function scoreboard(ctx, t, x, y, k, inV, outV) { if (k <= 0) return; ctx.save(); ctx.translate(x, y); ctx.scale(k, k); ctx.beginPath(); ctx.roundRect(-300, -110, 600, 220, 26); ctx.fillStyle = '#1b1f3b'; ctx.fill(); ctx.lineWidth = 8; ctx.strokeStyle = '#ffd23f'; ctx.stroke();
  text(ctx, 'IN', -150, -60, 40, '#3fa9ff', { lw: 0 }); text(ctx, 'OUT', 150, -60, 40, '#ffd23f', { lw: 0 }); text(ctx, String(inV).padStart(3, '0'), -150, 30, 96, '#3fa9ff', { lw: 0 }); text(ctx, String(outV).padStart(3, '0'), 150, 30, 96, '#ffd23f', { lw: 0 });
  text(ctx, '←', -150, -60 + 46, 1, '#3fa9ff', { lw: 0 }); ctx.restore(); }
function dangerSign(ctx, t, x, y, k) { if (k <= 0) return; ctx.save(); ctx.translate(x, y); ctx.scale(k, k); ctx.rotate(Math.sin(t * 12) * 0.04); ctx.beginPath(); ctx.moveTo(0, -150); ctx.lineTo(150, 110); ctx.lineTo(-150, 110); ctx.closePath(); ctx.fillStyle = '#ffd23f'; ctx.fill(); ctx.lineWidth = 14; ctx.strokeStyle = '#ff4d4d'; ctx.stroke();
  ctx.beginPath(); ctx.moveTo(14, -80); ctx.lineTo(-30, 10); ctx.lineTo(4, 10); ctx.lineTo(-14, 80); ctx.lineTo(36, -10); ctx.lineTo(2, -10); ctx.closePath(); ctx.fillStyle = '#1b1f3b'; ctx.fill(); text(ctx, 'DANGER', 0, 170, 64, '#ff4d4d', { lw: 12 }); ctx.restore(); }
// subscribe button with bell (same as the turtle video)
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
