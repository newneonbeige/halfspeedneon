#!/usr/bin/env node
// Veröffentlichung: Google Sheet „halfspeedneon“ → Markdown-Seiten + Neuerscheinungen.
//
// Quellen (je Tab eine CSV):
//   --seiten <datei>   oder  SHEET_CSV_URL_SEITEN    (Tab „Seiten“, im Web als CSV veröffentlicht)
//   --releases <datei> oder  SHEET_CSV_URL_RELEASES  (Tab „Releases“, im Web als CSV veröffentlicht)
//
// Tab „Seiten“ – Spalten (Kopfzeile, Groß/Klein egal):
//   status      entwurf | freigegeben | offline   (nur „freigegeben“ wird veröffentlicht, „offline“ nimmt eine Seite herunter)
//   typ         begriff | liste | aehnlich | szene | label | anleitung | analyse
//   titel       Seitentitel (H1)
//   slug        optional, sonst aus dem Titel
//   kurzantwort 1–3 Sätze, die die Frage direkt beantworten (steht oben auf der Seite und in llms.txt)
//   text        Haupttext in Markdown (## Zwischenüberschriften, Listen, Tabellen)
//   faq         optional, je Zeile:  Frage | Antwort
//   quellen     optional, je Zeile:  Titel | https://…   (oder nur die URL)
//   verwandt    optional, Slugs anderer Seiten, kommagetrennt
//   fragen      optional, Nummern aus der Nullmessung (nur intern)
//   datum       optional, Erstveröffentlichung JJJJ-MM-TT (sonst heute)
//
// Tab „Releases“: status, datum (Erscheinungstag), kuenstler, album, label, genre, format, land, notiz, link
//
// Optionen: --dry-run (nichts schreiben)
import { readFile, writeFile, mkdir, readdir, rm } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { parse } from 'csv-parse/sync';
import { seoFelder } from './lib/seo.mjs';
import { frontmatter, slugify } from './lib/text.mjs';
import { site, TYPEN, bereichVonTyp } from '../site.config.mjs';

const ROOT = path.resolve(import.meta.dirname, '..');
const SEITEN = path.join(ROOT, 'src/content/seiten');
const RELEASES = path.join(ROOT, 'src/data/releases.json');
const PUBLISH = path.join(ROOT, '.publish');

const args = process.argv.slice(2);
const arg = (name) => { const i = args.indexOf(name); return i >= 0 ? args[i + 1] : undefined; };
const dryRun = args.includes('--dry-run');
const heute = new Date().toISOString().slice(0, 10);
const normal = (s) => String(s ?? '').toLowerCase().trim();

/** Nimmt JJJJ-MM-TT oder TT.MM.JJJJ (Google-Sheets-Anzeige im deutschen Format) und gibt JJJJ-MM-TT zurück. */
function isoDatum(wert) {
  const w = String(wert ?? '').trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(w)) return w;
  const m = w.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/);
  return m ? `${m[3]}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}` : '';
}

