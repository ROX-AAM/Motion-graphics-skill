// 3D world (Three.js) + flat 2D character cards + 2D overlay. drawFrame(t) is deterministic.
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { BokehPass } from 'three/addons/postprocessing/BokehPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

const SC = window.SCALE || 1, PW = Math.round(1080 * SC), PH = Math.round(1920 * SC);
const SHORE = -30;
const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
renderer.setPixelRatio(1); renderer.setSize(PW, PH, false);
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.7; renderer.outputColorSpace = THREE.SRGBColorSpace;
const camera = new THREE.PerspectiveCamera(42, 1080 / 1920, 0.05, 3000);

// ---------- helpers ----------
function canvasTex(w, h, draw) { const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; }
const radialTex = (inner, outer) => canvasTex(256, 256, (x, w) => { const g = x.createRadialGradient(128, 128, 0, 128, 128, 128); g.addColorStop(0, inner); g.addColorStop(1, outer); x.fillStyle = g; x.fillRect(0, 0, 256, 256); });
const GLOW = radialTex('rgba(255,250,230,1)', 'rgba(255,250,230,0)'), SHADOW = radialTex('rgba(0,0,0,0.75)', 'rgba(0,0,0,0)');
const noiseTex = canvasTex(512, 512, (x) => { const r = rng(3); x.fillStyle = '#d8c39a'; x.fillRect(0, 0, 512, 512); for (let i = 0; i < 9000; i++) { const v = 150 + r() * 90 | 0; x.fillStyle = `rgba(${v},${v - 18},${v - 50},${0.25 + r() * 0.35})`; x.fillRect(r() * 512, r() * 512, 1 + r() * 2.5, 1 + r() * 2.5); } });
noiseTex.wrapS = noiseTex.wrapT = THREE.RepeatWrapping; noiseTex.repeat.set(40, 30);
const rayTex = canvasTex(64, 512, (x) => { const g = x.createLinearGradient(0, 0, 0, 512); g.addColorStop(0, 'rgba(200,240,255,0.55)'); g.addColorStop(1, 'rgba(200,240,255,0)'); x.fillStyle = g; x.fillRect(0, 0, 64, 512); const h = x.createLinearGradient(0, 0, 64, 0); h.addColorStop(0, 'rgba(0,0,0,1)'); h.addColorStop(0.5, 'rgba(0,0,0,0)'); h.addColorStop(1, 'rgba(0,0,0,1)'); x.globalCompositeOperation = 'destination-out'; x.fillStyle = h; x.fillRect(0, 0, 64, 512); });
const hash3 = (i) => { const s = Math.sin(i * 127.1) * 43758.5453; return s - Math.floor(s); };

// 2D character card: a flat cut-out plane with contact shadow, always turned toward the camera (yaw only)
function makeCard(draw, w, h, opts = {}) {
  const px = opts.px || 768, cv = document.createElement('canvas'); cv.width = px; cv.height = Math.round(px * h / w);
  const c2 = cv.getContext('2d'), tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 4;
  const mat = new THREE.MeshBasicMaterial({ map: tex, transparent: true, alphaTest: 0.04, side: THREE.DoubleSide, color: opts.tint || 0xdde6ff });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat);
  mesh.castShadow = true; mesh.customDepthMaterial = new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking, map: tex, alphaTest: 0.5 });
  const pivot = new THREE.Group(); pivot.add(mesh); pivot.position.y = opts.pivotY || 0; mesh.position.y = h * (opts.anchor ?? 0.32) - (opts.pivotY || 0);
  const group = new THREE.Group(); group.add(pivot);
  const cs = new THREE.Mesh(new THREE.PlaneGeometry(w * 0.85, w * 0.32), new THREE.MeshBasicMaterial({ map: SHADOW, transparent: true, depthWrite: false, opacity: 0.85 }));
  cs.rotation.x = -Math.PI / 2; cs.position.y = 0.015; group.add(cs);
  const unit = opts.unit || 600, oy = opts.oy ?? 0.62;
  return { group, pivot, mesh, cs, mat,
    update(t, state) { c2.setTransform(1, 0, 0, 1, 0, 0); c2.clearRect(0, 0, cv.width, cv.height); c2.translate(cv.width / 2 + (opts.ox || 0) * cv.width, cv.height * oy); const s = cv.width / unit; c2.scale(s, s); draw(c2, t, state); tex.needsUpdate = true; },
    face(cam) { group.rotation.y = Math.atan2(cam.position.x - group.position.x, cam.position.z - group.position.z) - Math.PI / 2 + Math.PI / 2; } };
}

