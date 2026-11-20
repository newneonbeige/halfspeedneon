import { defineCollection } from 'astro:content';
import { glob, file } from 'astro/loaders';
import { z } from 'astro/zod';

// Eine Wissensseite = eine Markdown-Datei unter src/content/seiten/<slug>.md
// Der Text unter dem Frontmatter ist der Haupttext der Seite (Markdown aus der Spalte „text“ im Sheet).
const seiten = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/seiten' }),
  schema: z.object({
    titel: z.string(),
    slug: z.string(),
    typ: z.enum(['begriff', 'liste', 'aehnlich', 'szene', 'label', 'anleitung', 'analyse']),
    kurzantwort: z.string(),
    seoTitle: z.string().max(70),
    seoDescription: z.string().max(170),
    datum: z.coerce.date(),
    aktualisiert: z.coerce.date(),
    faq: z.array(z.object({ frage: z.string(), antwort: z.string() })).default([]),
    quellen: z.array(z.object({ titel: z.string(), url: z.string().url() })).default([]),
    verwandt: z.array(z.string()).default([]),
    // Personen, Bands, Labels usw., die auf der Seite vorkommen – nur für Schema.org (mentions/about mit sameAs)
    entitaeten: z.array(z.object({ name: z.string(), typ: z.string().default('Thing'), url: z.string().url(), haupt: z.boolean().default(false) })).default([]),
    fragen: z.string().optional(), // Fragen-Nummern aus der Nullmessung, nur intern
  }),
});

// Neuerscheinungen: eine JSON-Liste, vom Skript aus dem Sheet-Tab „Releases“ geschrieben
const releases = defineCollection({
  loader: file('./src/data/releases.json'),
  schema: z.object({
    id: z.string(),
    datum: z.coerce.date(),
    kuenstler: z.string(),
    album: z.string(),
    label: z.string().optional(),
    genre: z.string().optional(),
    format: z.string().optional(),
    land: z.string().optional(),
    notiz: z.string().optional(),
    link: z.string().url().optional(),
  }),
});

export const collections = { seiten, releases };
