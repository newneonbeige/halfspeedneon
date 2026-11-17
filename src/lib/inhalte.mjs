import { getCollection } from 'astro:content';
import { site, bereiche, bereichVonTyp, NEUERSCHEINUNGEN } from '../../site.config.mjs';

export const absolut = (pfad) => new URL(pfad, site.url).href;

export async function alleSeiten() {
  const s = await getCollection('seiten');
  return s.sort((a, b) => b.data.aktualisiert - a.data.aktualisiert);
}

export const seitenUrl = (seite) => `/${bereichVonTyp(seite.data.typ).slug}/${seite.data.slug}/`;

export async function seitenImBereich(bereichSlug) {
  const b = bereiche.find((x) => x.slug === bereichSlug);
  return (await alleSeiten()).filter((s) => b.typen.includes(s.data.typ)).sort((a, b) => a.data.titel.localeCompare(b.data.titel, 'de'));
}

export const datumDe = (d) => new Date(d).toLocaleDateString('de-DE', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
export const isoTag = (d) => new Date(d).toISOString().slice(0, 10);

// ---------- Neuerscheinungen ----------

export function isoWoche(datum) {
  const d = new Date(Date.UTC(datum.getUTCFullYear(), datum.getUTCMonth(), datum.getUTCDate()));
  const tag = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - tag);
  const jahrStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return { jahr: d.getUTCFullYear(), woche: Math.ceil(((d - jahrStart) / 86400000 + 1) / 7) };
}

export const wochenSlug = ({ jahr, woche }) => `${jahr}-kw${String(woche).padStart(2, '0')}`;

/** Gruppiert alle Releases nach ISO-Kalenderwoche, neueste zuerst. */
export async function releaseWochen() {
  const alle = await getCollection('releases');
  const map = new Map();
  for (const r of alle) {
    const w = isoWoche(r.data.datum);
    const slug = wochenSlug(w);
    if (!map.has(slug)) map.set(slug, { slug, ...w, releases: [] });
    map.get(slug).releases.push(r.data);
  }
  return [...map.values()]
    .map((w) => ({ ...w, releases: w.releases.sort((a, b) => a.datum - b.datum || a.kuenstler.localeCompare(b.kuenstler, 'de')) }))
    .sort((a, b) => b.jahr - a.jahr || b.woche - a.woche);
}

export const wochenUrl = (w) => `/${NEUERSCHEINUNGEN.slug}/${w.slug}/`;

// ---------- Schema.org ----------

export const organisation = () => ({
  '@type': 'Organization',
  '@id': `${site.url}/#organisation`,
  name: site.name,
  alternateName: site.alternativeNamen,
  url: `${site.url}/`,
  logo: absolut('/favicon.svg'),
  description: site.description,
});

export const autor = () => ({ '@type': 'Person', name: site.autor, url: absolut('/ueber/') });

export function breadcrumbs(stufen) {
  return {
    '@type': 'BreadcrumbList',
    itemListElement: stufen.map(([name, pfad], i) => ({ '@type': 'ListItem', position: i + 1, name, item: absolut(pfad) })),
  };
}

export function faqSchema(faq) {
  if (!faq?.length) return null;
  return {
    '@type': 'FAQPage',
    mainEntity: faq.map((f) => ({ '@type': 'Question', name: f.frage, acceptedAnswer: { '@type': 'Answer', text: f.antwort } })),
  };
}

/** JSON-LD für eine Wissensseite – je nach Typ DefinedTerm oder Article, dazu FAQ und Breadcrumbs. */
export function seitenSchema(seite) {
  const d = seite.data;
  const b = bereichVonTyp(d.typ);
  const url = absolut(seitenUrl(seite));
  const graph = [];

  if (d.typ === 'begriff') {
    graph.push({
      '@type': 'DefinedTerm',
      '@id': `${url}#begriff`,
      name: d.titel.replace(/[:–—].*$/, '').trim(),
      description: d.kurzantwort,
      url,
      inDefinedTermSet: { '@type': 'DefinedTermSet', name: `${site.name} – Begriffe`, url: absolut('/begriffe/') },
    });
  }
  graph.push({
    '@type': 'Article',
    '@id': `${url}#artikel`,
    headline: d.titel,
    description: d.kurzantwort,
    url,
    inLanguage: site.sprache,
    datePublished: isoTag(d.datum),
    dateModified: isoTag(d.aktualisiert),
    author: autor(),
    publisher: { '@id': `${site.url}/#organisation` },
    isPartOf: { '@type': 'WebSite', '@id': `${site.url}/#website` },
    ...(d.typ === 'label' && { about: { '@type': 'Organization', name: d.titel.replace(/[:–—].*$/, '').trim() } }),
    ...(d.typ === 'begriff' && { about: { '@id': `${url}#begriff` } }),
    ...(d.quellen.length && { citation: d.quellen.map((q) => ({ '@type': 'CreativeWork', name: q.titel, url: q.url })) }),
  });
  const faq = faqSchema(d.faq);
  if (faq) graph.push(faq);
  graph.push(breadcrumbs([[site.name, '/'], [b.name, `/${b.slug}/`], [d.titel, seitenUrl(seite)]]));
  return { '@context': 'https://schema.org', '@graph': graph };
}
