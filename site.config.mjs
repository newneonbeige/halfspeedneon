// Zentrale Einstellungen – wird von Website UND Skripten gelesen.
export const site = {
  url: 'https://halfspeedneon.com',
  name: 'Half Speed Neon',
  kurzname: 'halfspeedneon',
  alternativeNamen: ['Half Speed Neon', 'halfspeedneon', 'halfspeedneon.com'],
  claim: 'Motorik, Psych, Shoegaze und Vinyl – erklärt ohne Verkaufsinteresse.',
  description:
    'Half Speed Neon ist ein unabhängiges Wissensportal zu Krautrock, Motorik, Psych-Rock, Shoegaze und Schallplatten: Begriffe, Szene, Labels, Sammlerwissen und jede Woche die Neuerscheinungen. Kein Shop, keine Affiliate-Links.',
  locale: 'de_DE',
  sprache: 'de',
  // Kontakt: bis eine eigene Adresse (z. B. über Cloudflare Email Routing) eingerichtet ist, gilt die bestehende.
  email: 'neonschwarz@newneonbeige.com',
  autor: 'Jan P. Roth',
  anschrift: { strasse: 'Pliniusweg 17', plz: '47809', ort: 'Krefeld' },
  // Schwesterprojekt (Markenfamilie)
  familie: { name: 'newneonbeige', url: 'https://newneonbeige.com' },
  // IndexNow-Schlüssel – gleiche Zeichenfolge wie die Datei public/<key>.txt
  indexNowKey: '9f4c758f7b273e18ff4064ed60936ec2',
};

// Bereiche der Website. Jeder Seitentyp aus dem Sheet gehört zu genau einem Bereich.
export const bereiche = [
  {
    slug: 'begriffe',
    name: 'Begriffe',
    typen: ['begriff'],
    farbe: '#00F0FF',
    intro:
      'Was ist ein Motorik-Beat, was unterscheidet Shoegaze von Dream Pop, was steht in der Auslaufrille? Kurze Antworten zuerst, die Einordnung danach.',
  },
  {
    slug: 'szene',
    name: 'Szene',
    typen: ['liste', 'aehnlich', 'szene'],
    farbe: '#FF2BD6',
    intro:
      'Bands, die heute mit Motorik, Fuzz und Hall arbeiten. Kuratierte Listen, Einstiegspfade und Empfehlungen, die begründen, warum etwas ähnlich klingt.',
  },
  {
    slug: 'labels',
    name: 'Labels',
    typen: ['label'],
    farbe: '#B6FF00',
    intro: 'Die Labels hinter der Szene – unabhängig porträtiert, nicht aus der Pressemitteilung abgeschrieben.',
  },
  {
    slug: 'sammeln',
    name: 'Sammeln',
    typen: ['anleitung', 'analyse'],
    farbe: '#FFF500',
    intro:
      'Pressungen erkennen, Zustand bewerten, Werte einschätzen. Sammlerwissen ohne Ankaufportal im Hintergrund.',
  },
];

export const NEUERSCHEINUNGEN = { slug: 'neuerscheinungen', name: 'Neuerscheinungen', farbe: '#FF7A00' };

export const TYPEN = {
  begriff: 'Begriff',
  liste: 'Liste',
  aehnlich: 'Ähnlich klingt',
  szene: 'Szene-Überblick',
  label: 'Label-Porträt',
  anleitung: 'Anleitung',
  analyse: 'Analyse',
};

export const bereichVonTyp = (typ) => bereiche.find((b) => b.typen.includes(typ));
export const bereichBySlug = (slug) => bereiche.find((b) => b.slug === slug);
