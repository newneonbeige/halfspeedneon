// Erzeugt SEO-Title und Meta-Description für eine Seite.
// Wichtig: Claude schreibt hier NUR die Metadaten. Der eigentliche Text kommt immer aus dem Sheet und ist von Hand geprüft.
// Ohne ANTHROPIC_API_KEY greifen einfache Vorlagen, damit die Veröffentlichung nie hängen bleibt.
import { kuerzen } from './text.mjs';

export function vorlage({ titel, kurzantwort }) {
  return {
    seoTitle: kuerzen(titel, 60),
    seoDescription: kuerzen(kurzantwort, 155),
  };
}

const PROMPT = ({ titel, typ, kurzantwort }) => `Du schreibst Metadaten für halfspeedneon.com, ein unabhängiges deutschsprachiges Wissensportal zu Krautrock, Motorik, Psych-Rock, Shoegaze und Schallplatten-Sammeln.

Seitentitel: "${titel}"
Seitentyp: ${typ}
Kurzantwort der Seite: "${kurzantwort}"

Gib ausschließlich ein JSON-Objekt zurück mit:
- "seoTitle": max. 60 Zeichen, enthält den Suchbegriff, den Leute tatsächlich eingeben würden, kein Websitename, keine Clickbait-Formulierung
- "seoDescription": 120–155 Zeichen, beantwortet die Frage bereits im Kern und macht Lust auf die Einordnung, sachlicher Ton, keine Superlative, die nicht in der Kurzantwort stehen`;

export async function seoFelder(eingabe) {
  const fallback = vorlage(eingabe);
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return { ...fallback, quelle: 'vorlage' };
  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': key,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: process.env.CLAUDE_MODEL || 'claude-sonnet-5-5',
        max_tokens: 400,
        messages: [{ role: 'user', content: PROMPT(eingabe) }],
      }),
    });
    if (!res.ok) throw new Error(`API ${res.status}: ${await res.text()}`);
    const data = await res.json();
    const roh = data.content?.map((c) => c.text ?? '').join('') ?? '';
    const json = JSON.parse(roh.slice(roh.indexOf('{'), roh.lastIndexOf('}') + 1));
    return {
      seoTitle: kuerzen(json.seoTitle || fallback.seoTitle, 60),
      seoDescription: kuerzen(json.seoDescription || fallback.seoDescription, 155),
      quelle: 'claude',
    };
  } catch (err) {
    console.warn(`  ⚠ Claude nicht erreichbar, nutze Vorlage (${err.message.slice(0, 120)})`);
    return { ...fallback, quelle: 'vorlage' };
  }
}
