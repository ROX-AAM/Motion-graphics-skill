// "Tutu & Misti: Sharing is sweet" – 60 s, 9:16. drawFrame(t) is pure.
const BOUNDS = [12, 24, 40];
const CAP_Y = 430;
const SHAKES = [];
function shakeAt(t) { let x = 0, y = 0; for (const [t0, amp] of SHAKES) { if (t < t0 || t > t0 + 0.5) continue; const k = Math.exp(-(t - t0) * 9) * amp; x += Math.sin(t * 90) * k; y += Math.cos(t * 77) * k; } return [x, y]; }
function camera(ctx, t, s, cx, cy, fn) { const [sx, sy] = shakeAt(t); ctx.save(); ctx.translate(W / 2 + sx, 1150 + sy); ctx.scale(s, s); ctx.translate(-cx, -cy); fn(); ctx.restore(); }
// smooth camera keyframes [[t, s, cx, cy], ...]
function camKeys(t, keys) {
  if (t <= keys[0][0]) return keys[0].slice(1);
  for (let i = 0; i < keys.length - 1; i++) { const [a, ...A] = keys[i], [b, ...B] = keys[i + 1]; if (t <= b) { const k = E.inOutCubic(seg(t, a, b)); return A.map((v, j) => lerp(v, B[j], k)); } }
  return keys[keys.length - 1].slice(1);
}
// hop motion: returns {lift, squash} for a hop cycle with given period
function hop(t, t0, period = 0.55, height = 1) {
  if (t < t0) return { lift: 0, squash: 0 };
  const p = ((t - t0) / period) % 1, lift = Math.sin(p * Math.PI) * height;
  return { lift: lift * 0.9, squash: lift * 0.35 - 0.6 * Math.exp(-p * 22) * height };
}
const FLOWERS = (() => { const r = rng(3), c = ['#ff7eb6', '#ffd23f', '#9b7bff', '#5bc0ff', '#ff9f43']; return Array.from({ length: 14 }, (_, i) => ({ x: r() * 1300 - 110, y: 1470 + r() * 360, c: c[i % 5], s: 0.7 + r() * 0.5, p: r() * 6 })); })();
function forest(ctx, t, o = {}) {
  sky(ctx, t, o.warm || 0);
  hills(ctx, t, o.px || 0);
  if (o.tree !== false) at(ctx, o.treeX || 820, 1440, o.treeS || 1, 0, () => tree(ctx, t, 1, true));
  ground(ctx, t);
  at(ctx, 110, 1490, 0.9, 0, () => mushroom(ctx, 1)); at(ctx, 190, 1520, 0.6, 0, () => mushroom(ctx, 1));
  FLOWERS.forEach(f => at(ctx, f.x, f.y, f.s, 0, () => flower(ctx, t, f.c, 1, f.p)));
  [[C.pink, 0], [C.yellow, 2], [C.lilac, 4]].forEach(([c, ph], i) => at(ctx, 200 + i * 320 + Math.sin(t * 0.6 + ph) * 120, 760 + Math.sin(t * 0.9 + ph) * 120 + i * 90, 1, Math.sin(t + ph) * 0.3, () => butterfly(ctx, t, c, ph)));
}
function foregroundFx(ctx, t, a = 1) { fireflies(ctx, t, 16, a); }

