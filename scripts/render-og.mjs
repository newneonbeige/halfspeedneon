#!/usr/bin/env node
// Rendert das Standard-Vorschaubild (1200×630) für Link-Vorschauen: schwarzer Grund, Platte, Neon-Schrift.
import sharp from 'sharp';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');
const rillen = Array.from({ length: 14 }, (_, i) => `<circle cx="930" cy="315" r="${250 - i * 11}" fill="none" stroke="#26262b" stroke-width="2"/>`).join('');
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630">
  <rect width="1200" height="630" fill="#0b0b0c"/>
  <circle cx="930" cy="315" r="262" fill="#141416"/>
  ${rillen}
  <circle cx="930" cy="315" r="86" fill="#FF2BD6"/>
  <circle cx="930" cy="315" r="12" fill="#0b0b0c"/>
  <text x="80" y="250" font-family="Arial Black, Arial, sans-serif" font-weight="900" font-size="92" fill="#f2efe9" letter-spacing="-3">Half Speed</text>
  <text x="80" y="350" font-family="Arial Black, Arial, sans-serif" font-weight="900" font-size="92" fill="#FF2BD6" letter-spacing="-3">Neon</text>
  <text x="82" y="440" font-family="Arial, sans-serif" font-size="30" fill="#9d998f">Motorik · Psych · Shoegaze · Vinyl</text>
</svg>`;
await sharp(Buffer.from(svg)).png().toFile(path.join(ROOT, 'public/og-default.png'));
console.log('public/og-default.png geschrieben');
