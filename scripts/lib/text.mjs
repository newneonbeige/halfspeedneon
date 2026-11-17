// Hilfsfunktionen für Slugs, Kalenderwochen und Frontmatter.

const STOPP = new Set('der die das ein eine einer einem einen und oder aber ist sind hat haben ich du er sie es wir ihr man nicht nur auch so wie mit im in am an auf aus bei zu zum zur von vor für den dem des sagt seit noch schon mal dann wenn dass da hier jetzt'.split(' '));

export function slugify(text, maxWoerter = 5) {
  const basis = text
    .toLowerCase()
    .replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss')
    .normalize('NFKD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s-]/g, ' ')
    .split(/\s+/)
    .filter(Boolean);
  const kern = basis.filter((w) => !STOPP.has(w) && w.length > 1 && !/^\d+$/.test(w));
  return (kern.length >= 2 ? kern : basis).slice(0, maxWoerter).join('-').replace(/-+/g, '-');
}

export function isoWoche(datum = new Date()) {
  const d = new Date(Date.UTC(datum.getFullYear(), datum.getMonth(), datum.getDate()));
  const tag = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - tag);
  const jahrStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return { jahr: d.getUTCFullYear(), woche: Math.ceil(((d - jahrStart) / 86400000 + 1) / 7) };
}

export const kuerzen = (s, max) => {
  if (s.length <= max) return s;
  const cut = s.slice(0, max - 1);
  return cut.slice(0, cut.lastIndexOf(' ') > max * 0.6 ? cut.lastIndexOf(' ') : cut.length).replace(/[\s,;:.–-]+$/, '') + '…';
};

const yamlString = (s) => JSON.stringify(String(s)); // JSON-Strings sind gültiges YAML

/** Setzt (oder ergänzt) ein einzelnes Feld im Frontmatter einer Markdown-Datei, der Rest bleibt unverändert. */
export function setzeFrontmatterFeld(inhalt, feld, wert) {
  const m = inhalt.match(/^---\n([\s\S]*?)\n---\n/);
  if (!m) throw new Error('Kein Frontmatter gefunden');
  const zeile = `${feld}: ${yamlString(wert)}`;
  const re = new RegExp(`^${feld}:.*$`, 'm');
  const kopf = re.test(m[1]) ? m[1].replace(re, zeile) : `${m[1]}\n${zeile}`;
  return `---\n${kopf}\n---\n` + inhalt.slice(m[0].length);
}

/** Akzeptiert nur echte Video-Links (TikTok …/video/<id>, Instagram /reel/ oder /p/). */
export function videoLink(url, plattform) {
  const u = String(url ?? '').trim().split('?')[0];
  if (!u) return undefined;
  if (plattform === 'tiktok' && /^https:\/\/(www\.)?tiktok\.com\/@[\w.-]+\/video\/\d+\/?$/.test(u)) return u.replace(/\/$/, '');
  if (plattform === 'instagram' && /^https:\/\/(www\.)?instagram\.com\/(reel|p)\/[\w-]+\/?$/.test(u)) return u.endsWith('/') ? u : u + '/';
  if (plattform === 'youtube') {
    const id = u.match(/^https:\/\/(?:www\.|m\.)?(?:youtube\.com\/(?:shorts\/|watch\?v=)|youtu\.be\/)([\w-]{11})/)?.[1]
      ?? String(url).match(/youtube\.com\/watch\?v=([\w-]{11})/)?.[1];
    if (id) return `https://www.youtube.com/shorts/${id}`;
  }
  return null; // vorhanden, aber ungültig
}

export function frontmatter(obj) {
  const zeilen = Object.entries(obj)
    .filter(([, v]) => v !== undefined && v !== null && v !== '')
    .map(([k, v]) => (Array.isArray(v) ? `${k}: [${v.map(yamlString).join(', ')}]` : `${k}: ${typeof v === 'string' ? yamlString(v) : v}`));
  return `---\n${zeilen.join('\n')}\n---\n`;
}
