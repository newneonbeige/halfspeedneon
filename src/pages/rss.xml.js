import rss from '@astrojs/rss';
import { site, bereichVonTyp } from '../../site.config.mjs';
import { alleSeiten, seitenUrl, releaseWochen, wochenUrl } from '../lib/inhalte.mjs';

export async function GET(context) {
  const seiten = (await alleSeiten()).map((s) => ({
    title: s.data.titel,
    description: s.data.kurzantwort,
    pubDate: s.data.aktualisiert,
    link: seitenUrl(s),
    categories: [bereichVonTyp(s.data.typ).name],
  }));
  const wochen = (await releaseWochen()).map((w) => ({
    title: `Neue Alben in KW ${w.woche}/${w.jahr}`,
    description: w.releases.map((r) => `${r.kuenstler} – ${r.album}`).join('; '),
    pubDate: w.releases[0].datum,
    link: wochenUrl(w),
    categories: ['Neuerscheinungen'],
  }));
  return rss({
    title: `${site.name} – neu und aktualisiert`,
    description: site.description,
    site: context.site,
    customData: '<language>de-de</language>',
    items: [...seiten, ...wochen].sort((a, b) => b.pubDate - a.pubDate).slice(0, 50),
  });
}
