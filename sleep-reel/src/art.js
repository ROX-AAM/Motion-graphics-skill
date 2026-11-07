// Character + props. Each draws around (0,0) in local units; callers place them with at().

// ---- the sleepy kid (head only; bodies/blankets are drawn by the scene) ----
// o: eyes 'open'|'closed'|'wide'|'tired'|'peek'|'shut', look [dx,dy], mouth 'smile'|'grin'|'flat'|'o'|'yawn'|'wobble'|'smug',
//    glow 0..1 (phone light), sweat 0..1, bags 0..1, blink (0..1 lid), veins 0..1, hairMess 0..1
function kid(ctx, t, o = {}) {
  const look = o.look || [0, 0], R = 120;
  // back hair
  ctx.beginPath(); ctx.ellipse(0, -18, R * 1.08, R * 1.02, 0, Math.PI * 0.9, Math.PI * 2.1); paint(ctx, C.hair, 8);
  // ears
  circle(ctx, -R + 4, 10, 26, C.skin); circle(ctx, R - 4, 10, 26, C.skin);
  // head
  circle(ctx, 0, 0, R, C.skin);
  // phone glow on face
  if (o.glow) alpha(ctx, o.glow, () => {
    ctx.save(); ctx.beginPath(); ctx.arc(0, 0, R - 4, 0, Math.PI * 2); ctx.clip();
    const g = ctx.createRadialGradient(0, 120, 10, 0, 60, 220); g.addColorStop(0, 'rgba(120,240,255,0.85)'); g.addColorStop(1, 'rgba(80,140,255,0.15)');
    ctx.fillStyle = g; ctx.fillRect(-R, -R, R * 2, R * 2); ctx.restore();
  });
  // front hair tufts (messier with hairMess)
  const m = o.hairMess || 0;
  ctx.beginPath(); ctx.moveTo(-R - 4, -10);
  const tufts = 6;
  for (let i = 0; i <= tufts; i++) {
    const a = Math.PI + (i / tufts) * Math.PI, rr_ = R + 14 + (i % 2 ? 22 + m * 40 * hash(i + 3) : 0);
    ctx.quadraticCurveTo(Math.cos(a - 0.2) * (R + 30 + m * 30), Math.sin(a - 0.2) * (R + 30 + m * 30) - 10, Math.cos(a) * rr_, Math.sin(a) * rr_ - 6);
  }
  ctx.quadraticCurveTo(R * 0.6, -R * 0.35, R * 0.15, -R * 0.55);
  ctx.quadraticCurveTo(-R * 0.3, -R * 0.2, -R - 4, -10); paint(ctx, C.hair, 8);
  // cowlick
  ctx.beginPath(); ctx.moveTo(-10, -R - 6); ctx.quadraticCurveTo(10 + wob(t, 0.5, 6), -R - 70 - m * 30, 50, -R - 50 - m * 20); ctx.quadraticCurveTo(20, -R - 30, 18, -R + 6); paint(ctx, C.hair, 7);
  // cheeks
  alpha(ctx, 0.55, () => { ellipse(ctx, -72, 42, 22, 13, C.pink, 0); ellipse(ctx, 72, 42, 22, 13, C.pink, 0); });
  // bags
  if (o.bags) alpha(ctx, o.bags, () => { ctx.strokeStyle = '#8a5cc7'; ctx.lineWidth = 6; for (const s of [-1, 1]) { ctx.beginPath(); ctx.arc(s * 46, 18, 30, 0.2 * Math.PI, 0.8 * Math.PI); ctx.stroke(); ctx.beginPath(); ctx.arc(s * 46, 26, 26, 0.25 * Math.PI, 0.75 * Math.PI); ctx.stroke(); } });
  // eyes
  const eye = (sx, kind) => {
    const x = sx * 46, y = -8;
    if (kind === 'closed') { ctx.beginPath(); ctx.arc(x, y - 4, 22, 0.15 * Math.PI, 0.85 * Math.PI); paint(ctx, null, 8); return; }
    if (kind === 'shut') { ctx.beginPath(); ctx.moveTo(x - 24, y); ctx.lineTo(x + 24, y); paint(ctx, null, 8); return; }
    const big = kind === 'wide', rx = big ? 40 : 30, ry = big ? 46 : 36;
    ellipse(ctx, x, y, rx, ry, '#ffffff', 7);
    if (o.veins) alpha(ctx, o.veins, () => { ctx.strokeStyle = C.red; ctx.lineWidth = 3; for (let i = 0; i < 4; i++) { const a = (i / 4) * Math.PI * 2 + 0.4; ctx.beginPath(); ctx.moveTo(x + Math.cos(a) * rx * 0.95, y + Math.sin(a) * ry * 0.95); ctx.lineTo(x + Math.cos(a + 0.15) * rx * 0.55, y + Math.sin(a + 0.15) * ry * 0.55); ctx.stroke(); } });
    const pr = big ? 11 : 15;
    circle(ctx, x + look[0] * rx * 0.45, y + look[1] * ry * 0.4, pr, C.ink, 0);
    circle(ctx, x + look[0] * rx * 0.45 + 5, y + look[1] * ry * 0.4 - 6, 5, '#fff', 0);
    // eyelid (tired / blink)
    const lid = kind === 'tired' ? 0.55 : 0;
    const k = Math.max(lid, o.blink || 0);
    if (k > 0.01) {
      ctx.save(); ctx.beginPath(); ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2); ctx.clip();
      ctx.fillStyle = C.skinD; ctx.fillRect(x - rx - 2, y - ry - 2, rx * 2 + 4, (ry * 2 + 4) * k); ctx.restore();
      ctx.beginPath(); ctx.moveTo(x - rx, y - ry + ry * 2 * k); ctx.lineTo(x + rx, y - ry + ry * 2 * k); paint(ctx, null, 7);
      ellipse(ctx, x, y, rx, ry, null, 7);
    }
  };
  const ek = o.eyes || 'open';
  if (ek === 'peek') { eye(-1, 'closed'); eye(1, 'open'); } else { eye(-1, ek); eye(1, ek); }
  // brows
  if (o.brows) { ctx.lineWidth = 8; ctx.strokeStyle = C.ink; for (const s of [-1, 1]) { ctx.beginPath(); ctx.moveTo(s * 70, -62 + (o.brows === 'worry' ? s * -8 : 0)); ctx.lineTo(s * 24, -66 - (o.brows === 'worry' ? s * -8 : 0)); ctx.stroke(); } }
  // mouth
  const mo = o.mouth || 'smile';
  ctx.beginPath();
  if (mo === 'smile') { ctx.arc(0, 40, 30, 0.15 * Math.PI, 0.85 * Math.PI); paint(ctx, null, 8); }
  else if (mo === 'grin') { ctx.moveTo(-40, 42); ctx.quadraticCurveTo(0, 100, 40, 42); ctx.closePath(); paint(ctx, '#7a2338', 7); }
  else if (mo === 'smug') { ctx.moveTo(-30, 54); ctx.quadraticCurveTo(10, 72, 38, 46); paint(ctx, null, 8); }
  else if (mo === 'flat') { ctx.moveTo(-26, 60); ctx.lineTo(26, 60); paint(ctx, null, 8); }
  else if (mo === 'o') { ctx.ellipse(0, 62, 16, 20, 0, 0, Math.PI * 2); paint(ctx, '#7a2338', 7); }
  else if (mo === 'yawn') { ctx.ellipse(0, 66, 30, 40, 0, 0, Math.PI * 2); paint(ctx, '#7a2338', 7); }
  else if (mo === 'wobble') { ctx.moveTo(-40, 62); for (let i = 1; i <= 8; i++) ctx.lineTo(-40 + i * 10, 62 + (i % 2 ? -9 : 9)); paint(ctx, null, 7); }
  // sweat drop
  if (o.sweat) alpha(ctx, o.sweat, () => {
    const dy = ((t * 0.9) % 1) * 40;
    ctx.beginPath(); const x = 104, y = -50 + dy; ctx.moveTo(x, y - 34); ctx.quadraticCurveTo(x + 22, y, x, y + 10); ctx.quadraticCurveTo(x - 22, y, x, y - 34); paint(ctx, '#9fe8ff', 6);
  });
}

