// Builds the app's Word template from the school's official memorandum (single source):
//   templates/MEMORANDUM_IDSS_OD_20042026_NASTAVNICI.dotx  (Director, 2026-11-10)
//   → src/assets/memorandum/IDSS_memorandum_nastavnici.docx
// Changes ONLY: (1) .dotx → .docx content type, (2) the empty body paragraph becomes the
// placeholder {{plan}} that DocxExportButton fills, (3) personal metadata (creator,
// last editor) removed and the title set, (4) the top margin raised from 0.95 cm to
// 2.5 cm: the logo in the header reaches ~2.1 cm, and long generated text otherwise runs
// into it on every page (seen in the rendered export, 2026-11-10). Headers, footer, logo, background, fonts,
// margins and styles are byte-identical.
// Usage: node scripts/build-memorandum.mjs [--check]
import { readFile, writeFile } from 'node:fs/promises';
import JSZip from 'jszip';

const SRC = 'templates/MEMORANDUM_IDSS_OD_20042026_NASTAVNICI.dotx';
const OUT = 'src/assets/memorandum/IDSS_memorandum_nastavnici.docx';
const check = process.argv.includes('--check');

const zip = await JSZip.loadAsync(await readFile(SRC));
const ct = await zip.file('[Content_Types].xml').async('string');
zip.file('[Content_Types].xml', ct.replace('wordprocessingml.template.main+xml', 'wordprocessingml.document.main+xml'));

let doc = await zip.file('word/document.xml').async('string');
const body = doc.match(/<w:body>(<w:p\b[\s\S]*?<\/w:p>)<w:sectPr/);
if (!body) throw new Error('memorandum: expected one empty paragraph before <w:sectPr>');
doc = doc.replace(body[1], '<w:p><w:r><w:t>{{plan}}</w:t></w:r></w:p>');
const TOP_BEFORE = 'w:top="536"', TOP_AFTER = 'w:top="1418"'; // twips: 0.95 cm → 2.5 cm
if (!doc.includes(TOP_BEFORE)) throw new Error('memorandum: unexpected top margin, check the template');
doc = doc.replace(TOP_BEFORE, TOP_AFTER);
zip.file('word/document.xml', doc);

let core = await zip.file('docProps/core.xml').async('string');
core = core
  .replace(/<dc:title>[^<]*<\/dc:title>/, '<dc:title>IDSS — pisana priprema nastavnog časa</dc:title>')
  .replace(/<dc:creator>[^<]*<\/dc:creator>/, '<dc:creator>IDSS IBL Planer</dc:creator>')
  .replace(/<cp:lastModifiedBy>[^<]*<\/cp:lastModifiedBy>/, '<cp:lastModifiedBy>IDSS IBL Planer</cp:lastModifiedBy>');
zip.file('docProps/core.xml', core);
let app = await zip.file('docProps/app.xml').async('string');
zip.file('docProps/app.xml', app.replace(/<Template>[^<]*<\/Template>/, '<Template>Normal.dotm</Template>'));

// Fixed timestamps keep the output byte-stable, so --check can compare.
const fixed = new Date('2026-11-10T00:00:00Z');
zip.forEach((_, f) => { f.date = fixed; });
const out = await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' });

if (check) {
  const cur = await readFile(OUT).catch(() => Buffer.alloc(0));
  if (!cur.equals(out)) { console.error(`[memorandum:check] ${OUT} is out of date. Run: node scripts/build-memorandum.mjs`); process.exit(1); }
  console.log('[memorandum:check] ok');
} else {
  await writeFile(OUT, out);
  console.log(`[memorandum] wrote ${OUT} (${out.length} bytes)`);
}
