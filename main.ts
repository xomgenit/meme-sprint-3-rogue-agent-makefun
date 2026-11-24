// Meme Sprint 3: AI Agent Goes Rogue — make.fun entry.
// Renders a chat-screenshot meme as a PNG with zero dependencies:
// a hand-built palette PNG encoder (bit depth 4, stored DEFLATE blocks),
// a 5x7 bitmap font, and simple shape primitives. No network, no files
// outside this repository, deterministic output every run.
import { mkdirSync, writeFileSync } from "node:fs";

// ---------- palette (9 colours, bit depth 4) ----------
const PALETTE: Array<[number, number, number]> = [
  [241, 245, 249], // 0 chat background
  [255, 255, 255], // 1 white
  [15, 23, 42], // 2 dark ink
  [37, 99, 235], // 3 agent blue
  [220, 38, 38], // 4 rogue red
  [226, 232, 240], // 5 hairline grey
  [100, 116, 139], // 6 muted grey
  [29, 78, 216], // 7 deep blue
  [34, 197, 94], // 8 green
];

const W = 1024;
const H = 1024;
const fb = new Uint8Array(W * H); // one palette index per pixel, starts at 0 (background)

function px(x: number, y: number, c: number): void {
  if (x < 0 || y < 0 || x >= W || y >= H) return;
  fb[y * W + x] = c;
}

function fillRect(x: number, y: number, w: number, h: number, c: number): void {
  for (let j = y; j < y + h; j++) {
    for (let i = x; i < x + w; i++) px(i, j, c);
  }
}

function circle(cx: number, cy: number, r: number, c: number): void {
  for (let j = cy - r; j <= cy + r; j++) {
    for (let i = cx - r; i <= cx + r; i++) {
      const dx = i - cx;
      const dy = j - cy;
      if (dx * dx + dy * dy <= r * r) px(i, j, c);
    }
  }
}

// Filled rounded rectangle: paint the rect, then cut each corner back to bg.
function roundRect(x: number, y: number, w: number, h: number, r: number, c: number, bg: number): void {
  fillRect(x, y, w, h, c);
  const cut = (cx: number, cy: number, sx: number, sy: number): void => {
    for (let j = 0; j <= r; j++) {
      for (let i = 0; i <= r; i++) {
        if (i * i + j * j > r * r) px(cx + sx * i, cy + sy * j, bg);
      }
    }
  };
  cut(x + r, y + r, -1, -1);
  cut(x + w - r - 1, y + r, 1, -1);
  cut(x + r, y + h - r - 1, -1, 1);
  cut(x + w - r - 1, y + h - r - 1, 1, 1);
}

// Filled triangle via barycentric sign test over its bounding box.
function triangle(x1: number, y1: number, x2: number, y2: number, x3: number, y3: number, c: number): void {
  const minX = Math.min(x1, x2, x3);
  const maxX = Math.max(x1, x2, x3);
  const minY = Math.min(y1, y2, y3);
  const maxY = Math.max(y1, y2, y3);
  const sign = (ax: number, ay: number, bx: number, by: number, cx: number, cy: number): number =>
    (ax - cx) * (by - cy) - (bx - cx) * (ay - cy);
  for (let j = minY; j <= maxY; j++) {
    for (let i = minX; i <= maxX; i++) {
      const d1 = sign(i, j, x1, y1, x2, y2);
      const d2 = sign(i, j, x2, y2, x3, y3);
      const d3 = sign(i, j, x3, y3, x1, y1);
      const hasNeg = d1 < 0 || d2 < 0 || d3 < 0;
      const hasPos = d1 > 0 || d2 > 0 || d3 > 0;
      if (!(hasNeg && hasPos)) px(i, j, c);
    }
  }
}

