# halfspeedneon.com

**Half Speed Neon** – unabhängiges Wissensportal zu Krautrock, Motorik, Psych-Rock, Shoegaze und Vinyl.
Statisch gebaut mit [Astro](https://astro.build), befüllt aus dem Google Sheet „halfspeedneon“, gehostet auf Cloudflare Pages.
Aufbau wie bei [newneonbeige](https://github.com/newneonbeige/newneonbeige).

```
Google Sheet „halfspeedneon“
 ├─ Tab „Seiten“    (status = freigegeben)
 └─ Tab „Releases“  (status = freigegeben)
   │  täglich 05:00 UTC + freitags 10:00 UTC – GitHub Actions
   ▼
scripts/publish.mjs ──► SEO-Title/Description (Claude, nur Metadaten) ──► src/content/seiten/<slug>.md
                    └─► src/data/releases.json
   │  Commit ins Repo
   ▼
astro build ──► Cloudflare Pages ──► IndexNow-Ping   (Sitemap, RSS und llms.txt automatisch)
```

**Grundsatz:** Der Text jeder Seite kommt aus dem Sheet und ist von Hand geprüft. Claude erzeugt in der Pipeline nur Title und Meta-Description.

## Bereiche und URLs

| Typ im Sheet | Bereich | URL |
|---|---|---|
| `begriff` | Begriffe | `/begriffe/<slug>/` |
| `liste`, `aehnlich`, `szene` | Szene | `/szene/<slug>/` |
| `label` | Labels | `/labels/<slug>/` |
| `anleitung`, `analyse` | Sammeln | `/sammeln/<slug>/` |
| Tab „Releases“ | Neuerscheinungen | `/neuerscheinungen/<jahr>-kw<nn>/` |

## Was jede Seite mitbringt

- **Kurzantwort** oben (1–3 Sätze) – das, was Suchmaschinen und Sprachmodelle zitieren sollen
- Haupttext in Markdown, „Häufige Fragen“, **Quellen**, „Weiterlesen“
- Datum der Veröffentlichung bzw. Aktualisierung, Autor
- Schema.org: `Article`, bei Begriffen zusätzlich `DefinedTerm`, dazu `FAQPage` und `BreadcrumbList`; Neuerscheinungen als `ItemList` aus `MusicAlbum`
- Title ≤ 60 Zeichen, Meta-Description ≤ 155 Zeichen, Canonical, Open Graph

Dazu: `/llms.txt` (Übersicht für Sprachmodelle), `robots.txt` mit ausdrücklicher Freigabe für KI-Crawler, `sitemap-index.xml`, `rss.xml`, lokale Schriften (DSGVO), keine Cookies.

## Google Sheet „halfspeedneon“

**Tab „Seiten“**

| Spalte | Inhalt |
|---|---|
| `status` | `entwurf` · `freigegeben` · `offline` (nimmt die Seite wieder herunter) |
| `typ` | `begriff` `liste` `aehnlich` `szene` `label` `anleitung` `analyse` |
| `titel` | Seitentitel (H1) |
| `slug` | optional, sonst aus dem Titel |
| `kurzantwort` | 1–3 Sätze, beantwortet die Frage direkt |
| `text` | Haupttext in Markdown (`## Zwischenüberschrift`, Listen, Tabellen) |
| `faq` | optional, je Zeile `Frage \| Antwort` |
| `quellen` | optional, je Zeile `Titel \| https://…` |
| `verwandt` | optional, Slugs anderer Seiten, kommagetrennt |
| `fragen` | optional, Nummern aus der Nullmessung (intern) |
| `entitaeten` | optional, je Zeile `Name \| Typ \| https://…` (Typ: `Person`, `MusicGroup`, `Organization`, `MusicAlbum`, `Place`, `Event`; `*` vor dem Namen = Hauptthema). Erscheint nicht im Text, nur als Schema.org `about`/`mentions` mit `sameAs` |
| `datum` | optional, Erstveröffentlichung `JJJJ-MM-TT` |
| `notiz` | intern, wird nicht veröffentlicht |

Pflicht für `freigegeben`: `typ`, `titel`, `kurzantwort`, `text`. Änderungen an freigegebenen Seiten werden übernommen und setzen das Aktualisierungsdatum.

**Tab „Releases“**: `status`, `datum` (Erscheinungstag, `JJJJ-MM-TT`), `kuenstler`, `album`, `label`, `genre`, `format`, `land`, `notiz` (ein Satz Einordnung), `link`.

## Einmalig einrichten

1. **GitHub:** Repo anlegen und diesen Ordner pushen.
2. **Sheet:** Beide Tabs über *Datei › Freigeben › Im Web veröffentlichen* jeweils als **CSV** veröffentlichen und die beiden Links kopieren.
3. **Cloudflare Pages:** Projekt `halfspeedneon` anlegen (*Direct Upload*), Domain `halfspeedneon.com` verbinden, Web Analytics aktivieren. API-Token mit Recht *Cloudflare Pages: Edit* erstellen.
4. **GitHub › Settings › Secrets and variables › Actions:**
   - `SHEET_CSV_URL_SEITEN`, `SHEET_CSV_URL_RELEASES`
   - `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`
   - `ANTHROPIC_API_KEY` (optional, für Title/Description; ohne Schlüssel greifen Vorlagen)
5. **Google Search Console:** Domain bestätigen, `https://halfspeedneon.com/sitemap-index.xml` einreichen.
6. **Bing Webmaster Tools:** Sitemap einreichen (Bing speist u. a. ChatGPT und Copilot).

## Lokal arbeiten

```bash
npm install
npm run demo      # Beispieldaten aus examples/ veröffentlichen (nur zum Ausprobieren, danach wieder löschen)
npm run dev       # http://localhost:4321
npm run build
npm run og        # Vorschaubild public/og-default.png neu rendern
```

Probelauf gegen das echte Sheet: `SHEET_CSV_URL_SEITEN=… node scripts/publish.mjs --dry-run`

## Anpassen

- Name, Texte, Kontakt, Bereiche und Farben: `site.config.mjs`
- Look: `src/styles/global.css`, Logo: `src/components/Logo.astro`
- Prompt für Title/Description: `scripts/lib/seo.mjs`
