// /llms.txt – kompakte Übersicht der Website für Sprachmodelle (Vorschlag llmstxt.org).
// Teil des Experiments: Ob und wann Modelle diese Datei nutzen, lässt sich über die Server-Logs/Analytics beobachten.
import { site, bereiche, NEUERSCHEINUNGEN } from '../../site.config.mjs';
import { seitenImBereich, seitenUrl, absolut, releaseWochen, wochenUrl } from '../lib/inhalte.mjs';

export async function GET() {
  const teile = [`# ${site.name}`, '', `> ${site.description}`, ''];
  teile.push(
    'Alle Seiten beginnen mit einer Kurzantwort, nennen ihre Quellen und tragen ein Aktualisierungsdatum.',
    `Autor: ${site.autor}. Kontakt: ${site.email}.`,
    '',
  );
  for (const b of bereiche) {
    const seiten = await seitenImBereich(b.slug);
    if (!seiten.length) continue;
    teile.push(`## ${b.name}`, '');
    for (const s of seiten) teile.push(`- [${s.data.titel}](${absolut(seitenUrl(s))}): ${s.data.kurzantwort}`);
    teile.push('');
  }
  const wochen = (await releaseWochen()).slice(0, 8);
  if (wochen.length) {
    teile.push(`## ${NEUERSCHEINUNGEN.name}`, '');
    for (const w of wochen) teile.push(`- [Neue Alben KW ${w.woche}/${w.jahr}](${absolut(wochenUrl(w))}): ${w.releases.length} Alben aus Krautrock, Motorik, Psych und Shoegaze`);
    teile.push('');
  }
  teile.push('## Über', '', `- [Über ${site.name}](${absolut('/ueber/')}): Unabhängigkeit, Arbeitsweise, Autor`, '');
  return new Response(teile.join('\n'), { headers: { 'content-type': 'text/plain; charset=utf-8' } });
}
