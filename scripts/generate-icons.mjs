// Gera os ícones PWA (PNG) a partir de formas simples, sem dependências externas.
// Uso: node scripts/generate-icons.mjs
import { deflateSync } from "node:zlib";
import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");

const TEAL = [22, 131, 110];
const TEAL_DARK = [15, 95, 81];
const WHITE = [255, 255, 255];

function crc32(buf) {
  let c = ~0;
  for (let i = 0; i < buf.length; i++) {
    c ^= buf[i];
    for (let k = 0; k < 8; k++) c = (c >>> 1) ^ (0xedb88320 & -(c & 1));
  }
  return ~c >>> 0;
}

function chunk(type, data) {
  const typeBuf = Buffer.from(type, "ascii");
  const body = Buffer.concat([typeBuf, data]);
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body), 0);
  return Buffer.concat([len, body, crc]);
}

function encodePng(width, height, rgba) {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // RGBA
  const raw = Buffer.alloc((width * 4 + 1) * height);
  for (let y = 0; y < height; y++) {
    raw[y * (width * 4 + 1)] = 0; // filtro 0
    rgba.copy(raw, y * (width * 4 + 1) + 1, y * width * 4, (y + 1) * width * 4);
  }
  return Buffer.concat([sig, chunk("IHDR", ihdr), chunk("IDAT", deflateSync(raw, { level: 9 })), chunk("IEND", Buffer.alloc(0))]);
}

function makeCanvas(size) {
  return { size, px: Buffer.alloc(size * size * 4) };
}

function set(c, x, y, [r, g, b], a = 255) {
  if (x < 0 || y < 0 || x >= c.size || y >= c.size) return;
  const i = (y * c.size + x) * 4;
  c.px[i] = r;
  c.px[i + 1] = g;
  c.px[i + 2] = b;
  c.px[i + 3] = a;
}

function fillRoundedRect(c, x0, y0, x1, y1, radius, color) {
  for (let y = Math.floor(y0); y < y1; y++) {
    for (let x = Math.floor(x0); x < x1; x++) {
      const dx = Math.min(x - x0, x1 - 1 - x);
      const dy = Math.min(y - y0, y1 - 1 - y);
      if (dx < radius && dy < radius) {
        const cx = x0 + radius;
        const cy = y0 + radius;
        const rx = x < x0 + radius ? cx : x1 - radius;
        const ry = y < y0 + radius ? cy : y1 - radius;
        if (Math.hypot(x - rx + 0.5, y - ry + 0.5) > radius) continue;
      }
      set(c, x, y, color);
    }
  }
}

// Desenha uma casa branca (telhado + corpo + porta) dentro de uma caixa.
function drawHouse(c, cx, cy, scale, bgColor) {
  const roofTop = cy - scale * 0.62;
  const roofBase = cy - scale * 0.12;
  const halfRoof = scale * 0.78;
  const bodyHalf = scale * 0.56;
  const bodyBottom = cy + scale * 0.66;

  // Telhado (triângulo)
  for (let y = Math.floor(roofTop); y < roofBase; y++) {
    const t = (y - roofTop) / (roofBase - roofTop);
    const half = halfRoof * t;
    for (let x = Math.floor(cx - half); x <= cx + half; x++) set(c, x, y, WHITE);
  }
  // Corpo (retângulo)
  for (let y = Math.floor(roofBase); y < bodyBottom; y++) {
    for (let x = Math.floor(cx - bodyHalf); x <= cx + bodyHalf; x++) set(c, x, y, WHITE);
  }
  // Porta (recorte na cor de fundo)
  const doorHalf = scale * 0.17;
  const doorTop = cy + scale * 0.08;
  for (let y = Math.floor(doorTop); y < bodyBottom; y++) {
    for (let x = Math.floor(cx - doorHalf); x <= cx + doorHalf; x++) set(c, x, y, bgColor);
  }
}

function buildIcon(size, { maskable }) {
  const c = makeCanvas(size);
  if (maskable) {
    // Fundo cheio (sem cantos) para a zona de segurança das máscaras.
    for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) set(c, x, y, TEAL);
    drawHouse(c, size / 2, size / 2, size * 0.26, TEAL);
  } else {
    fillRoundedRect(c, 0, 0, size, size, size * 0.22, TEAL);
    // leve faixa inferior mais escura
    fillRoundedRect(c, 0, size * 0.72, size, size, size * 0.22, TEAL_DARK);
    drawHouse(c, size / 2, size / 2, size * 0.32, TEAL);
  }
  return encodePng(size, size, c.px);
}

mkdirSync(resolve(ROOT, "icons"), { recursive: true });
writeFileSync(resolve(ROOT, "icons/icon-192.png"), buildIcon(192, { maskable: false }));
writeFileSync(resolve(ROOT, "icons/icon-512.png"), buildIcon(512, { maskable: false }));
writeFileSync(resolve(ROOT, "icons/maskable-512.png"), buildIcon(512, { maskable: true }));
console.log("Ícones gerados em icons/");
