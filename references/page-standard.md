# Page standard for “Камчатка — трэвел”

Read this reference before implementing a page with `kamchatka-seo-page-optimizer`.

## Benchmark

Use `/tury/dzhip-tury/` as the benchmark for:

- SEO targeting;
- commercial usefulness;
- real YouTravel.me tour data;
- tables and cards;
- quiz / fast-choice conversion block;
- proof and “how to choose” sections;
- FAQ;
- mobile sticky affiliate CTA;
- production validation discipline.

## SEO standard

For each page:

1. Find the URL in `seo/kamchatka-seo-map.xlsx`.
2. Preserve the main key as the center of the page.
3. Use secondary keys naturally in headings, intro, comparison blocks, FAQ, and internal links.
4. Do not dilute the cluster by chasing unrelated keys.
5. Additional modifiers like “лучшие”, “топовые”, “с детьми”, “цены”, “из Петропавловска” are allowed only when they fit the intent.
6. Title, description, H1, and H2 must be unique and aligned with the page.

If current facts, rules, prices, API behavior, or external details may have changed, verify before relying on them.

## Content tone

Write as an independent travel guide, not as a generic SEO doorway:

- concrete;
- useful;
- commercially aware;
- honest about uncertainty;
- no fake guarantees;
- no “незабываемый отдых ждёт вас” fluff;
- no copied top-search phrasing;
- no developer/implementation text.

Use copy that helps a traveler choose and naturally leads to an affiliate click.

## Recommended page structure

Adapt to the page type, but prefer this order:

1. Hero:
   - strong H1;
   - concise lead;
   - page-specific positioning.
2. Short post-hero lead:
   - who the format suits;
   - how it differs from nearby formats;
   - what to compare before booking.
3. Fast-choice block / quiz:
   - helps users self-select a scenario;
   - does not pretend to store answers or perform real booking;
   - final button goes to affiliate partner.
4. Real tour table:
   - generated from YouTravel data when possible;
   - no invented rows;
   - compact on desktop;
   - mobile scroll hint if table overflows.
   - add expandable original editorial descriptions for the strongest 5-8 real tours when useful.
5. Secondary table or cards if the page has subformats.
6. “How to choose” / proof block:
   - criteria;
   - red flags;
   - what to ask the organizer.
7. Main SEO content:
   - useful sections;
   - internal links to adjacent pages;
   - no walls of text.
8. FAQ:
   - 6–10 concrete questions;
   - include price/date/season/safety/family/format questions when relevant.
9. Final CTA:
   - short;
   - confident;
   - affiliate link.
10. Mobile sticky CTA:
   - one button;
   - simple hook, e.g. “Смотреть топовые туры ↗”;
   - affiliate link.

## YouTravel/API and affiliate requirements

- Use the existing project architecture:
  - `tools/fetch-youtravel-tours.mjs`
  - `src/youtravel-tours.generated.mjs`
  - `src/pages.mjs`
  - `build.mjs`
  - `public/assets/style.css`
  - `public/assets/main.js`
- Use real API-derived tours when possible.
- Do not invent tours to make a table look full.
- Use API tour fields as facts, not copy. When adding expandable tour descriptions, write original short editorial notes: what the tour is, who it suits, and what to verify with the organizer.
- If data is insufficient, be honest through page structure rather than public technical notes.
- CTA links must route through:
  - `https://travelme.g2afse.com/click?pid=1177&offer_id=1`
- For category pages, add `path=` when appropriate, following existing `partnerPath` patterns.
- Public UI should say “Организатор”, not “Эксперт”.
- Avoid fixed current dates unless verified; prefer “посмотреть даты и места”.

## UX/design requirements

- Match the site’s visual language.
- Reuse benchmark patterns rather than creating a new design system.
- Avoid horizontal overflow on mobile.
- Mobile menu must not be open by default.
- If tables scroll on mobile, add a visible hint.
- Do not let sticky CTA cover footer/content; add bottom spacing when necessary.
- If images are weak or missing, create or propose AI images consistent with the project style; do not use random copyrighted images.

## Validation checklist

Run:

```powershell
deno check build.mjs
deno run --allow-read --allow-write build.mjs
python tools\check_site.py
```

Then inspect generated HTML with `rg`:

- target page contains new blocks;
- CSS/JS cache-bust version changed when needed;
- affiliate links are present;
- old technical phrases are absent;
- mobile sticky CTA text is correct;
- no outdated “Эксперт” wording remains where public tour UI should say “Организатор”.

## Deployment checklist

1. Create/update a small deploy manifest with only changed files.
2. Deploy with the existing deploy tool:

```powershell
python "B:\новые доры\редизайн\deploy-tool\deploy_redesign.py" --manifest "<manifest>" --yes
```

3. Wait for Vercel.
4. Verify production with `Invoke-WebRequest`.
5. Verify GitHub `main` hash.
6. Update `docs/SEO_PAGE_QUEUE.md` row to `done` only after production is actually live.

## Queue update format

When a page is complete, change:

```text
| N | todo | `/url/` | ...
```

to:

```text
| N | done | `/url/` | ...
```

Append concise notes:

```text
Эталонно переработана: SEO, реальные туры, таблица/карточки, квиз, FAQ, mobile CTA. Production commit: `abcdef1…`.
```
