// "The Banishment Room" – Japanese corporate culture explainer, 9:16. drawFrame(t) is pure; shots start on VO words.
const CAP_Y = 400;
const SHAKES = [];
function shakeAt(t) { let x = 0, y = 0; for (const [t0, amp] of SHAKES) { if (t < t0 || t > t0 + 0.5) continue; const k = Math.exp(-(t - t0) * 9) * amp; x += Math.sin(t * 90) * k; y += Math.cos(t * 77) * k; } return [x, y]; }
function camera(ctx, t, s, cx, cy, fn) { const [sx, sy] = shakeAt(t); ctx.save(); ctx.translate(W / 2 + sx, 1150 + sy); ctx.scale(s, s); ctx.translate(-cx, -cy); fn(); ctx.restore(); }
function camKeys(t, keys) {
  if (t <= keys[0][0]) return keys[0].slice(1);
  for (let i = 0; i < keys.length - 1; i++) { const [a, ...A] = keys[i], [b, ...B] = keys[i + 1]; if (t <= b) { const k = E.inOutCubic(seg(t, a, b)); return A.map((v, j) => lerp(v, B[j], k)); } }
  return keys[keys.length - 1].slice(1);
}
const FLOOR = 1520;
function room(ctx, t, o = {}) {
  const g = ctx.createLinearGradient(0, 0, 0, FLOOR); g.addColorStop(0, o.w2 || P.wall2); g.addColorStop(1, o.w1 || P.wall1);
  ctx.fillStyle = g; ctx.fillRect(-2000, -500, 6000, FLOOR + 500);
  ctx.fillStyle = o.floor || P.floor; ctx.fillRect(-2000, FLOOR, 6000, 1200);
  ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.fillRect(-2000, FLOOR, 6000, 14);
}
function officeWall(ctx, t, x0, x1) { // windows along the wall
  for (let x = x0; x < x1; x += 360) { box(ctx, x, 620, 280, 420, 10, '#1a2433'); const g = ctx.createLinearGradient(0, 640, 0, 1020); g.addColorStop(0, '#41566e'); g.addColorStop(1, '#2a3a4e'); rr(ctx, x + 14, 634, 252, 392, 6); ctx.fillStyle = g; ctx.fill();
    for (let i = 0; i < 4; i++) box(ctx, x + 40 + i * 52, 820 - (i * 37 % 90), 36, 210 + (i * 37 % 90), 3, '#22303f'); box(ctx, x + 138, 634, 6, 392, 0, '#1a2433'); }
}
function worker(ctx, t, x, o = {}) { at(ctx, x, FLOOR, 1, 0, () => { chair(ctx); person(ctx, t, { pose: 'sit', suit: o.suit || '#56606f', tie: o.tie || '#8a94a3', face: o.face || 'neutral', look: o.look || [0, 1], hairStyle: o.hs || 0, arm: 'down' }); }); at(ctx, x, FLOOR - 250, 1, 0, () => desk(ctx, t, { monitor: true, monX: 120, papers: o.papers, mug: o.mug })); }
const B_ = () => ({ suit: P.boss, tie: P.bossTie, hairStyle: 1, glasses: true });
const V_ = () => ({ suit: P.vet, tie: P.vetTie, hairStyle: 2 });
function overlayTint(ctx, col, a) { alpha(ctx, a, () => { ctx.fillStyle = col; ctx.fillRect(0, 0, W, H); }); }
function vignette(ctx, a) { const g = ctx.createRadialGradient(W / 2, H * 0.55, H * 0.3, W / 2, H * 0.55, H * 0.75); g.addColorStop(0, 'rgba(4,6,12,0)'); g.addColorStop(1, `rgba(4,6,12,${a})`); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); }
// feet-up pose: seated person behind a desk with soles on the desk top
function feetUp(ctx, t, x, o) {
  at(ctx, x, FLOOR, 1, 0, () => { chair(ctx); person(ctx, t, { ...o, pose: 'sit' }); });
  at(ctx, x, FLOOR - 250, 1, 0, () => {
    desk(ctx, t, { w: 340, mug: o.mug, plant: o.plant, papers: o.papers });
    for (const s of [-1, 1]) { box(ctx, s * 44 - 18, -40, 36, 34, 10, '#1f2633'); ctx.beginPath(); ctx.ellipse(s * 46, -40, 24, 30, s * 0.25, 0, Math.PI * 2); F(ctx, '#0e1118'); ctx.beginPath(); ctx.ellipse(s * 46, -40, 15, 21, s * 0.25, 0, Math.PI * 2); F(ctx, '#2a303c'); }
  });
}

