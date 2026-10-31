# SiraatOne-Website — checkpoints

Static site for siraatone.com. Host: GitHub Pages. Domain/DNS: GoDaddy (switch LAST).
Rules: English first, mobile-first, light+dark, no third-party template/tracking. No Islamic text without user-provided, cited source.

## Stage 1 — repo + Home + Privacy (2026-10-30)
Files: index.html, privacy/index.html, assets/css/style.css, assets/js/site.js, .nojekyll, NOTES.md
Status: PENDING local check
Open items:
- Brand colors: placeholders in style.css :root (--brand #0F6B4F, --accent #C9A227) -> replace with app hex.
- Logo: assets/img/logo.png (copied from app launcher icon).
- Privacy text taken from both GitHub Gists (26 Oct 2026). Azan Gist says "SiraatOne Display" -> page uses "SiraatOne Azan". Confirm vs live GoDaddy /privacy. Added short "This website" section (new) -> confirm.
- No CNAME yet (added at DNS-switch stage).
- Nav links quran/, azan/, testers/, support/ -> 404 until stage 2.

## Stage 1b — Home opens Sura list (2026-10-30)
Files: index.html, assets/js/suras.js, assets/css/style.css, privacy/index.html (nav), scripts/fetch-chapters.ps1, assets/data/chapters.json (generated)
Source: Quran Foundation API v4 chapters, fetched once to static JSON; validated 114 suras / 6236 verses. No runtime third-party calls.
Sura links -> sura/?n=N (reader page = next stage; needs verified Quran text source + script choice).
Status: PENDING local check

## Stage 2 — pages (2026-10-30)
Files: quran/, azan/, testers/, support/ index.html, 404.html, style.css (desktop nav one line)
Quran Play ID: com.siraatone.quran. Tester flow = email signup (confirm). 404 uses root paths (works on custom domain; not on github.io subpath).
Status: PENDING local check

## Stage 3b — Calm Quran reader design (2026-10-30)
Files: index.html, assets/css/style.css, assets/js/suras.js, assets/fonts/ (Amiri, OFL, self-hosted)
Cream Mushaf-index look, gold star numbers, Makki/Madani filter. Status: PENDING user review

## Stage 4 — Sura reader (2026-10-31)
Files: sura/index.html, assets/js/reader.js, assets/css/style.css, scripts/fetch-quran.ps1, scripts/fetch-chapters.ps1 (UTF-8 fix), assets/data/sura/*.json (generated), assets/fonts/amiri-quran (OFL)
Source: Quran Foundation API v4 - Uthmani text + translation 20 (Saheeh International). Validated per-sura counts + 6236 total + Arabic chars. Bismillah taken from 1:1 data (not shown for 1 and 9).
Open: Saheeh International usage terms to confirm for website use. Status: PENDING

## Stage 5a — App-style website layout (2026-10-31)
Home dashboard (greeting, search, Last Read, Quick access tiles), Quran index /read/ (quick suras 67,32,18,36,55 as in app; tabs Surah/Juz/Hizb/Page/Search/Bookmarks/Favorites/Notes), reader actions (bookmark/favorite/note, last read). Data stays in browser (localStorage).
index.json checks: juz2=2:142, juz30=78:1, page604=112:1. Commit 2c9560c.
Files: index.html, read/index.html, sura/index.html, assets/js/lib.js, home.js, quran-index.js, reader.js, style.css, scripts/fetch-index.ps1, assets/data/index.json (generated); nav/footer on all pages. Removed: assets/js/suras.js.
Status: PASS (data); live look PENDING user check

## Stage 5b — 99 Names (2026-10-31)
Files: names/index.html, assets/js/names.js, style.css, assets/data/names99.json (copied unchanged from C:\SiraatOne-Quran\assets\names_of_allah\data\names_of_allah_99.json; validated 99, ids 1..99). Sources shown from the file's own references. Status: PASS (45da770, hash = app)

## Stage 6a — Reader v2, app-style (2026-10-31)
Modes: Clean Mushaf (flowing Arabic), Mushaf+ (word-by-word + translation), Verse List. Settings modal (Reading/Text/Appearance/Behavior): sizes, header/meaning/decoration, background (app/cream/sepia/night), prev/next by Surah or Juz, hide toolbar on scroll, compact status, keep screen awake, auto scroll. Ayah action sheet (bookmark/favorite/copy/note). Original SVG header frame (app frame + Surah Name font not reused: source/license unknown).
Files: sura/index.html, assets/js/reader.js, style.css, scripts/fetch-wbw.ps1, assets/data/wbw/*.json (generated). Headless test: no JS errors, bookmark saved. wbw check 1:1 = app glosses. Status: PASS (b837a55)
Later (6b): Page-by-page layout, side quick panel, Tajweed/IndoPak scripts. Printed version skipped.

## Stage 6a-2 — Edge-to-edge layout on computers (2026-10-31)
style.css: full browser width with side padding; 3-col sura list / 6-col names on wide screens. Status: PASS (d0a0cac)

## Stage 6a-3 — Hide top bar on scroll + cache busting (2026-10-31)
site.js hides site header when scrolling down (all pages). CSS/JS links carry ?v=VERSION; bump VERSION on every release so browsers load new files. Current: 20261031a. Status: PASS (e368891; old view was browser cache)

## Stage 6a-4 — Home icons plain + app header frames (2026-10-31)
Home quick access: plain icons, no boxes. scripts/prep-frames.ps1 copies app header images (user-owned) -> assets/img/frame.png (no Bismillah: suras 1, 9) and frame-bism.png (others), max 1200px (frame 1200x412, frame-bism 1200x627). Reader uses them when "title decoration" is on; name overlaid on frame (top 65.6% for frame-bism). Version 20261031c. Status: PASS (bf7e978)

## Stage 6a-6 — Surah name font v2 + gear icon (2026-10-31)
Font: QUL "Surah name font v2" (qul.tarteel.ai/resources/font/455), ligature surahNNN; file copied from app (assets/fonts/arabic_fonts/Surah Name V2 - TTF.ttf) -> assets/fonts/surah-name-v2.ttf. Used in frame, bottom bar, sura list; falls back to Arabic text if font fails. License: check QUL Licence tab (user-chosen). Real gear icon in reader bottom bar. Version 20261031d. Status: PASS (5c31bb1; app uses same surahNNN ligature)

## Stage 6a-7 — 3 Quran fonts + theme-coloured frame + bigger name (2026-10-31)
Fonts (same as app, SHA-256 verified): Uthmani = KFGQPC UthmanicHafs1Ver18 + text_qpc_hafs; IndoPak = indopak-nastaleeq-waqf-lazim-v4.2.1 + text_indopak_nastaleeq; Naskh = Amiri Quran + text_uthmani. Script: scripts/fetch-scripts.ps1 -> assets/data/qpc, assets/data/indopak. Mushaf+ word-by-word stays Naskh. Frame PNGs used as CSS mask -> colour follows theme (green light, gold dark/night). Mushaf al-Madina QCF V4 (604 page fonts) deferred to 6b with page-by-page. Version 20261031e. Status: PASS (721f531; qpc/indopak 114 each, fonts SHA = app)

## Stage 6a-8 — Frame colour = text colour (2026-10-31)
Frame + Bismillah image follow the text colour (dark on light themes, light on dark). PNGs confirmed transparent (corner alpha 0). Fallback to original-colour image if browser lacks CSS mask. Version 20261031f. Status: PENDING

## Next
Stage 6: CNAME + GoDaddy DNS switch (verify /privacy first).
Rule: delete temp/draft/unneeded files after each step and after any failure.
