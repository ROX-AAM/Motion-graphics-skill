// "The Pig War" (1859) – comedic history cartoon timed to the user's ElevenLabs VO. drawFrame(t) is pure.
const CAP_Y = 400;
const SHAKES = [];
function shakeAt(t) { let x = 0, y = 0; for (const [t0, amp] of SHAKES) { if (t < t0 || t > t0 + 0.6) continue; const k = Math.exp(-(t - t0) * 8) * amp; x += Math.sin(t * 90) * k; y += Math.cos(t * 77) * k; } return [x, y]; }
function camera(ctx, t, s, cx, cy, fn) { const [sx, sy] = shakeAt(t); ctx.save(); ctx.translate(W / 2 + sx, 1150 + sy); ctx.scale(s, s); ctx.translate(-cx, -cy); fn(); ctx.restore(); }
function vignette(ctx, a) { const g = ctx.createRadialGradient(W / 2, H * 0.55, H * 0.32, W / 2, H * 0.55, H * 0.8); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, `rgba(10,8,30,${a})`); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); }
function outdoor(ctx, t, o = {}) {
  const g = ctx.createLinearGradient(0, 0, 0, 1400); g.addColorStop(0, o.sky1 || '#7fd0ff'); g.addColorStop(1, o.sky2 || '#d8f2ff'); ctx.fillStyle = g; ctx.fillRect(-500, -500, W + 1000, H + 1000);
  if (o.sun !== false) { circle(ctx, 880, 560, 80, '#ffe27a', 0); }
  for (const [x0, y, s] of [[120, 640, 1], [640, 520, 0.8]]) { const x = ((x0 + t * 14 * s) % 1400) - 150; for (const [dx, dy, r] of [[0, 0, 50], [50, -20, 60], [110, 0, 48]]) circle(ctx, x + dx * s, y + dy * s, r * s, '#ffffff', 0); }
  ctx.beginPath(); ctx.moveTo(-500, 1180); ctx.quadraticCurveTo(300, 1080, 1600, 1200); ctx.lineTo(1600, 2400); ctx.lineTo(-500, 2400); ctx.closePath(); paint(ctx, '#8fd27a', 0);
  ctx.fillStyle = K.grass; ctx.fillRect(-500, 1480, W + 1000, 1000);
  for (let i = 0; i < 6; i++) { const x = 80 + i * 190; rbox(ctx, x - 12, 1000, 24, 120, 6, K.brownD, 0); circle(ctx, x, 980, 70, '#3f9a4a', 0); circle(ctx, x - 30, 1010, 50, '#4fae56', 0); }
}
function sea(ctx, t) {
  const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#9fdcff'); g.addColorStop(0.5, '#d8f2ff'); g.addColorStop(0.5, K.sea); g.addColorStop(1, K.seaD); ctx.fillStyle = g; ctx.fillRect(-500, -500, W + 1000, H + 1000);
  ctx.strokeStyle = 'rgba(255,255,255,0.6)'; ctx.lineWidth = 6; ctx.lineCap = 'round'; for (let i = 0; i < 14; i++) { const x = ((i * 157 + t * 50) % 1300) - 100, y = 1000 + (i % 5) * 150; ctx.beginPath(); ctx.moveTo(x, y); ctx.quadraticCurveTo(x + 30, y - 14, x + 60, y); ctx.stroke(); }
}