// =================== BEACH ===================
const beach = new THREE.Scene();
beach.fog = new THREE.Fog(0x0b1838, 25, 260);
{ // sky dome
  const g = new THREE.SphereGeometry(1500, 32, 16), m = new THREE.ShaderMaterial({ side: THREE.BackSide, depthWrite: false, fog: false, uniforms: {},
    vertexShader: 'varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.); }',
    fragmentShader: 'varying vec3 vP; void main(){ float h = clamp(vP.y*1.4,0.,1.); vec3 c = mix(vec3(0.10,0.17,0.36), vec3(0.015,0.03,0.09), h); gl_FragColor = vec4(c,1.); }' });
  beach.add(new THREE.Mesh(g, m));
}
const stars = (() => { const n = 1600, p = new Float32Array(n * 3); for (let i = 0; i < n; i++) { const a = hash3(i) * Math.PI * 2, e = 0.06 + hash3(i + 999) * 1.4, r = 1300; p[i * 3] = Math.cos(a) * Math.cos(e) * r; p[i * 3 + 1] = Math.sin(e) * r; p[i * 3 + 2] = Math.sin(a) * Math.cos(e) * r; } const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(p, 3)); const s = new THREE.Points(g, new THREE.PointsMaterial({ color: 0xffffff, size: 2.2 * SC, sizeAttenuation: false, fog: false, transparent: true, opacity: 0.9 })); beach.add(s); return s; })();
const MOON = new THREE.Vector3(-70, 120, -700);
const moon = new THREE.Mesh(new THREE.SphereGeometry(26, 48, 32), new THREE.MeshBasicMaterial({ color: 0xfff4d6, fog: false })); moon.position.copy(MOON); beach.add(moon);
const moonGlow = new THREE.Sprite(new THREE.SpriteMaterial({ map: GLOW, color: 0xbfd2ff, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, fog: false, opacity: 0.55 })); moonGlow.scale.set(260, 260, 1); moonGlow.position.copy(MOON); beach.add(moonGlow);
beach.add(new THREE.HemisphereLight(0x7a9ad8, 0x3a2e1e, 1.6));
const moonLight = new THREE.DirectionalLight(0xd4ddff, 3.2); moonLight.castShadow = true; moonLight.shadow.mapSize.set(2048, 2048);
Object.assign(moonLight.shadow.camera, { left: -9, right: 9, top: 9, bottom: -9, near: 1, far: 200 }); moonLight.shadow.bias = -0.0004; moonLight.shadow.normalBias = 0.03;
beach.add(moonLight); beach.add(moonLight.target);
// sand
const sandH = (x, z) => { let y = 0.12 * Math.sin(x * 0.35 + z * 0.12) + 0.08 * Math.sin(x * 0.9 - z * 0.5) + 0.05 * Math.sin(z * 1.3 + x * 0.2); if (z < SHORE + 3) y -= (SHORE + 3 - z) * 0.11; y -= 0.38 * Math.exp(-(x * x + z * z) / 0.7); return y; };
const SANDCOL = 0xf0dcae;
const sand = (() => { const g = new THREE.PlaneGeometry(160, 120, 200, 150); g.rotateX(-Math.PI / 2); g.translate(0, 0, -10); const p = g.attributes.position, col = new Float32Array(p.count * 3);
  for (let i = 0; i < p.count; i++) { const x = p.getX(i), z = p.getZ(i); p.setY(i, sandH(x, z)); const wet = clamp((SHORE + 5 - z) / 4); col[i * 3] = lerp(1, 0.55, wet); col[i * 3 + 1] = lerp(1, 0.56, wet); col[i * 3 + 2] = lerp(1, 0.62, wet); }
  g.setAttribute('color', new THREE.BufferAttribute(col, 3)); g.computeVertexNormals();
  const m = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ map: noiseTex, color: SANDCOL, vertexColors: true, roughness: 1, metalness: 0, bumpMap: noiseTex, bumpScale: 0.6 })); m.receiveShadow = true; beach.add(m); return m; })();
// ocean
const ocean = (() => { const g = new THREE.PlaneGeometry(500, 300, 220, 140); g.rotateX(-Math.PI / 2); g.translate(0, 0, SHORE - 146); const m = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ color: 0x1a4e72, emissive: 0x051826, roughness: 0.14, metalness: 0.2 })); m.receiveShadow = true; beach.add(m); m.userData.base = g.attributes.position.array.slice(); return m; })();
const waveY = (x, z, t) => -0.06 + Math.sin(x * 0.18 + t * 1.1) * 0.12 + Math.sin(z * 0.35 + t * 1.6) * 0.18 + Math.sin((x + z) * 0.6 + t * 2.3) * 0.05;
function updateOcean(t) { const p = ocean.geometry.attributes.position, b = ocean.userData.base; for (let i = 0; i < p.count; i++) p.setY(i, waveY(b[i * 3], b[i * 3 + 2], t)); p.needsUpdate = true; ocean.geometry.computeVertexNormals(); }
// moon path glitter
const glitter = (() => { const n = 2600, p = new Float32Array(n * 3), c = new Float32Array(n * 3); for (let i = 0; i < n; i++) { const d = Math.pow(hash3(i * 3 + 1), 1.6), z = SHORE - 4 - d * 600, w = 2 + d * 70; p[i * 3] = MOON.x * d * 0.9 + (hash3(i * 3 + 2) - 0.5) * w; p[i * 3 + 1] = 0.12; p[i * 3 + 2] = z; }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(p, 3)); g.setAttribute('color', new THREE.BufferAttribute(c, 3));
  const s = new THREE.Points(g, new THREE.PointsMaterial({ size: 0.35, vertexColors: true, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, map: GLOW })); beach.add(s); return s; })();
function updateGlitter(t, k = 1) { const c = glitter.geometry.attributes.color; for (let i = 0; i < c.count; i++) { const v = Math.max(0, Math.sin(t * (3 + hash3(i) * 5) + i)) ** 6 * k; c.setXYZ(i, v, v * 0.97, v * 0.85); } c.needsUpdate = true; }
// wash (thin sheet of water running up the sand)
const wash = new THREE.Mesh(new THREE.PlaneGeometry(80, 7, 1, 1), new THREE.MeshStandardMaterial({ color: 0x9fd0e8, transparent: true, opacity: 0.28, roughness: 0.1, depthWrite: false })); wash.rotation.x = -Math.PI / 2; beach.add(wash);
const foamLine = new THREE.Mesh(new THREE.PlaneGeometry(80, 0.22), new THREE.MeshBasicMaterial({ color: 0xf2fbff, transparent: true, opacity: 0.6, depthWrite: false })); foamLine.rotation.x = -Math.PI / 2; beach.add(foamLine);
// breaker wave
const breaker = new THREE.Group(); beach.add(breaker);
{ // curling wave: a 2D profile extruded along the shoreline
  const sh = new THREE.Shape(); sh.moveTo(-4, 0); sh.bezierCurveTo(-2.4, 0.15, -1.2, 0.6, -0.3, 1.15); sh.bezierCurveTo(0.2, 1.45, 0.8, 1.45, 1.1, 1.15); sh.bezierCurveTo(1.25, 0.95, 1.05, 0.8, 0.8, 0.85);
  sh.bezierCurveTo(0.55, 0.9, 0.5, 0.6, 0.62, 0.35); sh.bezierCurveTo(0.7, 0.15, 0.9, 0.05, 1.2, 0); sh.lineTo(-4, 0);
  const g = new THREE.ExtrudeGeometry(sh, { depth: 38, bevelEnabled: false, curveSegments: 24 }); g.translate(0, 0, -36.5); g.rotateY(-Math.PI / 2); g.computeVertexNormals();
  const body = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ color: 0x2f8fb0, emissive: 0x0b3346, roughness: 0.15, metalness: 0.1, side: THREE.DoubleSide, transparent: true, opacity: 0.93 }));
  body.castShadow = true; breaker.add(body);
  const lip = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 38, 12), new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xbfe2f5, emissiveIntensity: 0.35, roughness: 0.7 })); lip.rotation.z = Math.PI / 2; lip.position.set(-17.5, 1.38, 0.5); breaker.add(lip); }
