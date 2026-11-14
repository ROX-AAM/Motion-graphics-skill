// Storybook forest art: Tutu (bunny), Misti (squirrel), apple, forest. Characters stand with feet at (0,0).
const INK = C.ink;
function grad(ctx, x, y, r, c0, c1, ox = -0.35, oy = -0.45) { const g = ctx.createRadialGradient(x + r * ox, y + r * oy, r * 0.1, x, y, r * 1.1); g.addColorStop(0, c0); g.addColorStop(1, c1); return g; }
function heart(ctx, x, y, s, fill = C.pink, lw = 6) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s); ctx.beginPath(); ctx.moveTo(0, 30);
  ctx.bezierCurveTo(-60, -10, -30, -55, 0, -22); ctx.bezierCurveTo(30, -55, 60, -10, 0, 30); ctx.restore(); paint(ctx, fill, lw);
}
// big glossy storybook eye
function bigEye(ctx, x, y, rx, ry, look, o = {}) {
  if (o.closed) { ctx.beginPath(); ctx.arc(x, y + ry * 0.2, rx * 0.95, 1.1 * Math.PI, 1.9 * Math.PI); paint(ctx, null, 7); return; }
  ctx.beginPath(); ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2); ctx.fillStyle = '#fff'; ctx.fill(); ctx.lineWidth = 5; ctx.strokeStyle = INK; ctx.stroke();
  const ix = x + look[0] * rx * 0.28, iy = y + look[1] * ry * 0.22, ir = Math.min(rx, ry) * (o.big ? 0.86 : 0.74);
  const g = ctx.createRadialGradient(ix, iy + ir * 0.3, ir * 0.1, ix, iy, ir); g.addColorStop(0, o.iris2 || '#8a5a3a'); g.addColorStop(1, o.iris || '#3b2416');
  ctx.save(); ctx.beginPath(); ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2); ctx.clip();
  ctx.beginPath(); ctx.ellipse(ix, iy, ir, ir * 1.12, 0, 0, Math.PI * 2); ctx.fillStyle = g; ctx.fill();
  circle(ctx, ix, iy + ir * 0.05, ir * 0.48, '#1a0f0a', 0);
  circle(ctx, ix - ir * 0.32, iy - ir * 0.38, ir * 0.3, '#fff', 0);
  circle(ctx, ix + ir * 0.35, iy + ir * 0.3, ir * 0.13, '#fff', 0);
  if (o.big) circle(ctx, ix + ir * 0.1, iy - ir * 0.55, ir * 0.12, '#fff', 0);
  ctx.restore();
  if (o.tear) alpha(ctx, o.tear, () => { ctx.beginPath(); ctx.ellipse(x, y + ry * 0.85, rx * 0.9, ry * 0.18, 0, 0, Math.PI); ctx.fillStyle = 'rgba(160,230,255,0.75)'; ctx.fill(); });
}

