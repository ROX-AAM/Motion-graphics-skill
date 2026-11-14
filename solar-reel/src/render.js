#!/usr/bin/env node
// Deterministic frame renderer: headless Chromium draws drawFrame(t) on a canvas, frames depend only on t.
// Usage:
//   node src/render.js --from 0 --to 60 --fps 30 --scale 1 --out <dir> [--jpg]     → frames 00000.jpg …
//   node src/render.js --from 0 --to 60 --fps 30 --pipe renders/cache/video.mp4     → streams into ffmpeg (no audio)
//   node src/render.js --cues plan/cues.json                                         → dump SFX cue list
const { chromium } = require('playwright');
const { spawn } = require('child_process');
const fs = require('fs'), path = require('path');

const a = process.argv.slice(2);
const opt = (k, d) => { const i = a.indexOf('--' + k); return i >= 0 ? a[i + 1] : d; };
const from = +opt('from', 0), to = +opt('to', 60), fps = +opt('fps', 30), scale = +opt('scale', 1);
const out = opt('out', 'cache/frames'), pipe = opt('pipe'), cuesOut = opt('cues'), workers = +opt('workers', 4);
const root = path.resolve(__dirname, '..');
const W = 1080, H = 1920;

const http = require('http');
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.json': 'application/json', '.ttf': 'font/ttf', '.png': 'image/png', '.wav': 'audio/wav' };
function serve() { return new Promise(res => { const srv = http.createServer((q, r) => { const f = path.join(root, decodeURIComponent(q.url.split('?')[0])); if (!f.startsWith(root) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { r.writeHead(404); return r.end(); } r.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(r); }); srv.listen(0, '127.0.0.1', () => res(srv)); }); }
(async () => {
  const srv = await serve(); const base = `http://127.0.0.1:${srv.address().port}`;
  const beats = JSON.parse(fs.readFileSync(path.join(root, 'plan/beats.json'), 'utf8'));
  const exe = process.env.CHROME_PATH || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
  const browser = await chromium.launch({ executablePath: exe, args: ['--disable-gpu-vsync', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const mkPage = async () => {
    const page = await browser.newPage({ viewport: { width: Math.round(W * scale), height: Math.round(H * scale) } });
    page.on('pageerror', e => { console.error('page error:', e.message); process.exit(1); });
    await page.addInitScript(`window.BEATS=${JSON.stringify(beats)};window.SCALE=${scale};`);
    await page.goto(base + '/src/index.html');
    await page.waitForFunction('window.READY === true', null, { timeout: 120000 });
    return page;
  };

  if (cuesOut) {
    const page = await mkPage();
    const cues = await page.evaluate('window.CUES');
    fs.writeFileSync(cuesOut, JSON.stringify(cues, null, 1));
    console.log(`cues: ${cues.length} → ${cuesOut}`);
    await browser.close(); srv.close(); return;
  }

  const pages = await Promise.all(Array.from({ length: workers }, mkPage));
  const n = Math.max(1, Math.round((to - from) * fps));
  const grab = (page, t) => page.evaluate(([t]) => { drawFrame(t); return CANVAS.toDataURL('image/jpeg', 0.92); }, [t]);

  let ff;
  if (pipe) {
    fs.mkdirSync(path.dirname(pipe), { recursive: true });
    ff = spawn('ffmpeg', ['-v', 'error', '-y', '-f', 'image2pipe', '-framerate', String(fps), '-c:v', 'mjpeg', '-i', '-',
      '-c:v', 'libx264', '-preset', 'medium', '-crf', '17', '-pix_fmt', 'yuv420p', '-r', String(fps), pipe], { stdio: ['pipe', 'inherit', 'inherit'] });
  } else fs.mkdirSync(out, { recursive: true });

  const t0 = Date.now();
  for (let i = 0; i < n; i += workers) {
    const batch = [];
    for (let j = 0; j < workers && i + j < n; j++) batch.push(grab(pages[j], from + (i + j) / fps));
    const urls = await Promise.all(batch);
    for (let j = 0; j < urls.length; j++) {
      const buf = Buffer.from(urls[j].split(',')[1], 'base64');
      if (ff) { if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r)); }
      else fs.writeFileSync(path.join(out, String(i + j).padStart(5, '0') + '.jpg'), buf);
    }
    if (pipe && (i / workers) % 60 === 0) process.stdout.write(`\r${i}/${n} frames  ${((Date.now() - t0) / 1000).toFixed(0)} s`);
  }
  if (ff) { ff.stdin.end(); await new Promise(r => ff.on('close', r)); console.log(`\nvideo: ${pipe}`); }
  console.log(`${n} frames in ${((Date.now() - t0) / 1000).toFixed(1)} s`);
  await browser.close(); srv.close();
})().catch(e => { console.error(e); process.exit(1); });
