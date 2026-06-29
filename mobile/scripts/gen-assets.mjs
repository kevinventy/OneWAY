// Generates ONE WAY Expo assets (icon, adaptive-icon, splash) as PNGs.
// Pure Node (zlib) — no native deps. Run: node scripts/gen-assets.mjs
import { deflateSync } from 'node:zlib';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const BRAND = [20, 26, 87];
const AMBER = [255, 149, 0];
const SS = 4;

const CRC = (() => { const t = new Uint32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
const crc32 = (b) => { let c = 0xffffffff; for (let i = 0; i < b.length; i++) c = CRC[(c ^ b[i]) & 0xff] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };
function chunk(type, data) { const len = Buffer.alloc(4); len.writeUInt32BE(data.length, 0); const body = Buffer.concat([Buffer.from(type, 'ascii'), data]); const c = Buffer.alloc(4); c.writeUInt32BE(crc32(body), 0); return Buffer.concat([len, body, c]); }
function png(w, h, rgba) {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4); ihdr[8] = 8; ihdr[9] = 6;
  const stride = w * 4; const raw = Buffer.alloc((stride + 1) * h);
  for (let y = 0; y < h; y++) { raw[y * (stride + 1)] = 0; rgba.copy(raw, y * (stride + 1) + 1, y * stride, y * stride + stride); }
  return Buffer.concat([sig, chunk('IHDR', ihdr), chunk('IDAT', deflateSync(raw, { level: 9 })), chunk('IEND', Buffer.alloc(0))]);
}
function sample(nx, ny, { transparentBg, safe }) {
  const m = safe ? 0.66 : 1;
  const cx = 0.5; const ax = (nx - cx) / m + cx; const ay = (ny - 0.5) / m + 0.5;
  const apexY = 0.24, baseY = 0.52, headHalf = 0.24; let inArrow = false;
  if (ay >= apexY && ay <= baseY) { const hw = ((ay - apexY) / (baseY - apexY)) * headHalf; if (ax >= cx - hw && ax <= cx + hw) inArrow = true; }
  if (ay > baseY && ay <= 0.8 && ax >= 0.42 && ax <= 0.58) inArrow = true;
  if (inArrow) return [...AMBER, 255];
  return transparentBg ? [0, 0, 0, 0] : [...BRAND, 255];
}
function render(size, opts) {
  const S = size * SS; const hi = Buffer.alloc(S * S * 4);
  for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) { const [r, g, b, a] = sample((x + 0.5) / S, (y + 0.5) / S, opts); const i = (y * S + x) * 4; hi[i] = r; hi[i + 1] = g; hi[i + 2] = b; hi[i + 3] = a; }
  const out = Buffer.alloc(size * size * 4);
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) { let r = 0, g = 0, bl = 0, a = 0; for (let dy = 0; dy < SS; dy++) for (let dx = 0; dx < SS; dx++) { const i = ((y * SS + dy) * S + (x * SS + dx)) * 4; r += hi[i]; g += hi[i + 1]; bl += hi[i + 2]; a += hi[i + 3]; } const n = SS * SS; const o = (y * size + x) * 4; out[o] = Math.round(r / n); out[o + 1] = Math.round(g / n); out[o + 2] = Math.round(bl / n); out[o + 3] = Math.round(a / n); }
  return png(size, size, out);
}

const dir = join(process.cwd(), 'assets');
mkdirSync(dir, { recursive: true });
writeFileSync(join(dir, 'icon.png'), render(1024, { transparentBg: false, safe: true }));
writeFileSync(join(dir, 'adaptive-icon.png'), render(1024, { transparentBg: true, safe: true }));
writeFileSync(join(dir, 'splash-icon.png'), render(512, { transparentBg: true, safe: true }));
writeFileSync(join(dir, 'favicon.png'), render(48, { transparentBg: false, safe: true }));
console.log('✓ Assets Expo générés dans mobile/assets/ (icon, adaptive-icon, splash-icon, favicon)');