// ---------- Tutu the bunny ----------
// o: look [x,y], mouth 'smile'|'grin'|'o'|'open'|'chew'|'lick', eyes 'open'|'closed'|'wide', ears 0..1 wiggle, arms 'down'|'hold'|'offer'|'up'|'hug'
//    squash (−1..1: <0 squash, >0 stretch), blush
function tutu(ctx, t, o = {}) {
  const sq = o.squash || 0, sx = 1 - sq * 0.12, sy = 1 + sq * 0.14, look = o.look || [0, 0];
  alpha(ctx, 0.25, () => ellipse(ctx, 0, 4, 120 * (1 - (o.lift || 0) * 0.4), 20, '#2a4a1a', 0));
  ctx.save(); ctx.translate(0, -(o.lift || 0) * 120); ctx.scale(sx, sy);
  const W_ = '#fffaf3', W2 = '#e9dccd';
  // tail
  circle(ctx, -95, -95, 34, grad(ctx, -95, -95, 34, '#ffffff', W2), 6);
  // feet
  ellipse(ctx, -52, -12, 46, 22, grad(ctx, -52, -12, 46, W_, W2), 6); ellipse(ctx, 52, -12, 46, 22, grad(ctx, 52, -12, 46, W_, W2), 6);
  // body
  ellipse(ctx, 0, -100, 96, 102, grad(ctx, 0, -100, 102, W_, W2), 7);
  ellipse(ctx, 0, -80, 58, 66, 'rgba(255,255,255,0.9)', 0);
  // ears
  const ew = o.ears ? Math.sin(t * 9) * 0.12 * o.ears : 0;
  for (const s of [-1, 1]) {
    ctx.save(); ctx.translate(s * 42, -290); ctx.rotate(s * 0.18 + ew * s + (s > 0 ? Math.sin(t * 1.3) * 0.05 : 0));
    ellipse(ctx, 0, -95, 34, 105, grad(ctx, 0, -95, 105, W_, W2), 7); ellipse(ctx, 0, -88, 17, 78, '#ffb3c7', 0);
    ctx.restore();
  }
  // head
  circle(ctx, 0, -222, 104, grad(ctx, 0, -222, 104, '#ffffff', W2), 7);
  alpha(ctx, 0.6, () => { ellipse(ctx, -62, -190, 22, 14, '#ffa3bd', 0); ellipse(ctx, 62, -190, 22, 14, '#ffa3bd', 0); });
  const eo = o.eyes || 'open';
  bigEye(ctx, -38, -236, eo === 'wide' ? 30 : 26, eo === 'wide' ? 38 : 33, look, { closed: eo === 'closed', iris: '#2a3d7a', iris2: '#5a86d6', big: eo === 'wide' });
  bigEye(ctx, 38, -236, eo === 'wide' ? 30 : 26, eo === 'wide' ? 38 : 33, look, { closed: eo === 'closed', iris: '#2a3d7a', iris2: '#5a86d6', big: eo === 'wide' });
  // nose + mouth
  ctx.beginPath(); ctx.moveTo(-11, -200); ctx.quadraticCurveTo(0, -207, 11, -200); ctx.quadraticCurveTo(0, -186, -11, -200); paint(ctx, '#ff7fa3', 4);
  const m = o.mouth || 'smile';
  if (m === 'smile' || m === 'grin') {
    ctx.beginPath(); ctx.moveTo(0, -190); ctx.lineTo(0, -182); ctx.moveTo(-24, -184); ctx.quadraticCurveTo(-12, -170, 0, -182); ctx.quadraticCurveTo(12, -170, 24, -184); paint(ctx, null, 5);
    if (m === 'grin') { rr(ctx, -11, -181, 22, 17, 4); paint(ctx, '#fff', 4); }
  } else if (m === 'o') { ellipse(ctx, 0, -172, 12, 15, '#a3354f', 5); }
  else if (m === 'open') { ctx.beginPath(); ctx.ellipse(0, -168, 24, 20, 0, 0, Math.PI * 2); paint(ctx, '#a3354f', 5); ellipse(ctx, 0, -158, 12, 7, '#ff8fa8', 0); rr(ctx, -11, -188, 22, 15, 4); paint(ctx, '#fff', 4); }
  else if (m === 'chew') { const k = Math.abs(Math.sin(t * 10)); ctx.beginPath(); ctx.ellipse(0, -176, 18, 5 + k * 9, 0, 0, Math.PI * 2); paint(ctx, '#a3354f', 5); }
  else if (m === 'lick') { ctx.beginPath(); ctx.moveTo(-22, -182); ctx.quadraticCurveTo(0, -168, 22, -182); paint(ctx, null, 5); ellipse(ctx, 12, -172, 9, 11, '#ff8fa8', 4); }
  // whiskers
  ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(58,35,71,0.6)'; for (const s of [-1, 1]) for (const dy of [-4, 8]) { ctx.beginPath(); ctx.moveTo(s * 34, -194 + dy); ctx.lineTo(s * 84, -200 + dy * 1.6); ctx.stroke(); }
  // arms
  const arm = (x0, y0, x1, y1) => { ctx.beginPath(); ctx.moveTo(x0, y0); ctx.quadraticCurveTo((x0 + x1) / 2 + 10, y1 + 30, x1, y1); ctx.lineCap = 'round'; ctx.lineWidth = 44; ctx.strokeStyle = INK; ctx.stroke(); ctx.lineWidth = 32; ctx.strokeStyle = W_; ctx.stroke(); };
  const a = o.arms || 'down';
  if (a === 'down') { arm(-70, -140, -78, -70); arm(70, -140, 78, -70); }
  else if (a === 'hold') { arm(-70, -140, -40, -150); arm(70, -140, 40, -150); }
  else if (a === 'hug') { arm(-70, -140, -20, -110); arm(70, -140, 20, -110); }
  else if (a === 'offer') { arm(-70, -140, -78, -70); arm(70, -140, 150, -150); }
  else if (a === 'up') { arm(-70, -140, -120, -250); arm(70, -140, 120, -250); }
  ctx.restore();
}

