// Downloads every image/document referenced in content/ and writes optimized, responsive copies to public/media/.
// Writes content/media.json (original URL -> local files) which build.mjs uses.
// Re-run after adding images:  npm run media
import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import sharp from 'sharp';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CONTENT = path.join(ROOT, 'content');
const OUT = path.join(ROOT, 'public', 'media');
const CACHE = path.join(ROOT, '.cache', 'originals');
const MANIFEST = path.join(CONTENT, 'media.json');
const WIDTHS = [480, 960, 1600, 2400];
const IMG_RE = /\.(jpe?g|png|gif|webp|svg)(\?.*)?$/i;
const DOC_RE = /\.(pdf|docx?|xlsx?|pptx?|mp3|mp4|mov|m4v|webm)(\?.*)?$/i;
const URL_RE = /https?:\/\/[^\s"'<>)]+/g;

async function walk(dir) {
  const out = [];
  for (const e of await fs.readdir(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...await walk(p));
    else if (e.name.endsWith('.json') && e.name !== 'media.json' && e.name !== 'forms.json') out.push(p);
  }
  return out;
}

function isOurs(u) {
  return /^https?:\/\/(www\.)?sunflowercreativearts\.org\/wp-content\/uploads\//.test(u) ||
    /^https?:\/\/(c\d+|farm\d+|live)\.staticflickr\.com\//.test(u);
}

function localBase(u) {
  const url = new URL(u);
  let p = decodeURIComponent(url.pathname);
  if (p.includes('/wp-content/uploads/')) p = p.split('/wp-content/uploads/')[1];
  else p = 'flickr/' + path.basename(p);
  const ext = path.extname(p);
  const stem = p.slice(0, -ext.length).replace(/[^A-Za-z0-9/_-]+/g, '-').replace(/-+/g, '-');
  return { stem, ext: ext.toLowerCase() };
}

async function download(u) {
  const key = crypto.createHash('sha1').update(u).digest('hex') + path.extname(new URL(u).pathname).toLowerCase();
  const file = path.join(CACHE, key);
  try { await fs.access(file); return file; } catch {}
  const urls = [u, u.replace(/^http:/, 'https:')];
  for (const cand of urls) {
    try {
      const r = await fetch(cand, { headers: { 'User-Agent': 'Mozilla/5.0 (site migration)' } });
      if (!r.ok) continue;
      const buf = Buffer.from(await r.arrayBuffer());
      if (buf.length < 200) continue;
      await fs.writeFile(file, buf);
      return file;
    } catch {}
  }
  return null;
}

async function processOne(u, manifest) {
  if (manifest[u] && manifest[u].ok) return;
  const src = await download(u);
  if (!src) { manifest[u] = { ok: false }; console.warn('  missing', u); return; }
  const { stem, ext } = localBase(u);
  const isDoc = DOC_RE.test(u);
  if (isDoc || ext === '.svg' || ext === '.gif') {
    const rel = `${stem}${ext}`;
    await fs.mkdir(path.dirname(path.join(OUT, rel)), { recursive: true });
    await fs.copyFile(src, path.join(OUT, rel));
    let w, h;
    if (ext === '.gif') { try { const m = await sharp(src).metadata(); w = m.width; h = m.pageHeight || m.height; } catch {} }
    manifest[u] = { ok: true, file: `/media/${rel}`, w, h, kind: isDoc ? 'doc' : 'raw' };
    return;
  }
  let img;
  try { img = sharp(src, { failOn: 'none' }).rotate(); } catch (e) { manifest[u] = { ok: false }; return; }
  const meta = await img.metadata();
  const w0 = meta.autoOrient?.width || meta.width, h0 = meta.autoOrient?.height || meta.height;
  if (!w0) { manifest[u] = { ok: false }; return; }
  const widths = WIDTHS.filter(w => w < w0 * 1.05);
  if (!widths.length || widths[widths.length - 1] < Math.min(w0, 2400) * 0.9) widths.push(Math.min(w0, 2400));
  const uniq = [...new Set(widths)].sort((a, b) => a - b);
  await fs.mkdir(path.dirname(path.join(OUT, stem)), { recursive: true });
  for (const w of uniq) {
    const out = path.join(OUT, `${stem}-${w}.webp`);
    try { await fs.access(out); continue; } catch {}
    await sharp(src, { failOn: 'none' }).rotate().resize({ width: w, withoutEnlargement: true })
      .webp({ quality: meta.hasAlpha ? 82 : 72, effort: 4 }).toFile(out);
  }
  // tiny blurred placeholder colour
  const { dominant } = await sharp(src, { failOn: 'none' }).stats();
  manifest[u] = {
    ok: true, base: `/media/${stem}`, widths: uniq, w: w0, h: h0, alpha: !!meta.hasAlpha,
    color: `rgb(${dominant.r},${dominant.g},${dominant.b})`
  };
}

async function main() {
  await fs.mkdir(CACHE, { recursive: true });
  await fs.mkdir(OUT, { recursive: true });
  let manifest = {};
  try { manifest = JSON.parse(await fs.readFile(MANIFEST, 'utf8')); } catch {}
  const urls = new Set();
  for (const f of await walk(CONTENT)) {
    const txt = await fs.readFile(f, 'utf8');
    for (let m of txt.match(URL_RE) || []) {
      m = m.replace(/\\$/, '').replace(/&amp;/g, '&');
      if (!isOurs(m)) continue;
      if (IMG_RE.test(new URL(m).pathname) || DOC_RE.test(new URL(m).pathname)) urls.add(m.split('?')[0]);
    }
  }
  const retry = process.argv.includes('--retry');
  const list = [...urls].filter(u => !manifest[u] || (!manifest[u].ok && retry));
  console.log(`${urls.size} media URLs, ${list.length} to process`);
  let i = 0;
  const worker = async () => {
    while (i < list.length) {
      const u = list[i++];
      try { await processOne(u, manifest); } catch (e) { console.warn('  fail', u, e.message); manifest[u] = { ok: false }; }
      if (i % 25 === 0) { console.log(`  ${i}/${list.length}`); await fs.writeFile(MANIFEST, JSON.stringify(manifest, null, 1)); }
    }
  };
  await Promise.all(Array.from({ length: 8 }, worker));
  const sorted = Object.fromEntries(Object.entries(manifest).sort());
  await fs.writeFile(MANIFEST, JSON.stringify(sorted, null, 1));
  const bad = Object.entries(manifest).filter(([, v]) => !v.ok).map(([k]) => k);
  console.log(`done. ${Object.keys(manifest).length - bad.length} ok, ${bad.length} missing`);
  if (bad.length) console.log(bad.join('\n'));
}
main();