// ---------- scene 1: the discovery (0–12) ----------
function scene1(ctx, t) {
  const found = T(0, 'found'), apl = T(0, 'apple'), walk = 7.3, lift = 9.6;
  const [s, cx, cy] = camKeys(t, [[0, 1.0, 540, 1150], [found, 1.0, 540, 1150], [7.5, 1.14, 600, 1260], [12, 1.18, 560, 1250]]);
  camera(ctx, t, s, cx, cy, () => {
    forest(ctx, t, { px: -t * 6 });
    // Tutu: hop in → stop → excited hops → hop to apple → lift it
    let x, h = { lift: 0, squash: 0 };
    if (t < found) { x = lerp(-180, 360, seg(t, 0, found)); h = hop(t, 0, 0.56); }
    else if (t < walk) { x = 360; if (t > apl - 0.1 && t < apl + 1.15) h = hop(t, apl - 0.1, 0.55, 0.6); }
    else if (t < 8.95) { x = lerp(360, 560, seg(t, walk, 8.95)); h = hop(t, walk, 0.55, 0.8); }
    else x = 560;
    const holding = t > lift;
    const ax = holding ? x : 760, ay = holding ? 1470 - 118 - h.lift * 120 : lerp(1430, 1430, 0), ar = holding ? 82 : 95;
    const glow = seg(t, found - 0.3, found + 0.4) * (0.7 + 0.3 * Math.sin(t * 5));
    // apple under the tree (on ground) — behind Tutu once he holds it
    const appleDraw = () => at(ctx, ax, ay - (holding ? 0 : 0), (t > apl - 0.05 && t < apl + 0.6 && !holding ? 1 + 0.15 * Math.sin(seg(t, apl - 0.05, apl + 0.6) * Math.PI) : 1), 0, () => apple(ctx, t, ar, glow));
    if (!holding) appleDraw();
    at(ctx, x, 1470, 1, 0, () => tutu(ctx, t, {
      ...h, look: t < found ? [0.6, 0] : [1, 0.5], eyes: t > found && t < 9 ? 'wide' : 'open',
      mouth: t < found ? 'smile' : t < apl ? 'o' : 'grin', ears: t > found && t < found + 0.8 ? 1 : 0, arms: holding ? 'hold' : t > apl && t < walk ? 'up' : 'down',
    }));
    if (holding) appleDraw();
    // "!" over Tutu
    at(ctx, x + 40, 900, life(t, found, found + 1.4, 0.3), 0.1, () => { burst(ctx, 0, 0, 70, C.yellow, 12, 6); text(ctx, '!', 0, 4, 90, C.red, { lw: 10 }); });
    // sparkles around the apple
    const sp = seg(t, found, found + 0.3);
    for (let i = 0; i < 7; i++) { const a = (i / 7) * Math.PI * 2 + t * 1.2, r = ar * (1.5 + 0.2 * Math.sin(t * 4 + i)); alpha(ctx, sp * (0.6 + 0.4 * Math.sin(t * 6 + i)), () => sparkle(ctx, ax + Math.cos(a) * r, ay + Math.sin(a) * r * 0.8, 14 + 8 * Math.abs(Math.sin(t * 5 + i)), '#fff6a8')); }
    if (holding) for (let i = 0; i < 8; i++) { const k = seg(t, lift, lift + 0.7); alpha(ctx, 1 - k, () => star(ctx, ax + Math.cos(i * 0.8) * 200 * k, ay + Math.sin(i * 0.8) * 200 * k, 20, C.yellow, 4)); }
  });
  foregroundFx(ctx, t);
}