// pajama torso (sitting up) with arms; hands at handL/handR (local coords)
function torso(ctx, t, handL = [-110, 180], handR = [110, 180]) {
  ctx.beginPath(); ctx.moveTo(-150, 380); ctx.quadraticCurveTo(-160, 150, -60, 120); ctx.lineTo(60, 120); ctx.quadraticCurveTo(160, 150, 150, 380); ctx.closePath(); paint(ctx, C.blue, 8);
  ctx.save(); ctx.clip(); for (let i = 0; i < 6; i++) star(ctx, -110 + (i % 3) * 110, 190 + Math.floor(i / 3) * 110, 16, C.yellow, 0); ctx.restore();
  for (const [sx, hd] of [[-1, handL], [1, handR]]) {
    ctx.beginPath(); ctx.moveTo(sx * 120, 170); ctx.quadraticCurveTo(sx * 150, hd[1] + 40, hd[0], hd[1]); ctx.lineWidth = 56; ctx.strokeStyle = C.ink; ctx.lineCap = 'round'; ctx.stroke(); ctx.lineWidth = 40; ctx.strokeStyle = C.blue; ctx.stroke();
  }
}
const hand = (ctx, x, y) => circle(ctx, x, y, 30, C.skin, 7);

// ---- bed: headboard + pillow + blanket (blanketTop y in local) ----
function bedBack(ctx) {
  rr(ctx, -470, -260, 940, 420, 60); paint(ctx, '#8b5a3c', 8);
  rr(ctx, -420, -210, 840, 300, 40); paint(ctx, '#a8714c', 6);
  rr(ctx, -300, -90, 600, 170, 70); paint(ctx, '#ffffff', 8);
}
function blanket(ctx, t, top = 40, breathe = 0) {
  const b = Math.sin(t * 1.4) * 6 * breathe;
  ctx.beginPath(); ctx.moveTo(-500, top + 40); ctx.quadraticCurveTo(-200, top - 30 - b, 0, top - 10 - b); ctx.quadraticCurveTo(250, top - 30 - b, 500, top + 40);
  ctx.lineTo(500, 700); ctx.lineTo(-500, 700); ctx.closePath(); paint(ctx, C.pink, 8);
  ctx.save(); ctx.clip();
  ctx.fillStyle = 'rgba(255,255,255,0.35)';
  for (let i = 0; i < 18; i++) { ctx.beginPath(); ctx.arc(-450 + (i % 6) * 180 + (Math.floor(i / 6) % 2) * 90, top + 90 + Math.floor(i / 6) * 120, 18, 0, Math.PI * 2); ctx.fill(); }
  ctx.restore();
  ctx.beginPath(); ctx.moveTo(-500, top + 70); ctx.quadraticCurveTo(0, top + 20 - b, 500, top + 70); ctx.lineWidth = 34; ctx.strokeStyle = '#fff'; ctx.stroke();
}