const spray = (() => { const n = 500, p = new Float32Array(n * 3); const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(p, 3)); const s = new THREE.Points(g, new THREE.PointsMaterial({ size: 0.12, color: 0xeaf7ff, transparent: true, opacity: 0.9, map: GLOW, depthWrite: false })); beach.add(s); return s; })();
// set the breaker for one wave that reaches z=zHit at time tHit (h = height)
function setWave(t, tHit, zHit, h = 1, gentle = false) {
  const a = seg(t, tHit - 1.8, tHit), b = seg(t, tHit, tHit + 1.2);
  if (t < tHit - 1.8 || b >= 1) return false;
  breaker.visible = true;
  const z = lerp(zHit - 16, zHit, E.inOutCubic(a)) + b * 0.4, s = h * (t < tHit ? lerp(0.5, 1, a) : 1 - E.inCubic(b));
  breaker.position.set(0, -0.15, z); breaker.scale.set(1, Math.max(0.01, s * 0.9), Math.max(0.2, s));
  const p = spray.geometry.attributes.position; spray.visible = t > tHit - 0.1 && !gentle;
  for (let i = 0; i < p.count; i++) { const k = clamp((t - tHit + 0.1) * 1.3), x = (hash3(i) - 0.5) * 30, vy = 1.5 + hash3(i + 7) * 3, vz = 1 + hash3(i + 3) * 2.5; p.setXYZ(i, x, 0.3 + vy * k - 4.9 * k * k, zHit + vz * k); }
  p.needsUpdate = true; spray.material.opacity = 0.9 * (1 - b);
  return true;
}
// rocks, cookie, nest
const rocks = [[3.6, -6], [-3.0, -10], [3.8, -15], [-3.8, -20], [3.0, -24], [-4.5, -4]].map(([x, z], i) => { const m = new THREE.Mesh(new THREE.DodecahedronGeometry(0.25 + hash3(i) * 0.3, 0), new THREE.MeshStandardMaterial({ color: 0x9aa0ac, roughness: 0.9, flatShading: true })); m.position.set(x, sandH(x, z) + 0.15, z); m.rotation.set(hash3(i + 1) * 3, hash3(i + 2) * 3, 0); m.scale.y = 0.7; m.castShadow = m.receiveShadow = true; beach.add(m); return m; });
const cookie = (() => { const g = new THREE.Group(); const base = new THREE.Mesh(new THREE.CylinderGeometry(0.62, 0.6, 0.16, 48), new THREE.MeshStandardMaterial({ color: 0xe0a060, roughness: 0.8, bumpMap: noiseTex, bumpScale: 2 })); base.castShadow = base.receiveShadow = true; g.add(base);
  for (let i = 0; i < 9; i++) { const a = hash3(i) * 6.28, r = 0.15 + hash3(i + 4) * 0.38; const chip = new THREE.Mesh(new THREE.SphereGeometry(0.07, 10, 8), new THREE.MeshStandardMaterial({ color: 0x3a2214, roughness: 0.6 })); chip.position.set(Math.cos(a) * r, 0.08, Math.sin(a) * r); chip.scale.y = 0.6; g.add(chip); }
  g.position.set(-1.05, sandH(-1.05, 0.25) + 0.09, 0.25); g.scale.setScalar(0.85); g.rotation.set(0.08, 0.4, -0.06); beach.add(g); return g; })();
const nestRing = new THREE.Mesh(new THREE.TorusGeometry(0.5, 0.05, 10, 40), new THREE.MeshStandardMaterial({ map: noiseTex, color: 0xe2cfa4, roughness: 1 })); nestRing.rotation.x = -Math.PI / 2; nestRing.position.y = -0.12; nestRing.receiveShadow = true; beach.add(nestRing);
const grains = new THREE.InstancedMesh(new THREE.SphereGeometry(0.016, 6, 4), new THREE.MeshStandardMaterial({ color: 0xf2e2bc, emissive: 0x3a3020, roughness: 1 }), 60); beach.add(grains);
const dummy = new THREE.Object3D();
function updateGrains(t, k) { for (let i = 0; i < 60; i++) { const a = hash3(i) * 6.28, r = 0.15 + hash3(i + 5) * 0.4, j = k * Math.sin(t * 25 + i) * 0.04; dummy.position.set(Math.cos(a) * r + j, sandH(Math.cos(a) * r, Math.sin(a) * r) + 0.01 + k * 0.06 * Math.abs(Math.sin(t * 12 + i)), Math.sin(a) * r); dummy.scale.setScalar(k > 0.02 ? 1 : 0.001); dummy.updateMatrix(); grains.setMatrixAt(i, dummy.matrix); } grains.instanceMatrix.needsUpdate = true; }
// characters
const turtle = makeCard(drawTurtle, 1.5, 1.5, { anchor: 0.18, oy: 0.68, pivotY: 0.28 }); beach.add(turtle.group);
const crab = makeCard(drawCrab, 1.6, 1.6, { anchor: 0.42, oy: 0.82, unit: 460, tint: 0xe6ecff }); beach.add(crab.group);
const gull = makeCard(drawGull, 3, 1.6, { anchor: 0.5, oy: 0.6, unit: 520 }); gull.cs.visible = false; beach.add(gull.group);
const gullShadow = new THREE.Mesh(new THREE.PlaneGeometry(4.5, 2.2), new THREE.MeshBasicMaterial({ map: canvasTex(256, 128, (x) => { x.filter = 'blur(6px)'; x.fillStyle = 'rgba(0,0,0,0.85)'; x.translate(128, 70); x.beginPath(); x.ellipse(0, 0, 18, 30, 0, 0, 7); x.fill(); for (const s of [-1, 1]) { x.beginPath(); x.moveTo(0, -6); x.quadraticCurveTo(s * 70, -40, s * 115, -8); x.quadraticCurveTo(s * 70, 0, 0, 10); x.fill(); } }), transparent: true, depthWrite: false }));
gullShadow.rotation.x = -Math.PI / 2; beach.add(gullShadow);
const babies = [0, 1, 2, 3, 4].map(i => { const c = makeCard(drawTurtle, 1.5, 1.5, { anchor: 0.3, oy: 0.68, px: 384 }); c.cs.visible = false; beach.add(c.group); return c; });

