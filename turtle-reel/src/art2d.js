// 2D cartoon characters (drawn onto card textures) + 2D overlay graphics. Bold outlines, big eyes.
const T2 = { ink: '#14213d', shell: '#4f9a5a', shellD: '#2f6e3f', shellL: '#8fd18a', skin: '#8fd3a0', skinD: '#5fae78', crab: '#ff6b4a', crabD: '#c8432a', gull: '#ffffff', gullD: '#c9d3df', beak: '#ffb02e', gold: '#ffd166', teal: '#5fe0d0' };
function pt(ctx, fill, lw = 9) { if (fill) { ctx.fillStyle = fill; ctx.fill(); } if (lw) { ctx.lineWidth = lw; ctx.strokeStyle = T2.ink; ctx.lineJoin = 'round'; ctx.lineCap = 'round'; ctx.stroke(); } }
function ell(ctx, x, y, rx, ry, rot, fill, lw = 9) { ctx.beginPath(); ctx.ellipse(x, y, rx, ry, rot, 0, Math.PI * 2); pt(ctx, fill, lw); }

// ---------- baby sea turtle (side view, facing right; origin = belly contact point) ----------
// o: crawl (phase, radians), pose 'crawl'|'swim'|'flail'|'still', eyes 'open'|'wide'|'tired'|'determined'|'happy'|'closed', shake 0..1, look [x,y]
function drawTurtle(ctx, t, o = {}) {
  const ph = o.crawl || 0, pose = o.pose || 'crawl', shake = (o.shake || 0) * Math.sin(t * 60) * 0.12;
  const flip = (base, amp, off) => base + Math.sin(ph + off) * amp;
  // back flipper
  let a1 = pose === 'swim' ? flip(0.9, 0.5, 1.5) : pose === 'flail' ? Math.sin(t * 22) * 0.8 + 0.4 : flip(0.5, 0.35, Math.PI) + shake;
  ctx.save(); ctx.translate(-120, -50); ctx.rotate(a1); ell(ctx, -40, 10, 60, 22, 0.3, T2.skinD); ctx.restore();
  // shell
  ctx.beginPath(); ctx.moveTo(-170, -50); ctx.bezierCurveTo(-170, -210, 150, -230, 150, -60); ctx.quadraticCurveTo(0, -20, -170, -50); pt(ctx, T2.shell);
  ctx.save(); ctx.clip(); ctx.fillStyle = T2.shellD;
  for (const [x, y] of [[-90, -130], [0, -150], [80, -120], [-30, -80], [50, -70], [-120, -75]]) { ctx.beginPath(); for (let i = 0; i < 6; i++) { const a = i * Math.PI / 3; ctx.lineTo(x + Math.cos(a) * 44, y + Math.sin(a) * 34); } ctx.closePath(); ctx.fill(); }
  ctx.globalAlpha = 0.35; ell(ctx, -30, -165, 90, 30, -0.1, T2.shellL, 0); ctx.restore();
  ctx.beginPath(); ctx.moveTo(-170, -50); ctx.bezierCurveTo(-170, -210, 150, -230, 150, -60); ctx.quadraticCurveTo(0, -20, -170, -50); pt(ctx, null);
  ell(ctx, -10, -40, 150, 18, 0.03, '#e8e2b8', 7);
  // head
  ctx.save(); ctx.translate(175, -95 + (pose === 'swim' ? -10 : 0) + Math.sin(ph * 2) * 4); ctx.rotate(o.headTilt || 0);
  ell(ctx, -40, 10, 50, 34, 0, T2.skin, 9);
  ell(ctx, 10, 0, 62, 54, 0, T2.skin);
  const lk = o.look || [0.3, 0];
  const e = o.eyes || 'open';
  if (e === 'closed' || e === 'happy') { ctx.beginPath(); ctx.arc(22, -12, 18, 1.1 * Math.PI, 1.9 * Math.PI); pt(ctx, null, 8); }
  else {
    const big = e === 'wide' ? 1.25 : 1;
    ell(ctx, 22, -14, 26 * big, 30 * big, 0, '#fff', 7);
    ell(ctx, 28 + lk[0] * 8, -12 + lk[1] * 8, 15 * big, 18 * big, 0, T2.ink, 0);
    ell(ctx, 22 + lk[0] * 8, -22 + lk[1] * 8, 6, 7, 0, '#fff', 0); ell(ctx, 34 + lk[0] * 8, -4 + lk[1] * 8, 3, 3, 0, '#fff', 0);
    if (e === 'tired') { ctx.save(); ctx.beginPath(); ctx.ellipse(22, -14, 26, 30, 0, 0, Math.PI * 2); ctx.clip(); ctx.fillStyle = T2.skinD; ctx.fillRect(-10, -50, 70, 34); ctx.restore(); ctx.beginPath(); ctx.moveTo(-4, -16); ctx.lineTo(48, -16); pt(ctx, null, 7); ell(ctx, 22, -14, 26, 30, 0, null, 7); }
    if (e === 'determined') { ctx.beginPath(); ctx.moveTo(-6, -50); ctx.lineTo(46, -38); pt(ctx, null, 9); }
  }
  // mouth
  ctx.beginPath();
  if (e === 'tired') { ctx.moveTo(40, 26); ctx.quadraticCurveTo(52, 20, 62, 26); }
  else if (e === 'wide') { ctx.ellipse(52, 26, 7, 9, 0, 0, Math.PI * 2); }
  else { ctx.moveTo(38, 22); ctx.quadraticCurveTo(52, 36, 64, 20); }
  pt(ctx, e === 'wide' ? '#7a2338' : null, 6);
  alpha(ctx, 0.5, () => ell(ctx, -6, 18, 12, 7, 0, '#ff8fa8', 0));
  ctx.restore();
  // front flipper
  let a2 = pose === 'swim' ? flip(-0.2, 0.7, 0) : pose === 'flail' ? Math.sin(t * 20 + 1) * 0.9 - 0.3 : flip(0.4, 0.45, 0) + shake;
  ctx.save(); ctx.translate(90, -55); ctx.rotate(a2); ell(ctx, 20, 30, 34, 78, -0.5, T2.skin); ctx.restore();
  if (o.sweat) alpha(ctx, o.sweat, () => { ctx.beginPath(); const y = -180 + ((t * 50) % 40); ctx.moveTo(240, y - 22); ctx.quadraticCurveTo(256, y, 240, y + 8); ctx.quadraticCurveTo(224, y, 240, y - 22); pt(ctx, '#9fe8ff', 6); });
}
// ---------- grumpy crab (front view; origin = feet) ----------
function drawCrab(ctx, t, o = {}) {
  const snap = Math.abs(Math.sin(t * 4)) * 0.25, sway = Math.sin(t * 3) * 6;
  for (const s of [-1, 1]) for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.moveTo(s * 60, -60 + i * 14); ctx.lineTo(s * (120 + i * 16), -40 + i * 18); ctx.lineTo(s * (140 + i * 16), 0); pt(ctx, null, 14); ctx.beginPath(); ctx.moveTo(s * 60, -60 + i * 14); ctx.lineTo(s * (120 + i * 16), -40 + i * 18); ctx.lineTo(s * (140 + i * 16), 0); ctx.lineWidth = 7; ctx.strokeStyle = T2.crab; ctx.stroke(); }
  ell(ctx, sway, -80, 120, 70, 0, T2.crab); ell(ctx, sway - 30, -110, 50, 18, -0.2, '#ff9a7a', 0);
  for (const s of [-1, 1]) { // claws
    ctx.save(); ctx.translate(s * 150 + sway, -150); ctx.rotate(s * (0.4 + snap));
    ell(ctx, 0, 0, 52, 40, 0, T2.crab); ctx.beginPath(); ctx.moveTo(s * 10, -10); ctx.lineTo(s * 50, -40); ctx.lineTo(s * 30, 0); ctx.closePath(); pt(ctx, T2.crabD, 6); ctx.restore();
    ctx.beginPath(); ctx.moveTo(s * 90 + sway, -110); ctx.lineTo(s * 140 + sway, -130); pt(ctx, null, 14);
    // eye stalks
    ctx.beginPath(); ctx.moveTo(s * 30 + sway, -140); ctx.lineTo(s * 40 + sway, -200); pt(ctx, null, 10);
    ell(ctx, s * 42 + sway, -215, 22, 24, 0, '#fff', 7); ell(ctx, s * 38 + sway, -212, 10, 12, 0, T2.ink, 0);
    ctx.beginPath(); ctx.moveTo(s * 18 + sway, -246 + (s > 0 ? -8 : 8) * -1); ctx.lineTo(s * 66 + sway, -232 + (s > 0 ? 8 : -8) * -1); pt(ctx, null, 9);
  }
  ctx.beginPath(); ctx.arc(sway, -50, 26, 1.15 * Math.PI, 1.85 * Math.PI); pt(ctx, null, 8);
}
// ---------- seagull (top-ish view, wings flapping) ----------
function drawGull(ctx, t) {
  const f = Math.sin(t * 7) * 0.35;
  for (const s of [-1, 1]) { ctx.save(); ctx.scale(s, 1); ctx.rotate(f); ctx.beginPath(); ctx.moveTo(20, -10); ctx.quadraticCurveTo(140, -90, 230, -30); ctx.quadraticCurveTo(140, -20, 20, 20); ctx.closePath(); pt(ctx, T2.gull); ctx.beginPath(); ctx.moveTo(180, -48); ctx.quadraticCurveTo(210, -40, 230, -30); ctx.quadraticCurveTo(205, -30, 175, -32); ctx.closePath(); pt(ctx, '#3a4352', 0); ctx.restore(); }
  ell(ctx, 0, 0, 34, 70, 0, T2.gull); ell(ctx, 0, -70, 26, 26, 0, T2.gull);
  ctx.beginPath(); ctx.moveTo(-8, -92); ctx.lineTo(0, -122); ctx.lineTo(8, -92); ctx.closePath(); pt(ctx, T2.beak, 6);
  ell(ctx, -10, -74, 5, 5, 0, T2.ink, 0); ell(ctx, 10, -74, 5, 5, 0, T2.ink, 0);
}