// ---------- scene 2: Misti appears (12–24) ----------
function scene2(ctx, t) {
  const eat = T(1, 'eat'), self = T(1, 'himself...'), but = T(1, 'but'), noticed = T(1, 'noticed'), mis = T(1, 'little'), watch = T(1, 'watching'), hungry = T(1, 'hungry');
  const [s, cx, cy] = camKeys(t, [[12, 1.22, 520, 1250], [watch - 0.3, 1.22, 520, 1250], [watch + 0.6, 1.55, 800, 1250], [21.4, 1.55, 800, 1250], [22.3, 1.2, 600, 1250]]);
  camera(ctx, t, s, cx, cy, () => {
    forest(ctx, t, { treeX: 120, treeS: 0.95, px: -40 });
    // Misti behind the bush
    const peek = E.outBack(seg(t, mis - 0.1, mis + 0.5), 1.4);
    if (t > mis - 0.1) at(ctx, 840, lerp(1700, 1420, peek), 1, Math.sin(t * 1.5) * 0.04, () => misti(ctx, t, { eyes: t > watch ? 'big' : 'open', look: [-1, 0.3], mouth: t > hungry + 0.3 ? 'o' : 'shy', tear: t > hungry ? 0.8 : 0, shadow: 0, earUp: peek }));
    at(ctx, 840, 1490, 1, 0, () => bush(ctx, t, t > but - 0.2 && t < mis ? 1 : 0));
    // Tutu with the apple
    const toMouth = E.inOutCubic(seg(t, eat, eat + 0.4)) * (1 - E.inOutCubic(seg(t, self + 0.3, self + 0.7)));
    const hug = t > self && t < but + 0.2;
    const lookR = t > noticed - 0.2;
    const think = t > 21.4;
    const look = think ? (Math.floor((t - 21.4) / 0.6) % 2 ? [1, 0.2] : [0, 0.9]) : lookR ? [1, 0] : [0, 0.7];
    const shimmy = hug ? Math.sin(t * 8) * 0.04 : 0;
    at(ctx, 400, 1480, 1, shimmy, () => tutu(ctx, t, { look, eyes: hug ? 'closed' : lookR && !think ? 'wide' : 'open', mouth: toMouth > 0.5 ? 'open' : hug ? 'grin' : lookR ? 'o' : 'lick', arms: hug ? 'hug' : 'hold', ears: t > but && t < noticed + 0.5 ? 1 : 0 }));
    at(ctx, 400 + shimmy * 600, 1480 - 118 - toMouth * 75 + (hug ? 25 : 0), 1, 0, () => apple(ctx, t, 82));
    // rustle marks
    if (t > but - 0.2 && t < mis) for (const s of [-1, 1]) { ctx.beginPath(); ctx.arc(840, 1330, 230, s > 0 ? -0.7 : Math.PI - 0.1, s > 0 ? -0.2 : Math.PI + 0.4); ctx.lineWidth = 10; ctx.strokeStyle = '#fff'; ctx.stroke(); }
    // hungry thought bubble over Misti
    at(ctx, 960, 1020, life(t, hungry, 21.6, 0.4), 0, () => {
      circle(ctx, -70, 90, 16, '#fff', 5); circle(ctx, -95, 125, 10, '#fff', 5);
      ellipse(ctx, 0, 0, 105, 85, '#fff', 7); at(ctx, 0, 8, 1, Math.sin(t * 4) * 0.1, () => apple(ctx, t, 44));
    });
    // tummy grumble lines
    if (t > hungry + 0.2 && t < hungry + 1.3) { ctx.strokeStyle = C.orange; ctx.lineWidth = 6; for (let i = 0; i < 3; i++) { ctx.beginPath(); const y = 1330 + i * 22; ctx.moveTo(700, y); for (let x = 0; x <= 60; x += 10) ctx.lineTo(700 - x, y + (x % 20 ? -8 : 8)); ctx.stroke(); } }
    // lightbulb idea
    at(ctx, 400, 860, life(t, 23.0, 24.4, 0.35), 0, () => { alpha(ctx, 0.5, () => circle(ctx, 0, 0, 90, '#fff6a8', 0)); circle(ctx, 0, 0, 52, C.yellow, 7); rr(ctx, -22, 46, 44, 34, 8); paint(ctx, '#bbb', 6); });
  });
  foregroundFx(ctx, t, 0.7);
}