// =================== UNDERWATER ===================
const under = new THREE.Scene();
under.background = new THREE.Color(0x03243c); under.fog = new THREE.FogExp2(0x0a4a6c, 0.028);
under.add(new THREE.HemisphereLight(0x5fc8ff, 0x0a1a20, 1.1));
const uSun = new THREE.DirectionalLight(0xbfe8ff, 1.6); uSun.position.set(-5, 40, -20); uSun.castShadow = true; uSun.shadow.mapSize.set(1024, 1024); Object.assign(uSun.shadow.camera, { left: -12, right: 12, top: 12, bottom: -12 }); under.add(uSun); under.add(uSun.target);
const floor = (() => { const g = new THREE.PlaneGeometry(200, 200, 120, 120); g.rotateX(-Math.PI / 2); const p = g.attributes.position; for (let i = 0; i < p.count; i++) { const x = p.getX(i), z = p.getZ(i); p.setY(i, -12 + Math.sin(x * 0.3) * 0.6 + Math.sin(z * 0.2 + x * 0.1) * 0.9); } g.computeVertexNormals(); const m = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ map: noiseTex, color: 0x9fb0a0, roughness: 1 })); m.receiveShadow = true; under.add(m); return m; })();
for (let i = 0; i < 14; i++) { const m = new THREE.Mesh(new THREE.DodecahedronGeometry(0.8 + hash3(i) * 1.6, 0), new THREE.MeshStandardMaterial({ color: 0x4a6a70, roughness: 0.9, flatShading: true })); m.position.set((hash3(i + 1) - 0.5) * 50, -11.5, -10 - hash3(i + 2) * 60); m.castShadow = m.receiveShadow = true; under.add(m); }
const surface = (() => { const g = new THREE.PlaneGeometry(400, 400, 100, 100); g.rotateX(Math.PI / 2); g.translate(0, 14, 0); const m = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ color: 0x2f86b0, transparent: true, opacity: 0.4, side: THREE.DoubleSide })); m.userData.base = g.attributes.position.array.slice(); under.add(m); return m; })();
const uMoon = new THREE.Sprite(new THREE.SpriteMaterial({ map: GLOW, color: 0xfff6d8, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, fog: false })); uMoon.scale.set(9, 9, 1); uMoon.material.opacity = 0.85; uMoon.position.set(-6, 22, -40); under.add(uMoon);
const rays = [...Array(12)].map((_, i) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(2.5 + hash3(i) * 3, 50), new THREE.MeshBasicMaterial({ map: rayTex, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, opacity: 0.5, fog: false })); m.position.set(-20 + i * 3.6, -8, -10 - hash3(i + 9) * 30); m.rotation.z = 0.25; under.add(m); return m; });
const bubbles = new THREE.InstancedMesh(new THREE.SphereGeometry(0.09, 10, 8), new THREE.MeshStandardMaterial({ color: 0xffffff, transparent: true, opacity: 0.55, emissive: 0x8fd8ff, emissiveIntensity: 0.4, roughness: 0.05 }), 160); under.add(bubbles);
const sparks = (() => { const n = 500, p = new Float32Array(n * 3), c = new Float32Array(n * 3); for (let i = 0; i < n; i++) { p[i * 3] = (hash3(i) - 0.5) * 30; p[i * 3 + 1] = -8 + hash3(i + 1) * 20; p[i * 3 + 2] = -hash3(i + 2) * 40 + 6; } const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(p, 3)); g.setAttribute('color', new THREE.BufferAttribute(c, 3)); const s = new THREE.Points(g, new THREE.PointsMaterial({ size: 0.16, vertexColors: true, map: GLOW, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false })); under.add(s); return s; })();
const uTurtle = makeCard(drawTurtle, 1.6, 1.6, { anchor: 0.5, oy: 0.62, tint: 0xcfefff }); uTurtle.cs.visible = false; under.add(uTurtle.group);
function updateUnder(t, focus) {
  const p = surface.geometry.attributes.position, b = surface.userData.base; for (let i = 0; i < p.count; i++) p.setY(i, b[i * 3 + 1] + Math.sin(b[i * 3] * 0.15 + t * 1.3) * 0.4 + Math.sin(b[i * 3 + 2] * 0.2 + t) * 0.3); p.needsUpdate = true;
  rays.forEach((m, i) => { m.rotation.z = 0.25 + Math.sin(t * 0.4 + i) * 0.06; m.material.opacity = 0.18 + 0.1 * Math.sin(t * 0.7 + i * 1.7); });
  for (let i = 0; i < 160; i++) { const h = 22, y = -11 + ((t * (0.8 + hash3(i) * 1.4) + hash3(i + 3) * h) % h); dummy.position.set(focus.x + (hash3(i + 1) - 0.5) * 14 + Math.sin(t * 2 + i) * 0.2, y, focus.z + (hash3(i + 2) - 0.6) * 14); const s = 0.5 + hash3(i + 4) * 1.4; dummy.scale.set(s, s, s); dummy.updateMatrix(); bubbles.setMatrixAt(i, dummy.matrix); } bubbles.instanceMatrix.needsUpdate = true;
  const c = sparks.geometry.attributes.color; for (let i = 0; i < c.count; i++) { const v = Math.max(0, Math.sin(t * (2 + hash3(i) * 4) + i)) ** 4; c.setXYZ(i, v, v, v * 0.8); } c.needsUpdate = true;
}

