// Deterministic optimization of owner-supplied website assets. No catalogue writes.
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { resolve } from 'node:path';
const require = createRequire(resolve('../../backend/package.json'));
const sharp = require('sharp');
const inventory = JSON.parse(await readFile('../../docs/teamcore/reference/source-asset-inventory.json', 'utf8'));
const out = resolve('public/teamcore');
await mkdir(out + '/products', { recursive: true });
await import('./prepare-teamcore-logo.mjs');
const jobs = inventory.categories.flatMap(category => category.imageReferences.map((entry, index) => ({ category: category.category, index, ...entry })));
const results = [];
async function worker() {
  while (jobs.length) {
    const entry = jobs.shift();
    const target = `${entry.category}-${String(entry.index + 1).padStart(2, '0')}.webp`;
    try {
      const response = await fetch(entry.url, { signal: AbortSignal.timeout(30000) });
      if (!response.ok) throw Error(`HTTP ${response.status}`);
      const buffer = Buffer.from(await response.arrayBuffer());
      const meta = await sharp(buffer).metadata();
      await sharp(buffer).rotate().resize({ width: 1000, withoutEnlargement: true }).webp({ quality: 86 }).toFile(out + '/products/' + target);
      results.push({ ...entry, local: '/teamcore/products/' + target, width: meta.width, height: meta.height, status: 'decoded and optimized' });
    } catch (error) { results.push({ ...entry, status: 'unavailable', error: error.message }); }
  }
}
await Promise.all(Array.from({ length: 4 }, worker));
results.sort((a,b) => a.category.localeCompare(b.category) || a.index - b.index);
await writeFile('../../docs/teamcore/reference/prepared-assets.json', JSON.stringify({ preparedOn: '2026-10-13', assets: results }, null, 2));
console.log(`Prepared logo, favicon, social image and ${results.filter(r=>r.local).length}/${results.length} verified product images.`);
for (const failure of results.filter(r=>!r.local)) console.log(`${failure.category} ${failure.index + 1}: ${failure.error}`);