// ================= shots =================
const SHOTS = [];
function defineShots() {
  const s0 = SEC(0).start, s1 = SEC(1).start, s2 = SEC(2).start, s3 = SEC(3).start;
  const sh = (t0, fn) => SHOTS.push([t0, fn]);

  // --- 0a hook: you can't be fired… ---
  sh(0, (ctx, t) => {
    const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#0f141d'); g.addColorStop(1, '#232c3b'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    const but = T(0, 'but'), worse = T(0, 'worse.');
    const k = E.inOutCubic(seg(t, but, but + 0.5));
    alpha(ctx, 1 - k, () => {
      at(ctx, 540, 1050, 1, 0, () => { circle(ctx, 0, 0, 300, '#f4efe8', 0); circle(ctx, 0, 0, 130, P.red, 0); });
      at(ctx, 540, 1060, pop(t, 0.25, 0.4), -0.05, () => { box(ctx, -230, -300, 460, 600, 14, '#f4efe8'); text(ctx, 'TERMINATION', 0, -220, 64, '#1b2230', { lw: 0, font: 'Anton' }); text(ctx, 'NOTICE', 0, -150, 64, '#1b2230', { lw: 0, font: 'Anton' }); for (let i = 0; i < 6; i++) box(ctx, -170, -70 + i * 50, 340 - (i % 3) * 60, 16, 8, '#c9d1dc'); });
      at(ctx, 540, 1060, pop(t, T(0, 'fired') - 0.05, 0.25) * 1.2, 0, () => noIcon(ctx, 260));
    });
    // the door
    alpha(ctx, k, () => {
      at(ctx, 540, 1500, 1.15, 0, () => { door(ctx, 0.08 + 0.04 * Math.sin(t * 3), ''); });
      const flick = 0.6 + 0.4 * Math.sin(t * 31) * Math.sin(t * 7);
      alpha(ctx, flick * 0.8, () => { const gg = ctx.createLinearGradient(540, 0, 900, 0); gg.addColorStop(0, 'rgba(234,246,200,0.55)'); gg.addColorStop(1, 'rgba(234,246,200,0)'); ctx.fillStyle = gg; ctx.beginPath(); ctx.moveTo(400, 900); ctx.lineTo(440, 900); ctx.lineTo(1080, 1700); ctx.lineTo(1080, 1900); ctx.closePath(); ctx.fill(); });
    });
    at(ctx, 540, 760, pop(t, worse - 0.05, 0.3), 0, () => {});
  });
  // --- 0b the walk past your desk ---
  const walk0 = T(0, 'Imagine'), tiny = T(0, 'tiny'), noComp = T(0, 'computer,'), noWork = T(0, 'work.');
  sh(walk0 - 0.1, (ctx, t) => {
    const k = seg(t, walk0, tiny + 0.2), bx = lerp(200, 2350, k), yx = bx - 260;
    const camX = clamp(yx + 140, 540, 2300);
    camera(ctx, t, 1.0, camX, 1150, () => {
      room(ctx, t); officeWall(ctx, t, -200, 3200);
      const desks = [[400, 0], [820, 1], [1240, 2], [1660, 3]];
      desks.forEach(([x, i]) => { if (i === 2) { at(ctx, x, FLOOR, 1, 0, () => chair(ctx)); at(ctx, x, FLOOR - 250, 1, 0, () => desk(ctx, t, { monitor: true, monX: 120, plant: true, mug: true })); } else worker(ctx, t, x, { look: [clamp((yx - x) / 400, -1, 1), 0.2], suit: ['#56606f', '#4e5a52', '#5a5268', '#56606f'][i], hs: i % 2 }); });
      at(ctx, 2500, FLOOR, 1.05, 0, () => door(ctx, seg(t, tiny - 0.6, tiny), 'ROOM 7'));
      at(ctx, bx, FLOOR, 1, 0, () => person(ctx, t, { ...B_(), pose: k < 1 ? 'walk' : 'stand', walkT: t * 3, face: 'smile', arm: k >= 1 ? 'point' : 'behind' }));
      at(ctx, yx, FLOOR, 1, 0, () => person(ctx, t, { pose: k < 1 ? 'walk' : 'stand', walkT: t * 3 + 0.5, face: t > T(0, 'desk,') ? 'worried' : 'neutral', look: t > T(0, 'desk,') && t < tiny ? [-1, 0] : [1, 0] }));
      // "your desk" tag
      at(ctx, 1240, 1020, life(t, T(0, 'desk,') - 0.05, tiny + 0.3, 0.3), 0, () => { box(ctx, -130, -44, 260, 88, 44, P.teal); text(ctx, 'YOUR DESK', 0, 4, 46, '#0f141d', { lw: 0, font: 'Anton' }); ctx.beginPath(); ctx.moveTo(-18, 44); ctx.lineTo(18, 44); ctx.lineTo(0, 74); ctx.closePath(); F(ctx, P.teal); });
    });
    at(ctx, 300, 840, pop(t, noComp - 0.05, 0.3), -0.05, () => { computerIcon(ctx); noIcon(ctx, 150); });
    at(ctx, 780, 840, pop(t, noWork - 0.05, 0.3), 0.05, () => { trayIcon(ctx); noIcon(ctx, 150); });
  });
  // --- 0c the room: clock + idle guy ---
  const rm = T(0, 'Just'), tick = T(0, 'ticking'), guy = T(0, 'guy'), vac = T(0, 'vacation.');
  const theRoom = (ctx, t, o = {}) => {
    room(ctx, t, { w1: '#33403f', w2: '#1d2526', floor: '#262d2c' });
    at(ctx, 540, 560, 1, 0, () => fluorescent(ctx, t, 460, 1));
    at(ctx, 800, 860, 0.9, 0, () => wallClock(ctx, t, o.hour ?? 10, o.min ?? 12 + t / 60));
    if (o.vet !== false) feetUp(ctx, t, 320, { ...V_(), face: o.vetFace || 'happy', phone: 1, look: [0, 1] });
  };
  sh(rm - 0.1, (ctx, t) => {
    const [s, cx, cy] = camKeys(t, [[rm, 1.0, 540, 1150], [tick, 1.0, 540, 1150], [tick + 0.4, 1.7, 800, 900], [guy - 0.3, 1.7, 800, 900], [guy + 0.3, 1.25, 400, 1250]]);
    camera(ctx, t, s, cx, cy, () => { theRoom(ctx, t); at(ctx, 780, FLOOR, 1, 0, () => chair(ctx)); at(ctx, 780, FLOOR - 250, 1, 0, () => desk(ctx, t, { w: 340 })); });
    at(ctx, 420, 820, life(t, vac - 0.1, 99, 0.4), 0, () => palmBubble(ctx, t));
  });
  // --- 0d the boss in the doorway ---
  const bossT = T(0, 'Your', T(0, 'vacation.')), six = T(0, '6:00.”');
  sh(bossT - 0.15, (ctx, t) => {
    camera(ctx, t, 1.0 + 0.04 * seg(t, bossT, six + 0.6), 540, 1150, () => {
      room(ctx, t, { w1: '#33403f', w2: '#1d2526', floor: '#262d2c' });
      at(ctx, 540, FLOOR + 60, 1.45, 0, () => { box(ctx, -200, -560, 400, 560, 6, '#151a22'); box(ctx, -186, -546, 372, 546, 4, '#0b0e14'); });
      at(ctx, 540, FLOOR + 220, 1.45, 0, () => person(ctx, t, { ...B_(), face: t > T(0, 'nothing.') - 0.1 ? 'grin' : 'smile', arm: t > T(0, '“is') ? 'shrug' : 'point' }));
    });
    at(ctx, 830, 860, pop(t, T(0, 'until') - 0.05, 0.35) * 0.85, 0, () => wallClock(ctx, t, 6, 0, { sec: 0 }));
  });
  // --- 0e you: paid for this? ---
  const think = T(0, 'And', T(0, '6:00.”')), paid = T(0, 'paid');
  sh(think - 0.1, (ctx, t) => {
    camera(ctx, t, 1.6, 540, 1180, () => {
      room(ctx, t, { w1: '#33403f', w2: '#1d2526', floor: '#262d2c' });
      at(ctx, 540, 560, 1, 0, () => fluorescent(ctx, t, 460, 1));
      at(ctx, 540, FLOOR, 1, 0, () => { chair(ctx); person(ctx, t, { pose: 'sit', face: t > paid ? 'grin' : t > T(0, '“Wait...') ? 'shock' : 'worried', look: t > T(0, '“Wait...') ? [0, -1] : [1, 0] }); });
      at(ctx, 540, FLOOR - 250, 1, 0, () => desk(ctx, t, { w: 340 }));
    });
    if (t > paid - 0.1) moneyRain(ctx, t, paid - 0.1, seg(t, paid - 0.1, paid + 0.2));
  });

  // --- 1a paradise ---
  sh(s1, (ctx, t) => {
    camera(ctx, t, 1.15, 540, 1250, () => { theRoom(ctx, t, { vet: false }); feetUp(ctx, t, 540, { face: 'happy', sunglasses: true, arm: 'down', mug: true }); });
    overlayTint(ctx, '#ffb86b', 0.18);
    at(ctx, 540, 820, pop(t, T(1, 'paradise.') - 0.05, 0.4) * 0.9, 0, () => palmBubble(ctx, t));
    for (let i = 0; i < 8; i++) alpha(ctx, 0.5 + 0.5 * Math.sin(t * 5 + i), () => sparkle(ctx, 150 + i * 110, 1000 + Math.sin(i * 2.1) * 250, 18, '#fff3c4'));
  });
  // --- 1b coworkers stare ---
  const stare = T(1, 'Then,');
  sh(stare - 0.1, (ctx, t) => {
    const yx = lerp(-150, 1250, seg(t, stare, T(1, 'The') + 0.1));
    camera(ctx, t, 1.05, 560, 1150, () => {
      room(ctx, t, { w1: '#26323f', w2: '#151c27' }); officeWall(ctx, t, -100, 1300);
      [[200, '#56606f'], [560, '#4e5a52'], [920, '#5a5268']].forEach(([x, c], i) => worker(ctx, t, x, { suit: c, hs: i % 2, face: 'neutral', look: [clamp((yx - x) / 300, -1, 1), 0] }));
      at(ctx, yx, FLOOR + 140, 1.15, 0, () => person(ctx, t, { pose: 'walk', walkT: t * 3, face: 'worried', look: [0, 0.6] }));
    });
    overlayTint(ctx, '#1d3a5a', 0.22);
  });
  // --- 1c emails stop ---
  const em = T(1, 'emails');
  sh(T(1, 'The') - 0.1, (ctx, t) => {
    ctx.fillStyle = '#151c27'; ctx.fillRect(0, 0, W, H);
    const k = seg(t, em, em + 0.55);
    at(ctx, 540, 1080, E.outBack(seg(t, T(1, 'The') - 0.1, T(1, 'The') + 0.25), 1.2) * 1.05, 0, () => inboxUI(ctx, t, Math.round(lerp(14, 0, k)), 1 - k));
  });
  // --- 1d desk taken ---
  const old = T(1, 'and', em), fam = T(1, 'family');
  sh(old - 0.1, (ctx, t) => {
    camera(ctx, t, 1.25 + 0.05 * seg(t, old, fam + 1), 560, 1250, () => {
      room(ctx, t); officeWall(ctx, t, -100, 1300);
      at(ctx, 560, FLOOR, 1, 0, () => { chair(ctx); person(ctx, t, { pose: 'sit', suit: '#6a5a7a', tie: '#e2a4c8', face: 'smile', hairStyle: 0, hairColor: '#5a3a2a', look: [0, 1] }); });
      at(ctx, 560, FLOOR - 250, 1, 0, () => desk(ctx, t, { monitor: true, monX: 120, plant: true, photo: pop(t, fam - 0.05, 0.35) * 1.3 }));
    });
    if (t > fam) alpha(ctx, 1 - seg(t, fam + 0.6, fam + 1.4), () => { ctx.beginPath(); ctx.arc(330, 1080, 120 + seg(t, fam, fam + 0.5) * 30, 0, Math.PI * 2); ctx.lineWidth = 10; ctx.strokeStyle = P.yellow; ctx.stroke(); });
  });
  // --- 1e Friday: boss pops in ---
  const fri = T(1, 'Every'), pops = T(1, 'pops');
  sh(fri - 0.1, (ctx, t) => {
    camera(ctx, t, 1.1, 540, 1200, () => {
      theRoom(ctx, t, { vet: false });
      at(ctx, 170, FLOOR, 1, 0, () => { box(ctx, -150, -540, 300, 540, 6, '#151a22'); box(ctx, -136, -526, 272, 526, 4, '#0b0e14'); });
      const k = E.outBack(seg(t, pops - 0.05, pops + 0.35), 1.6);
      ctx.save(); rr(ctx, 34, FLOOR - 526, 272, 526, 4); ctx.clip();
      at(ctx, lerp(-60, 170, k), FLOOR + 30, 1.05, 0.12 * (1 - k) - 0.1, () => person(ctx, t, { ...B_(), face: t > T(1, 'smile,') - 0.1 ? 'grin' : 'smile', look: [1, 0], arm: 'wave' }));
      ctx.restore();
      at(ctx, 170, FLOOR, 1, 0, () => { box(ctx, 136, -540, 14, 540, 0, '#151a22'); box(ctx, 150, -540, 120, 540, 0, '#2b3535'); });
      feetUp(ctx, t, 720, { face: 'worried', look: [-1, 0] });
    });
    at(ctx, 560, 800, pop(t, T(1, 'Friday,') - 0.05, 0.35) * 0.6, 0.06, () => calendar(ctx, 'FRI'));
  });

  // --- 2a the veteran: 3 years, happiest ---
  const yrs = T(2, '3'), hap = T(2, 'happier');
  sh(s2, (ctx, t) => {
    camera(ctx, t, 1.25, 420, 1250, () => theRoom(ctx, t, { vetFace: 'happy' }));
    at(ctx, 800, 820, life(t, yrs - 0.05, hap - 0.1, 0.35) * 0.8, 0.05, () => { calendar(ctx, '3', P.teal); text(ctx, 'YEARS', 0, 130, 50, '#1b2230', { lw: 0, font: 'Anton' }); });
    at(ctx, 760, 1020, life(t, hap - 0.05, 99, 0.35), 0, () => {
      box(ctx, -250, -330, 500, 420, 30, 'rgba(15,20,29,0.85)'); text(ctx, 'HAPPINESS', 0, -280, 44, '#e9edf2', { lw: 0, font: 'Anton' });
      [[-150, 0.18, P.red, 'BOSS'], [-50, 0.25, P.red, 'STAFF'], [50, 0.12, P.red, 'HR'], [150, seg(t, hap, hap + 0.8), P.teal, 'HIM']].forEach(([x, k, c, l]) => at(ctx, x, 30, 0.75, 0, () => meter(ctx, k, c, l)));
    });
  });
  // --- 2b fine, pay me ---
  const so = T(2, 'So,'), fine = T(2, 'fine.');
  sh(so - 0.1, (ctx, t) => {
    camera(ctx, t, 1.3, 540, 1220, () => { theRoom(ctx, t, { vet: false }); at(ctx, 540, FLOOR, 1, 0, () => person(ctx, t, { face: t > fine ? 'smile' : 'neutral', arm: 'shrug', look: [0, -0.3] })); });
    for (let i = 0; i < 5; i++) at(ctx, 220 + i * 160, lerp(1700, 1250, E.outBack(seg(t, T(2, 'pay') + i * 0.08, T(2, 'pay') + 0.4 + i * 0.08))) + Math.sin(t * 3 + i) * 20, 1, 0, () => coin(ctx, t, i));
    at(ctx, 540, 820, pop(t, fine - 0.05, 0.25), 0, () => stampMark(ctx, 'FINE.', P.teal, 150));
  });
  // --- 2c feet up together ---
  const kick = T(2, 'You', fine);
  sh(kick - 0.1, (ctx, t) => {
    camera(ctx, t, 1.1, 540, 1250, () => { theRoom(ctx, t, { vet: false }); feetUp(ctx, t, 320, { ...V_(), face: 'happy', phone: 1, look: [0, 1] }); feetUp(ctx, t, 760, { face: 'happy', phone: 1, look: [0, 1], mug: true }); });
    overlayTint(ctx, '#ffb86b', 0.08);
  });
  // --- 2d Monday: he's gone ---
  const mon = T(2, 'Then,'), gone = T(2, 'gone.');
  sh(mon - 0.1, (ctx, t) => {
    camera(ctx, t, t > gone ? 1.3 : 1.1, t > gone ? 340 : 540, 1250, () => {
      theRoom(ctx, t, { vet: false });
      at(ctx, 320, FLOOR, 1, 0, () => chair(ctx)); at(ctx, 320, FLOOR - 250, 1, 0, () => desk(ctx, t, { w: 340, mug: true, papers: true, plant: true }));
      at(ctx, 780, FLOOR, 1, 0, () => chair(ctx)); at(ctx, 780, FLOOR - 250, 1, 0, () => desk(ctx, t, { w: 340 }));
      if (t < gone) at(ctx, lerp(1250, 900, seg(t, T(2, 'walk', mon), T(2, 'walk', mon) + 0.8)), FLOOR + 40, 1.05, 0, () => person(ctx, t, { pose: 'walk', walkT: t * 3, face: 'neutral', look: [-1, 0] }));
    });
    at(ctx, 560, 800, life(t, T(2, 'Monday,') - 0.05, gone - 0.1, 0.35) * 0.6, -0.06, () => calendar(ctx, 'MON', '#3a4352'));
    if (t > gone) { overlayTint(ctx, '#0b1a2a', 0.35); at(ctx, 760, 1450, 0.9, 0, () => person(ctx, t, { face: 'shock', look: [-1, -0.2] })); }
  });
  // --- 2e chair pushed in, desk cleared ---
  const ch = T(2, 'chair'), cl = T(2, 'cleared,');
  sh(T(2, 'His') - 0.1, (ctx, t) => {
    camera(ctx, t, 1.45, 540, 1300, () => {
      theRoom(ctx, t, { vet: false });
      const push = E.inOutCubic(seg(t, ch + 0.2, ch + 0.8));
      at(ctx, 540 + lerp(150, 0, push), FLOOR + lerp(0, -30, push), lerp(1, 0.92, push), 0, () => chair(ctx));
      at(ctx, 540, FLOOR - 250, 1, 0, () => desk(ctx, t, { w: 380 }));
      const items = 1 - seg(t, cl - 0.05, cl + 0.25);
      at(ctx, 540, FLOOR - 250, 1, 0, () => alpha(ctx, items, () => { box(ctx, 70, -30, 90, 22, 3, '#dfe5ec'); box(ctx, 110, -50, 40, 46, 8, '#c9504a'); box(ctx, -160, -46, 40, 40, 8, '#8a6a4a'); circle(ctx, -140, -70, 30, '#3f8f6a', 0); }));
      if (t > cl - 0.05 && t < cl + 0.6) { const k = seg(t, cl - 0.05, cl + 0.6); for (let i = 0; i < 10; i++) alpha(ctx, 1 - k, () => circle(ctx, 540 + Math.cos(i * 0.63) * 220 * k, FLOOR - 290 + Math.sin(i * 0.63) * 90 * k, 22 * (1 - k) + 4, '#c9d1dc', 0)); }
    });
    overlayTint(ctx, '#0b1a2a', 0.3);
  });
  // --- 2f nobody will tell you ---
  const nob = T(2, 'nobody');
  sh(T(2, 'and', cl) - 0.1, (ctx, t) => {
    camera(ctx, t, 1.0, 540, 1150, () => {
      room(ctx, t, { w1: '#202a36', w2: '#11171f' }); officeWall(ctx, t, -100, 1300);
      [[200, '#56606f'], [880, '#5a5268']].forEach(([x, c], i) => worker(ctx, t, x, { suit: c, hs: i, face: 'neutral', look: [i ? 1 : -1, 0] }));
      at(ctx, 540, FLOOR + 100, 1.1, 0, () => person(ctx, t, { face: 'sad', look: [Math.sin(t * 3) > 0 ? 1 : -1, 0], arm: 'shrug' }));
    });
    for (let i = 0; i < 3; i++) at(ctx, 380 + i * 160, 850 - i * 40, pop(t, nob + i * 0.25, 0.3), (i - 1) * 0.2, () => text(ctx, '?', 0, 0, 140, '#e9edf2', { lw: 0, font: 'Anton' }));
    overlayTint(ctx, '#0b1a2a', 0.3);
  });

  // --- 3a the law protects you ---
  const law = T(3, 'law', s3), fireT = T(3, 'fire');
  sh(s3, (ctx, t) => {
    const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#0f141d'); g.addColorStop(1, '#2a1f24'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    at(ctx, 540, 1080, 1, 0, () => { circle(ctx, 0, 0, 340, 'rgba(226,70,63,0.18)', 0); });
    at(ctx, 360, 1080, pop(t, law - 0.05, 0.4), -0.05, () => lawBook(ctx));
    at(ctx, 760, 1080, pop(t, T(3, 'almost') - 0.05, 0.35) * 0.9, 0, () => shield(ctx, 0));
    // FIRED stamp flies in and bounces off the shield
    if (t > fireT - 0.4 && t < fireT + 0.7) { const k = seg(t, fireT - 0.4, fireT), b = seg(t, fireT, fireT + 0.6);
      const x = t < fireT ? lerp(1250, 930, E.inCubic(k)) : lerp(930, 1250, E.outCubic(b)), y = t < fireT ? 1080 : 1080 - Math.sin(b * Math.PI) * 300 + b * 400;
      at(ctx, x, y, 0.9, t < fireT ? -0.2 : -0.2 + b * 3, () => stampMark(ctx, 'FIRED', P.red, 120, 0)); }
  });
  // --- 3b … but making them miserable is legal ---
  const mis = T(3, 'miserable.');
  sh(T(3, 'but', s3) - 0.1, (ctx, t) => {
    ctx.fillStyle = '#120f14'; ctx.fillRect(0, 0, W, H);
    at(ctx, 540, 1100, 1.1, -0.04, () => { box(ctx, -300, -380, 600, 760, 14, '#efe9df'); text(ctx, 'EMPLOYMENT RULES', 0, -300, 56, '#1b2230', { lw: 0, font: 'Anton' }); for (let i = 0; i < 9; i++) box(ctx, -240, -210 + i * 56, 480 - (i % 3) * 90, 18, 9, '#c9c2b6'); });
    at(ctx, 540, 1130, pop(t, mis - 0.08, 0.22) * 1.05, 0, () => stampMark(ctx, 'MISERABLE', P.red, 120, -0.18));
    at(ctx, 540, 620, life(t, T(3, 'no', s3) - 0.05, mis - 0.1, 0.3), 0, () => { box(ctx, -220, -60, 440, 120, 60, '#0f141d'); text(ctx, 'NO RULE ✗', 0, 4, 64, P.yellow, { lw: 0, font: 'Anton' }); });
  });
  // --- 3c they take away your work and friends ---
  const take = T(3, 'take'), frd = T(3, 'friends,');
  sh(T(3, 'So,', s3) - 0.1, (ctx, t) => {
    camera(ctx, t, 1.2, 540, 1250, () => {
      theRoom(ctx, t, { vet: false });
      at(ctx, 540, FLOOR, 1, 0, () => { chair(ctx); person(ctx, t, { pose: 'sit', face: 'sad', look: [0, -1] }); }); at(ctx, 540, FLOOR - 250, 1, 0, () => desk(ctx, t, { w: 360 }));
    });
    for (let i = 0; i < 4; i++) { const k = E.inCubic(seg(t, take + 0.2 + i * 0.1, take + 1.0 + i * 0.1)); at(ctx, 300 + i * 160 + k * (i - 1.5) * 120, lerp(1150, -200, k), 0.9, k * (i - 1.5), () => folder(ctx, ['#f6c945', '#5fd3c8', '#e2463f', '#c9d1dc'][i])); }
    [[180, 900, '#5a5268'], [900, 880, '#4e5a52'], [160, 1300, '#56606f'], [920, 1320, '#6a5a7a']].forEach(([x, y, c], i) => {
      const k = seg(t, frd - 0.1 + i * 0.12, frd + 0.6 + i * 0.12);
      alpha(ctx, pop(t, T(3, 'So,', s3) + i * 0.1, 0.3) * (1 - k), () => at(ctx, x + (x < 540 ? -1 : 1) * k * 200, y, 0.9, 0, () => avatar(ctx, c)));
    });
    overlayTint(ctx, '#0b1a2a', 0.25);
  });
  // --- 3d … and wait. Nobody can do nothing forever. ---
  const wt = T(3, 'wait...'), bec = T(3, 'because');
  sh(wt - 0.15, (ctx, t) => {
    const out = E.inOutCubic(seg(t, bec, bec + 1.8));
    ctx.fillStyle = '#05070b'; ctx.fillRect(0, 0, W, H);
    camera(ctx, t, lerp(1.25, 0.42, out), lerp(800, 540, out), lerp(1000, 1150, out), () => {
      ctx.save(); rr(ctx, -10, 470, 1100, 1300, 0); ctx.clip();
      theRoom(ctx, t, { vet: false, min: 12 + (t - wt) * 8 });
      at(ctx, 540, FLOOR, 1, 0, () => { chair(ctx); person(ctx, t, { pose: 'sit', face: 'sad', look: [0.6, -0.8] }); }); at(ctx, 540, FLOOR - 250, 1, 0, () => desk(ctx, t, { w: 360 }));
      ctx.restore();
      ctx.lineWidth = 10; ctx.strokeStyle = '#3a4352'; ctx.strokeRect(-10, 470, 1100, 1300);
    });
    alpha(ctx, seg(t, SEC(3).end - 0.5, SEC(3).end - 0.05), () => { ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H); });
  });
  SHOTS.sort((a, b) => a[0] - b[0]);
}