// =================== camera + DOF ===================
const composers = {};
function composerFor(scene, key) {
  if (composers[key]) return composers[key];
  const c = new EffectComposer(renderer); c.setPixelRatio(1); c.setSize(PW, PH);
  c.addPass(new RenderPass(scene, camera)); const bokeh = new BokehPass(scene, camera, { focus: 5, aperture: 0.0025, maxblur: 0.008 }); c.addPass(bokeh); c.addPass(new OutputPass());
  return (composers[key] = { c, bokeh });
}
function camKeys(t, keys) { // [t, [px,py,pz], [lx,ly,lz]]
  let a = keys[0], b = keys[keys.length - 1];
  for (let i = 0; i < keys.length - 1; i++) if (t >= keys[i][0] && t <= keys[i + 1][0]) { a = keys[i]; b = keys[i + 1]; break; }
  const k = a === b ? 0 : E.inOutCubic(seg(t, a[0], b[0])); if (t > keys[keys.length - 1][0]) { a = b; }
  return [a[1].map((v, i) => lerp(v, b[1][i], k)), a[2].map((v, i) => lerp(v, b[2][i], k))];
}
function setCam(p, l) { camera.position.set(...p); camera.lookAt(...l); }

// =================== the story: turtle state over time ===================
const A = (i, w, after) => T(i, w, after);
let ANCH = null;
function anchors() {
  if (ANCH) return ANCH;
  const s = i => SEC(i).start;
  ANCH = { s1: s(1), s2: s(2), s3: s(3), s4: s(4), s5: s(5), s6: s(6), s7: s(7), s8: s(8),
    thisOne: A(0, 'This'), knocked: A(0, 'knocked'), again1: A(0, 'again,'), again2: A(0, 'again.'), watch: A(0, 'Watch'), thousand: A(0, 'thousand'),
    sand: A(1, 'sand'), push: A(1, 'pushes'), cookie: A(1, "He's"),
    between: A(2, 'between'), crawl: A(2, 'starts'), crabT: A(2, 'crab'), around: A(2, 'goes'), gullT: A(2, 'seagull\'s'), freeze: A(2, 'freezes.'), keeps: A(2, 'keeps'),
    rushes: A(3, 'rushes'), wave1: A(3, 'wave,'), throws: A(3, 'throws'), upside: A(3, 'Upside'),
    flips: A(4, 'flips'), tries: A(4, 'Tries'), another: A(4, 'Another'), back2: A(4, 'Back'),
    others: A(5, 'other'), tired: A(5, "He's"), shaking: A(5, 'shaking.'),
    looks: A(6, 'looks'), moonl: A(6, 'moonlight'), crawls: A(6, 'crawls,'),
    thisTime: A(7, 'This'), lifts: A(7, 'lifts'), first: A(7, 'first'), swims: A(7, 'swims.'),
    never: A(8, 'never'), waiting: A(8, 'waiting...'), end: BEATS.duration };
  return ANCH;
}
// returns {x, z, y, rot, pose, eyes, crawl, shake, look}
function turtleState(t) {
  const a = anchors(); const crawlPh = t * 9;
  const st = { x: 0, z: 0, y: 0, rot: 0, pose: 'still', eyes: 'open', crawl: 0, shake: 0, look: [0.3, 0] };
  const path = (k) => { // 0..1 along the beach run (nest → just before the shore)
    const z = lerp(-0.6, -17, k), x = Math.sin(clamp((z + 6.5) / -5) * Math.PI) * 1.7; return [x, z]; };
  if (t < a.s1) { st.x = 0; st.z = SHORE + 1.2; st.pose = 'crawl'; st.crawl = crawlPh; const hits = [a.knocked, a.again1, a.again2]; for (const h of hits) { const b = seg(t, h, h + 0.7); if (b > 0 && b < 1) { st.z += Math.sin(b * Math.PI) * 0.4 + b * 1.8; st.y = Math.sin(b * Math.PI) * 0.8; st.rot = b * Math.PI * 2; st.pose = 'flail'; } } return st; }
  if (t < a.s2) { const up = E.outBack(seg(t, a.push, a.push + 1.2), 1.4); st.y = lerp(-0.85, -0.05, up); st.eyes = t < a.push + 0.6 ? 'closed' : 'open'; st.look = [0.4, -0.3]; return st; }
  if (t < a.s3) {
    let k;
    if (t < a.crawl) k = 0; else if (t < a.crabT) k = lerp(0, 0.28, seg(t, a.crawl, a.crabT)); else if (t < a.around) k = 0.28; else if (t < a.freeze) k = lerp(0.28, 0.82, seg(t, a.around, a.freeze)); else if (t < a.keeps) k = 0.82; else k = lerp(0.82, 1, seg(t, a.keeps, a.s3));
    [st.x, st.z] = path(k); const moving = (t > a.crawl && t < a.crabT) || (t > a.around && t < a.freeze) || t > a.keeps;
    st.pose = moving ? 'crawl' : 'still'; st.crawl = moving ? crawlPh : 0; st.eyes = t > a.freeze && t < a.keeps ? 'wide' : t > a.crabT && t < a.around ? 'wide' : 'open';
    st.look = t > a.gullT && t < a.keeps ? [0, -1] : [0.4, 0]; return st;
  }
  if (t < a.s4) { // first wave
    const reach = lerp(SHORE + 2.5, SHORE + 0.2, seg(t, a.rushes, a.wave1 + 0.3)); st.z = reach; st.pose = t < a.throws ? 'crawl' : 'flail'; st.crawl = crawlPh;
    const b = seg(t, a.throws, a.throws + 1.2); if (b > 0) { st.z = lerp(reach, SHORE + 3.2, E.outCubic(b)); st.y = Math.sin(b * Math.PI) * 1.4; st.rot = Math.PI * E.inOutCubic(b); st.eyes = 'wide'; }
    return st;
  }
  if (t < a.s5) { // flip over, try again, tossed back
    const f = E.inOutCubic(seg(t, a.flips, a.flips + 0.55)); st.rot = Math.PI * (1 + f); st.y = Math.sin(f * Math.PI) * 0.5; st.z = SHORE + 3.2; st.pose = f < 1 ? 'flail' : 'crawl'; st.crawl = crawlPh;
    if (t > a.tries) st.z = lerp(SHORE + 3.2, SHORE + 0.4, seg(t, a.tries, a.another + 0.4));
    const b = seg(t, a.back2 - 0.35, a.back2 + 0.7); if (b > 0) { st.z = lerp(SHORE + 0.4, SHORE + 3, E.outCubic(b)); st.y = Math.sin(b * Math.PI) * 1.0; st.rot = Math.PI * 2 + Math.PI * 2 * E.inOutCubic(b); st.pose = 'flail'; st.eyes = 'wide'; }
    return st;
  }
  if (t < a.s6) { st.z = SHORE + 3; st.eyes = t > a.tired ? 'tired' : 'open'; st.shake = t > a.shaking - 0.4 ? 1 : t > a.tired ? 0.4 : 0; st.pose = 'crawl'; st.crawl = 0; return st; }
  if (t < a.s7) { const k = seg(t, a.crawls, a.s7); st.z = lerp(SHORE + 3, SHORE + 0.3, k); st.pose = k > 0 && k < 1 ? 'crawl' : 'still'; st.crawl = crawlPh * 0.8; st.eyes = t > a.moonl ? 'determined' : 'tired'; st.look = t < a.crawls ? [0.6, -0.8] : [0.5, 0]; return st; }
  // lifted by the wave
  const lift = E.inOutCubic(seg(t, a.lifts - 0.3, a.lifts + 1.2)); st.z = lerp(SHORE + 0.3, SHORE - 3, lift); st.y = lift * 0.9 + Math.sin(t * 2) * 0.08 * lift; st.pose = lift > 0.3 ? 'swim' : 'crawl'; st.crawl = t * 4; st.eyes = lift > 0.5 ? 'happy' : 'determined'; return st;
}