// ---------- Misti the squirrel ----------
function misti(ctx, t, o = {}) {
  const sq = o.squash || 0, look = o.look || [0, 0];
  const O1 = '#f29a55', O2 = '#c8662c', CR = '#fff0d6';
  alpha(ctx, 0.25 * (o.shadow ?? 1), () => ellipse(ctx, 0, 4, 100 * (1 - (o.lift || 0) * 0.4), 18, '#2a4a1a', 0));
  ctx.save(); ctx.translate(0, -(o.lift || 0) * 120); ctx.scale(1 - sq * 0.12, 1 + sq * 0.14);
  // tail (behind)
  const sw = Math.sin(t * 2.2) * 0.08 + (o.tailWag ? Math.sin(t * 12) * 0.12 * o.tailWag : 0);
  ctx.save(); ctx.translate(-50, -50); ctx.rotate(sw);
  ctx.beginPath(); ctx.moveTo(0, 0); ctx.bezierCurveTo(-150, -20, -170, -200, -90, -300); ctx.bezierCurveTo(-30, -370, 80, -330, 60, -260);
  ctx.bezierCurveTo(40, -220, -10, -250, -10, -220); ctx.bezierCurveTo(-60, -180, -40, -60, 40, -30); ctx.closePath();
  ctx.fillStyle = grad(ctx, -60, -180, 200, '#ffb877', O2, 0.2, -0.3); ctx.fill(); ctx.lineWidth = 7; ctx.strokeStyle = INK; ctx.stroke();
  ctx.beginPath(); ctx.moveTo(-20, -30); ctx.bezierCurveTo(-110, -60, -110, -200, -70, -270); ctx.lineWidth = 14; ctx.strokeStyle = 'rgba(255,230,190,0.6)'; ctx.stroke();
  ctx.restore();
  // feet + body
  ellipse(ctx, -36, -10, 34, 16, O2, 6); ellipse(ctx, 36, -10, 34, 16, O2, 6);
  ellipse(ctx, 0, -88, 72, 86, grad(ctx, 0, -88, 86, '#ffb877', O1), 7);
  ellipse(ctx, 0, -76, 44, 58, CR, 0);
  // ears with tufts
  for (const s of [-1, 1]) { ctx.beginPath(); ctx.moveTo(s * 30, -258); ctx.lineTo(s * 62, -322 - (o.earUp || 0) * 10); ctx.lineTo(s * 78, -246); ctx.closePath(); paint(ctx, O1, 6); ctx.beginPath(); ctx.moveTo(s * 44, -260); ctx.lineTo(s * 62, -306); ctx.lineTo(s * 68, -256); ctx.closePath(); ctx.fillStyle = '#ffc6a0'; ctx.fill(); }
  // head
  circle(ctx, 0, -205, 84, grad(ctx, 0, -205, 84, '#ffb877', O1), 7);
  ellipse(ctx, 0, -172, 50, 34, CR, 0);
  alpha(ctx, 0.6, () => { ellipse(ctx, -54, -176, 17, 11, '#ff8fa8', 0); ellipse(ctx, 54, -176, 17, 11, '#ff8fa8', 0); });
  const eo = o.eyes || 'open', big = eo === 'big';
  bigEye(ctx, -32, -218, big ? 29 : 24, big ? 36 : 30, look, { closed: eo === 'closed', iris: '#3b2416', iris2: '#9a6a3a', big, tear: o.tear });
  bigEye(ctx, 32, -218, big ? 29 : 24, big ? 36 : 30, look, { closed: eo === 'closed', iris: '#3b2416', iris2: '#9a6a3a', big, tear: o.tear });
  ellipse(ctx, 0, -186, 11, 8, '#3a2347', 0);
  const m = o.mouth || 'smile';
  if (m === 'smile') { ctx.beginPath(); ctx.moveTo(-16, -170); ctx.quadraticCurveTo(0, -158, 16, -170); paint(ctx, null, 5); }
  else if (m === 'shy') { ctx.beginPath(); ctx.moveTo(-10, -166); ctx.quadraticCurveTo(0, -162, 10, -166); paint(ctx, null, 5); }
  else if (m === 'o') ellipse(ctx, 0, -164, 9, 11, '#a3354f', 4);
  else if (m === 'grin') { ctx.beginPath(); ctx.moveTo(-22, -172); ctx.quadraticCurveTo(0, -140, 22, -172); ctx.closePath(); paint(ctx, '#a3354f', 5); }
  else if (m === 'chew') { const k = Math.abs(Math.sin(t * 11 + 1)); ellipse(ctx, 0, -166, 14, 4 + k * 8, '#a3354f', 4); }
  // paws
  const paw = (x0, y0, x1, y1) => { ctx.beginPath(); ctx.moveTo(x0, y0); ctx.quadraticCurveTo((x0 + x1) / 2, y1 + 20, x1, y1); ctx.lineCap = 'round'; ctx.lineWidth = 34; ctx.strokeStyle = INK; ctx.stroke(); ctx.lineWidth = 23; ctx.strokeStyle = O1; ctx.stroke(); };
  const a = o.arms || 'chest';
  if (a === 'chest') { paw(-50, -130, -14, -128); paw(50, -130, 14, -128); }
  else if (a === 'hold') { paw(-50, -130, -34, -140); paw(50, -130, 34, -140); }
  else if (a === 'reach') { paw(-50, -130, -14, -128); paw(50, -130, -130 * (o.reachDir || -1) * -1, -150); }
  else if (a === 'up') { paw(-50, -130, -100, -230); paw(50, -130, 100, -230); }
  ctx.restore();
}

