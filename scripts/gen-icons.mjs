// Generates ONE WAY PWA icons as PNGs using only Node built-ins (zlib).
// Draws the brand mark: deep-blue rounded square + amber "one way" up-arrow.
// Output: public/icons/*.png
import { deflateSync } from 'node:zlib';
import { mkdirSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const BRAND = [22, 34, 77]; // #16224d (marine du logo)
const AMBER = [240, 125, 26]; // #f07d1a (orange du logo)
const SS = 4; // supersampling factor for anti-aliasing

// CRC32 (PNG)
const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();
function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}
function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, 'ascii');
  const body = Buffer.concat([typeBuf, data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body), 0);
  return Buffer.concat([len, body, crc]);
}
function encodePNG(width, height, rgba) {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // RGBA
  // filter byte 0 per scanline
  const stride = width * 4;
  const raw = Buffer.alloc((stride + 1) * height);
  for (let y = 0; y < height; y++) {
    raw[y * (stride + 1)] = 0;
    rgba.copy(raw, y * (stride + 1) + 1, y * stride, y * stride + stride);
  }
  const idat = deflateSync(raw, { level: 9 });
  return Buffer.concat([sig, chunk('IHDR', ihdr), chunk('IDAT', idat), chunk('IEND', Buffer.alloc(0))]);
}

// Returns [r,g,b,a] for a point in normalized [0,1] coords.
function sample(nx, ny, { rounded, safe, circle, transparentBg }) {
  // Rounded-rect mask (transparent corners) for "any" icons.
  if (rounded) {
    const r = 0.20;
    const dx = Math.max(r - nx, nx - (1 - r), 0);
    const dy = Math.max(r - ny, ny - (1 - r), 0);
    if (dx * dx + dy * dy > r * r) return [0, 0, 0, 0];
  }
  // Circular mask (Android round launcher icon).
  if (circle) {
    const dx = nx - 0.5, dy = ny - 0.5;
    if (dx * dx + dy * dy > 0.5 * 0.5) return [0, 0, 0, 0];
  }
  // Arrow geometry — scale down for maskable safe zone.
  const m = safe ? 0.72 : 1; // shrink arrow within safe area
  const cx = 0.5;
  const ax = (nx - cx) / m + cx;
  const ay = (ny - 0.5) / m + 0.5;
  const apexY = 0.24, baseY = 0.52, headHalf = 0.24;
  let inArrow = false;
  if (ay >= apexY && ay <= baseY) {
    const hw = ((ay - apexY) / (baseY - apexY)) * headHalf;
    if (ax >= cx - hw && ax <= cx + hw) inArrow = true;
  }
  if (ay > baseY && ay <= 0.80 && ax >= 0.42 && ax <= 0.58) inArrow = true;
  if (inArrow) return [...AMBER, 255];
  return transparentBg ? [0, 0, 0, 0] : [...BRAND, 255];
}

function render(size, opts) {
  const S = size * SS;
  const hi = Buffer.alloc(S * S * 4);
  for (let y = 0; y < S; y++) {
    for (let x = 0; x < S; x++) {
      const [r, g, b, a] = sample((x + 0.5) / S, (y + 0.5) / S, opts);
      const i = (y * S + x) * 4;
      hi[i] = r; hi[i + 1] = g; hi[i + 2] = b; hi[i + 3] = a;
    }
  }
  // Downsample SSxSS box filter -> anti-aliased size x size.
  const out = Buffer.alloc(size * size * 4);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      let r = 0, g = 0, bl = 0, a = 0;
      for (let dy = 0; dy < SS; dy++) {
        for (let dx = 0; dx < SS; dx++) {
          const i = ((y * SS + dy) * S + (x * SS + dx)) * 4;
          r += hi[i]; g += hi[i + 1]; bl += hi[i + 2]; a += hi[i + 3];
        }
      }
      const n = SS * SS;
      const o = (y * size + x) * 4;
      out[o] = Math.round(r / n); out[o + 1] = Math.round(g / n);
      out[o + 2] = Math.round(bl / n); out[o + 3] = Math.round(a / n);
    }
  }
  return encodePNG(size, size, out);
}

// ── Web / PWA icons ──────────────────────────────────────────────────────
const dir = join(process.cwd(), 'public', 'icons');
mkdirSync(dir, { recursive: true });
const files = [
  ['icon-192.png', render(192, { rounded: true })],
  ['icon-512.png', render(512, { rounded: true })],
  ['icon-maskable-192.png', render(192, { rounded: false, safe: true })],
  ['icon-maskable-512.png', render(512, { rounded: false, safe: true })],
  ['apple-touch-icon.png', render(180, { rounded: false })],
];
for (const [name, buf] of files) {
  writeFileSync(join(dir, name), buf);
  console.log(`✓ public/icons/${name} (${buf.length} bytes)`);
}

// ── Android launcher icons (Capacitor project, if present) ───────────────
const androidRes = join(process.cwd(), 'android', 'app', 'src', 'main', 'res');
if (existsSync(androidRes)) {
  // density -> [legacy launcher px, adaptive foreground px]
  const densities = {
    'mipmap-mdpi': [48, 108],
    'mipmap-hdpi': [72, 162],
    'mipmap-xhdpi': [96, 216],
    'mipmap-xxhdpi': [144, 324],
    'mipmap-xxxhdpi': [192, 432],
  };
  for (const [d, [legacy, fg]] of Object.entries(densities)) {
    const base = join(androidRes, d);
    if (!existsSync(base)) continue;
    writeFileSync(join(base, 'ic_launcher.png'), render(legacy, { rounded: true }));
    writeFileSync(join(base, 'ic_launcher_round.png'), render(legacy, { circle: true }));
    writeFileSync(join(base, 'ic_launcher_foreground.png'), render(fg, { transparentBg: true, safe: true }));
  }
  console.log('✓ Icônes de lanceur Android régénérées (android/.../res/mipmap-*)');
}

console.log('Terminé.');