// ---------- scene 3: snap & share (24–40) ----------
function scene3(ctx, t) {
  const snap = T(2, 'half.'), here = T(2, 'Here,'), lets = T(2, "Let's"), because = T(2, 'Because');
  const [s, cx, cy] = camKeys(t, [[24, 1.18, 580, 1250], [snap - 0.2, 1.3, 520, 1250], [snap + 0.8, 1.18, 580, 1250], [because, 1.08, 560, 1220], [40, 1.12, 560, 1230]]);
  camera(ctx, t, s, cx, cy, () => {
    forest(ctx, t, { treeX: 120, treeS: 0.95, px: -40 });
    if (t > because) alpha(ctx, 0.9, () => rainbow(ctx, E.outCubic(seg(t, because, because + 1.4))));
    at(ctx, 960, 1490, 0.9, 0, () => bush(ctx, t, 0));
    // Misti hops out
    const mx = lerp(840, 740, seg(t, 24.4, 25.6)), joy = t > because;
    const hm = joy ? hop(t, because + 0.12, 0.6, 1) : t > 24.4 && t < 25.6 ? hop(t, 24.4, 0.6, 0.7) : { lift: 0, squash: 0 };
    const hasHalf = t > here + 1.25;
    at(ctx, mx, lerp(1420, 1480, seg(t, 24.4, 25.0)), 1, 0, () => misti(ctx, t, { ...hm, eyes: joy && hm.lift > 0.3 ? 'closed' : 'big', look: [-1, 0.4], mouth: joy || t > lets ? 'grin' : t > here ? 'o' : 'shy', arms: hasHalf ? 'hold' : 'chest', tailWag: t > lets ? 1 : 0, shadow: seg(t, 24.4, 25) }));
    // Tutu
    const ht = joy ? hop(t, because, 0.6, 1) : { lift: 0, squash: 0 };
    const offering = t > here - 0.1 && t < here + 1.4;
    at(ctx, 380, 1480, 1, 0, () => tutu(ctx, t, { ...ht, look: [1, 0.2], eyes: joy && ht.lift > 0.3 ? 'closed' : 'open', mouth: t > snap ? 'grin' : 'smile', arms: offering ? 'offer' : 'hold', ears: t > snap && t < snap + 0.6 ? 1 : 0 }));
    // apple → halves
    const tutuY = 1480 - 118 - ht.lift * 120, mistiY = 1480 - 112 - hm.lift * 120;
    if (t < snap) at(ctx, 380, tutuY, 1 + 0.04 * Math.sin(t * 20) * seg(t, snap - 0.8, snap), 0, () => apple(ctx, t, 82));
    else {
      const sp = E.outBack(seg(t, snap, snap + 0.35), 2);
      at(ctx, 380 - 36 * sp, tutuY, 0.92, -0.15 * sp, () => appleHalf(ctx, t, 82, -1, 0));
      // right half: from Tutu → Misti
      const k = E.inOutCubic(seg(t, here + 0.1, here + 1.2));
      const hx = lerp(380 + 36 * sp + (offering ? 90 * seg(t, here - 0.1, here + 0.2) : 0), mx, k), hy = lerp(tutuY, mistiY, k) - Math.sin(k * Math.PI) * 120;
      at(ctx, hasHalf ? mx : hx, hasHalf ? mistiY : hy, hasHalf ? 0.82 : lerp(0.92, 0.82, k), 0.15 * sp * (1 - k), () => appleHalf(ctx, t, 82, 1, 0));
    }
    // snap flash + sparkle burst
    const f = seg(t, snap, snap + 0.6);
    if (t > snap && f < 1) { for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2; alpha(ctx, 1 - f, () => star(ctx, 380 + Math.cos(a) * 260 * E.outCubic(f), tutuY + Math.sin(a) * 260 * E.outCubic(f), 26 * (1 - f) + 6, i % 2 ? C.yellow : '#fff', 4)); } alpha(ctx, (1 - f) * 0.7, () => burst(ctx, 380, tutuY, 170 * E.outBack(f), '#fff6a8', 16, 0)); }
    // hearts between friends
    if (t > lets) for (let i = 0; i < 6; i++) { const k = ((t - lets) * 0.5 + i / 6) % 1; alpha(ctx, Math.sin(k * Math.PI), () => heart(ctx, 560 + Math.sin(i * 2.3 + t) * 90, 1250 - k * 420, 0.8 + 0.3 * (i % 2), i % 2 ? C.pink : '#ff6b8a')); }
    // confetti on joy
    if (joy) { const r = rng(11); for (let i = 0; i < 40; i++) { const x = r() * W, sp_ = 260 + r() * 200, y = -60 + ((t - because) * sp_ + r() * 300) % 1700; at(ctx, x + Math.sin(t * 3 + i) * 30, 400 + y, 1, t * 4 + i, () => { rr(ctx, -9, -5, 18, 10, 3); ctx.fillStyle = [C.pink, C.yellow, C.cyan, C.green, C.orange][i % 5]; ctx.fill(); }); } }
  });
  // "Sharing is caring" badge once the caption is gone
  at(ctx, 540, 430, life(t, 35.2, 39.9, 0.45), wob(t, 0.8, 0.04), () => { rr(ctx, -380, -90, 760, 180, 90); paint(ctx, '#fff', 10); text(ctx, 'SHARING IS', 0, -28, 70, C.pink, { lw: 12 }); text(ctx, 'CARING ♥', 0, 44, 78, C.green, { lw: 12 }); });
  foregroundFx(ctx, t, 0.6);
}