// =================== shots ===================
function beachShot(t) {
  const a = anchors(), st = turtleState(t);
  // defaults
  let p = [3, 1.4, 4], l = [0, 0.4, 0], focus = 4, dark = 0;
  breaker.visible = false; spray.visible = false; crab.group.visible = false; gull.group.visible = false; gullShadow.visible = false; babies.forEach(b => (b.group.visible = false));
  turtle.group.visible = true; let washZ = SHORE + 0.5 + Math.sin(t * 0.9) * 1.2;
  if (t < a.thisOne - 0.05) { [p, l] = camKeys(t, [[0, [0, 9, 4], [-30, 30, -500]], [a.thisOne, [0, 7, 0], [-30, 30, -500]]]); turtle.group.visible = false; dark = 0.55; focus = 30; }
  else if (t < a.watch - 0.05) { p = [6, 1.6, SHORE + 6]; l = [0, 0.45, SHORE + 1.3]; for (const h of [a.knocked, a.again1, a.again2]) { if (setWave(t, h, SHORE + 1.2, 1.1)) break; } washZ = SHORE + 1.5; focus = 4.5; }
  else if (t < a.s1) { [p, l] = camKeys(t, [[a.watch, [0, 2.2, SHORE + 2], [-20, 8, -400]], [a.s1, [-2, 2.8, SHORE - 18], [-25, 12, -400]]]); turtle.group.visible = false; focus = 60; }
  else if (t < a.sand - 0.1) { [p, l] = camKeys(t, [[a.s1, [2, 16, 14], [-20, 30, -300]], [a.sand - 0.1, [0.5, 1.2, 3.2], [0, -0.1, 0]]]); focus = 3.3; }
  else if (t < a.cookie - 0.1) { [p, l] = camKeys(t, [[a.sand, [0.45, 1.0, 3.0], [0.1, -0.15, 0]], [a.cookie, [0.35, 0.8, 2.6], [0.1, -0.1, 0]]]); focus = 2.7; }
  else if (t < a.s2) { [p, l] = camKeys(t, [[a.cookie, [0.35, 0.8, 2.6], [0.1, -0.1, 0]], [a.cookie + 1.2, [-0.4, 1.1, 4.0], [-0.45, -0.1, 0.1]]]); focus = 4.0; }
  else if (t < a.between - 0.05) { p = [0.25, 0.55, 2.4]; l = [0, 1.6, -80]; focus = 2.4; }
  else if (t < a.crawl - 0.05) { [p, l] = camKeys(t, [[a.between, [5, 2.5, 5], [0, 0, -8]], [a.crawl, [12, 13, 10], [-2, 0, -18]]]); focus = 18; }
  else if (t < a.gullT - 0.05) { p = [st.x + 3.4, 1.25, st.z + 1.0]; l = [st.x, 0.35, st.z - 0.7]; focus = 3.6; }
  else if (t < a.freeze - 0.05) { p = [st.x + 3.4, 3.6, st.z + 3.2]; l = [st.x, 0, st.z - 1]; focus = 5.5; }
  else if (t < a.s3) { [p, l] = camKeys(t, [[a.freeze, [st.x + 1.6, 0.6, st.z + 0.9], [st.x, 0.35, st.z]], [a.keeps + 0.6, [st.x + 3.8, 1.4, st.z + 2.2], [st.x, 0.35, st.z - 1.4]]]); focus = 2; }
  else if (t < a.s5) { // waves at the shore
    p = [6.2, 1.7, SHORE + 6.6]; l = [0, 0.45, SHORE + 1.7]; focus = 7.9;
    setWave(t, a.throws, SHORE + 0.2, 1.2) || setWave(t, a.back2 - 0.35, SHORE + 0.4, 1.0); washZ = SHORE + 1 + 2 * Math.max(seg(t, a.throws, a.throws + 0.6) * (1 - seg(t, a.throws + 0.8, a.throws + 2)), seg(t, a.back2 - 0.35, a.back2) * (1 - seg(t, a.back2 + 0.3, a.back2 + 1.4)));
    if (t > a.flips - 0.05 && t < a.tries) { p = [2.2, 0.8, SHORE + 4.3]; l = [0, 0.4, SHORE + 3.1]; focus = 2.3; }
  }
  else if (t < a.tired - 0.05) { p = [0.4, 1.3, SHORE + 5]; l = [-3, 0.8, -120]; focus = 25; turtle.group.visible = false;
    babies.forEach((b, i) => { b.group.visible = true; const z = SHORE - 8 - i * 3.5 - (t - a.s5) * 1.6, x = -1.5 + i * 1.2 - (t - a.s5) * 0.4; b.group.position.set(x, waveY(x, z, t) + 0.05, z); b.pivot.rotation.z = Math.sin(t * 3 + i) * 0.08; b.update(t, { pose: 'swim', crawl: t * 5 + i, eyes: 'happy' }); b.face(camera); }); }
  else if (t < a.s6) { p = [st.x + 1.7, 0.55, st.z + 0.8]; l = [st.x, 0.4, st.z]; focus = 1.9; }
  else if (t < a.moonl + 0.6) { p = [st.x + 1.7, 0.55, st.z + 0.9]; l = [st.x, 0.42, st.z]; focus = 1.95; }
  else if (t < a.crawls - 0.05) { p = [st.x + 0.1, 0.35, st.z - 0.6]; l = [-25, 9, -400]; focus = 80; turtle.group.visible = false; }
  else if (t < a.s7) { p = [st.x + 3.2, 1.0, st.z + 0.6]; l = [st.x, 0.4, st.z - 0.6]; focus = 3.3; }
  else { // the gentle lift
    [p, l] = camKeys(t, [[a.s7, [6, 1.6, SHORE + 5.6], [0, 0.5, SHORE + 0.7]], [a.lifts, [4.8, 1.7, SHORE + 3.4], [0, 0.6, SHORE - 0.4]], [a.first, [3.4, 1.9, SHORE + 0.2], [0, 0.9, SHORE - 3]]]); focus = 5.5;
    setWave(t, a.lifts, SHORE + 0.2, 0.9, true); }
  // place things
  turtle.group.position.set(st.x, Math.max(st.y, -0.9) + sandH(st.x, st.z) * (st.y > -0.5 ? 1 : 0), st.z); turtle.pivot.rotation.z = -st.rot;
  turtle.cs.material.opacity = 0.8 * clamp(1 - st.y * 1.2); turtle.cs.position.y = -st.y * (st.y > 0 ? 1 : 0) + 0.02;
  turtle.update(t, st);
  if (t > a.crabT - 0.6 && t < a.gullT) { crab.group.visible = true; const cz = -6.5 - 1.6; crab.group.position.set(0.15, sandH(0.15, cz), cz); crab.update(t, {}); }
  if (t > a.gullT - 0.4 && t < a.freeze + 1.4) { const k = seg(t, a.gullT - 0.3, a.freeze + 1.3), sx = lerp(-9, 9, k); gull.group.visible = true; gull.group.position.set(sx, 4.5 + Math.sin(k * 3) * 0.3, st.z - 2); gull.update(t, {}); gullShadow.visible = true; gullShadow.position.set(lerp(-7, 7, k), sandH(0, st.z) + 0.03, st.z + 0.1); }
  // ground-level details
  updateGrains(t, seg(t, a.sand, a.sand + 0.4) * (1 - seg(t, a.push + 1.2, a.push + 1.8)));
  nestRing.visible = false; grains.visible = t < a.s3; cookie.visible = t < a.s3;
  wash.visible = false; foamLine.visible = false;
  updateOcean(t); updateGlitter(t);
  moonLight.target.position.set(st.x, 0, st.z); moonLight.position.copy(moonLight.target.position).add(MOON.clone().normalize().multiplyScalar(80));
  setCam(p, l);
  [turtle, crab, gull].forEach(c => c.face(camera));
  return { focus, dark };
}
function underShot(t) {
  const a = anchors(); const k = seg(t, a.s8, a.end);
  const tz = -2 - (t - a.first) * 1.1 - k * 4, ty = -3 + (t - a.first) * 0.25 + k * 3.5, tx = Math.sin(t * 0.6) * 0.6;
  uTurtle.group.position.set(tx, ty, tz); uTurtle.pivot.rotation.z = 0.25 + Math.sin(t * 2) * 0.05;
  uTurtle.update(t, { pose: 'swim', crawl: t * 4.5, eyes: 'happy' });
  let p, l, focus;
  if (t < a.s8) { p = [tx + 2.6, ty + 0.2, tz + 2.4]; l = [tx, ty + 0.2, tz]; focus = 3.4; }
  else { const w = E.inOutCubic(seg(t, a.s8, a.s8 + 2.5)); p = [lerp(tx + 2.6, tx + 2.8, w), lerp(ty + 0.2, ty - 1.8, w), lerp(tz + 2.4, tz + 5.5, w)]; l = [tx, lerp(ty + 0.2, ty + 0.9, w), lerp(tz, tz - 1.5, w)]; focus = lerp(3.4, 6.2, w); }
  uSun.target.position.set(tx, -12, tz); uMoon.position.set(tx - 3, 22, tz - 26); uSun.position.set(tx - 5, 30, tz - 10);
  updateUnder(t, uTurtle.group.position);
  setCam(p, l); uTurtle.face(camera);
  return { focus, dark: 0 };
}