// ---------- apple ----------
function applePath(r) {
  const p = new Path2D();
  p.moveTo(0, -0.7 * r);
  p.bezierCurveTo(0.55 * r, -1.15 * r, 1.25 * r, -0.55 * r, 1.0 * r, 0.25 * r);
  p.bezierCurveTo(0.8 * r, 0.95 * r, 0.25 * r, 1.05 * r, 0, 0.9 * r);
  p.bezierCurveTo(-0.25 * r, 1.05 * r, -0.8 * r, 0.95 * r, -1.0 * r, 0.25 * r);
  p.bezierCurveTo(-1.25 * r, -0.55 * r, -0.55 * r, -1.15 * r, 0, -0.7 * r);
  return p;
}
function appleSkin(ctx, r) { const g = ctx.createRadialGradient(-0.35 * r, -0.35 * r, r * 0.05, 0, 0, r * 1.15); g.addColorStop(0, '#ff8a80'); g.addColorStop(0.45, '#e8242f'); g.addColorStop(1, '#9e0f1d'); return g; }
function apple(ctx, t, r = 90, glow = 0) {
  if (glow) alpha(ctx, glow, () => { const g = ctx.createRadialGradient(0, 0, r * 0.5, 0, 0, r * 2.4); g.addColorStop(0, 'rgba(255,240,150,0.8)'); g.addColorStop(1, 'rgba(255,240,150,0)'); ctx.fillStyle = g; ctx.fillRect(-r * 2.5, -r * 2.5, r * 5, r * 5); });
  const p = applePath(r);
  ctx.fillStyle = appleSkin(ctx, r); ctx.fill(p); ctx.lineWidth = 7; ctx.strokeStyle = INK; ctx.stroke(p);
  alpha(ctx, 0.8, () => ellipse(ctx, -0.42 * r, -0.4 * r, 0.16 * r, 0.26 * r, '#fff', 0, -0.5));
  circle(ctx, -0.2 * r, -0.62 * r, 0.06 * r, 'rgba(255,255,255,0.8)', 0);
  ctx.beginPath(); ctx.moveTo(0, -0.68 * r); ctx.quadraticCurveTo(0.05 * r, -0.95 * r, 0.18 * r, -1.1 * r); ctx.lineWidth = 0.1 * r; ctx.strokeStyle = '#6b3b1f'; ctx.lineCap = 'round'; ctx.stroke();
  ctx.beginPath(); ctx.moveTo(0.1 * r, -0.92 * r); ctx.quadraticCurveTo(0.45 * r, -1.25 * r, 0.75 * r, -1.0 * r); ctx.quadraticCurveTo(0.45 * r, -0.75 * r, 0.1 * r, -0.92 * r); paint(ctx, '#4fbf4a', 5);
}
// half: side -1 (left half) or 1 (right half), cut face toward viewer; bites 0..3
const _off = typeof OffscreenCanvas !== 'undefined' ? new OffscreenCanvas(600, 600) : null;
function appleHalf(ctx, t, r, side, bites = 0) {
  const o = _off, c = o.getContext('2d'); c.setTransform(1, 0, 0, 1, 0, 0); c.clearRect(0, 0, 600, 600); c.translate(300, 300);
  const p = applePath(r);
  c.save(); c.beginPath(); c.rect(side < 0 ? -2 * r : 0, -2 * r, 2 * r, 4 * r); c.clip();
  c.fillStyle = appleSkin(c, r); c.fill(p);
  c.beginPath(); c.ellipse(0, 0.08 * r, 0.72 * r, 0.86 * r, 0, 0, Math.PI * 2); c.fillStyle = '#fff3cf'; c.fill();
  c.beginPath(); c.ellipse(side * 0.02 * r, 0.1 * r, 0.22 * r, 0.32 * r, 0, 0, Math.PI * 2); c.fillStyle = '#f6dc9c'; c.fill();
  for (const dy of [-0.12, 0.14, 0.34]) { c.beginPath(); c.ellipse(side * 0.08 * r, dy * r, 0.04 * r, 0.08 * r, 0, 0, Math.PI * 2); c.fillStyle = '#4a2a14'; c.fill(); }
  c.lineWidth = 7; c.strokeStyle = INK; c.stroke(p); c.beginPath(); c.moveTo(0, -0.72 * r); c.lineTo(0, 0.9 * r); c.stroke();
  c.restore();
  if (side > 0) { c.beginPath(); c.moveTo(0, -0.68 * r); c.quadraticCurveTo(0.05 * r, -0.95 * r, 0.18 * r, -1.1 * r); c.lineWidth = 0.1 * r; c.strokeStyle = '#6b3b1f'; c.lineCap = 'round'; c.stroke(); }
  // bites
  c.globalCompositeOperation = 'destination-out';
  const bp = [[side * 0.55, -0.62], [side * 0.92, -0.08], [side * 0.6, 0.62]];
  for (let i = 0; i < bites; i++) for (const [dx, dy] of [[0, 0], [0.16, 0.12], [-0.12, 0.14]]) { c.beginPath(); c.arc((bp[i][0] + dx * side) * r, (bp[i][1] + dy) * r, 0.2 * r, 0, Math.PI * 2); c.fill(); }
  c.globalCompositeOperation = 'source-over';
  ctx.drawImage(o, -300, -300);
}