async function ladeCsv(dateiArg, envName) {
  const datei = arg(dateiArg);
  if (datei) return readFile(path.resolve(datei), 'utf8');
  const url = process.env[envName];
  if (!url) return null;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${envName}: Sheet nicht abrufbar (${res.status})`);
  return res.text();
}

const zeilenAus = (csv) => parse(csv, { columns: (k) => k.map((s) => s.trim().toLowerCase()), skip_empty_lines: true, trim: true, bom: true, relax_column_count: true });

function faqAus(zelle) {
  return String(zelle ?? '').split(/\r?\n/).map((z) => z.split('|')).filter((t) => t.length >= 2 && t[0].trim() && t[1].trim())
    .map(([frage, ...rest]) => ({ frage: frage.trim(), antwort: rest.join('|').trim() }));
}

function quellenAus(zelle) {
  return String(zelle ?? '').split(/\r?\n/).map((z) => z.trim()).filter(Boolean).map((z) => {
    const teile = z.split('|').map((t) => t.trim());
    const url = teile.find((t) => /^https?:\/\//.test(t));
    if (!url) return null;
    const titel = teile.find((t) => t && t !== url) ?? new URL(url).hostname.replace(/^www\./, '');
    return { titel, url };
  }).filter(Boolean);
}

/** Liest das Frontmatter einer bestehenden Datei (nur die Felder, die wir zum Vergleichen brauchen). */
async function bestehend(datei) {
  if (!existsSync(datei)) return null;
  const inhalt = await readFile(datei, 'utf8');
  const feld = (k) => { const m = inhalt.match(new RegExp(`^${k}:\\s*(.+)$`, 'm')); return m ? JSON.parse(m[1]) : undefined; };
  return { inhalt, datum: feld('datum'), titel: feld('titel'), kurzantwort: feld('kurzantwort'), seoTitle: feld('seoTitle'), seoDescription: feld('seoDescription'), aktualisiert: feld('aktualisiert') };
}

async function seiten(csv, neueUrls) {
  const zeilen = zeilenAus(csv);
  let neu = 0, geaendert = 0, entfernt = 0;
  const vorhanden = new Set(existsSync(SEITEN) ? (await readdir(SEITEN)).map((d) => d.replace(/\.md$/, '')) : []);

  for (const z of zeilen) {
    const status = normal(z.status);
    const typ = normal(z.typ);
    const slug = slugify(z.slug || z.titel || '', 7);
    if (!slug) continue;
    const datei = path.join(SEITEN, `${slug}.md`);

    if (status === 'offline' && vorhanden.has(slug)) {
      console.log(`  ✗ offline: ${slug}`);
      if (!dryRun) await rm(datei);
      entfernt++;
      continue;
    }
    if (status !== 'freigegeben') continue;
    if (!TYPEN[typ]) { console.warn(`  ⚠ Übersprungen – unbekannter Typ "${z.typ}": ${z.titel}`); continue; }
    if (!z.titel || !z.kurzantwort || !z.text) { console.warn(`  ⚠ Übersprungen – titel, kurzantwort und text sind Pflicht: ${z.titel || slug}`); continue; }

    const alt = await bestehend(datei);
    // Beschreibungen aus der Vorlage (ohne API-Schlüssel entstanden, enden auf „…“) werden neu erzeugt, sobald ein Schlüssel da ist
    const ausVorlage = Boolean(process.env.ANTHROPIC_API_KEY) && String(alt?.seoDescription ?? '').endsWith('…');
    const metaGleich = alt && alt.titel === z.titel && alt.kurzantwort === z.kurzantwort && alt.seoTitle && !ausVorlage;
    const seo = metaGleich ? { seoTitle: alt.seoTitle, seoDescription: alt.seoDescription, quelle: 'unverändert' } : await seoFelder({ titel: z.titel, typ: TYPEN[typ], kurzantwort: z.kurzantwort });

    const felder = {
      titel: z.titel,
      slug,
      typ,
      kurzantwort: z.kurzantwort,
      seoTitle: seo.seoTitle,
      seoDescription: seo.seoDescription,
      datum: isoDatum(z.datum) || alt?.datum || heute,
      aktualisiert: '__AKTUALISIERT__',
      verwandt: z.verwandt ? z.verwandt.split(/[,;]/).map((s) => slugify(s.trim(), 7)).filter(Boolean) : undefined,
      fragen: z.fragen || undefined,
    };
    const faq = faqAus(z.faq);
    const quellen = quellenAus(z.quellen);
    const yamlListe = (name, liste) => liste.length ? `${name}:\n${liste.map((o) => '  - ' + Object.entries(o).map(([k, v]) => `${k}: ${JSON.stringify(v)}`).join('\n    ')).join('\n')}\n` : '';
    const bauen = (akt) => frontmatter({ ...felder, aktualisiert: akt }).replace(/---\n$/, yamlListe('faq', faq) + yamlListe('quellen', quellen) + '---\n') + `\n${z.text.trim()}\n`;

    // Nur als „aktualisiert“ zählen, wenn sich wirklich etwas am Inhalt geändert hat
    const kandidat = bauen(alt?.aktualisiert ?? heute);
    if (alt && alt.inhalt === kandidat) continue;
    const md = bauen(heute);
    const url = `${site.url}/${bereichVonTyp(typ).slug}/${slug}/`;
    console.log(`  ${alt ? '↻ aktualisiert' : '✓ neu'}: ${url}  (SEO: ${seo.quelle})`);
    alt ? geaendert++ : neu++;
    neueUrls.push(url);
    if (!dryRun) { await mkdir(SEITEN, { recursive: true }); await writeFile(datei, md); }
  }
  return { neu, geaendert, entfernt };
}

async function releases(csv, neueUrls) {
  const alle = zeilenAus(csv).map((z) => ({ ...z, datum: isoDatum(z.datum) }));
  for (const z of alle) if (normal(z.status) === 'freigegeben' && !z.datum) console.warn(`  ⚠ Übersprungen – Datum fehlt oder unlesbar: ${z.kuenstler} – ${z.album}`);
  const zeilen = alle.filter((z) => normal(z.status) === 'freigegeben' && z.kuenstler && z.album && z.datum);
  const liste = zeilen.map((z) => ({
    id: slugify(`${z.datum} ${z.kuenstler} ${z.album}`, 12),
    datum: z.datum,
    kuenstler: z.kuenstler,
    album: z.album,
    ...(z.label && { label: z.label }),
    ...(z.genre && { genre: z.genre }),
    ...(z.format && { format: z.format }),
    ...(z.land && { land: z.land }),
    ...(z.notiz && { notiz: z.notiz }),
    ...(/^https?:\/\//.test(z.link ?? '') && { link: z.link }),
  })).sort((a, b) => a.datum.localeCompare(b.datum) || a.kuenstler.localeCompare(b.kuenstler, 'de'));
  const json = JSON.stringify(liste, null, 2) + '\n';
  const alt = existsSync(RELEASES) ? await readFile(RELEASES, 'utf8') : '';
  if (alt === json) return 0;
  const altIds = new Set(alt ? JSON.parse(alt).map((r) => r.id) : []);
  const neu = liste.filter((r) => !altIds.has(r.id)).length;
  console.log(`  ♪ Neuerscheinungen: ${liste.length} insgesamt, ${neu} neu`);
  if (neu) neueUrls.push(`${site.url}/neuerscheinungen/`);
  if (!dryRun) await writeFile(RELEASES, json);
  return neu || 1;
}

async function main() {
  const seitenCsv = await ladeCsv('--seiten', 'SHEET_CSV_URL_SEITEN');
  const releasesCsv = await ladeCsv('--releases', 'SHEET_CSV_URL_RELEASES');
  if (!seitenCsv && !releasesCsv) throw new Error('Keine Quelle: --seiten/--releases <datei> oder SHEET_CSV_URL_SEITEN/SHEET_CSV_URL_RELEASES setzen.');

  const neueUrls = [];
  const s = seitenCsv ? await seiten(seitenCsv, neueUrls) : { neu: 0, geaendert: 0, entfernt: 0 };
  const r = releasesCsv ? await releases(releasesCsv, neueUrls) : 0;
  const aenderungen = s.neu + s.geaendert + s.entfernt + r;

  if (!dryRun && aenderungen) {
    await mkdir(PUBLISH, { recursive: true });
    await writeFile(path.join(PUBLISH, 'neue-urls.json'), JSON.stringify({ erstellt: new Date().toISOString(), urls: neueUrls }, null, 2) + '\n');
  }
  const hinweis = dryRun ? ' (Probelauf, nichts geschrieben)' : '';
  console.log(`\nSeiten: ${s.neu} neu, ${s.geaendert} aktualisiert, ${s.entfernt} offline. Neuerscheinungen: ${r ? 'geändert' : 'unverändert'}${hinweis}.`);
  if (process.env.GITHUB_OUTPUT) await writeFile(process.env.GITHUB_OUTPUT, `aenderungen=${aenderungen}\n`, { flag: 'a' });
}

main().catch((err) => { console.error('✗', err.message); process.exit(1); });