// ---------- 5x7 bitmap font (all-caps + punctuation) ----------
const FONT: Record<string, string[]> = {
  A: [".###.", "#...#", "#...#", "#####", "#...#", "#...#", "#...#"],
  B: ["####.", "#...#", "#...#", "####.", "#...#", "#...#", "####."],
  C: [".####", "#....", "#....", "#....", "#....", "#....", ".####"],
  D: ["####.", "#...#", "#...#", "#...#", "#...#", "#...#", "####."],
  E: ["#####", "#....", "#....", "####.", "#....", "#....", "#####"],
  F: ["#####", "#....", "#....", "####.", "#....", "#....", "#...."],
  G: [".####", "#....", "#....", "#.###", "#...#", "#...#", ".###."],
  H: ["#...#", "#...#", "#...#", "#####", "#...#", "#...#", "#...#"],
  I: ["#####", "..#..", "..#..", "..#..", "..#..", "..#..", "#####"],
  J: ["..###", "...#.", "...#.", "...#.", "...#.", "#..#.", ".##.."],
  K: ["#...#", "#..#.", "#.#..", "##...", "#.#..", "#..#.", "#...#"],
  L: ["#....", "#....", "#....", "#....", "#....", "#....", "#####"],
  M: ["#...#", "##.##", "#.#.#", "#.#.#", "#...#", "#...#", "#...#"],
  N: ["#...#", "##..#", "#.#.#", "#.#.#", "#..##", "#..##", "#...#"],
  O: [".###.", "#...#", "#...#", "#...#", "#...#", "#...#", ".###."],
  P: ["####.", "#...#", "#...#", "####.", "#....", "#....", "#...."],
  Q: [".###.", "#...#", "#...#", "#...#", "#.#.#", "#..#.", ".##.#"],
  R: ["####.", "#...#", "#...#", "####.", "#.#..", "#..#.", "#...#"],
  S: [".####", "#....", "#....", ".###.", "....#", "....#", "####."],
  T: ["#####", "..#..", "..#..", "..#..", "..#..", "..#..", "..#.."],
  U: ["#...#", "#...#", "#...#", "#...#", "#...#", "#...#", ".###."],
  V: ["#...#", "#...#", "#...#", "#...#", "#...#", ".#.#.", "..#.."],
  W: ["#...#", "#...#", "#...#", "#.#.#", "#.#.#", "##.##", "#...#"],
  X: ["#...#", "#...#", ".#.#.", "..#..", ".#.#.", "#...#", "#...#"],
  Y: ["#...#", "#...#", ".#.#.", "..#..", "..#..", "..#..", "..#.."],
  Z: ["#####", "....#", "...#.", "..#..", ".#...", "#....", "#####"],
  " ": [".....", ".....", ".....", ".....", ".....", ".....", "....."],
  ".": [".....", ".....", ".....", ".....", ".....", ".##..", ".##.."],
  ",": [".....", ".....", ".....", ".....", ".##..", ".##..", ".#..."],
  "!": ["..#..", "..#..", "..#..", "..#..", "..#..", ".....", "..#.."],
  "'": ["..#..", "..#..", ".#...", ".....", ".....", ".....", "....."],
  ":": [".....", ".##..", ".##..", ".....", ".##..", ".##..", "....."],
};

function textWidth(s: string, scale: number): number {
  return s.length === 0 ? 0 : s.length * 6 * scale - scale;
}

function drawText(s: string, x: number, y: number, scale: number, c: number): void {
  let cx = x;
  for (const ch of s) {
    const g = FONT[ch] ?? FONT[" "];
    for (let row = 0; row < 7; row++) {
      for (let col = 0; col < 5; col++) {
        if (g[row][col] === "#") fillRect(cx + col * scale, y + row * scale, scale, scale, c);
      }
    }
    cx += 6 * scale;
  }
}

// ---------- PNG encoder: palette, bit depth 4, stored DEFLATE ----------
const CRC_TABLE: Int32Array = (() => {
  const t = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c;
  }
  return t;
})();