const SHOTS = [];
function defineShots() {
  const S = i => SEC(i).start;
  const sh = (t0, fn) => SHOTS.push([t0, fn]);

  // ===== 0: HOOK =====
  const war = T(0, 'war.'), over = T(0, 'Over'), wait = T(0, 'wait');
  sh(0, (ctx, t) => {
    const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#2a2f6a'); g.addColorStop(1, '#5a3a7a'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    camera(ctx, t, 1, 540, 1150, () => {
      at(ctx, lerp(-200, 120, E.outBack(seg(t, 0.1, 0.7))), 760, 0.95, 0, () => ukFlag(ctx, 300, 190));
      at(ctx, lerp(1280, 660, E.outBack(seg(t, 0.4, 1.0))), 760, 0.95, 0, () => usFlag(ctx, 300, 190));
      at(ctx, 250, 1380, E.outBack(seg(t, T(0, 'got') - 0.2, T(0, 'got') + 0.3)), 0, () => cannon(ctx, 1));
      at(ctx, 830, 1380, E.outBack(seg(t, T(0, 'got'), T(0, 'got') + 0.5)), 0, () => cannon(ctx, -1));
      at(ctx, 540, 1100, pop(t, T(0, 'ready') - 0.1, 0.35), wob(t, 1.5, 0.08), () => { burst(ctx, 0, 0, 110, K.gold, 14, 7); text(ctx, 'VS', 0, 6, 90, K.ukRed, { lw: 14 }); });
      if (t > over - 0.1) at(ctx, 470, 1520, E.outBack(seg(t, over - 0.1, over + 0.4), 2.2) * 0.9, 0, () => pig(ctx, t, { eyes: t > wait ? 'worried' : 'happy', look: 1 }));
    });
    // record-scratch freeze on "over one pig"
    if (t > over - 0.1 && t < over + 0.25) alpha(ctx, 0.35, () => { ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, W, H); });
    at(ctx, 540, 1700, pop(t, T(0, 'many') - 0.2, 0.35), 0, () => { rbox(ctx, -260, -70, 520, 140, 30, 'rgba(255,248,238,0.95)'); text(ctx, 'DEATHS:', -70, 4, 70, K.ink, { lw: 0 }); text(ctx, '?', 160, 4, 96, K.ukRed, { lw: 12 }); });
  });

  // ===== 1: 1859, San Juan Island =====
  const isl = T(1, 'San'), both = T(1, 'Both'), side = T(1, 'So'), nob = T(1, 'nobody');
  sh(S(1), (ctx, t) => {
    const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#2a2f6a'); g.addColorStop(1, '#4a5a9a'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    at(ctx, 540, 1100, E.outBack(seg(t, S(1) + 0.2, S(1) + 0.7), 1.6), -0.08, () => { rbox(ctx, -330, -150, 660, 300, 40, K.white); text(ctx, '1859', 0, 10, 220, K.ukRed, { lw: 18 }); });
  });
  sh(isl - 0.15, (ctx, t) => {
    const z = E.inOutCubic(seg(t, isl, isl + 1.5));
    camera(ctx, t, lerp(1, 1.25, z), 540, lerp(1150, 1050, z), () => {
      mapScene(ctx, t, { pulse: 1 });
      if (t > both - 0.1) { at(ctx, 520, 1000, pop(t, both - 0.1, 0.4) * 0.45, -0.1 + Math.sin(t * 6) * 0.05, () => flagPole(ctx, t, 'uk')); at(ctx, 620, 1020, pop(t, both + 0.2, 0.4) * 0.45, 0.1 - Math.sin(t * 6) * 0.05, () => flagPole(ctx, t, 'us')); }
    });
    at(ctx, 540, 1650, pop(t, T(1, 'theirs.') - 0.1, 0.3), 0, () => { rbox(ctx, -300, -60, 600, 120, 60, 'rgba(255,248,238,0.95)'); text(ctx, '"MINE!"  "NO, MINE!"', 0, 4, 54, K.ink, { lw: 0 }); });
  });
  sh(side - 0.1, (ctx, t) => {
    camera(ctx, t, 1.0, 540, 1180, () => {
      outdoor(ctx, t, { sky1: t > nob ? '#8a9ab8' : '#7fd0ff', sun: t < nob });
      at(ctx, 290, 1500, 0.9, 0, () => cabin(ctx, 'uk')); at(ctx, 790, 1500, 0.9, 0, () => cabin(ctx, 'us'));
      at(ctx, 360, 1640, 0.8, 0, () => person(ctx, t, { kind: 'settlerUK', face: t > nob ? 'grumpy' : 'neutral', look: 1 }));
      at(ctx, 720, 1640, 0.8, 0, () => person(ctx, t, { kind: 'settlerUS', face: t > nob ? 'grumpy' : 'neutral', look: -1 }));
      if (t > nob) at(ctx, 540, 700, pop(t, nob, 0.4), 0, () => { for (const [x, r] of [[-80, 70], [0, 90], [90, 70]]) circle(ctx, x, 0, r, '#5a6478', 0); ctx.beginPath(); ctx.moveTo(-10, 60); ctx.lineTo(-40, 150); ctx.lineTo(0, 140); ctx.lineTo(-20, 220); ctx.lineWidth = 12; ctx.strokeStyle = K.gold; ctx.stroke(); });
    });
  });

  // ===== 2: the pig and the potatoes =====
  const found = T(2, 'found'), again = T(2, 'Again.'), belong = T(2, 'The'), grab = T(2, 'grabbed'), shot = T(2, 'shot');
  sh(S(2), (ctx, t) => {
    camera(ctx, t, 1.1, 540, 1250, () => {
      outdoor(ctx, t, { sky1: '#ffc58a', sky2: '#ffe9c8' });
      at(ctx, 540, 1600, 0.9, 0, () => potatoPatch(ctx, t));
      at(ctx, 300, 1640, 0.9, 0, () => person(ctx, t, { kind: 'farmer', face: t > found ? 'shock' : 'smile', look: 1 }));
      if (t > found - 0.3) { at(ctx, lerp(1250, 720, E.outCubic(seg(t, found - 0.3, found + 0.6))), 1640, 0.85, 0, () => pig(ctx, t, { dig: t > found + 0.6 ? 0.8 + 0.2 * Math.sin(t * 10) : 0, walk: t < found + 0.6, eyes: 'happy' })); if (t > found + 0.6) dirt(ctx, t, 830, 1560); }
    });
  });
  sh(again - 0.1, (ctx, t) => {
    camera(ctx, t, 1.35, 400, 1250, () => { outdoor(ctx, t, { sky1: '#ffc58a', sky2: '#ffe9c8' }); at(ctx, 540, 1600, 0.9, 0, () => potatoPatch(ctx, t)); at(ctx, 230, 1640, 0.9, 0, () => person(ctx, t, { kind: 'farmer', face: 'angry', arm: 'facepalm' })); at(ctx, 560, 1640, 0.8, 0, () => pig(ctx, t, { dig: 0.9, eyes: 'happy' })); dirt(ctx, t, 660, 1560); });
    at(ctx, 760, 780, pop(t, again, 0.3), 0.15, () => { rbox(ctx, -150, -70, 300, 140, 30, K.white); text(ctx, 'AGAIN!', 0, 4, 76, K.ukRed, { lw: 0 }); });
  });
  sh(belong - 0.1, (ctx, t) => {
    camera(ctx, t, 1.3, 560, 1300, () => { outdoor(ctx, t, { sky1: '#ffc58a', sky2: '#ffe9c8' }); at(ctx, 520, 1600, 1.15, 0, () => pig(ctx, t, { eyes: 'open', tag: true, look: 1 })); });
    at(ctx, 540, 820, pop(t, T(2, 'British') - 0.1, 0.35), 0, () => { rbox(ctx, -330, -70, 660, 140, 30, K.ukRed); text(ctx, "HUDSON'S BAY COMPANY", 0, 4, 52, K.white, { lw: 0 }); });
  });
  sh(T(2, 'So') - 0.1, (ctx, t) => {
    camera(ctx, t, 1.2, 420, 1250, () => { outdoor(ctx, t, { sky1: '#ffc58a', sky2: '#ffe9c8' }); at(ctx, 250, 1640, 0.95, 0, () => person(ctx, t, { kind: 'farmer', face: 'angry', arm: t > grab ? 'rifle' : 'down' })); at(ctx, 640, 1640, 0.75, 0, () => pig(ctx, t, { dig: t < shot ? 0.9 : 0, eyes: t > shot ? 'x' : 'happy', halo: seg(t, shot + 0.4, shot + 0.9) })); });
    if (t > shot - 0.05 && t < shot + 1.0) at(ctx, 760, 820, E.outBack(seg(t, shot - 0.05, shot + 0.2), 2) * (1 - seg(t, shot + 0.7, shot + 1.0)), 0.1, () => bang(ctx));
  });

  // ===== 3: escalation =====
  const fur = T(3, 'furious'), amer = T(3, 'Americans'), ships = T(3, 'answered'), bythe = T(3, 'By'), hungry = T(3, 'All');
  sh(S(3), (ctx, t) => {
    camera(ctx, t, 1.15, 540, 1250, () => { outdoor(ctx, t); at(ctx, 540, 1640, 1.0, 0, () => person(ctx, t, { kind: 'redcoat', face: 'angry', steam: true, arm: t > T(3, 'threatened') ? 'paper' : 'angry' })); });
  });
  sh(amer - 0.1, (ctx, t) => {
    camera(ctx, t, 1.0, 540, 1250, () => { outdoor(ctx, t); at(ctx, 540, 1600, 0.85, 0, () => person(ctx, t, { kind: 'farmer', face: 'smile' }));
      for (let i = 0; i < 4; i++) { const k = E.outCubic(seg(t, amer + i * 0.15, amer + 1.2 + i * 0.15)), side_ = i % 2 ? 1 : -1, x = 540 + side_ * (190 + Math.floor(i / 2) * 170); at(ctx, lerp(x + side_ * 700, x, k), 1640, 0.75, 0, () => person(ctx, t, { kind: 'usSoldier', face: 'neutral', arm: 'march', walk: k < 1, walkT: t * 3 + i, look: -side_ })); } });
  });
  sh(ships - 0.1, (ctx, t) => {
    camera(ctx, t, 1.0, 540, 1150, () => { sea(ctx, t); for (let i = 0; i < 3; i++) { const k = E.outCubic(seg(t, ships + i * 0.25, ships + 1.5 + i * 0.25)); at(ctx, lerp(1500, 220 + i * 320, k), 1060 + i * 120, 0.55 + i * 0.08, 0, () => warship(ctx, t + i)); } });
  });
  sh(bythe - 0.1, (ctx, t) => {
    const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#2a2f6a'); g.addColorStop(1, '#4a3a7a'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    const n461 = T(3, '461'), c14 = T(3, '14'), s5 = T(3, '5'), m2k = T(3, '2,000');
    at(ctx, 540, 800, pop(t, n461 - 0.15, 0.35) * 1.35, 0, () => { at(ctx, -330, -40, 0.35, 0, () => usFlag(ctx, 300, 190)); scoreBoard(ctx, [[String(Math.round(461 * seg(t, n461 - 0.1, n461 + 0.6))), 'SOLDIERS'], ...(t > c14 - 0.1 ? [['14', 'CANNONS']] : [])], K.usBlue); });
    at(ctx, 540, 1460, pop(t, s5 - 0.15, 0.35) * 1.35, 0, () => { at(ctx, -330, -40, 0.35, 0, () => ukFlag(ctx, 300, 190)); scoreBoard(ctx, [['5', 'WARSHIPS'], ...(t > m2k - 0.1 ? [[Math.round(2000 * seg(t, m2k - 0.1, m2k + 0.5)).toLocaleString('en-US') + '+', 'MEN']] : [])], K.ukRed); });
    at(ctx, 540, 1130, pop(t, T(3, 'facing') - 0.1, 0.3) * 1.3, 0, () => { burst(ctx, 0, 0, 80, K.gold, 14, 6); text(ctx, 'VS', 0, 4, 64, K.ukRed, { lw: 10 }); });
  });
  sh(hungry - 0.1, (ctx, t) => {
    const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#2a2f6a'); g.addColorStop(1, '#4a3a7a'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    at(ctx, 540, 1150, E.outBack(seg(t, hungry - 0.1, hungry + 0.4), 1.4), Math.sin(t * 2) * 0.04, () => { rbox(ctx, -300, -260, 600, 520, 20, K.gold); rbox(ctx, -270, -230, 540, 460, 10, '#d8f2ff'); at(ctx, -30, 170, 1.2, 0, () => pig(ctx, t, { eyes: 'happy' })); });
  });

  // ===== 4: the standoff =====
  const nobody = T(4, 'Nobody'), refused = T(4, 'refused'), stayed = T(4, 'stayed.'), yrs = T(4, '12'), camp = T(4, 'Camping');
  sh(S(4), (ctx, t) => {
    camera(ctx, t, 1.05, 540, 1250, () => { outdoor(ctx, t);
      at(ctx, 270, 1640, 0.85, 0, () => person(ctx, t, { kind: 'redcoat', face: t > nobody ? 'sweat' : 'neutral', arm: t > refused ? 'no' : 'point', look: 1 }));
      at(ctx, 810, 1640, 0.85, 0, () => person(ctx, t, { kind: 'usSoldier', face: t > nobody ? 'sweat' : 'neutral', arm: t > refused ? 'no' : 'point', look: -1 }));
      at(ctx, 540, 1640, 0.6, 0, () => pig(ctx, t, { eyes: 'worried', look: Math.sin(t * 3) > 0 ? 1 : -1 })); });
    at(ctx, 540, 860, pop(t, T(4, 'war') - 0.1, 0.3) * (1 - seg(t, refused - 0.2, refused)), 0, () => { rbox(ctx, -300, -70, 600, 140, 30, K.white); text(ctx, 'YOU SHOOT FIRST!', 0, 4, 56, K.ink, { lw: 0 }); });
    at(ctx, 540, 860, pop(t, refused, 0.3), 0, () => { rbox(ctx, -300, -70, 600, 140, 30, K.white); text(ctx, 'NOPE.  NOPE.', 0, 4, 64, K.ukRed, { lw: 0 }); });
  });
  sh(T(4, 'And') - 0.1, (ctx, t) => {
    camera(ctx, t, 1.0, 540, 1250, () => { outdoor(ctx, t, { sky1: '#ffb07a', sky2: '#ffe0b8', sun: false }); at(ctx, 280, 1560, 0.9, 0, () => tent(ctx, '#e8d0c0')); at(ctx, 800, 1560, 0.9, 0, () => tent(ctx, '#c9dcff')); at(ctx, 540, 1600, 0.9, 0, () => campfire(ctx, t));
      at(ctx, 390, 1700, 0.65, 0, () => person(ctx, t, { kind: 'redcoat', face: 'neutral', arm: 'shrug' })); at(ctx, 690, 1700, 0.65, 0, () => person(ctx, t, { kind: 'usSoldier', face: 'neutral', arm: 'shrug' })); });
    at(ctx, 820, 820, life(t, yrs - 0.15, camp - 0.1, 0.35) * 0.8, 0.08, () => calendar(ctx, Math.round(lerp(1860, 1872, seg(t, yrs, yrs + 1.2)))));
  });
  sh(camp - 0.1, (ctx, t) => {
    camera(ctx, t, 1.25, 560, 1050, () => { mapScene(ctx, t, { label: false });
      at(ctx, 560, 930, 0.32, 0, () => { tent(ctx, '#ff8a8a'); }); at(ctx, 600, 1110, 0.32, 0, () => { tent(ctx, '#8ab4ff'); });
      text(ctx, 'ENGLISH CAMP', 560, 860, 30, K.ukRed, { lw: 8, stroke: K.white }); text(ctx, 'AMERICAN CAMP', 600, 1170, 30, K.usBlue, { lw: 8, stroke: K.white }); });
  });

  // ===== 5: the Kaiser and the final count =====
  const gave = T(5, 'gave'), fin = T(5, 'Final'), one = T(5, 'One'), thepig = T(5, 'The', T(5, 'casualty.'));
  sh(S(5), (ctx, t) => {
    camera(ctx, t, 1.05, 540, 1250, () => { const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#3a1f3a'); g.addColorStop(1, '#6a2a4a'); ctx.fillStyle = g; ctx.fillRect(-500, -500, W + 1000, H + 1000);
      at(ctx, 540, 1560, 1, 0, () => throne(ctx)); at(ctx, 540, 1640, 0.95, 0, () => person(ctx, t, { kind: 'kaiser', face: t > gave ? 'smile' : 'neutral', arm: t > gave ? 'point' : 'down' })); });
    at(ctx, 540, 820, life(t, T(5, 'asked') - 0.1, gave - 0.1, 0.35), 0, () => scroll_(ctx, 'WHOSE ISLAND?'));
  });
  sh(gave - 0.1, (ctx, t) => {
    camera(ctx, t, 1.25, 560, 1050, () => { mapScene(ctx, t, { islandCol: '#8ab4ff' });
      at(ctx, 520, 1000, 0.45 * (1 - E.inCubic(seg(t, gave + 0.6, gave + 1.2))), 0, () => flagPole(ctx, t, 'uk'));
      at(ctx, 580, 1010, E.outBack(seg(t, gave + 0.3, gave + 0.9), 1.8) * 0.5, 0, () => flagPole(ctx, t, 'us')); });
  });
  sh(fin - 0.1, (ctx, t) => {
    const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#1d1846'); g.addColorStop(1, '#3a2f6a'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    // spotlight
    alpha(ctx, 0.25, () => { ctx.beginPath(); ctx.moveTo(470, 0); ctx.lineTo(610, 0); ctx.lineTo(900, 1800); ctx.lineTo(180, 1800); ctx.closePath(); ctx.fillStyle = '#fff6c8'; ctx.fill(); });
    at(ctx, 540, 1000, E.outBack(seg(t, fin - 0.1, fin + 0.4), 1.3), 0, () => { rbox(ctx, -330, -230, 660, 460, 30, K.white); text(ctx, 'CASUALTIES', 0, -140, 64, K.ink, { lw: 0 });
      const roll = t < one ? String(Math.floor(t * 23) % 10) + String(Math.floor(t * 17) % 10) + String(Math.floor(t * 31) % 10) : '1';
      text(ctx, roll, 0, 60, 230, t < one ? '#8a8aa0' : K.ukRed, { lw: 0 }); });
    if (t > thepig - 0.15) at(ctx, 540, 1600, E.outBack(seg(t, thepig - 0.15, thepig + 0.4), 1.6) * 0.9, 0, () => pig(ctx, t, { eyes: 'happy', halo: 1 }));
    if (t > BEATS.duration - 1.6) at(ctx, 540, 640, pop(t, BEATS.duration - 1.6, 0.35), 0, () => { rbox(ctx, -340, -60, 680, 120, 60, K.gold); text(ctx, 'THE PIG WAR · 1859', 0, 4, 60, K.ink, { lw: 0 }); });
  });
  SHOTS.sort((a, b) => a[0] - b[0]);
}