// ---------- scene 4: twice as sweet + dance + CTA (40–60) ----------
function scene4(ctx, t) {
  const sweet = T(3, 'twice'), rem = T(3, 'Remember'), tap = T(3, 'follow,'), fun = T(3, 'fun');
  const [s, cx, cy] = camKeys(t, [[40, 1.25, 545, 1250], [rem - 0.3, 1.25, 545, 1250], [rem + 0.8, 1.05, 545, 1200], [60, 1.08, 545, 1200]]);
  const dancing = t > rem;
  camera(ctx, t, s, cx, cy, () => {
    forest(ctx, t, { warm: 1, treeX: 1000, treeS: 0.9, px: -60 });
    const bites = Math.min(3, Math.floor(seg(t, 40.5, rem - 0.4) * 4));
    const gone = t > rem - 0.25;
    // dance motion
    const beat = 60 / 100, ph = (t - rem) / beat;
    const dT = dancing ? { lift: Math.abs(Math.sin(ph * Math.PI)) * 0.45, squash: Math.sin(ph * Math.PI * 2) * 0.25 } : { lift: 0, squash: 0 };
    const dM = dancing ? { lift: Math.abs(Math.sin(ph * Math.PI + 1.57)) * 0.45, squash: Math.cos(ph * Math.PI * 2) * 0.25 } : { lift: 0, squash: 0 };
    const sway = dancing ? Math.sin(ph * Math.PI) * 0.12 : 0;
    at(ctx, 400, 1480, 1, sway, () => tutu(ctx, t, { ...dT, look: [0.6, -0.2], eyes: dancing ? (Math.sin(ph * Math.PI) > 0.6 ? 'closed' : 'open') : 'closed', mouth: dancing ? 'grin' : 'chew', arms: dancing ? (Math.floor(ph) % 2 ? 'up' : 'offer') : 'hold', ears: dancing ? 0.6 : 0 }));
    at(ctx, 700, 1480, 1, -sway, () => misti(ctx, t, { ...dM, look: [-0.6, -0.2], eyes: dancing ? (Math.cos(ph * Math.PI) > 0.6 ? 'closed' : 'big') : 'closed', mouth: dancing ? 'grin' : 'chew', arms: dancing ? (Math.floor(ph) % 2 ? 'hold' : 'up') : 'hold', tailWag: dancing ? 1 : 0.3 }));
    if (!gone) { at(ctx, 400, 1480 - 165, 0.9, 0, () => appleHalf(ctx, t, 82, -1, bites)); at(ctx, 700, 1480 - 150, 0.8, 0, () => appleHalf(ctx, t, 82, 1, bites)); }
    else alpha(ctx, 1 - seg(t, rem - 0.25, rem + 0.3), () => { for (let i = 0; i < 10; i++) { const a = i * 0.63, k = seg(t, rem - 0.25, rem + 0.3); sparkle(ctx, 550 + Math.cos(a) * 260 * k, 1320 + Math.sin(a) * 160 * k, 22, '#fff'); } });
    // crumbs while munching
    if (!gone) for (let i = 0; i < 6; i++) { const k = ((t * 1.3 + i / 6) % 1); alpha(ctx, 1 - k, () => circle(ctx, 450 + (i % 3) * 110 + Math.sin(i) * 30, 1290 + k * 160, 6, '#fff3cf', 3)); }
    // music notes when dancing
    if (dancing) for (let i = 0; i < 5; i++) { const k = ((t - rem) * 0.45 + i / 5) % 1; alpha(ctx, Math.sin(k * Math.PI), () => at(ctx, 200 + i * 170 + Math.sin(t + i) * 30, 1250 - k * 500, 1, Math.sin(t * 2 + i) * 0.3, () => { circle(ctx, 0, 0, 20, [C.pink, C.cyan, C.yellow, C.green, C.lilac][i], 5); ctx.beginPath(); ctx.moveTo(18, 0); ctx.lineTo(18, -70); ctx.lineTo(44, -56); paint(ctx, null, 7); })); }
  });
  leaves(ctx, t, 1);
  // x2 sweet badge
  at(ctx, 540, 740, life(t, sweet - 0.05, rem - 0.2, 0.4), wob(t, 1, 0.06), () => { heart(ctx, 0, 30, 4.2, C.pink, 10); text(ctx, 'x2', 0, -10, 130, '#fff', { lw: 18 }); text(ctx, 'SWEET!', 0, 92, 62, C.yellow, { lw: 12 }); });
  // follow button + tap
  const fb = life(t, T(3, 'tap') - 0.15, 60.5, 0.4), done = t > tap + 0.08;
  const press = done && t < tap + 0.25 ? 0.9 : 1;
  at(ctx, 540, 740, fb * press * (done ? 1 + 0.04 * Math.sin(t * 4) : 1), 0, () => followBtn(ctx, t, done));
  if (t > tap - 0.6 && t < tap + 0.9) { const k = E.outCubic(seg(t, tap - 0.6, tap)); at(ctx, lerp(900, 640, k), lerp(1060, 815, k) + (t > tap && t < tap + 0.2 ? 14 : 0), 1, -0.4, () => pointer(ctx)); }
  if (done) { const f = seg(t, tap + 0.08, tap + 0.7); if (f < 1) alpha(ctx, 1 - f, () => { for (let i = 0; i < 10; i++) { const a = (i / 10) * Math.PI * 2; star(ctx, 540 + Math.cos(a) * 330 * f, 740 + Math.sin(a) * 160 * f, 22, i % 2 ? C.yellow : C.pink, 4); } }); }
  // end title
  at(ctx, 540, 430, life(t, 50.6, 61, 0.5), wob(t, 0.6, 0.03), () => {
    rr(ctx, -400, -110, 800, 220, 110); paint(ctx, '#fff8ee', 10);
    text(ctx, 'TUTU & MISTI', 0, -28, 92, C.pink, { lw: 14 }); text(ctx, 'share with a friend today ♥', 0, 52, 46, C.green, { lw: 8, font: 'Fredoka', weight: 700 });
  });
}