// ---------- forest ----------
function sky(ctx, t, warm = 0) {
  const g = ctx.createLinearGradient(0, 0, 0, 1500); g.addColorStop(0, warm ? '#ffb37a' : '#7fd0ff'); g.addColorStop(0.6, warm ? '#ffd9a0' : '#c9ecff'); g.addColorStop(1, '#fff6d8');
  ctx.fillStyle = g; ctx.fillRect(-300, -300, W + 600, H + 600);
  // sun glow + rays
  ctx.save(); ctx.translate(860, 330);
  alpha(ctx, 0.5, () => { const s = ctx.createRadialGradient(0, 0, 40, 0, 0, 420); s.addColorStop(0, 'rgba(255,250,200,1)'); s.addColorStop(1, 'rgba(255,250,200,0)'); ctx.fillStyle = s; ctx.fillRect(-500, -500, 1000, 1000); });
  ctx.rotate(t * 0.05); ctx.fillStyle = 'rgba(255,255,230,0.18)';
  for (let i = 0; i < 10; i++) { ctx.rotate(Math.PI / 5); ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(1600, -110); ctx.lineTo(1600, 110); ctx.closePath(); ctx.fill(); }
  ctx.restore();
  circle(ctx, 860, 330, 80, '#fff4b0', 0);
  // clouds
  for (const [x0, y, s] of [[200, 260, 1], [700, 170, 0.7], [1050, 420, 0.8]]) {
    const x = ((x0 + t * 12 * s) % 1400) - 150;
    alpha(ctx, 0.9, () => { for (const [dx, dy, r] of [[0, 0, 50], [50, -20, 60], [110, 0, 48], [55, 18, 50]]) circle(ctx, x + dx * s, y + dy * s, r * s, '#ffffff', 0); });
  }
}
function hills(ctx, t, px = 0) {
  const layer = (y, amp, col, f, off) => { ctx.beginPath(); ctx.moveTo(-300, H); ctx.lineTo(-300, y); for (let x = -300; x <= W + 300; x += 30) ctx.lineTo(x, y + Math.sin((x + off) * f) * amp + Math.sin((x + off) * f * 2.3) * amp * 0.3); ctx.lineTo(W + 300, H); ctx.closePath(); ctx.fillStyle = col; ctx.fill(); };
  layer(1000, 40, '#bfe6a8', 0.006, px * 0.2);
  // distant round trees
  for (let i = 0; i < 9; i++) { const x = i * 150 - 60 + px * 0.35, y = 1010 + (i % 3) * 14; rr(ctx, x - 10, y - 10, 20, 70, 6); ctx.fillStyle = '#9b7a5a'; ctx.fill(); circle(ctx, x, y - 40, 62 + (i % 2) * 14, '#8fd27a', 0); circle(ctx, x - 25, y - 60, 30, '#a8e08e', 0); }
  layer(1120, 30, '#8fd27a', 0.009, 300 + px * 0.5);
}
function tree(ctx, t, s = 1, apples = true) {
  ctx.save(); ctx.scale(s, s);
  ctx.beginPath(); ctx.moveTo(-60, 0); ctx.quadraticCurveTo(-30, -150, -45, -380); ctx.lineTo(45, -380); ctx.quadraticCurveTo(30, -150, 60, 0); ctx.quadraticCurveTo(110, 20, 140, 10); ctx.lineTo(-140, 10); ctx.quadraticCurveTo(-110, 20, -60, 0); paint(ctx, grad(ctx, 0, -200, 300, '#b07a4f', '#7a4a2a'), 8);
  ctx.beginPath(); ctx.moveTo(-10, -60); ctx.quadraticCurveTo(-20, -160, 0, -260); ctx.lineWidth = 6; ctx.strokeStyle = 'rgba(58,35,71,0.35)'; ctx.stroke();
  const sway = Math.sin(t * 0.9) * 6;
  const blobs = [[-170, -440, 130], [0, -560, 170], [170, -450, 130], [-90, -620, 120], [100, -640, 110], [0, -420, 140]];
  for (const [x, y, r] of blobs) circle(ctx, x + sway, y, r + 8, INK, 0);
  for (const [x, y, r] of blobs) circle(ctx, x + sway, y, r, grad(ctx, x + sway, y, r, '#8fe07a', '#3f9a45'), 0);
  if (apples) for (const [x, y] of [[-150, -420], [80, -520], [160, -400], [-40, -630]]) at(ctx, x + sway, y, 1, 0, () => apple(ctx, t, 26));
  ctx.restore();
}
function bush(ctx, t, rustle = 0) {
  const w = rustle ? Math.sin(t * 30) * 8 * rustle : 0;
  const blobs = [[-150, -70, 90], [-50, -130, 105], [70, -120, 100], [160, -60, 85], [0, -50, 110]];
  for (const [x, y, r] of blobs) circle(ctx, x + w * (y / -100), y, r + 7, INK, 0);
  for (const [x, y, r] of blobs) circle(ctx, x + w * (y / -100), y, r, grad(ctx, x, y, r, '#7ad66a', '#2f8a3c'), 0);
  for (const [x, y] of [[-90, -110], [40, -150], [120, -70], [-20, -40]]) { circle(ctx, x + w, y, 12, '#ff5d8f', 4); }
}
function ground(ctx, t) {
  const g = ctx.createLinearGradient(0, 1380, 0, H); g.addColorStop(0, '#6fcf5c'); g.addColorStop(1, '#3f9a45');
  ctx.beginPath(); ctx.moveTo(-300, 1420); for (let x = -300; x <= W + 300; x += 40) ctx.lineTo(x, 1410 + Math.sin(x * 0.01) * 14); ctx.lineTo(W + 300, H + 300); ctx.lineTo(-300, H + 300); ctx.closePath(); ctx.fillStyle = g; ctx.fill();
  ctx.strokeStyle = '#4fae46'; ctx.lineWidth = 6; ctx.lineCap = 'round';
  const r = rng(9); for (let i = 0; i < 60; i++) { const x = r() * (W + 200) - 100, y = 1450 + r() * 420, h = 18 + r() * 22; ctx.beginPath(); ctx.moveTo(x, y); ctx.quadraticCurveTo(x + 6 + Math.sin(t * 2 + i) * 4, y - h / 2, x + Math.sin(t * 2 + i) * 6, y - h); ctx.stroke(); }
}
function flower(ctx, t, col, s = 1, ph = 0) {
  ctx.save(); ctx.scale(s, s); ctx.rotate(Math.sin(t * 1.5 + ph) * 0.08);
  ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(8, -40, 0, -80); ctx.lineWidth = 7; ctx.strokeStyle = '#3f9a45'; ctx.stroke();
  for (let i = 0; i < 5; i++) { const a = (i / 5) * Math.PI * 2; circle(ctx, Math.cos(a) * 20, -80 + Math.sin(a) * 20, 16, col, 4); }
  circle(ctx, 0, -80, 12, C.yellow, 4); ctx.restore();
}
function mushroom(ctx, s = 1) {
  ctx.save(); ctx.scale(s, s);
  rr(ctx, -20, -60, 40, 60, 14); paint(ctx, '#fff3e0', 6);
  ctx.beginPath(); ctx.moveTo(-70, -50); ctx.quadraticCurveTo(-60, -130, 0, -130); ctx.quadraticCurveTo(60, -130, 70, -50); ctx.closePath(); paint(ctx, '#ff5a5a', 6);
  for (const [x, y, r] of [[-30, -85, 12], [15, -105, 10], [40, -72, 9]]) circle(ctx, x, y, r, '#fff', 0);
  ctx.restore();
}
function butterfly(ctx, t, col, ph) {
  const f = Math.abs(Math.sin(t * 9 + ph));
  ctx.save(); ctx.scale(1, 1);
  for (const s of [-1, 1]) { ctx.save(); ctx.scale(s * (0.3 + 0.7 * f), 1); ellipse(ctx, 22, -12, 24, 18, col, 4); ellipse(ctx, 18, 14, 16, 12, col, 4); ctx.restore(); }
  ellipse(ctx, 0, 0, 5, 18, INK, 0); ctx.restore();
}
function fireflies(ctx, t, n = 18, a = 1) {
  const r = rng(77);
  for (let i = 0; i < n; i++) {
    const x0 = r() * W, y0 = 500 + r() * 1100, ph = r() * 6;
    const x = x0 + Math.sin(t * 0.7 + ph) * 40, y = y0 + Math.cos(t * 0.5 + ph) * 30, k = 0.5 + 0.5 * Math.sin(t * 3 + ph);
    alpha(ctx, a * k, () => { circle(ctx, x, y, 14, 'rgba(255,250,170,0.35)', 0); sparkle(ctx, x, y, 12, '#fffbd0'); });
  }
}
function leaves(ctx, t, a = 1, n = 26) {
  const r = rng(5), cols = ['#ff9f43', '#ffd23f', '#ff6b6b', '#f7b267'];
  for (let i = 0; i < n; i++) {
    const x0 = r() * W, sp = 90 + r() * 80, ph = r() * 6, col = cols[i % 4], s = 0.7 + r() * 0.6;
    const y = ((r() * H + t * sp) % (H + 200)) - 100, x = x0 + Math.sin(t * 1.2 + ph) * 70;
    alpha(ctx, a, () => at(ctx, x, y, s, t * 1.5 + ph, () => { ctx.beginPath(); ctx.moveTo(0, -26); ctx.quadraticCurveTo(22, 0, 0, 26); ctx.quadraticCurveTo(-22, 0, 0, -26); paint(ctx, col, 4); ctx.beginPath(); ctx.moveTo(0, -20); ctx.lineTo(0, 22); ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(58,35,71,0.5)'; ctx.stroke(); }));
  }
}
function rainbow(ctx, k) {
  const cols = ['#ff6b6b', '#ff9f43', '#ffd23f', '#6bd66b', '#5bc0ff', '#9b7bff'];
  ctx.save(); ctx.lineCap = 'round';
  cols.forEach((c, i) => { ctx.beginPath(); ctx.arc(540, 1250, 560 - i * 34, Math.PI, Math.PI + Math.PI * k); ctx.lineWidth = 36; ctx.strokeStyle = c; ctx.stroke(); });
  ctx.restore();
}
function followBtn(ctx, t, done) {
  rr(ctx, -260, -75, 520, 150, 75); paint(ctx, done ? C.green : '#ff3b5c', 9);
  text(ctx, done ? 'FOLLOWING ✓' : '+ FOLLOW', 0, 4, done ? 70 : 84, '#fff', { lw: 0 });
}
function pointer(ctx) {
  rr(ctx, -16, -120, 32, 110, 16); paint(ctx, '#ffd2b0', 6);
  rr(ctx, -50, -30, 100, 90, 36); paint(ctx, '#ffd2b0', 6);
  for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.moveTo(-30 + i * 22, -26); ctx.lineTo(-30 + i * 22, 0); ctx.lineWidth = 4; ctx.strokeStyle = 'rgba(58,35,71,0.5)'; ctx.stroke(); }
}