function drawFrame(t) {
  const ctx = CTX; ctx.setTransform(SCALE, 0, 0, SCALE, 0, 0);
  if (!SHOTS.length) defineShots();
  let i = 0; while (i + 1 < SHOTS.length && t >= SHOTS[i + 1][0]) i++;
  const k = seg(t, SHOTS[i][0], SHOTS[i][0] + 0.18);
  if (i > 0 && k < 1) { SHOTS[i - 1][1](ctx, t); alpha(ctx, k, () => SHOTS[i][1](ctx, t)); } else SHOTS[i][1](ctx, t);
  vignette(ctx, 0.35);
  captions(ctx, t, CAP_Y, { size: 92 });
  const end = BEATS.duration; alpha(ctx, seg(t, end - 0.4, end - 0.02), () => { ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H); });
}

function buildCues() {
  if (!SHOTS.length) defineShots();
  const q = [], add = (t, type, gain = 1, extra = {}) => q.push({ t: +t.toFixed(3), type, gain, ...extra });
  SHOTS.slice(1).forEach(([t0]) => add(t0 - 0.12, 'swoosh', 0.3));
  add(0.1, 'whoosh', 0.4); add(0.4, 'whoosh', 0.4); add(T(0, 'got'), 'clank', 0.5); add(T(0, 'ready'), 'stamp', 0.6); add(T(0, 'war.'), 'boom', 0.7);
  add(T(0, 'Over') - 0.1, 'scratch', 0.8); add(T(0, 'Over'), 'oink', 0.8); add(T(0, 'many') - 0.2, 'pop', 0.5);
  add(SEC(1).start + 0.2, 'stamp', 0.7); add(T(1, 'Both') - 0.1, 'pop', 0.5); add(T(1, 'Both') + 0.2, 'pop', 0.5); add(T(1, 'nobody'), 'thunder', 0.5);
  add(T(2, 'found') - 0.3, 'oink', 0.6); add(T(2, 'found') + 0.6, 'dig', 0.5, { dur: 2.2 }); add(T(2, 'Again.'), 'boing', 0.5); add(T(2, 'Again.') + 0.2, 'dig', 0.4, { dur: 1.4 });
  add(T(2, 'British') - 0.1, 'pop', 0.5); add(T(2, 'grabbed'), 'clank', 0.5); add(T(2, 'shot') - 0.03, 'gunshot', 0.55); add(T(2, 'shot') + 0.5, 'chime', 0.4);
  add(T(3, 'furious'), 'boing', 0.4); add(T(3, 'Americans'), 'march', 0.5, { dur: 1.6 }); add(T(3, 'answered'), 'horn', 0.6);
  add(T(3, '461') - 0.15, 'pop', 0.5); add(T(3, '461'), 'tick', 0.4); add(T(3, '14') - 0.1, 'pop', 0.4); add(T(3, '5') - 0.15, 'pop', 0.5); add(T(3, '2,000') - 0.1, 'pop', 0.4); add(T(3, 'All') - 0.1, 'oink', 0.6);
  add(T(4, 'war') - 0.1, 'pop', 0.4); add(T(4, 'refused'), 'boing', 0.4); add(T(4, 'stayed.'), 'cricket', 0.4, { dur: 1.3 }); add(T(4, '12') - 0.15, 'pop', 0.4); add(T(4, 'Camping'), 'swoosh', 0.3);
  add(T(5, 'asked') - 0.1, 'fanfare', 0.5); add(T(5, 'gave') + 0.3, 'pop', 0.5); add(T(5, 'Final') - 0.1, 'drumroll', 0.6, { dur: T(5, 'One') - T(5, 'Final') + 0.05 }); add(T(5, 'One'), 'stamp', 0.8);
  add(T(5, 'The', T(5, 'casualty.')) + 0.3, 'trombone', 0.6);
  return q.sort((a, b) => a.t - b.t);
}
function initShakes() { SHAKES.push([T(0, 'war.'), 12], [T(2, 'shot'), 16], [T(5, 'One'), 8]); }