// =================== frame ===================
function drawFrame(t) {
  const a = anchors(); const isUnder = t >= a.first + 1.25;
  const sh = isUnder ? underShot(t) : beachShot(t);
  const { c, bokeh } = composerFor(isUnder ? under : beach, isUnder ? 'u' : 'b');
  bokeh.uniforms.focus.value = sh.focus; bokeh.uniforms.aperture.value = isUnder ? 0.004 : 0.0025;
  c.render();
  const ctx = CTX; ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.drawImage(renderer.domElement, 0, 0, CANVAS.width, CANVAS.height);
  ctx.setTransform(SC, 0, 0, SC, 0, 0);
  if (sh.dark) { ctx.fillStyle = `rgba(4,8,20,${sh.dark})`; ctx.fillRect(0, 0, W, H); }
  // overlays
  if (t < a.thisOne + 0.2) { alpha(ctx, 1 - seg(t, a.thisOne - 0.1, a.thisOne + 0.15), () => thousand(ctx, t, 0.5, a.thousand + 0.3, 512)); }
  if (t > a.cookie && t < a.s2) sizeBracket(ctx, t, 540, 780, 560, 'SAME SIZE!', seg(t, a.cookie + 0.3, a.cookie + 0.7));
  // cut dips
  const cuts = [a.thisOne, a.watch, a.s1, a.s2, a.between, a.crawl, a.gullT, a.freeze, a.s3, a.s5, a.tired, a.s6, a.crawls, a.s7];
  for (const ct of cuts) { const d = 1 - Math.abs(t - ct) / 0.12; if (d > 0) { ctx.fillStyle = `rgba(2,4,12,${0.85 * d})`; ctx.fillRect(0, 0, W, H); } }
  // dive into the water: bright bubble flash
  const dv = 1 - Math.abs(t - (a.first + 1.25)) / 0.35; if (dv > 0) { ctx.fillStyle = `rgba(190,235,255,${0.8 * dv})`; ctx.fillRect(0, 0, W, H); }
  vignette2(ctx, 0.45);
  captions(ctx, t, 1430, { size: 104 });
  subscribeBtn(ctx, t, a.end - 2.0);
  ctx.fillStyle = `rgba(0,0,0,${seg(t, a.end - 0.25, a.end - 0.02)})`; ctx.fillRect(0, 0, W, H);
}
function vignette2(ctx, a) { const g = ctx.createRadialGradient(W / 2, H * 0.5, H * 0.3, W / 2, H * 0.5, H * 0.8); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, `rgba(0,4,16,${a})`); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); }