function drawFrame(t) {
  const ctx = CTX; ctx.setTransform(SCALE, 0, 0, SCALE, 0, 0);
  if (!SHOTS.length) defineShots();
  let i = 0; while (i + 1 < SHOTS.length && t >= SHOTS[i + 1][0]) i++;
  SHOTS[i][1](ctx, t);
  vignette(ctx, 0.55);
  // brief dip on each cut
  const cut = SHOTS[i][0]; if (i > 0) alpha(ctx, 1 - seg(t, cut, cut + 0.12), () => { ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H); });
  captions(ctx, t, CAP_Y, { size: 100 });
}

// ---------- SFX cues ----------
function buildCues() {
  if (!SHOTS.length) defineShots();
  const q = [], add = (t, type, gain = 1, extra = {}) => q.push({ t: +t.toFixed(3), type, gain, ...extra });
  SHOTS.slice(1).forEach(([t0]) => add(t0 - 0.12, 'swoosh', 0.35));
  const s1 = SEC(1).start, s2 = SEC(2).start, s3 = SEC(3).start;
  add(0.25, 'pop', 0.6); add(T(0, 'fired') - 0.05, 'stamp', 0.9); add(T(0, 'worse.'), 'boom', 0.8);
  add(T(0, 'Imagine'), 'typing', 0.25, { dur: T(0, 'tiny') - T(0, 'Imagine') }); add(T(0, 'tiny') - 0.5, 'creak', 0.6);
  add(T(0, 'computer,') - 0.05, 'error', 0.6); add(T(0, 'work.') - 0.05, 'error', 0.6);
  for (let t = T(0, 'Just'); t < T(0, 'Your', T(0, 'vacation.')) - 0.2; t += 1) add(t, 'tick', 0.5);
  add(T(0, 'ticking'), 'hum', 0.3, { dur: 4 }); add(T(0, 'vacation.'), 'chime', 0.4);
  add(T(0, 'until') - 0.05, 'tick', 0.7); add(T(0, 'paid'), 'cash', 0.7);
  add(T(1, 'paradise.'), 'sparkle', 0.5); add(T(1, 'Then,'), 'boom', 0.4);
  add(T(1, 'emails'), 'error', 0.4); add(T(1, 'stop,'), 'error', 0.5); add(T(1, 'family') - 0.05, 'pop', 0.6);
  add(T(1, 'Friday,') - 0.05, 'pop', 0.5); add(T(1, 'pops') - 0.05, 'creak', 0.5); add(T(1, 'smile,'), 'ding', 0.4);
  for (let t = s2; t < T(2, 'So,') - 0.3; t += 1) add(t, 'tick', 0.35);
  add(T(2, '3') - 0.05, 'pop', 0.5); add(T(2, 'happier') - 0.05, 'rise', 0.35); add(T(2, 'pay'), 'cash', 0.5); add(T(2, 'fine.') - 0.05, 'stamp', 0.8);
  add(T(2, 'Monday,') - 0.05, 'pop', 0.5); add(T(2, 'walk', T(2, 'Then,')), 'steps', 0.4, { dur: 0.9 }); add(T(2, 'gone.') - 0.4, 'rise', 0.4); add(T(2, 'gone.'), 'boom', 1.0);
  add(T(2, 'chair') + 0.2, 'slide', 0.5); add(T(2, 'cleared,') - 0.05, 'poof', 0.5);
  add(T(3, 'law', s3) - 0.05, 'thud', 0.5); add(T(3, 'fire') - 0.02, 'clank', 0.7); add(T(3, 'miserable.') - 0.08, 'stamp', 1.0);
  add(T(3, 'take') + 0.2, 'swoosh', 0.5); add(T(3, 'friends,'), 'swoosh', 0.4);
  for (let t = T(3, 'wait...'); t < SEC(3).end - 0.6; t += 1) add(t, 'tick', 0.7);
  add(T(3, 'forever.'), 'boom', 0.7);
  return q.sort((a, b) => a.t - b.t);
}
function initShakes() { SHAKES.push([T(0, 'fired'), 10], [T(2, 'gone.'), 14], [T(3, 'miserable.'), 14], [T(2, 'fine.'), 6]); }
