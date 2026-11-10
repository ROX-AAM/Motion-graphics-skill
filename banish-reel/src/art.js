// Flat corporate motion-graphics art. No outlines; shading by tone. Characters stand with feet at (0,0).
const P = {
  wall1: '#2b3646', wall2: '#1b2230', floor: '#232b38', desk: '#4a5568', deskTop: '#5d6b80', monitor: '#1a2130', screen: '#5fb3d9',
  skin: '#f2c7a5', skinS: '#d9a888', hair: '#22252e', shirt: '#e9edf2', you: '#3f7f8f', youTie: '#5fd3c8', boss: '#4b5260', bossTie: '#d6453d', vet: '#6b5d4f', vetTie: '#c9a24a',
  light: '#eaf6c8', shadow: 'rgba(5,8,14,0.35)', red: '#e2463f', yellow: '#f6c945', teal: '#5fd3c8',
};
const F = (ctx, fill) => { ctx.fillStyle = fill; ctx.fill(); };
function box(ctx, x, y, w, h, r, fill) { rr(ctx, x, y, w, h, r); F(ctx, fill); }

// ---------- person ----------
// o: suit, tie, pose 'stand'|'walk'|'sit'|'feetup', face 'neutral'|'smile'|'grin'|'worried'|'happy'|'shock'|'sad'|'bored', look [x,y],
//    phone 0..1 (holding phone up), glasses, hairStyle 0..2, walkT (phase), arm 'down'|'point'|'shrug'|'wave'
function person(ctx, t, o = {}) {
  const suit = o.suit || P.you, tie = o.tie || P.youTie, pose = o.pose || 'stand', look = o.look || [0, 0];
  const ph = o.walkT ?? t * 3.2, swing = pose === 'walk' ? Math.sin(ph * Math.PI) : 0, bob = pose === 'walk' ? Math.abs(Math.cos(ph * Math.PI)) * 8 : 0;
  ctx.save(); ctx.translate(0, -bob);
  alpha(ctx, 0.35, () => { ctx.beginPath(); ctx.ellipse(0, bob, 90, 14, 0, 0, Math.PI * 2); F(ctx, '#05080e'); });
  const seated = pose === 'sit' || pose === 'feetup';
  const hipY = seated ? -150 : -190;
  // legs
  if (!seated) {
    for (const s of [-1, 1]) { ctx.save(); ctx.translate(s * 26, hipY); ctx.rotate(s * swing * 0.25); box(ctx, -18, 0, 36, 182, 14, '#1f2633'); box(ctx, -24, 168, 50, 22, 10, '#0e1118'); ctx.restore(); }
  } else if (pose === 'sit') {
    for (const s of [-1, 1]) { box(ctx, s * 26 - 20, hipY, 40, 70, 14, '#1f2633'); box(ctx, s * 26 - 18, hipY + 60, 36, 90, 12, '#1f2633'); box(ctx, s * 26 - 24, -18, 50, 20, 10, '#0e1118'); }
  }
  // torso
  ctx.beginPath(); ctx.moveTo(-72, hipY + 10); ctx.lineTo(-64, hipY - 150); ctx.quadraticCurveTo(0, hipY - 178, 64, hipY - 150); ctx.lineTo(72, hipY + 10); ctx.closePath(); F(ctx, suit);
  ctx.beginPath(); ctx.moveTo(-28, hipY - 162); ctx.lineTo(0, hipY - 90); ctx.lineTo(28, hipY - 162); ctx.closePath(); F(ctx, P.shirt);
  ctx.beginPath(); ctx.moveTo(-9, hipY - 150); ctx.lineTo(9, hipY - 150); ctx.lineTo(13, hipY - 92); ctx.lineTo(0, hipY - 78); ctx.lineTo(-13, hipY - 92); ctx.closePath(); F(ctx, tie);
  alpha(ctx, 0.18, () => { ctx.beginPath(); ctx.moveTo(30, hipY - 150); ctx.lineTo(64, hipY - 150); ctx.lineTo(72, hipY + 10); ctx.lineTo(40, hipY + 10); ctx.closePath(); F(ctx, '#000'); });
  // arms
  const arm = (s, ang, len = 150, holdPhone = false) => {
    ctx.save(); ctx.translate(s * 64, hipY - 140); ctx.rotate(ang);
    box(ctx, -17, 0, 34, len, 16, suit); circle(ctx, 0, len + 4, 17, P.skin, 0);
    ctx.restore();
  };
  const a = o.arm || 'down';
  if (o.phone) { // both hands up holding phone in front of chest
    arm(-1, -0.9 + swing * 0.1, 120); arm(1, 0.9, 120);
    ctx.save(); ctx.translate(0, hipY - 120 - o.phone * 20); box(ctx, -32, -52, 64, 104, 10, '#0e1118'); box(ctx, -26, -44, 52, 86, 6, '#6fd0ff');
    alpha(ctx, 0.9, () => { for (let i = 0; i < 3; i++) box(ctx, -20, -38 + i * 26 - ((t * 40) % 26), 40, 18, 4, i % 2 ? '#ffffff' : '#ffd0e0'); }); ctx.restore();
  } else if (a === 'point') { arm(-1, 0.08 - swing * 0.2); arm(1, -1.55, 160); }
  else if (a === 'shrug') { arm(-1, 0.9, 110); arm(1, -0.9, 110); }
  else if (a === 'wave') { arm(-1, 0.08); arm(1, -2.6 + Math.sin(t * 10) * 0.25, 150); }
  else if (a === 'behind') { arm(-1, 0.25, 140); arm(1, -0.25, 140); }
  else { arm(-1, 0.08 - swing * 0.25); arm(1, -0.08 + swing * 0.25); }
  // head
  const hy = hipY - 222;
  box(ctx, -18, hy + 40, 36, 30, 8, P.skinS);
  circle(ctx, 0, hy, 62, P.skin, 0);
  circle(ctx, -60, hy + 6, 13, P.skinS, 0); circle(ctx, 60, hy + 6, 13, P.skinS, 0);
  // hair
  const hs = o.hairStyle || 0;
  ctx.beginPath();
  if (hs === 0) { ctx.arc(0, hy - 4, 64, Math.PI * 1.02, Math.PI * 1.98); ctx.quadraticCurveTo(40, hy - 36, -20, hy - 30); ctx.quadraticCurveTo(-50, hy - 26, -62, hy - 2); }
  else if (hs === 1) { ctx.arc(0, hy - 2, 65, Math.PI * 1.05, Math.PI * 1.95); ctx.lineTo(50, hy - 26); ctx.lineTo(-50, hy - 26); } // flat neat (boss)
  else { ctx.arc(0, hy - 6, 66, Math.PI * 0.95, Math.PI * 2.05); ctx.quadraticCurveTo(70, hy - 10, 40, hy - 40); ctx.quadraticCurveTo(0, hy - 20, -66, hy); } // messy (vet)
  F(ctx, o.hairColor || P.hair);
  // face
  const f = o.face || 'neutral', ex = look[0] * 6, ey = look[1] * 5;
  const eye = (x, kind) => {
    if (kind === 'closed') { ctx.beginPath(); ctx.arc(x, hy - 2, 9, 1.1 * Math.PI, 1.9 * Math.PI); ctx.lineWidth = 5; ctx.strokeStyle = '#1a1d24'; ctx.stroke(); return; }
    if (kind === 'wide') { circle(ctx, x, hy - 4, 13, '#fff', 0); circle(ctx, x + ex, hy - 4 + ey, 6, '#1a1d24', 0); return; }
    if (kind === 'half') { circle(ctx, x + ex, hy + ey, 6, '#1a1d24', 0); ctx.fillStyle = P.skin; ctx.fillRect(x - 10, hy - 12, 20, 10); ctx.beginPath(); ctx.moveTo(x - 10, hy - 2); ctx.lineTo(x + 10, hy - 2); ctx.lineWidth = 4; ctx.strokeStyle = '#1a1d24'; ctx.stroke(); return; }
    circle(ctx, x + ex, hy - 2 + ey, 7, '#1a1d24', 0);
  };
  const ek = f === 'happy' || f === 'grin' ? 'closed' : f === 'shock' ? 'wide' : f === 'bored' ? 'half' : 'open';
  eye(-22, ek); eye(22, ek);
  if (o.glasses) { ctx.lineWidth = 4; ctx.strokeStyle = '#11141a'; rr(ctx, -40, hy - 16, 34, 26, 8); ctx.stroke(); rr(ctx, 6, hy - 16, 34, 26, 8); ctx.stroke(); ctx.beginPath(); ctx.moveTo(-6, hy - 6); ctx.lineTo(6, hy - 6); ctx.stroke(); }
  ctx.lineWidth = 5; ctx.strokeStyle = '#1a1d24'; ctx.lineCap = 'round';
  if (f === 'worried' || f === 'sad') { for (const s of [-1, 1]) { ctx.beginPath(); ctx.moveTo(s * 34, hy - 26 + (f === 'worried' ? 0 : 4)); ctx.lineTo(s * 12, hy - 32 + (f === 'worried' ? 0 : 8)); ctx.stroke(); } }
  ctx.beginPath();
  if (f === 'smile' || f === 'happy') { ctx.arc(0, hy + 18, 18, 0.15 * Math.PI, 0.85 * Math.PI); ctx.stroke(); }
  else if (f === 'grin') { ctx.moveTo(-30, hy + 18); ctx.quadraticCurveTo(0, hy + 52, 30, hy + 18); ctx.closePath(); F(ctx, '#ffffff'); ctx.stroke(); ctx.beginPath(); ctx.moveTo(-26, hy + 26); ctx.lineTo(26, hy + 26); ctx.lineWidth = 2; ctx.stroke(); }
  else if (f === 'shock') { ctx.ellipse(0, hy + 30, 10, 14, 0, 0, Math.PI * 2); F(ctx, '#5a2730'); }
  else if (f === 'sad') { ctx.arc(0, hy + 38, 14, 1.15 * Math.PI, 1.85 * Math.PI); ctx.stroke(); }
  else if (f === 'worried') { ctx.moveTo(-14, hy + 30); ctx.quadraticCurveTo(0, hy + 24, 14, hy + 30); ctx.stroke(); }
  else { ctx.moveTo(-12, hy + 28); ctx.lineTo(12, hy + 28); ctx.stroke(); }
  if (o.sunglasses) { box(ctx, -44, hy - 18, 38, 22, 8, '#0b0d12'); box(ctx, 6, hy - 18, 38, 22, 8, '#0b0d12'); ctx.fillRect(-6, hy - 12, 12, 4); }
  ctx.restore();
}