function buildCues() {
  const a = anchors(), q = [], add = (t, type, gain = 1, extra = {}) => q.push({ t: +t.toFixed(3), type, gain, ...extra });
  add(0, 'shore', 0.5, { dur: a.first + 1.25 });
  add(a.thousand + 0.1, 'chime', 0.5); add(a.thisOne, 'whoosh', 0.3);
  for (const h of [a.knocked, a.again1, a.again2]) { add(h - 0.25, 'crash', 0.7); }
  add(a.watch, 'rise', 0.3); add(a.sand, 'sandshift', 0.6, { dur: a.push + 1.2 - a.sand }); add(a.push + 0.5, 'pop', 0.5); add(a.cookie + 0.3, 'tick', 0.4);
  add(a.crawl, 'patter', 0.35, { dur: a.crabT - a.crawl }); add(a.crabT, 'clack', 0.5); add(a.crabT + 0.5, 'clack', 0.4); add(a.around, 'patter', 0.35, { dur: a.freeze - a.around });
  add(a.gullT, 'gull', 0.6); add(a.gullT + 0.2, 'swoosh', 0.4); add(a.freeze, 'boom', 0.35); add(a.keeps, 'patter', 0.35, { dur: a.s3 - a.keeps });
  add(a.rushes, 'patter', 0.3, { dur: 1.2 }); add(a.throws - 0.25, 'crash', 0.85); add(a.throws + 1.2, 'thud', 0.4); add(a.upside, 'boing', 0.35);
  add(a.flips, 'swoosh', 0.35); add(a.flips + 0.5, 'thud', 0.3); add(a.another - 0.1, 'crash', 0.8); add(a.back2 + 0.4, 'thud', 0.4);
  add(a.tired, 'heart', 0.4, { dur: a.s6 - a.tired }); add(a.moonl, 'sparkle', 0.5); add(a.crawls, 'patter', 0.35, { dur: a.s7 - a.crawls });
  add(a.lifts - 0.4, 'swell', 0.6); add(a.first + 1.15, 'splash', 0.7); add(a.first + 1.25, 'underwater', 0.6, { dur: a.end - a.first - 1.25 }); add(a.swims, 'sparkle', 0.5);
  add(a.end - 2.0, 'pop', 0.6); add(a.end - 1.1, 'click', 0.7); add(a.end - 1.05, 'bell', 0.7);
  return q.sort((x, y) => x.t - y.t);
}

window.drawFrame = drawFrame;
(async () => {
  await document.fonts.ready;
  window.CUES = buildCues();
  drawFrame(0.01); drawFrame(SEC(7).start + 7);
  window.READY = true;
})();