// ---- room bits ----
function windowFrame(ctx, t, w, h, sky, inner) {
  rr(ctx, -w / 2, -h / 2, w, h, 26); paint(ctx, '#7d5b9e', 10);
  ctx.save(); rr(ctx, -w / 2 + 22, -h / 2 + 22, w - 44, h - 44, 12); ctx.clip();
  const g = ctx.createLinearGradient(0, -h / 2, 0, h / 2); sky.forEach((c, i) => g.addColorStop(i / (sky.length - 1), c));
  ctx.fillStyle = g; ctx.fillRect(-w / 2, -h / 2, w, h);
  inner && inner(); ctx.restore();
  rr(ctx, -w / 2 + 22, -h / 2 + 22, w - 44, h - 44, 12); paint(ctx, null, 8);
  ctx.beginPath(); ctx.moveTo(0, -h / 2 + 22); ctx.lineTo(0, h / 2 - 22); ctx.moveTo(-w / 2 + 22, 0); ctx.lineTo(w / 2 - 22, 0); ctx.lineWidth = 16; ctx.strokeStyle = '#7d5b9e'; ctx.stroke(); ctx.lineWidth = 6; ctx.strokeStyle = C.ink; ctx.stroke();
}
function moon(ctx, t, r = 70) {
  alpha(ctx, 0.35, () => circle(ctx, 0, 0, r * 1.6, '#fff4b8', 0));
  ctx.save(); ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); paint(ctx, '#fff1a8', 7); ctx.clip(); circle(ctx, r * 0.55, -r * 0.35, r * 0.85, 'rgba(230,200,90,0.35)', 0); ctx.restore();
  circle(ctx, -18, -10, 6, C.ink, 0); circle(ctx, 18, -10, 6, C.ink, 0);
  ctx.beginPath(); ctx.arc(0, 8, 16, 0.15 * Math.PI, 0.85 * Math.PI); paint(ctx, null, 5);
}
function sun(ctx, t, r = 90, face = 'smug') {
  ctx.save(); ctx.rotate(t * 0.4);
  for (let i = 0; i < 12; i++) { ctx.rotate(Math.PI / 6); ctx.beginPath(); ctx.moveTo(-18, -r - 14); ctx.lineTo(0, -r - 60); ctx.lineTo(18, -r - 14); ctx.closePath(); paint(ctx, C.orange, 6); }
  ctx.restore();
  circle(ctx, 0, 0, r, C.yellow, 8);
  // sunglasses + smirk
  if (face === 'smug') {
    rr(ctx, -64, -30, 56, 34, 12); paint(ctx, C.ink, 0); rr(ctx, 8, -30, 56, 34, 12); paint(ctx, C.ink, 0);
    ctx.beginPath(); ctx.moveTo(-10, -16); ctx.lineTo(10, -16); ctx.lineWidth = 7; ctx.strokeStyle = C.ink; ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-28, 34); ctx.quadraticCurveTo(10, 56, 36, 26); paint(ctx, null, 7);
  } else {
    for (const s of [-1, 1]) { ctx.beginPath(); ctx.arc(s * 30, -12, 14, 1.1 * Math.PI, 1.9 * Math.PI); paint(ctx, null, 7); }
    ctx.beginPath(); ctx.arc(0, 18, 30, 0.15 * Math.PI, 0.85 * Math.PI); paint(ctx, null, 7);
  }
}
function nightstand(ctx, t, lampOn = 1) {
  rr(ctx, -120, 0, 240, 230, 20); paint(ctx, '#b07a52', 8);
  rr(ctx, -95, 40, 190, 70, 12); paint(ctx, '#c98e62', 6); circle(ctx, 0, 75, 9, C.ink, 0);
  // lamp
  rr(ctx, -70, -40, 30, 40, 6); paint(ctx, '#eee', 6);
  ctx.beginPath(); ctx.moveTo(-100, -40); ctx.lineTo(-10, -40); ctx.lineTo(-30, -130); ctx.lineTo(-80, -130); ctx.closePath(); paint(ctx, C.yellow, 7);
  if (lampOn) alpha(ctx, 0.25 * lampOn, () => circle(ctx, -55, -90, 130, '#fff3a0', 0));
}
// phone: back side (face down) or screen side with drawScreen(ctx,w,h)
function phone(ctx, t, w, h, o = {}) {
  if (o.glow) alpha(ctx, o.glow, () => { const g = ctx.createRadialGradient(0, 0, w * 0.2, 0, 0, w * 1.4); g.addColorStop(0, 'rgba(110,230,255,0.7)'); g.addColorStop(1, 'rgba(110,230,255,0)'); ctx.fillStyle = g; ctx.fillRect(-w * 1.5, -h, w * 3, h * 2); });
  rr(ctx, -w / 2, -h / 2, w, h, w * 0.16); paint(ctx, '#2b2b44', Math.max(6, w * 0.035));
  const m = w * 0.06;
  if (o.screen) {
    ctx.save(); rr(ctx, -w / 2 + m, -h / 2 + m, w - 2 * m, h - 2 * m, w * 0.11); ctx.clip();
    ctx.translate(-w / 2 + m, -h / 2 + m); o.screen(ctx, w - 2 * m, h - 2 * m); ctx.restore();
    rr(ctx, -w * 0.14, -h / 2 + m + 10, w * 0.28, w * 0.07, w * 0.035); paint(ctx, '#111', 0);
  } else { circle(ctx, -w * 0.22, -h * 0.36, w * 0.09, '#555577', 5); }
}
function alarmClock(ctx, t, label, o = {}) {
  const ring = o.ring ? Math.sin(t * 60) * 0.06 * o.ring : 0;
  ctx.save(); ctx.rotate(ring);
  for (const s of [-1, 1]) { ctx.beginPath(); ctx.arc(s * 120, -150, 60, Math.PI, 2 * Math.PI); paint(ctx, C.red, 8); }
  rr(ctx, -230, -150, 460, 300, 70); paint(ctx, C.red, 10);
  rr(ctx, -185, -105, 370, 210, 34); paint(ctx, '#1b1530', 8);
  text(ctx, label, 0, 4, o.size || 120, o.color || '#ff4f6a', { lw: 0, font: 'Lilita' });
  alpha(ctx, 0.25, () => text(ctx, label, 0, 4, o.size || 120, '#ff4f6a', { lw: 18, stroke: 'rgba(255,79,106,0.4)', shadow: false }));
  for (const s of [-1, 1]) { rr(ctx, s * 150 - 18, 140, 36, 50, 10); paint(ctx, C.ink, 0); }
  ctx.restore();
  if (o.ring) for (let i = 0; i < 3; i++) { ctx.beginPath(); const s = i % 2 ? 1 : -1; ctx.arc(0, -40, 300 + i * 34, s > 0 ? -0.5 : Math.PI + 0.2, s > 0 ? -0.2 : Math.PI + 0.5); ctx.lineWidth = 10; ctx.strokeStyle = C.yellow; ctx.stroke(); }
}
function siren(ctx, t) {
  const on = Math.floor(t * 6) % 2;
  alpha(ctx, 0.5, () => circle(ctx, 0, -40, 150, on ? 'rgba(255,71,87,0.6)' : 'rgba(54,226,255,0.5)', 0));
  rr(ctx, -110, 40, 220, 60, 16); paint(ctx, '#555577', 8);
  ctx.beginPath(); ctx.moveTo(-85, 40); ctx.lineTo(-85, -40); ctx.arc(0, -40, 85, Math.PI, 0); ctx.lineTo(85, 40); ctx.closePath(); paint(ctx, on ? C.red : '#ff8b95', 8);
  rr(ctx, -40, -70, 26, 70, 13); paint(ctx, 'rgba(255,255,255,0.7)', 0);
}
function warning(ctx) {
  ctx.beginPath(); ctx.moveTo(0, -120); ctx.lineTo(130, 100); ctx.lineTo(-130, 100); ctx.closePath(); paint(ctx, C.yellow, 12);
  text(ctx, '!', 0, 20, 150, C.ink, { lw: 0 });
}
function stopwatch(ctx, t, k) {
  rr(ctx, -26, -170, 52, 40, 8); paint(ctx, '#ccc', 7);
  circle(ctx, 0, 0, 140, '#fff', 10); circle(ctx, 0, 0, 112, '#f4f0ff', 5);
  for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2; ctx.beginPath(); ctx.moveTo(Math.sin(a) * 95, -Math.cos(a) * 95); ctx.lineTo(Math.sin(a) * 108, -Math.cos(a) * 108); ctx.lineWidth = 6; ctx.strokeStyle = C.ink; ctx.stroke(); }
  ctx.save(); ctx.beginPath(); ctx.moveTo(0, 0); ctx.arc(0, 0, 88, -Math.PI / 2, -Math.PI / 2 + k * Math.PI * 2); ctx.closePath(); ctx.fillStyle = 'rgba(255,93,162,0.5)'; ctx.fill(); ctx.restore();
  ctx.save(); ctx.rotate(k * Math.PI * 2); ctx.beginPath(); ctx.moveTo(0, 14); ctx.lineTo(0, -92); ctx.lineWidth = 9; ctx.strokeStyle = C.red; ctx.stroke(); ctx.restore();
  circle(ctx, 0, 0, 12, C.ink, 0);
}
function wallClock(ctx, t, hourA, minA, rimColor = C.cyan) {
  circle(ctx, 0, 0, 150, '#fff', 10); circle(ctx, 0, 0, 150, null, 0);
  ctx.beginPath(); ctx.arc(0, 0, 150, 0, Math.PI * 2); ctx.lineWidth = 22; ctx.strokeStyle = rimColor; ctx.stroke(); ctx.lineWidth = 8; ctx.strokeStyle = C.ink; ctx.beginPath(); ctx.arc(0, 0, 162, 0, Math.PI * 2); ctx.stroke();
  for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2; circle(ctx, Math.sin(a) * 118, -Math.cos(a) * 118, 7, C.ink, 0); }
  const hand_ = (a, len, w, col) => { ctx.save(); ctx.rotate(a); ctx.beginPath(); ctx.moveTo(0, 12); ctx.lineTo(0, -len); ctx.lineCap = 'round'; ctx.lineWidth = w + 6; ctx.strokeStyle = C.ink; ctx.stroke(); ctx.lineWidth = w; ctx.strokeStyle = col; ctx.stroke(); ctx.restore(); };
  hand_(hourA, 70, 14, C.purple); hand_(minA, 105, 10, C.pink); circle(ctx, 0, 0, 14, C.ink, 0);
}
// sea otter floating on its back; hold = paw toward partner side (dir)
function otter(ctx, t, dir = 1, ph = 0) {
  const bob = Math.sin(t * 2 + ph) * 6;
  ctx.save(); ctx.translate(0, bob); ctx.scale(dir, 1);
  ellipse(ctx, 0, 0, 150, 62, '#9a6a45', 8); // body
  ellipse(ctx, -10, -8, 96, 38, '#c99b72', 0); // belly
  ellipse(ctx, 150, -2, 46, 22, '#9a6a45', 7, -0.3); // tail
  circle(ctx, -150, -30, 68, '#9a6a45', 8); // head
  ellipse(ctx, -165, -12, 42, 34, '#efdcc6', 0); // face patch
  circle(ctx, -110, -84, 18, '#9a6a45', 6); circle(ctx, -196, -78, 18, '#9a6a45', 6); // ears
  // closed sleepy eyes
  ctx.beginPath(); ctx.arc(-182, -38, 11, 0.1 * Math.PI, 0.9 * Math.PI); ctx.moveTo(-130, -42); ctx.arc(-140, -42, 11, 0.1 * Math.PI, 0.9 * Math.PI); paint(ctx, null, 6);
  ellipse(ctx, -162, -14, 13, 9, C.ink, 0); // nose
  alpha(ctx, 0.6, () => { circle(ctx, -200, -8, 10, C.pink, 0); circle(ctx, -122, -10, 10, C.pink, 0); });
  // arm reaching to partner (dir handled by scale)
  ctx.beginPath(); ctx.moveTo(-60, -40); ctx.quadraticCurveTo(-20, -110, -60 + 0, -150); ctx.lineWidth = 34; ctx.strokeStyle = C.ink; ctx.lineCap = 'round'; ctx.stroke(); ctx.lineWidth = 22; ctx.strokeStyle = '#9a6a45'; ctx.stroke();
  ctx.restore();
}
function water(ctx, t, w, y0, col1 = '#3fb8ff', col2 = '#7fdcff') {
  ctx.fillStyle = col1; ctx.beginPath(); ctx.moveTo(0, y0);
  for (let x = 0; x <= w; x += 20) ctx.lineTo(x, y0 + Math.sin(x * 0.02 + t * 2) * 12);
  ctx.lineTo(w, 4000); ctx.lineTo(0, 4000); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = col2; ctx.lineWidth = 8; ctx.lineCap = 'round';
  for (let i = 0; i < 8; i++) { const x = ((i * 137 + t * 40) % (w + 100)) - 50, y = y0 + 60 + (i % 4) * 70; ctx.beginPath(); ctx.moveTo(x, y); ctx.quadraticCurveTo(x + 25, y - 14, x + 50, y); ctx.stroke(); }
}
function heart(ctx, x, y, s, fill = C.pink, lw = 6) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s); ctx.beginPath(); ctx.moveTo(0, 30);
  ctx.bezierCurveTo(-60, -10, -30, -55, 0, -22); ctx.bezierCurveTo(30, -55, 60, -10, 0, 30); ctx.restore(); paint(ctx, fill, lw);
}
function bird(ctx, t, col, ph = 0, laugh = 1) {
  const hop = Math.abs(Math.sin(t * 7 + ph)) * 16 * laugh;
  ctx.save(); ctx.translate(0, -hop);
  ellipse(ctx, 0, 0, 62, 52, col, 8);
  ellipse(ctx, -14, 14, 34, 22, 'rgba(255,255,255,0.45)', 0);
  ctx.beginPath(); ctx.moveTo(30, 6); ctx.quadraticCurveTo(70, 0 - Math.sin(t * 14 + ph) * 10, 50, 36); paint(ctx, col, 7); // wing
  // laughing face: squeezed eyes + open beak
  ctx.beginPath(); ctx.moveTo(-30, -26); ctx.lineTo(-18, -18); ctx.lineTo(-30, -10); paint(ctx, null, 6);
  const open = 0.5 + 0.5 * Math.sin(t * 16 + ph);
  ctx.beginPath(); ctx.moveTo(-50, -10); ctx.lineTo(-92, -2 - open * 10); ctx.lineTo(-52, 6); ctx.closePath(); paint(ctx, C.orange, 6);
  ctx.beginPath(); ctx.moveTo(-52, 6); ctx.lineTo(-86, 10 + open * 14); ctx.lineTo(-48, 16); ctx.closePath(); paint(ctx, C.orange, 6);
  ctx.beginPath(); ctx.moveTo(-10, 50); ctx.lineTo(-10, 66); ctx.moveTo(14, 50); ctx.lineTo(14, 66); paint(ctx, null, 7);
  ctx.restore();
}
function ship(ctx, t) {
  const rock = Math.sin(t * 1.6) * 0.05;
  ctx.save(); ctx.rotate(rock);
  for (const [x, h, w] of [[-120, 230, 120], [20, 290, 150], [150, 200, 100]]) {
    ctx.beginPath(); ctx.moveTo(x, -40); ctx.lineTo(x, -40 - h); paint(ctx, null, 9);
    ctx.beginPath(); ctx.moveTo(x - w / 2, -60 - h * 0.85); ctx.quadraticCurveTo(x + w * 0.15, -40 - h * 0.5, x - w / 2, -60); ctx.lineTo(x + w / 2, -60); ctx.quadraticCurveTo(x + w * 0.75, -40 - h * 0.5, x + w / 2, -60 - h * 0.85); ctx.closePath(); paint(ctx, '#fff7ec', 7);
    ctx.beginPath(); ctx.moveTo(x, -40 - h); ctx.lineTo(x + 46, -26 - h); ctx.lineTo(x, -12 - h); ctx.closePath(); paint(ctx, C.red, 5);
  }
  ctx.beginPath(); ctx.moveTo(-270, -50); ctx.lineTo(270, -60); ctx.quadraticCurveTo(250, 40, 180, 60); ctx.lineTo(-200, 60); ctx.quadraticCurveTo(-250, 30, -270, -50); paint(ctx, '#9a5b34', 9);
  ctx.beginPath(); ctx.moveTo(-250, -10); ctx.lineTo(250, -18); paint(ctx, null, 5);
  for (let i = 0; i < 6; i++) circle(ctx, -170 + i * 64, 18, 12, C.ink, 0);
  ctx.restore();
}
function thought(ctx, t, w, h, inner) {
  for (const [x, y, r] of [[-w * 0.2, h / 2 + 50, 24], [-w * 0.28, h / 2 + 100, 14]]) circle(ctx, x, y, r, '#fff', 7);
  ctx.beginPath();
  const n = 14;
  for (let i = 0; i <= n; i++) { const a = (i / n) * Math.PI * 2, x = Math.cos(a) * w / 2, y = Math.sin(a) * h / 2; const a2 = ((i + 0.5) / n) * Math.PI * 2; i === 0 ? ctx.moveTo(x, y) : ctx.quadraticCurveTo(Math.cos(a2 - Math.PI / n) * w * 0.6, Math.sin(a2 - Math.PI / n) * h * 0.6, x, y); }
  paint(ctx, '#fff', 8);
  if (inner) { ctx.save(); ctx.beginPath(); ctx.ellipse(0, 0, w * 0.46, h * 0.44, 0, 0, Math.PI * 2); ctx.clip(); inner(); ctx.restore(); }
}
function noSign(ctx, r) { ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.moveTo(-r * 0.7, -r * 0.7); ctx.lineTo(r * 0.7, r * 0.7); ctx.lineWidth = r * 0.24; ctx.strokeStyle = C.red; ctx.stroke(); }
function stamp(ctx, s, col, size = 150) {
  ctx.save(); ctx.rotate(-0.15); ctx.font = `${size}px Lilita`; const w = ctx.measureText(s).width + 70;
  rr(ctx, -w / 2, -size * 0.7, w, size * 1.4, 26); ctx.lineWidth = 16; ctx.strokeStyle = col; ctx.stroke();
  text(ctx, s, 0, 6, size, col, { lw: 0 }); ctx.restore();
}
function commentCard(ctx, t, typed) {
  rr(ctx, -400, -150, 800, 300, 50); paint(ctx, '#ffffff', 10);
  circle(ctx, -300, -40, 56, C.lilac, 7);
  circle(ctx, -318, -52, 7, C.ink, 0); circle(ctx, -282, -52, 7, C.ink, 0); ctx.beginPath(); ctx.moveTo(-322, -16); ctx.lineTo(-278, -16); paint(ctx, null, 6);
  text(ctx, 'you', -210, -80, 44, C.ink, { lw: 0, align: 'left' });
  text(ctx, typed, -210, -10, 54, C.purple, { lw: 0, align: 'left' });
  rr(ctx, -210, 50, 190, 64, 32); paint(ctx, C.pink, 6); text(ctx, 'POST', -115, 84, 40, '#fff', { lw: 0 });
  heart(ctx, 300, 70, 0.9, C.pink, 6);
}
