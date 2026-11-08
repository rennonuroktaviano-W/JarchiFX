import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const output = resolve(here, "../web/public/img/market-strip.svg");

const WIDTH = 1280;
const HEIGHT = 760;
const COUNT = 48;
const GRID = 80;
const ACCENT = "#34C58A";
const DOWN = "#E5535F";

function mulberry32(seed) {
  let state = seed;

  return function random() {
    state |= 0;
    state = (state + 0x6d2b79f5) | 0;
    let value = Math.imul(state ^ (state >>> 15), 1 | state);
    value = (value + Math.imul(value ^ (value >>> 7), 61 | value)) ^ value;
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

const random = mulberry32(20261108);
const spacing = WIDTH / COUNT;
const startPrice = 380;

const moves = Array.from({ length: COUNT }, () => (random() - 0.5) * 22);
const average = moves.reduce((sum, value) => sum + value, 0) / COUNT;
const detrended = moves.map((value) => value - average);
const total = detrended.reduce((sum, value) => sum + value, 0);
detrended[COUNT - 1] -= total;

const closes = [];
let current = startPrice;

for (const move of detrended) {
  current += move;
  closes.push(current);
}

const candles = closes.map((close, index) => {
  const open = index === 0 ? startPrice : closes[index - 1];
  const wick = 2 + random() * 10;
  const high = Math.max(open, close) + wick * random();
  const low = Math.min(open, close) - wick * random();

  return { open, close, high, low };
});

const lows = candles.map((candle) => candle.low);
const highs = candles.map((candle) => candle.high);
const min = Math.min(...lows);
const max = Math.max(...highs);
const top = 100;
const bottom = HEIGHT - 100;

function scaleY(value) {
  return bottom - ((value - min) / (max - min)) * (bottom - top);
}

function candleX(index) {
  return index * spacing + spacing / 2;
}

const parts = [];
parts.push(
  `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}" fill="none">`,
);

for (let x = 0; x <= WIDTH; x += GRID) {
  parts.push(
    `<path d="M${x} 0V${HEIGHT}" stroke="#FFFFFF" stroke-opacity="0.05"/>`,
  );
}

for (let y = 0; y <= HEIGHT; y += GRID) {
  parts.push(
    `<path d="M0 ${y}H${WIDTH}" stroke="#FFFFFF" stroke-opacity="0.05"/>`,
  );
}

for (let index = 0; index < COUNT; index += 1) {
  const candle = candles[index];
  const x = candleX(index);
  const openY = scaleY(candle.open);
  const closeY = scaleY(candle.close);
  const highY = scaleY(candle.high);
  const lowY = scaleY(candle.low);
  const color = candle.close >= candle.open ? ACCENT : DOWN;
  const bodyTop = Math.min(openY, closeY);
  const bodyHeight = Math.max(Math.abs(closeY - openY), 1.5);

  parts.push(
    `<path d="M${x.toFixed(2)} ${highY.toFixed(2)}V${lowY.toFixed(2)}" stroke="${color}" stroke-width="1.5"/>`,
    `<rect x="${(x - 4.5).toFixed(2)}" y="${bodyTop.toFixed(2)}" width="9" height="${bodyHeight.toFixed(2)}" fill="${color}"/>`,
  );
}

const movingAverage = closes.map((_, index) => {
  let sum = 0;

  for (let offset = -2; offset <= 2; offset += 1) {
    sum += closes[(index + offset + COUNT) % COUNT];
  }

  return sum / 5;
});

const points = [];

for (let index = -1; index <= COUNT; index += 1) {
  const x = index * spacing + spacing / 2;
  const value = movingAverage[((index % COUNT) + COUNT) % COUNT];
  points.push(`${x.toFixed(2)},${scaleY(value).toFixed(2)}`);
}

parts.push(
  `<polyline points="${points.join(" ")}" stroke="#EEF2EF" stroke-opacity="0.55" stroke-width="1.5"/>`,
);
parts.push("</svg>");

mkdirSync(dirname(output), { recursive: true });
writeFileSync(output, parts.join("\n"), "utf8");
console.log(`Wrote ${output}`);