// ---------- transitions: soft sparkle flash ----------
function flashT(ctx, t) {
  for (const b of BOUNDS) {
    const k = 1 - Math.abs(t - b) / 0.22; if (k <= 0) continue;
    alpha(ctx, k, () => { ctx.fillStyle = '#fffbea'; ctx.fillRect(0, 0, W, H); });
    alpha(ctx, k, () => { for (let i = 0; i < 16; i++) { const a = (i / 16) * Math.PI * 2, r = 300 + (t - b + 0.22) * 1600; sparkle(ctx, W / 2 + Math.cos(a) * r, H / 2 + Math.sin(a) * r, 34, i % 2 ? C.yellow : C.pink); } });
  }
}
function vignette(ctx, a) { const g = ctx.createRadialGradient(W / 2, H * 0.55, H * 0.35, W / 2, H * 0.55, H * 0.78); g.addColorStop(0, 'rgba(40,20,40,0)'); g.addColorStop(1, `rgba(40,20,40,${a})`); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); }

function sceneFor(t) { return t < 12 ? scene1 : t < 24 ? scene2 : t < 40 ? scene3 : scene4; }
function drawFrame(t) {
  const ctx = CTX; ctx.setTransform(SCALE, 0, 0, SCALE, 0, 0);
  ctx.fillStyle = '#c9ecff'; ctx.fillRect(0, 0, W, H);
  sceneFor(t)(ctx, t);
  vignette(ctx, 0.28);
  captions(ctx, t, CAP_Y, { size: 88 });
  flashT(ctx, t);
}