// ---------- office furniture ----------
function chair(ctx, empty = false) {
  box(ctx, -60, -260, 120, 130, 22, '#262d3a'); box(ctx, -66, -150, 132, 30, 12, '#2f3747');
  box(ctx, -8, -120, 16, 80, 4, '#151a22'); box(ctx, -60, -42, 120, 12, 6, '#151a22');
  for (const x of [-56, 56]) circle(ctx, x, -20, 12, '#151a22', 0);
}
function desk(ctx, t, o = {}) { // front view desk, top at y=0, width w
  const w = o.w || 380;
  box(ctx, -w / 2, -10, w, 26, 6, P.deskTop); box(ctx, -w / 2 + 14, 16, w - 28, 150, 6, P.desk);
  alpha(ctx, 0.25, () => box(ctx, -w / 2 + 14, 16, w - 28, 22, 0, '#000'));
  if (o.monitor) { ctx.save(); ctx.translate(o.monX || 0, 0); ctx.scale(o.monX ? 0.8 : 1, o.monX ? 0.8 : 1); box(ctx, -10, -60, 20, 54, 4, '#151a22'); box(ctx, -40, -14, 80, 8, 4, '#151a22'); box(ctx, -110, -200, 220, 140, 10, P.monitor); box(ctx, -100, -190, 200, 120, 6, o.screen || P.screen);
    alpha(ctx, 0.5, () => { for (let i = 0; i < 4; i++) box(ctx, -86, -178 + i * 26, 120 - (i % 2) * 40, 12, 4, '#ffffff'); }); ctx.restore(); }
  if (o.papers) { box(ctx, w / 2 - 120, -30, 90, 22, 3, '#dfe5ec'); box(ctx, w / 2 - 116, -44, 84, 16, 3, '#cfd6df'); }
  if (o.photo) at(ctx, -w / 2 + 70, -50, o.photo, -0.08, () => photoFrame(ctx));
  if (o.mug) { box(ctx, w / 2 - 70, -50, 40, 46, 8, '#c9504a'); }
  if (o.plant) { box(ctx, -w / 2 + 30, -46, 40, 40, 8, '#8a6a4a'); circle(ctx, -w / 2 + 50, -70, 30, '#3f8f6a', 0); circle(ctx, -w / 2 + 34, -84, 18, '#4fae7f', 0); }
}
function photoFrame(ctx) {
  box(ctx, -46, -60, 92, 110, 6, '#c9a24a'); box(ctx, -38, -52, 76, 94, 4, '#bfe3f2');
  box(ctx, -38, 10, 76, 32, 0, '#8fd08a');
  for (const [x, h, c] of [[-20, 46, '#e2463f'], [0, 54, '#3f7f8f'], [20, 34, '#f6c945']]) { circle(ctx, x, 10 - h, 9, P.skin, 0); box(ctx, x - 8, 2 - h + 10, 16, h - 6, 6, c); }
}
function wallClock(ctx, t, hour, min, o = {}) {
  circle(ctx, 0, 0, 120, '#e8ecf0', 0); circle(ctx, 0, 0, 120, null, 0);
  ctx.beginPath(); ctx.arc(0, 0, 120, 0, Math.PI * 2); ctx.lineWidth = 16; ctx.strokeStyle = '#3a4352'; ctx.stroke();
  for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2; box(ctx, Math.sin(a) * 92 - 4, -Math.cos(a) * 92 - 10, 8, 20, 3, '#3a4352'); }
  const hand = (a, len, w, col) => { ctx.save(); ctx.rotate(a); box(ctx, -w / 2, -len, w, len + 14, w / 2, col); ctx.restore(); };
  hand((hour % 12 + min / 60) / 12 * Math.PI * 2, 56, 12, '#1b2230'); hand(min / 60 * Math.PI * 2, 84, 8, '#1b2230');
  const sec = o.sec ?? Math.floor(t); hand(sec / 60 * Math.PI * 2, 92, 4, P.red); circle(ctx, 0, 0, 9, P.red, 0);
}
function fluorescent(ctx, t, w = 420, flicker = 0) {
  const on = flicker ? (Math.sin(t * 37) > 0.85 || Math.sin(t * 13.3) > 0.93 ? 0.35 : 1) : 1;
  box(ctx, -w / 2, -14, w, 28, 8, '#3a4352'); box(ctx, -w / 2 + 12, -6, w - 24, 16, 6, on > 0.5 ? P.light : '#8a9378');
  alpha(ctx, 0.22 * on, () => { ctx.beginPath(); ctx.moveTo(-w / 2, 10); ctx.lineTo(w / 2, 10); ctx.lineTo(w * 1.1, 1400); ctx.lineTo(-w * 1.1, 1400); ctx.closePath(); const g = ctx.createLinearGradient(0, 0, 0, 1400); g.addColorStop(0, 'rgba(234,246,200,0.9)'); g.addColorStop(1, 'rgba(234,246,200,0)'); ctx.fillStyle = g; ctx.fill(); });
  return on;
}
function door(ctx, open = 0, label = '') { // door frame centred on x=0, floor at y=0, height 520
  box(ctx, -150, -540, 300, 540, 6, '#151a22');
  box(ctx, -136, -526, 272, 526, 4, '#0b0e14');
  ctx.save(); ctx.translate(-136, 0); ctx.scale(1 - open * 0.75, 1);
  box(ctx, 0, -526, 272, 526, 4, '#5a6474'); box(ctx, 220, -280, 26, 40, 8, '#c9ced6');
  if (label) { box(ctx, 46, -440, 180, 54, 6, '#e8ecf0'); text(ctx, label, 136, -413, 26, '#1b2230', { lw: 0, font: 'Anton' }); }
  ctx.restore();
}
function inboxUI(ctx, t, count, k = 1) {
  box(ctx, -300, -360, 600, 720, 36, '#e9edf2'); box(ctx, -300, -360, 600, 110, 36, '#3f7f8f'); ctx.fillStyle = '#3f7f8f'; ctx.fillRect(-300, -290, 600, 40);
  text(ctx, 'INBOX', -240, -300, 56, '#fff', { lw: 0, font: 'Anton', align: 'left' });
  rr(ctx, 150, -335, 110, 64, 32); F(ctx, count ? P.red : '#8a94a3'); text(ctx, String(count), 205, -302, 46, '#fff', { lw: 0, font: 'Anton' });
  for (let i = 0; i < 4; i++) alpha(ctx, clamp(k * 4 - i), () => { box(ctx, -260, -210 + i * 130, 520, 104, 16, '#ffffff'); circle(ctx, -200, -158 + i * 130, 30, ['#f6c945', '#5fd3c8', '#e2463f', '#8a94a3'][i], 0); box(ctx, -150, -186 + i * 130, 300, 18, 8, '#c9d1dc'); box(ctx, -150, -150 + i * 130, 220, 14, 7, '#dfe5ec'); });
  if (!count) alpha(ctx, 1 - k, () => text(ctx, 'No new messages', 0, 60, 52, '#8a94a3', { lw: 0, font: 'Fredoka', weight: 600 }));
}
function calendar(ctx, day, color = P.red) {
  box(ctx, -150, -170, 300, 340, 20, '#e9edf2'); box(ctx, -150, -170, 300, 100, 20, color); ctx.fillStyle = color; ctx.fillRect(-150, -110, 300, 40);
  for (const x of [-80, 80]) box(ctx, x - 10, -194, 20, 50, 10, '#3a4352');
  text(ctx, day, 0, 40, 150, '#1b2230', { lw: 0, font: 'Anton' });
}
function coin(ctx, t, ph = 0) {
  const w = Math.abs(Math.cos(t * 4 + ph));
  ctx.save(); ctx.scale(w * 0.9 + 0.1, 1); circle(ctx, 0, 0, 46, '#f6c945', 0); circle(ctx, 0, 0, 36, '#e0ac2a', 0); if (w > 0.4) text(ctx, '¥', 0, 4, 50, '#fff3c4', { lw: 0, font: 'Anton' }); ctx.restore();
}
function stampMark(ctx, s, col, size = 130, rot = -0.14) {
  ctx.save(); ctx.rotate(rot); ctx.font = `${size}px Anton`; const w = ctx.measureText(s).width + 70;
  rr(ctx, -w / 2, -size * 0.72, w, size * 1.44, 18); ctx.lineWidth = 14; ctx.strokeStyle = col; ctx.stroke();
  text(ctx, s, 0, 6, size, col, { lw: 0, font: 'Anton' }); ctx.restore();
}
function noIcon(ctx, r = 150) { ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.moveTo(-r * 0.7, -r * 0.7); ctx.lineTo(r * 0.7, r * 0.7); ctx.lineWidth = r * 0.2; ctx.strokeStyle = P.red; ctx.stroke(); }
function computerIcon(ctx) { box(ctx, -110, -90, 220, 150, 14, '#c9d1dc'); box(ctx, -96, -76, 192, 122, 8, '#5fb3d9'); box(ctx, -16, 60, 32, 30, 4, '#c9d1dc'); box(ctx, -60, 86, 120, 14, 6, '#c9d1dc'); }
function trayIcon(ctx) { ctx.beginPath(); ctx.moveTo(-120, -20); ctx.lineTo(-90, 60); ctx.lineTo(90, 60); ctx.lineTo(120, -20); ctx.lineTo(60, -20); ctx.lineTo(40, 14); ctx.lineTo(-40, 14); ctx.lineTo(-60, -20); ctx.closePath(); F(ctx, '#c9d1dc'); }
function lawBook(ctx) {
  box(ctx, -150, -190, 300, 380, 16, '#7a2d2d'); box(ctx, -150, -190, 40, 380, 8, '#5a1f1f');
  box(ctx, -80, -120, 190, 60, 8, '#c9a24a'); text(ctx, 'LABOR LAW', 15, -90, 42, '#5a1f1f', { lw: 0, font: 'Anton' });
  // scales of justice
  ctx.strokeStyle = '#c9a24a'; ctx.lineWidth = 8; ctx.beginPath(); ctx.moveTo(15, -20); ctx.lineTo(15, 120); ctx.moveTo(-50, 10); ctx.lineTo(80, 10); ctx.moveTo(-30, 120); ctx.lineTo(60, 120); ctx.stroke();
  for (const x of [-50, 80]) { ctx.beginPath(); ctx.arc(x, 50, 26, 0, Math.PI); F(ctx, '#c9a24a'); }
}
function shield(ctx, crack = 0) {
  ctx.beginPath(); ctx.moveTo(0, -150); ctx.lineTo(120, -100); ctx.quadraticCurveTo(120, 80, 0, 160); ctx.quadraticCurveTo(-120, 80, -120, -100); ctx.closePath(); F(ctx, '#3f7f8f');
  ctx.beginPath(); ctx.moveTo(0, -110); ctx.lineTo(84, -74); ctx.quadraticCurveTo(84, 56, 0, 116); ctx.quadraticCurveTo(-84, 56, -84, -74); ctx.closePath(); F(ctx, '#5fd3c8');
  if (crack) { ctx.beginPath(); ctx.moveTo(0, -150); ctx.lineTo(-20, -60); ctx.lineTo(24, 0); ctx.lineTo(-10, 80); ctx.lineTo(6, 160); ctx.lineWidth = 10 * crack; ctx.strokeStyle = '#1b2230'; ctx.stroke(); }
}
function folder(ctx, col = '#f6c945') { box(ctx, -90, -60, 70, 30, 8, col); box(ctx, -90, -44, 180, 120, 12, col); alpha(ctx, 0.2, () => box(ctx, -90, -10, 180, 86, 12, '#000')); }
function avatar(ctx, col) { circle(ctx, 0, 0, 70, '#3a4352', 0); circle(ctx, 0, -14, 28, P.skin, 0); ctx.beginPath(); ctx.arc(0, 52, 44, Math.PI, 0); F(ctx, col); }
function meter(ctx, k, col, label) {
  box(ctx, -40, -260, 80, 260, 40, '#1b2230'); box(ctx, -28, -248 + 236 * (1 - k), 56, 236 * k, 28, col);
  if (label) text(ctx, label, 0, 50, 40, '#e9edf2', { lw: 0, font: 'Anton' });
}
function palmBubble(ctx, t) {
  ctx.beginPath(); ctx.ellipse(0, 0, 200, 150, 0, 0, Math.PI * 2); F(ctx, '#e9edf2');
  circle(ctx, -110, 150, 22, '#e9edf2', 0); circle(ctx, -150, 195, 12, '#e9edf2', 0);
  ctx.save(); ctx.beginPath(); ctx.ellipse(0, 0, 188, 138, 0, 0, Math.PI * 2); ctx.clip();
  const g = ctx.createLinearGradient(0, -140, 0, 140); g.addColorStop(0, '#7fd0ff'); g.addColorStop(1, '#ffe7a8'); ctx.fillStyle = g; ctx.fillRect(-200, -150, 400, 300);
  circle(ctx, 90, -60, 40, '#ffd23f', 0); box(ctx, -200, 70, 400, 90, 0, '#f2d38a'); box(ctx, -200, 40, 400, 40, 0, '#3fa9d9');
  ctx.save(); ctx.translate(-60, 80); ctx.rotate(-0.15 + Math.sin(t * 2) * 0.04); box(ctx, -8, -150, 16, 150, 8, '#8a6a4a');
  for (let i = 0; i < 5; i++) { ctx.save(); ctx.translate(0, -150); ctx.rotate(-1.2 + i * 0.6); ctx.beginPath(); ctx.ellipse(55, 0, 60, 16, 0, 0, Math.PI * 2); F(ctx, '#3fa96a'); ctx.restore(); }
  ctx.restore(); ctx.restore();
}
function moneyRain(ctx, t, t0, a = 1) {
  const r = rng(21);
  for (let i = 0; i < 18; i++) { const x = r() * W, sp = 380 + r() * 260, y = -100 + ((t - t0) * sp + r() * 400) % 2100; alpha(ctx, a, () => at(ctx, x + Math.sin(t * 2 + i) * 30, y, 0.8, Math.sin(t * 3 + i) * 0.6, () => { if (i % 3) { box(ctx, -60, -30, 120, 60, 6, '#8fd08a'); circle(ctx, 0, 0, 18, '#6fb06a', 0); } else coin(ctx, t, i); })); }
}