// ---------- overlay: 1,000 turtle icons ----------
let ICON = null;
function iconCanvas(col) { const c = new OffscreenCanvas(64, 64), x = c.getContext('2d'); x.translate(32, 36); x.fillStyle = col; x.beginPath(); x.ellipse(-2, 0, 18, 13, 0, 0, Math.PI * 2); x.fill(); x.beginPath(); x.arc(19, -3, 7, 0, Math.PI * 2); x.fill(); for (const [px, py, r] of [[10, 10, 0.6], [-14, 10, -0.6], [10, -10, -0.6], [-14, -10, 0.6]]) { x.save(); x.translate(px, py); x.rotate(r); x.beginPath(); x.ellipse(0, 0, 9, 4, 0, 0, Math.PI * 2); x.fill(); x.restore(); } return c; }
function thousand(ctx, t, t0, tEnd, keep) {
  if (!ICON) ICON = { w: iconCanvas('#cfe3ee'), g: iconCanvas('#ffd166') };
  const cols = 25, rows = 40, cw = 40, x0 = W / 2 - (cols * cw) / 2 + cw / 2, y0 = 300, r = rng(99), k = seg(t, t0, tEnd);
  for (let i = 0; i < cols * rows; i++) {
    const d = r(), x = x0 + (i % cols) * cw, y = y0 + Math.floor(i / cols) * cw;
    if (i === keep) continue;
    const a = clamp((d - k) * 8);
    if (a > 0.01) { ctx.globalAlpha = a * 0.8; ctx.drawImage(ICON.w, x - 16, y - 16, 32, 32); }
  }
  ctx.globalAlpha = 1;
  const x = x0 + (keep % cols) * cw, y = y0 + Math.floor(keep / cols) * cw, gl = seg(t, tEnd - 0.4, tEnd + 0.3);
  const s = 1 + gl * 0.6 + gl * 0.15 * Math.sin(t * 6);
  if (gl > 0) { const g = ctx.createRadialGradient(x, y, 0, x, y, 90 * s); g.addColorStop(0, `rgba(255,209,102,${0.7 * gl})`); g.addColorStop(1, 'rgba(255,209,102,0)'); ctx.fillStyle = g; ctx.fillRect(x - 100 * s, y - 100 * s, 200 * s, 200 * s); }
  ctx.drawImage(gl > 0 ? ICON.g : ICON.w, x - 16 * s, y - 16 * s, 32 * s, 32 * s);
  return [x, y];
}
// ---------- overlay: subscribe button with bell ----------
function subscribeBtn(ctx, t, t0) {
  const k = E.outBack(seg(t, t0, t0 + 0.35), 1.6), click = t0 + 0.9, done = t > click;
  if (k <= 0) return;
  ctx.save(); ctx.translate(540, 1050); ctx.scale(1.35 * k * (done && t < click + 0.15 ? 0.92 : 1), 1.35 * k);
  rr(ctx, -300, -80, 600, 160, 80); ctx.fillStyle = done ? '#3a3f4a' : '#e62117'; ctx.fill(); ctx.lineWidth = 8; ctx.strokeStyle = '#fff'; ctx.stroke();
  text(ctx, done ? 'SUBSCRIBED' : 'SUBSCRIBE', -40, 6, 66, '#fff', { lw: 0 });
  // bell
  ctx.save(); ctx.translate(220, 0); ctx.rotate(done ? Math.sin((t - click) * 30) * 0.4 * Math.max(0, 1 - (t - click) * 1.2) : 0);
  ctx.beginPath(); ctx.moveTo(-34, 30); ctx.quadraticCurveTo(-34, -40, 0, -44); ctx.quadraticCurveTo(34, -40, 34, 30); ctx.lineTo(44, 40); ctx.lineTo(-44, 40); ctx.closePath(); ctx.fillStyle = '#fff'; ctx.fill();
  ctx.beginPath(); ctx.arc(0, 48, 11, 0, Math.PI * 2); ctx.fill(); ctx.beginPath(); ctx.arc(0, -48, 7, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
  if (done) { const f = seg(t, click, click + 0.6); ctx.globalAlpha = 1 - f; for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4; sparkle(ctx, 220 + Math.cos(a) * 110 * f, Math.sin(a) * 110 * f, 18, '#ffd166'); } ctx.globalAlpha = 1; }
  ctx.restore();
  // cursor
  if (t < click + 0.5) { const m = E.outCubic(seg(t, t0 + 0.2, click)); ctx.save(); ctx.translate(lerp(960, 860, m), lerp(1400, 1090, m) + (t > click && t < click + 0.15 ? 10 : 0)); ctx.rotate(-0.4);
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, 90); ctx.lineTo(24, 68); ctx.lineTo(42, 104); ctx.lineTo(58, 96); ctx.lineTo(40, 60); ctx.lineTo(70, 60); ctx.closePath(); ctx.fillStyle = '#fff'; ctx.fill(); ctx.lineWidth = 6; ctx.strokeStyle = '#14213d'; ctx.stroke(); ctx.restore(); }
}
function sizeBracket(ctx, t, x, y, w, label, a) {
  if (a <= 0) return; ctx.save(); ctx.globalAlpha = a; ctx.strokeStyle = '#ffd166'; ctx.lineWidth = 6; ctx.setLineDash([16, 12]);
  ctx.beginPath(); ctx.moveTo(x - w / 2, y); ctx.lineTo(x + w / 2, y); ctx.stroke(); ctx.setLineDash([]);
  for (const s of [-1, 1]) { ctx.beginPath(); ctx.moveTo(x + s * w / 2, y - 20); ctx.lineTo(x + s * w / 2, y + 20); ctx.stroke(); }
  text(ctx, label, x, y - 52, 52, '#ffd166', { lw: 10 }); ctx.restore();
}
