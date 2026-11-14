#!/usr/bin/env node
// P6 S1 — colour guard (CONSTITUTION rule 6 as amended, DL-P33).
// Scans the built CSS (dist/assets/*.css) and the source styles for every colour value and fails when one is not
// allowed. Allowed: the five IDSS colours, white, black and neutral greys (R = G = B), each with any transparency.
//   npm run build && npm run colours:check
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const IDSS = new Set(['000000', 'E8262C', '035EA1', 'FFCB29', '08ABE6', 'FFFFFF']);
const isNeutral = (r, g, b) => r === g && g === b;
const hex2 = (n) => n.toString(16).padStart(2, '0').toUpperCase();

function allowedRgb(r, g, b) {
  return isNeutral(r, g, b) || IDSS.has(hex2(r) + hex2(g) + hex2(b));
}

function hslToRgb(h, s, l) {
  s /= 100; l /= 100;
  const k = (n) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  return [f(0), f(8), f(4)].map((v) => Math.round(v * 255));
}

const files = [];
const dist = 'dist/assets';
if (existsSync(dist)) for (const f of readdirSync(dist)) if (f.endsWith('.css')) files.push(join(dist, f));
files.push('src/index.css');
if (files.length === 1) { console.error('[colours] no built CSS found — run `npm run build` first'); process.exit(1); }

const bad = new Map();
for (const file of files) {
  // ignore comments and the third-party font files' metadata
  const css = readFileSync(file, 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
  const note = (v) => bad.set(`${file}: ${v}`, (bad.get(`${file}: ${v}`) ?? 0) + 1);
  for (const m of css.matchAll(/#([0-9a-fA-F]{3,8})\b/g)) {
    let h = m[1];
    if (h.length === 3 || h.length === 4) h = h.slice(0, 3).split('').map((c) => c + c).join('');
    else h = h.slice(0, 6);
    if (h.length !== 6) continue;
    const [r, g, b] = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
    if (!allowedRgb(r, g, b)) note('#' + m[1]);
  }
  for (const m of css.matchAll(/rgba?\(\s*(\d{1,3})[\s,]+(\d{1,3})[\s,]+(\d{1,3})/g)) {
    const [r, g, b] = m.slice(1, 4).map(Number);
    if (!allowedRgb(r, g, b)) note(m[0] + ')');
  }
  for (const m of css.matchAll(/hsla?\(\s*([\d.]+)(?:deg)?[\s,]+([\d.]+)%[\s,]+([\d.]+)%/g)) {
    const [r, g, b] = hslToRgb(Number(m[1]), Number(m[2]), Number(m[3]));
    if (!allowedRgb(r, g, b)) note(m[0] + ')');
  }
  // CSS colour channel variables: "--name: R G B;" (used as rgb(var(--name)))
  for (const m of css.matchAll(/--[\w-]+:\s*(\d{1,3})\s+(\d{1,3})\s+(\d{1,3})\s*;/g)) {
    const [r, g, b] = m.slice(1, 4).map(Number);
    if (!allowedRgb(r, g, b)) note(m[0]);
  }
  const named = css.match(/:\s*(?:red|green|blue|yellow|orange|purple|pink|gray|grey|cyan|magenta|lime|teal|navy|maroon|olive|silver|gold)\b/gi);
  if (named) for (const n of named) note(n.trim());
}

if (bad.size) {
  console.error(`[colours] ${bad.size} colour value(s) outside the IDSS palette:`);
  for (const [k, n] of bad) console.error(`  ${k}  (${n}×)`);
  process.exit(1);
}
console.log(`[colours] ok: ${files.length} file(s), only IDSS colours, white, black and neutral greys`);