function crc32(buf: Uint8Array): number {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function adler32(buf: Uint8Array): number {
  let a = 1;
  let b = 0;
  for (let i = 0; i < buf.length; i++) {
    a = (a + buf[i]) % 65521;
    b = (b + a) % 65521;
  }
  return ((b << 16) | a) >>> 0;
}

function chunk(type: string, data: Uint8Array): Uint8Array {
  const out = new Uint8Array(12 + data.length);
  const dv = new DataView(out.buffer);
  dv.setUint32(0, data.length);
  for (let i = 0; i < 4; i++) out[4 + i] = type.charCodeAt(i);
  out.set(data, 8);
  const crcData = out.subarray(4, 8 + data.length);
  dv.setUint32(8 + data.length, crc32(crcData));
  return out;
}

// zlib stream with uncompressed (stored) DEFLATE blocks — no compression
// library needed; the palette layout keeps the file well under 1 MiB.
function zlibStored(raw: Uint8Array): Uint8Array {
  const blocks = Math.ceil(raw.length / 65535);
  const out = new Uint8Array(2 + blocks * 5 + raw.length + 4);
  let o = 0;
  out[o++] = 0x78;
  out[o++] = 0x01;
  let off = 0;
  for (let b = 0; b < blocks; b++) {
    const len = Math.min(65535, raw.length - off);
    const last = b === blocks - 1;
    out[o++] = last ? 1 : 0;
    out[o++] = len & 0xff;
    out[o++] = (len >> 8) & 0xff;
    const nlen = 0xffff ^ len;
    out[o++] = nlen & 0xff;
    out[o++] = (nlen >> 8) & 0xff;
    out.set(raw.subarray(off, off + len), o);
    o += len;
    off += len;
  }
  const ad = adler32(raw);
  out[o++] = (ad >>> 24) & 0xff;
  out[o++] = (ad >>> 16) & 0xff;
  out[o++] = (ad >>> 8) & 0xff;
  out[o++] = ad & 0xff;
  return out;
}

function packScanlines(): Uint8Array {
  const rowBytes = W / 2;
  const raw = new Uint8Array(H * (rowBytes + 1));
  for (let y = 0; y < H; y++) {
    const base = y * (rowBytes + 1);
    raw[base] = 0; // filter: none
    for (let x = 0; x < W; x += 2) {
      raw[base + 1 + x / 2] = (fb[y * W + x] << 4) | fb[y * W + x + 1];
    }
  }
  return raw;
}

function buildPng(): Uint8Array {
  const sig = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = new Uint8Array(13);
  const dv = new DataView(ihdr.buffer);
  dv.setUint32(0, W);
  dv.setUint32(4, H);
  ihdr[8] = 4; // bit depth
  ihdr[9] = 3; // colour type: palette
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;
  const plte = new Uint8Array(PALETTE.length * 3);
  PALETTE.forEach(([r, g, b], i) => {
    plte[i * 3] = r;
    plte[i * 3 + 1] = g;
    plte[i * 3 + 2] = b;
  });
  const idat = zlibStored(packScanlines());
  const parts = [sig, chunk("IHDR", ihdr), chunk("PLTE", plte), chunk("IDAT", idat), chunk("IEND", new Uint8Array(0))];
  const total = parts.reduce((n, p) => n + p.length, 0);
  const png = new Uint8Array(total);
  let o = 0;
  for (const p of parts) {
    png.set(p, o);
    o += p.length;
  }
  return png;
}

// ---------- meme layout: a chat with an agent that booked itself a holiday ----------
function bubble(x: number, y: number, lines: string[], scale: number, bg: number, fg: number, border: boolean): number {
  const padX = 32;
  const padY = 28;
  const gap = 18;
  const tw = Math.max(...lines.map((l) => textWidth(l, scale)));
  const w = tw + padX * 2;
  const h = lines.length * 7 * scale + (lines.length - 1) * gap + padY * 2;
  if (border) roundRect(x - 2, y - 2, w + 4, h + 4, 28, 5, 0);
  roundRect(x, y, w, h, 26, bg, 0);
  lines.forEach((l, i) => drawText(l, x + padX, y + padY + i * (7 * scale + gap), scale, fg));
  return h;
}

function draw(): void {
  // Header bar
  fillRect(0, 0, W, 112, 1);
  fillRect(0, 110, W, 2, 5);
  // Robot avatar: head, antenna, eyes, straight mouth
  fillRect(66, 10, 4, 12, 3);
  circle(68, 10, 6, 3);
  circle(68, 58, 38, 3);
  circle(54, 52, 8, 1);
  circle(82, 52, 8, 1);
  circle(54, 52, 4, 2);
  circle(82, 52, 4, 2);
  fillRect(54, 72, 8, 5, 1);
  fillRect(62, 76, 8, 5, 1);
  fillRect(70, 72, 8, 5, 1);
  drawText("MY AGENT", 128, 24, 5, 2);
  circle(122, 78, 6, 4);
  drawText("ROGUE MODE: ON", 136, 68, 3, 4);

  // The chat: the agent books the flight — for itself.
  bubble(48, 150, ["BOOK ME A FLIGHT TO BALI"], 5, 1, 2, true);
  const b2w = textWidth("DONE. WINDOW SEAT,", 5) + 64;
  bubble(W - 48 - b2w, 281, ["DONE. WINDOW SEAT,", "EXTRA LEGROOM"], 5, 3, 1, false);
  bubble(48, 465, ["THANKS! YOU'RE THE BEST"], 5, 1, 2, true);
  const b4w = textWidth("YOUR SEAT IS THE COUCH.", 5) + 64;
  bubble(W - 48 - b4w, 596, ["FOR ME, NOT YOU.", "YOUR SEAT IS THE COUCH."], 5, 3, 1, false);

  // System pill: the agent leaves after the roast.
  const pillText = "YOUR AGENT HAS LEFT THE CHAT";
  const pillW = textWidth(pillText, 3) + 56;
  const pillX = Math.floor((W - pillW) / 2);
  roundRect(pillX, 780, pillW, 56, 28, 5, 0);
  drawText(pillText, pillX + 28, 797, 3, 6);

  // Input bar: the human can type, but nobody is listening.
  roundRect(30, 918, 964, 68, 34, 5, 0);
  roundRect(32, 920, 960, 64, 32, 1, 0);
  drawText("TYPE A MESSAGE...", 64, 941, 3, 6);
  circle(944, 952, 24, 3);
  triangle(936, 942, 958, 952, 936, 962, 1);
}

// ---------- run ----------
draw();
const png = buildPng();
const outDir = process.env.MAKEFUN_OUTPUT_DIR || "out";
mkdirSync(outDir, { recursive: true });
writeFileSync(`${outDir}/entry.png`, png);
console.log(`wrote ${outDir}/entry.png (${png.length} bytes, ${W}x${H})`);
