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

## Next
Stage 3: GitHub repo + Pages preview on github.io.
Stage 4: CNAME + GoDaddy DNS switch (verify /privacy first).

## Stage 3 � GitHub Pages live (2026-10-30)
URL: https://mirahimi500-ai.github.io/SiraatOne-Website/ | Status: PASS (HTTP 200)
