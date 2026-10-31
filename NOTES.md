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
Files: index.html, read/index.html, sura/index.html, assets/js/lib.js, home.js, quran-index.js, reader.js, style.css, scripts/fetch-index.ps1, assets/data/index.json (generated); nav/footer on all pages. Removed: assets/js/suras.js.
Status: PENDING

## Next
Stage 5b: 99 Names page (reuse app's reviewed names_of_allah_99.json + sourced meanings).
Stage 6: CNAME + GoDaddy DNS switch (verify /privacy first).
Rule: delete temp/draft/unneeded files after each step and after any failure.