// ---------- SFX cues (scripts/mix.py) ----------
function buildCues() {
  const q = [], add = (t, type, gain = 1, extra = {}) => q.push({ t: +t.toFixed(3), type, gain, ...extra });
  add(0, 'birds', 0.22, { dur: 60 });
  BOUNDS.forEach(b => add(b - 0.15, 'sparkle', 0.6));
  const found = T(0, 'found'), apl = T(0, 'apple');
  for (let t = 0; t < found; t += 0.56) add(t + 0.5, 'hop', 0.55);
  add(found, 'ding', 0.6); add(found + 0.05, 'sparkle', 0.7);
  add(apl - 0.1 + 0.5, 'hop', 0.5); add(apl - 0.1 + 1.05, 'hop', 0.5);
  for (let t = 7.3; t < 8.95; t += 0.55) add(t + 0.5, 'hop', 0.5);
  add(9.6, 'rise', 0.45); add(9.95, 'chime', 0.5);
  add(T(1, 'eat') + 0.3, 'gulp', 0.5); add(T(1, 'himself...'), 'boing', 0.35);
  add(T(1, 'but') - 0.2, 'rustle', 0.6, { dur: T(1, 'little') - T(1, 'but') + 0.2 }); add(T(1, 'little') - 0.05, 'pop', 0.6);
  add(T(1, 'watching'), 'aww', 0.45); add(T(1, 'hungry') + 0.2, 'grumble', 0.7); add(23.0, 'ding', 0.55);
  add(24.4, 'hop', 0.5); add(25.0, 'hop', 0.5);
  add(T(2, 'half.') - 0.02, 'snap', 0.85); add(T(2, 'half.') + 0.02, 'sparkle', 0.8);
  add(T(2, 'Here,') + 0.1, 'swoosh', 0.5); add(T(2, 'Here,') + 1.2, 'pop', 0.6); add(T(2, "Let's"), 'aww', 0.55);
  const bc = T(2, 'Because'); add(bc, 'chime', 0.5); for (let t = bc + 0.12; t < 39.5; t += 0.6) add(t + 0.6, 'hop', 0.3);
  add(35.2, 'pop', 0.6);
  for (let t = 40.6; t < T(3, 'Remember') - 0.4; t += 0.45) add(t, 'crunch', 0.45);
  add(T(3, 'twice'), 'pop', 0.7); add(T(3, 'Remember') - 0.25, 'poof', 0.5);
  add(T(3, 'tap') - 0.15, 'pop', 0.7); add(T(3, 'follow,') + 0.08, 'click', 0.8); add(T(3, 'follow,') + 0.12, 'chime', 0.6);
  add(50.6, 'sparkle', 0.6);
  return q.sort((a, b) => a.t - b.t);
}
function initShakes() { SHAKES.push([T(2, 'half.'), 10]); }
