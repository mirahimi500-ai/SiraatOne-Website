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
Frame + Bismillah image follow the text colour (dark on light themes, light on dark). PNGs confirmed transparent (corner alpha 0). Fallback to original-colour image if browser lacks CSS mask. Version 20261031f. Status: PASS (92ffc7c)

## Stage 7 — App audit (2026-10-31)
Read-only audit of C:\SiraatOne-Quran (205 dart files, 34 screens, ~170 settings keys, ~70 enums); report deleted after reading. Approved: A reader parity, B audio, C site themes + home, D tools + content. Prayer/Ramadan/Qibla later (needs location + privacy update).

## Stage A1 — Reader parity part 1 (2026-10-31)
11 app page backgrounds (exact colours from quran_reader_background_theme.dart), translation layouts Columns/Ayah by Ayah/Verse List, show Arabic/translation/word-by-word toggles, show ayah numbers + numbers on right, line height, side margins, ayah highlights (10 colours, app enum names) + Highlights tab, sura list views (list/small icons/large cards) + font size + meaning/numbers. Headless test: all features work, no JS errors. Version 20261031g. Status: PASS (5dc9ed9)

## Stage A2 — Page-by-page + Tajweed (2026-10-31)
Clean Mushaf "Page by Page" (Madani 604 pages, URL sura/?p=N, crosses suras, titles + Bismillah inside page, arrow keys / bottom bar). PASS (6c94308).
Tajweed v1 (letter-compare of a 2nd text) FAILED safely: QF tajweed text is a different orthography (4115/6236 verses differ, 804 different length) - nothing wrong went online.
Tajweed v2 = app method: assets/js/tajweed.js ports the app's quran_tajweed_markup_parser + quran_tajweed_projector (rules projected onto the SELECTED Mushaf text by letter skeleton; fail-closed per verse; integrity gate output === canonical). Palette = app quran_tajweed_palette (Material shades, light/dark). Data: scripts/fetch-tajweed.ps1 stores QF markup as rule source only. Node unit tests: alef variant aligns, different letter fails, bad markup rejected. Coverage (tools/tajweed-check.html, now deleted): Naskh 5932/6236 coloured, Uthmani(QPC) 5930/6236, IndoPak 367/6236 -> Tajweed disabled for IndoPak with a note; unaligned verses show plain (fail-closed, same as app). Version 20261031j. Status: PASS (f022d98)

## Stage B — Audio (2026-10-31)
Recitation = app sources: Quran Foundation ayah CDN https://verses.quran.foundation/{Alafasy|Husary}/mp3/SSSAAA.mp3 (app: quran_audio_asset_repository.dart), word audio https://audio.qurancdn.com/wbw/SSS_AAA_WWW.mp3. Play button + audio bar (prev/play-pause/next, speed, repeat off/ayah/surah, stop), Play from ayah sheet, follow (scroll+highlight), continue to next surah / next page, tap word to hear (Mushaf+), speed + volume in Audio settings. Privacy page "This website" updated (local storage + QF audio streaming). Headless test PASS (correct URLs, controls), no JS errors. Husary first guessed path FAILED (HEAD check); fixed to official QF API URL (recitation 6): https://mirrors.quranicaudio.com/everyayah/Husary_64kbps/SSSAAA.mp3. Version 20261031l. Status: PASS (8cc9179; Alafasy/Husary/word audio HEAD 200)

## Stage C — Site themes + Home (2026-10-31)
Theme menu (System / Light / Dark / OLED pure black, as app S1ThemePreference) + Reduce motion (site-wide, saved in browser). Home: Quick access Edit (move earlier/later, hide, add back; like app Customize Home; Highlights tile added), Ayah of the day (deterministic from the date, verified data, reference + link to context), Reading streak (days the reader was opened, this browser only). Headless test PASS (OLED black, order/hide persist, no JS errors). Version 20261031m. Status: PASS (0b9c9d4)

## Stage D1 — Tasbih, Islamic Calendar, 99 Names options (2026-10-31)
/tasbih/: named counters (add/rename/delete), target 33/34/99/100/custom, rounds, -1, reset (confirm), vibrate, sound at target, today/all stats (app tasbih settings). /calendar/: Hijri Umm al-Qura via browser Intl + Gregorian month grid, adjustment -2..+2 days (app islamic_calendar adjustment), tap day = fasted mark. 99 Names: views large cards/small icons/list, font Uthmani/IndoPak, meaning, numbers, tap to pronounce (browser Arabic TTS, like app device TTS). Home tiles Tasbih + Calendar. No new Islamic text added. Headless test PASS. Version 20261031n. Status: PASS (146b22b)

## Stage D2 — Duas & Adhkar (2026-10-31)
assets/data/duas.json generated from the app's catalog (duas_adhkar_catalog.dart sha256 42a027b6..., duas_adhkar_browse_categories.dart c05dac07...) by a strict Dart-literal parser (no text edits): 228 entries (Morning&Evening 26, Prophetic 133, Quranic 44, Prayer&Salah 28 in app order), 15 browse categories (177 mapped), every entry has sources; 0 validation errors. Quranic duas: Arabic resolved from verified Quran text (selected font), meaning from Saheeh International (labelled). /duas/: tabs Morning/Evening/Prophetic/Quranic/Prayer/Saved, categories, search, font, size, transliteration/meaning/numbers, repetition counter, save, sources shown. App note shown: English meanings are study glosses pending qualified scholarly review. Headless test PASS. Version 20261031o. Status: PASS (146b22b)

## Stage D3 — Hadith (2026-10-31)
/hadith/: live HadeethEnc API (same endpoints as app hadeethenc_api_client.dart: categories/list, hadeeths/list, hadeeths/one; en + ar). CORS checked: Access-Control-Allow-Origin * (status 200). Category tree + paged lists + detail (Arabic, English, grade, reported by, explanation, benefits, link to source), Saved, options (Arabic/translation/metadata/size). All text escaped. Privacy page mentions HadeethEnc. Version 20261031p. Status: PENDING

## Fix — double ayah numbers (2026-10-31)
QPC Hafs / IndoPak texts already end with their own ayah-number glyph; reader no longer adds a second marker (hasNum). Bismillah above suras shows 1:1 without its number glyph (noNum). Version 20261031q. Status: PASS (4a1279d)

## Fix — dark block before frame loads (2026-10-31)
On sura change the masked frame div showed as a solid text-colour box until the PNG mask loaded. Frame now hidden until the image has loaded (space kept). r: still flashed on first paint (CSS showed box before JS) -> s: .fimg hidden by CSS until .ready. Version 20261031s. Status: PASS (707f74c)

## Fix — IndoPak double ayah numbers (2026-10-31)
IndoPak text ends with a font-specific ayah-number glyph in the Private Use Area (e.g. U+F500, U+F61E); hasNum/noNum now recognise it. Version 20261031t. Status: PASS (9c7d0d0)

## Tajweed v3 = exact app method (2026-10-31)
Read app quran_unicode_tajweed_text.dart (read-only): with Tajweed ON the app renders QF text_uthmani_tajweed segments in the selected font (Uthmani/IndoPak/Naskh); Uthmani KFGQPC only: U+0672->U+0670, U+06DF->U+06E0 (1:1 presentation mapping); ayah marker = the source end segment. Website now does the same (IndoPak Tajweed enabled, no projection). Version 20261031u. Status: PASS (777461d)

## Tajweed colours brighter (2026-10-31)
Vivid palette (light: #0A84FF blue, #FF1744 red, #D500F9 purple, #00C853 green, #00B8D4 cyan, #FF6D00 orange, #5856D6 indigo; brighter variants on dark themes). Same rule-to-colour mapping as app. Version 20261031v. Status: PASS (03979ec)

## Removed Ayah of the day + Reading streak (2026-10-31)
User request: removed home widgets section, home.js widget code, reader streak recording, widget CSS. Version 20261031w. Status: PASS (432e1a1)

## Privacy review (2026-10-31)
Live GoDaddy siraatone.com/privacy returns 404 (Page Not Found). Play Console uses the GitHub Gists (OK). Gists renamed: Azan "SiraatOne Display" -> "SiraatOne Azan" (3b603d0), Quran "siraatone_quran" -> "SiraatOne Quran" (024278c). Website privacy = both Gist policies + "This website" section (dated 31 Oct 2026: local storage only, QF audio, HadeethEnc). After DNS switch: optionally point Play privacy links to https://siraatone.com/privacy/. Version 20261031x.

## Next
Stage 6: CNAME + GoDaddy DNS switch (verify /privacy first).
Rule: delete temp/draft/unneeded files after each step and after any failure.

## Tester page merged into Support (2026-10-31)
testers/ removed; its content is now support/#testers; footer "Become a Tester" links to support/#testers on all pages. Status: PENDING live check

## Stage T1 — All translations (2026-11-01)
scripts/fetch-translations.ps1: every Quran Foundation translation (126 listed / 66 languages) saved once to assets/data/tr/<id>/<sura>.json + translations.json. Checks per translation: verse_key order, 114 suras, counts, 6236, no empty verse; failed ones skipped and listed. Reader: Settings > Text > Translation (Language, Translator), RTL for Arabic-script/Hebrew, credit line follows choice. Saheeh (20) stays in sura/*.json. Version 20261101a. Status: PENDING run on PC
Theme-aware switches + translation lists (dark fix). Version 20261101b. PASS (screenshot dark).

## Stage L1 — Legal check + Terms & Credits (2026-11-01)
Checked: KFGQPC Hafs licence = free use/copy/distribute, no modify/sell (we serve unmodified). IndoPak + Surah Name V2 (QUL): "no copyright information" -> kept, unmodified, credited. HadeethEnc terms: republish allowed unchanged, credit HadeethEnc.com, latest version, no inappropriate ads -> live API meets this. New terms/ page (use terms, scholar disclaimer, all credits, copyright-owner contact); footer link on all pages. Status: PENDING live check

## Stage F1 — Full-surah reciters + Tafsir + Backup (2026-11-01)
Read app (read-only, staged copies deleted): reciters = MP3Quran.net API v3 rewaya=1, https, surah_total 114 (quran_resource_catalog_service.dart); tafsir = spa5k/tafsir_api via jsDelivr. scripts/fetch-reciters.ps1 -> assets/data/reciters.json (same filter + HEAD test 001/114.mp3). Reader: Audio tab "More reciters — full surah" (no ayah highlight), ayah sheet Tafsir (live, unchanged, all spa5k editions), Behavior tab Backup export/import (so.*, theme, rm). Privacy website section + Terms updated (MP3Quran.net, jsDelivr). Version 20261101c. Status: PENDING run + live check

## Stage D4 — Duas landing like the app (2026-11-01)
Read app (read-only, staged copies deleted): duas_adhkar_screen.dart _buildLandingBrowseContent, dua_folder_labels.dart icons, strings (en). Landing: "Collections" (Morning/Evening, Prophetic, Quranic, Prayer/Salah with the app's prayer_salah.png icon) + "Browse Prophetic & Quranic Duas" (15 topics, app short titles + order), 4 equal columns, search all, Saved. Folder/topic opens list with back button (hash URLs). Test: 19 tiles, Faith 15, Morning 25, Prophetic 133, no JS errors. Version 20261101d. Status: PENDING live check
D4b (2026-11-01): Duas list - title hidden, centered pill Morning/Evening, single column, no boxes, faded centered divider. Version 20261101e.
R1 (2026-11-01): sura start shows only frame + name; new i button opens Surah information (name, meaning, ayahs, Makki/Madani, juz/page, translation, Tajweed colour key). Legend removed from text. Version 20261101f. PASS (headless, no errors).
R1b (2026-11-01): i button centered under Bismillah; Surah information = app content (quran_surah_info.dart): curated overview 1-2 copied unchanged, structural overview for others from app metadata via scripts/export-surah-info.ps1 -> assets/data/surah-info.json. Version 20261101g. PASS (headless).
R1c: surah info details shown horizontally (stat chips). Version 20261101h.
R2 (2026-11-01): defaults clean mushaf/no paging/tajweed on/uthmani/app background/Alafasy; bottom-bar play hidden; volume slider in audio bar. Version 20261101n.
R3: ayah popup text-size slider + Translation button/popup. Version 20261101q.
Fix: ayah popup Tafsir/Translation lost the ayah (closeSheet cleared it). Translation popup language switch saved. PASS headless. Version 20261101t.
Tafsir choice in Settings > Text (shared with popup). Version 20261101v.
T2 (2026-11-01): bottom taskbar Home/Quran/App Library on all pages except reader (site.js); new apps/ App Library page (all tiles). Version 20261101w.
Q1 (2026-11-01): reader bottom-bar surah name opens centred Quick access panel = app quran_quick_access_overlay.dart (Bookmarks/Highlights/Notes/Favorites icons, shortcuts 18/36/55/67, search, 114 rows: number, meaning, ayah count, SurahNameV2 name, current highlighted). PASS headless. Version 20261101y.
Removed footer + Quran-page source line from all pages; Privacy and Terms & Credits added to top menu.
Q2: Quran index surah options in ☰ menu + Makki/Madani filter, order, ayah count/place/Arabic toggles. PASS headless. Version 20261102f.
N1 (2026-11-01): names99.json per user: removed Allah from #1, added Al-Ahad (Quran 112:1) after Al-Wahid; 99 names Ar-Rahman..As-Sabur; enumeration note updated. Website only - app file unchanged.
QA2: Quick access remove fixed ([hidden] overridden by .tile display); re-add only from App Library (+ Home / ✓ Home, same so.qa list). PASS headless. Version 20261102n.
TB2 (2026-11-02): Tasbih rebuilt: Back, settings (Target, Vibrate, Sound, Confirm, Stats, own counters), app's 8 sourced dhikr copied unchanged from tasbih_dhikr_catalog.dart with sunnah.com links, progress ring, pointerdown instant tap, pulse/target animation. Old counters migrated (so.tb -> so.tb2). PASS headless. Version 20261102o.
TB3: Tasbih = app features (tasbih_controller/settings): modes Dhikr / Saved counters (max 12), session history on reset (max 20), lifetime/today/targets reached/sessions, clear history, reset statistics; sound at target on by default like app. PASS headless. Version 20261102p.
TB4 (2026-11-02): full audit of app Tasbih (screen, dhikr panel, settings dialog, goal feedback, dhikr/counter controllers, strings) - website now mirrors it: mode menu Dhikr counter / Previous saved counters; Dhikr card (sound+haptic toggles, Arabic dropdown, phrase+source, Selected total, Total Tasbih, Personal target Off/33/34/100, progress bar, circle, -/Reset/+, note); saved counters (dropdown, +, rename/delete, targets none/33/34/100, circle with Target N, stats Lifetime/Targets/Sessions, Recent sessions 5 shown of 20, Clear); settings Haptic/Beep/Confirm/Statistics + Reset Tasbih Settings, all on by default; app's own tasbih_target_beep.wav. Migrates so.tb2/so.tb -> so.tb3. PASS headless. Version 20261102q.
Fix: global @font-face unicode-range (U+060C/061B/061F) for UthmanicHafs, IndoPakNastaleeq, Amiri Quran -> Arabic commas use system Arabic font everywhere. Version 20261102r.
CAL2 (2026-11-02): Islamic Calendar rebuilt from app audit (Umm al-Qura, adjustment -2..+2, Islamic Today, Hijri grid, today, pick date, long-press fast marks, total fasted, About text) + extras: Hijri/Gregorian views, calculation choice, week start, day panel, upcoming Islamic days with sunnah.com sources (verified: Muslim 1134a, Bukhari 969/1990/2017, Muslim 1141, Tirmidhi 747, Nasai 2420), converter both ways, fasting stats, swipe/arrow keys. so.fast keys unchanged. PASS headless. Version 20261102v.
Contrast audit (2026-11-02): all pages x light/dark/OLED, text contrast >=3:1 everywhere (header flag was a colour-format false positive). Fixed: event dots on the selected/today calendar day. Version 20261102x.
TB5: Tasbih uses the Islamic Calendar layout (hero summary card, mode pill instead of menu, two columns: counter card + side cards Dhikr list/Totals or Stats/Recent sessions). Standard for upcoming pages: Back + title + ⚙ top bar, hero card, pill, main + side cards. PASS headless. Version 20261102y.
NM3: 99 Names in Islamic Calendar layout (top bar Back/⚙, summary card with selected name, view pill, search + grid, side cards: selected name with prev/next/pronounce, Sources). PASS headless. Version 20261102z.
SV1: new saved/ page (Bookmarks/Favorites/Highlights/Notes) in Islamic Calendar layout: pill with counts, Arabic + translation, highlight colour, notes, remove, search, By surah filter, summary, settings (order, size, show Arabic/translation, confirm). Home/App Library tiles + reader quick panel link to saved/#... PASS headless. Version 20261103a.
SV2: Quran page tabs now Surah/Juz/Hizb/Page/Search only; Bookmarks/Highlights/Favorites/Notes live on saved/ (old read/#... links redirect). Version 20261103b.
HM2: Home in Islamic Calendar layout: hero (Hijri today Arabic/English, Gregorian, next Islamic day countdown), search, Quick access main column, side cards Last read / Saved counts / Tasbih totals. PASS headless. Version 20261103c.
QX3: Quran sura selection in Islamic Calendar layout: top bar Back/title/⚙ (list settings), hero (القرآن الكريم, counts, last read + continue), pill tabs Surah/Juz/Hizb/Page/Search, main list + side cards Popular suras / Saved counts. PASS headless. Version 20261103f.
Fix (2026-11-03): tb-top title exactly centred (wraps, never cut), gear no longer overlaps title on Quran page, hero Arabic line-height so lines never overlap. Measured on 6 layout pages. Version 20261103g.
DU5: Duas & Adhkar (landing + every collection/topic/saved/search) in Islamic Calendar layout: top bar Back(folder->landing)/title/⚙ settings, hero (landing totals or folder count), Morning/Evening pill, main grids/list + side cards Collections/Saved/About. PASS headless. Version 20261103h.
SP2: Support in Islamic Calendar layout (hero contact, pill Common questions/Become a Tester, FAQ accordion + website backup Q, side Contact/Our apps/Policies). Version 20261103i.
PV2: Privacy in Islamic Calendar layout; policy text unchanged (verified key passages), pill Quran/Azan/This website (all sections visible without JS), Changes + Contact as side cards, #quran/#azan/#website anchors kept. Version 20261103k.
Fix: privacy pill - card display rule overrode [hidden]; now one policy visible at a time (tested real visibility). Version 20261103l.
TM2: Terms & Credits in Islamic Calendar layout, text unchanged; pill Using this website / Credits & sources; side For copyright owners + Contact. PASS (real visibility). Version 20261103m.
AP2: Quran app + Azan app pages in Islamic Calendar layout (hero + Play button, features grid, side Content sources/Phones + Help & policies). Text unchanged. Version 20261103n.
HD3: Hadith in Islamic Calendar layout (top bar Back/⚙, hero الأحاديث النبوية + saved count, pill Collections/Saved, breadcrumbs + list, side Source/Note). Version 20261103o.
LB2: App Library in Islamic Calendar layout (hero count + on-Home count, tiles card with + Home, side Quick access help + Android apps). Version 20261103p.
Fix (2026-11-03): all hero cards + App Library card padded (no text touching card edge, checked on 13 pages), App badge above + Home button. Version 20261103q.
Fix: switching Page by page / No paging keeps Settings open on the same tab after the page switch. PASS headless. Version 20261103r.
QS1 (2026-11-03): Quran settings audit vs app quran_settings_controller.dart: options that don't apply to the reading mode are greyed out (paging=Clean; translation layout/Arabic/translation/tafsir=Verse List; word-by-word/tap word=Mushaf+; Tajweed not in Mushaf+; speed only with auto scroll; meaning/decoration only with header). Added app setting 'show tafsir in translation' (tafsir under each ayah, Verse List). Auto scroll: setting shows a start/pause button in the bottom bar; scrolling by hand pauses. Meaning line toggle works again (off by default). Tajweed key toggle controls the i-panel key. Every toggle/slider tested: Settings never closes. Not on website: app's printed Mushaf (QCF pages). Version 20261103s.
AS2: advanced auto scroll: control bar (play/pause, slower, faster, speed 1-20 = 6-120 px/s time-based, time left, stop), keys S/+/-/Esc, hand scroll pauses + optional resume after 3 s, continue to next surah/page, screen kept awake while running; settings Continue/Resume/Show time left (greyed unless Auto scroll on). PASS headless. Version 20261103t.
AS3: auto scroll controls (− ▶ + speed/time left) now inside the bottom toolbar (no floating pill); toolbar hides while scrolling with a smooth slide/fade, tap an empty part of the page to show/hide it, hand scroll pauses and shows it; tiny scroll moves ignored (no flicker). Phone width: prev/next hidden when auto scroll is on so the bar fits. PASS headless (390 px). Version 20261103u.
- AS4: pause fix (icon swap no longer detaches tap target), auto scroll row above toolbar (sura name fixed), X turns auto scroll off, bar auto-hides 3 s while running, first tap brings it back.
- AS5: auto scroll inline between sura name and settings (name always centred, never moves); phones: arrows step aside, − ▶ + right, speed + ✕ left; sub-pixel smooth scrolling.
- AS6: opening a Juz/ayah link (jump scroll) no longer hides the reader toolbar.
- NAV1: Juz mode toolbar shows current Juz (updates while scrolling); ‹ › go to prev/next Juz start (same sura: scrolls, no freeze); Surah mode shows sura.
- PILL1: reader top info bar, reader bottom bar, home taskbar = floating bold pills; top+bottom hide/show together smoothly.
- PILL2: Mushaf info pill always shown in every mode, full width (8px margin), slim; EN left: no · name · Juz · Page; AR right same; compact setting removed.
- MP1: top info pill never hides; narrow info pill inside Mushaf at every sura + Juz start (clean, verse/plus, page); Clean + No Paging = continuous (next suras appended), toolbar name/arrows/status/last-read follow visible sura.
- MP2: every sura start (continuous scroll + page mode) uses the same decorated frame with large name + Bismillah as the top header.
- NAV2: ‹ › (Surah/Juz) land exactly at the start: info pill 10px under the top pill (header slide accounted), toolbar stays shown; loaded next suras jump without reload; scroll restoration manual.
- SET1: reader Settings window fixed size (86vh, max 680px); sections scroll smoothly inside; scroll resets on section switch.
- HDR1: top site bar = floating pill (all pages), bold logo, pill nav links; slow smooth hide (0.7s) on scroll down, status/tabs/bottom bar follow same motion.
- HDR2: top bar hides as a visible slide-up (0.9s, fade only at the end), slides back down on scroll up.
- PV1: Settings live preview (real ayahs of current sura, follows every setting: mode, font, tajweed, sizes, spacing, margins, header/meaning/decoration, numbers, translation, background) at top of Reading/Text/Look; thumbnails on Reading mode, Paging, Translation layout, Quran font, Repeat, Next/previous.
- PV1 reverted (user: not professional/accurate). Settings back to SET1 state.
- MP+1: Mushaf+ Tajweed word by word (only when word count matches word-by-word data, else plain); tafsir under each ayah also in Mushaf+; Tajweed setting no longer greyed in Mushaf+.
- WBW2: word-by-word language choice (Settings > Reading, shown once scripts/fetch-wbw-langs.ps1 has run; per-ayah English fallback if word counts differ; RTL glosses for ur/fa/ps/ku). LH1: line height slider works in every mode/font (Mushaf+ row spacing, IndoPak, page mode).
- WBW3: own 'Word by word' section in Settings > Reading (toggle + language); always enabled; turning on switches to Mushaf+.
- WBW4: fetch-wbw-langs.ps1 fixed: QF v4 word language param is 'language' (verified ur on 1:2).
- WBW5: Mushaf+ tajweed words in selected Mushaf font (fixes broken letters); RTL word meanings in system Arabic font, bigger.
- WBW6: Mushaf+ ayah sign taken from the selected Mushaf text (own number glyph, Mushaf font) instead of ﴿﴾; slider 'Word meaning spacing (Mushaf+)' 0-30px (default 8).
- TJ-NASKH: Tajweed in Naskh/IndoPak maps source placeholders 1:1 to standard Uthmani letters (U+0672->U+0670, U+066E->U+0649; verified vs sura text 2:2, 2:29) - fixes dotted circles.
- TJ-NASKH2: Naskh/IndoPak Tajweed: a coloured part never starts with a bare vowel mark; its letter joins the same colour (sura 2 real data: 0 parts starting with a mark, no U+0672/U+066E left).
- VL1: Verse List: word by word works (words + meanings when on); inline tafsir always open, plain text under translation with one thin line (no box/colour/arrow).
- COL1: Verse List Columns: Arabic/words right; translation then tafsir on the left (with or without word by word).
- SET2: reader Settings regrouped (Layout / Text / Translation / Audio / More); Surah title = one choice (frame/plain/hidden) replacing 3 toggles; meaning line removed (in ⓘ + info pill); fixes: tafsir toggle live, Tajweed key shown on page, Juz/Surah nav greyed in Page by Page, tap-word + wbw language greying, clearer labels.
- WIN1: reader windows (Settings, ayah menu, tafsir, translation, info, quick panel) slide up + fade in on open, slide down + fade out on close (0.3-0.45s); Esc/backdrop/× all animated; off with Reduce motion.
- LEG2: Tajweed colour key removed from the page (all modes); shown only in the ⓘ sura info (setting relabelled).
- PT1: Prayer Times & Azan page (prayer/): Adhan 4.4.3 in-browser (same library/methods/defaults as SiraatOne Azan app: ISNA, Standard Asr, auto high-latitude >48° 1/7 else middle, Dubai tweak, ±30 min adjustments); Today list with per-prayer Azan bells, Month timetable, next-prayer countdown, Jumu'ah label, Hijri (calendar adjustment), night times + Qibla; GPS or Open-Meteo city search; Azan (complete/short/beep/off from the app) + browser notification while page open; Privacy section added; App Library/Home tile -> prayer/. Setup: scripts/setup-prayer.ps1.
- PW1: Home prayer-times widget (next prayer + countdown + today's 6 times, Use my location / Search a city when not set); shared calc moved to assets/js/prayer-core.js (used by Prayer page + Home).
- PW2: Home prayer widget moved to the right column as a compact card, replacing Last read / Saved / Tasbih cards (removed from code); no location -> 'Location required' link to prayer/.
- H3: Home redesign (same content): green gradient hero with Hijri date, next Islamic day chip and search inside; Prayer card beside it (stacked on phone); Quick access as card tiles with coloured icon bubbles and subtitles (auto-fill grid), edit mode unchanged.
- H3 reverted (user): Home back to PW2 layout (hero + search, Quick access, prayer card in right column).
- PW3: other times as in the Azan app: Ishraq/Duha (sunrise+20 min), Midnight, Qiyam = start of last third (Maghrib->Fajr): 3 boxes under Home prayer card; prayer page card 'Other times & Qibla'. Checked by hand (Maghrib 4:55, Fajr 5:15 -> 11:05 / 1:08).
- MINI3: Last read / Saved / Tasbih restored as 3 small side-by-side boxes under the Home prayer card.
- LR1: Continue tile renamed 'Last read' with continue-reading icon and sura · ayah subtitle (Home + App Library); small Last read box removed (Saved + Tasbih boxes remain, 2 columns).
- MG1: default Mushaf background (App Theme, renamed 'SiraatOne Green (default)') is soft green: light #EDF3E7, dark #0E1813, OLED black.
- MG1 reverted (user meant the frame). FR1: Surah name frame + name use the theme green (--brand): light #2E7D32, dark #66BB6A, each background its own accent.
- REV1 (items 1-5): Terms credits (Adhan MIT, Open-Meteo/GeoNames CC BY 4.0); Prayer page: Ishraq/Duha range (sunrise+20 .. Dhuhr-10), 'Avoid voluntary prayer' card (app margins, labelled), usual-method suggestion by country (city cc or timezone; only on tap); 'Prayer Times' in top menu on all pages.
- SEO/PWA (items 6-7): manifest.webmanifest (installable, Chrome: 0 installability errors), icons 192/512/180 from Play icon, og.png 1200x630, Open Graph/Twitter tags on all pages (siraatone.com URLs), robots.txt, sitemap.xml (15 pages + 114 suras).
- DOMAIN: primary www.siraatone.com (CNAME file); apex A records -> GitHub (redirects to www); OG/sitemap/robots URLs -> https://www.siraatone.com.
- MOB1: phone-only compact layout (<=600px): slim header, compact hero/search, 4-per-row round icon Quick access, 3x2 prayer grid, 64px taskbar (App Library -> Library under 380px), tighter cards/titles, 40px+ buttons/inputs, Quran Settings tabs 3+2 grid, side-by-side choices, background swatches 4 per row. Tested 320/360/390/430: no sideways scroll, no errors; desktop unchanged.
- MAIL1: support@zaibatech.com (Zoho, MX/SPF/DKIM verified) added next to siraatone1@gmail.com on Privacy (hero + contact), Support (hero, button, contact), Terms (copyright + contact). App policy texts unchanged.

## Search fix (SRCH1)
- quran-index.js: search ignores accents (allah = Allāh), loose sura names (yaseen, baqara), references (36, 2:255), safe loading. Sura filter uses the same matching.
- SG1 Home search: live results drop down as you type (suras, 2:255 refs, top 5 ayahs + "See all"). Arrow keys/Enter. home.js + style.css (SG1 block); index.html v=20261105i.
- SG1b Home search also finds features, settings (opens panel via ?set=1 in site.js), your bookmarks/favorites/highlights/notes, theme. site.js v=20261105i on all pages.
- SG1c Home search also finds individual duas (title, topic, meaning, Arabic); opens duas/?q=…#search (duas.js reads ?q).
- SG1d Home search shows Dua folders (4 collections, 15 topics, Saved duas); "dua/duas" lists all folders.
- SG2 Smart search: new assets/js/qs.js (stop words, word forms, synonyms, typo-tolerant sura names, highlight). Home search = one ranked list with icons + type tags, keyboard footer; Quran search page and Duas search use the same matching. Removed SG1 chevrons.
- QR1 Quran page search: Quran only (suras + every ayah), all results with Show more (50, then 100 per click), "found in N suras", highlighted words, Arabic queries show Arabic ayah; Surah filter typo-tolerant.
- SPF1 Support form: "Email support" opens a dialog (name, email, mobile optional, app, topic, device optional, subject, message, agree box) sent via Web3Forms (assets/js/support.js, KEY placeholder until Mirwais gives the access key). Emails removed from Support page; Privacy "This website" section mentions the form (3 Nov 2026).
- SPF2 Support page: 3 different forms. Email support = technical support modal (band header, device fields, reference SO-xxxx); Send a message = side drawer / phone bottom sheet with topic chips; Apply to join = tester card (perks, Google account, app chips, device). Different subjects: [Support SO-x], [Message] topic, [Tester application].
- SV3 Saved tabs: no "(0)"; count shown only when 1 or more, without brackets.
- SV4 Saved hero: "None yet" instead of "0 ayahs in 0 surahs"; 1 surah singular.
- WBW1 Clean Mushaf: tap a word to hear it (word found from tap point, brief highlight); tap ayah number or press-and-hold ayah for options. Setting enabled in Clean mode with hint. reader.js v=i.
- PLAY1 Recitation starts at the chosen ayah in continuous Mushaf (queue built for that sura, not the first sura opened); continues into the next sura on screen; play button starts from the ayah at the top of the screen. Full-surah reciters still start at the sura beginning (no timing data yet).
- GAP1 Recitation: next ayah preloaded in a second player and started the moment the current one ends (tested gap 2-7 ms with 400 ms network delay); iPhone unlock on first tap.
- AUD2 Recitation player moved inside the bottom toolbar (left side): play button; while playing prev/play-pause/next + ayah key; options pop-up (reciter, stop, volume, speed, repeat; prev/next on phone). Toolbar stays visible while playing; phone hides Back + sura arrows while playing; starting audio pauses auto scroll. Old floating audio bar removed.
- AUD2 reverted at Mirwais request: floating audio bar restored (GAP1 preload and PLAY1 kept).
- I18N1 Interface languages step 1: assets/js/i18n.js (globe picker next to theme button, saved as so.lang, RTL for ar/ur/fa/ps, translates page text + later script text, number patterns {n}, {x}, " · " parts, ~word tokens for dates); dictionaries assets/i18n/ar.json, ur.json (~870 phrases). All pages load i18n.js first; head script sets lang/dir early. Quran text, translations, duas/hadith content and legal text stay unchanged. Tested ar+ur on all 17 pages desktop+phone: no errors, no sideways scroll. Step 2: 14 more languages.
- I18N2 Step 2: 14 more interface languages (fa, ps, tr, id, ms, bn, hi, ta, so, sw, fr, es, de, ru) translated by helpers, each checked (866/866 phrases, placeholders kept). Picker lists 17 languages. Fixed: translator loop when a translation equals the English (froze Latin-script languages). ar/ur "Adhan" kept as library name. Tested all 16 on Home, sura, Prayer, Calendar, Support (desktop) + Home, sura (phone): no errors, no sideways scroll. Later: Russian date word order, notification text "It is time for … prayer", sura meanings and language-name lists stay English.
- GAPLESS1 Alafasy/Husary play the whole surah as one file (download.quranicaudio.com, Quran Foundation) with ayah start times from assets/data/timing/<reciter>/<n>.json (scripts/fetch-recitation-timings.ps1, 228 files). Highlight/follow, start at any ayah, prev/next, repeat ayah work by seeking; next surah file preloaded; falls back to per-ayah files if a timing or surah file fails. Privacy lists download.quranicaudio.com. Tested 112->113: ayah changes at 3.2/5.6/8.6 s (timings 2.98/5.51/8.49), one file per surah.
- CFWA1 Cloudflare Web Analytics (cookie-free) on all 17 pages (token 08e4…50de); Privacy: "Visitor statistics" paragraph, no-analytics wording replaced, hero translated in 16 languages; i18n v=d. Google Search Console verified (DNS TXT), sitemap submitted: 129 pages.
- POL1 Polish: dates/times use the chosen language (Intl, Western digits) on Home, Calendar, Prayer; prayer notification translated (16 langs); sura meanings from Quran Foundation for ur tr id ms bn fr es ru + Arabic names for ar (fa ps hi ta so sw de: QF has none, stay English); fixed date-word translation for Latin-script languages (Hijri dates in fr/de/tr/id now translate). Script scripts/fetch-sura-names.ps1 (data in assets/data/sura-names). i18n v=20261106a.
- UPD1 Privacy: privacy@zaibatech.com for privacy questions (hero + Contact), support@ / siraatone1@ for other help. iPhone/Android home-screen: app title "SiraatOne", standalone launch, status bar meta on all 17 pages. Email forwarding for siraatone.com dropped (Forward Email never delivered); remove its 3 DNS records.
- siraatone1@gmail.com removed from the website (Privacy, Terms); contacts: privacy@ and support@zaibatech.com.
- INFO2 Every surah in continuous Mushaf / Mushaf pages gets its own i button (opens that surah info); before only the first surah had one.


## QS1 — Quick Summary in the surah information (i) window (2026-11-06)
- New `assets/data/surah-summary.json`: Topic + Summary for all 114 surahs (English), from the reviewed document "SiraatOne Quick Summaries — Topic and Summary".
- `reader.js` openInfo: the Overview section is replaced by **Quick Summary** (Topic + Summary); all other fields unchanged. If the file cannot load, the old overview is shown. Summary text is marked translate="no" (English only for now).
- Labels "Quick Summary" and "Topic:" added to the 16 interface dictionaries. `sura/index.html`: reader.js?v=20261106b.


## MOB2 — tighter phone sizes (2026-11-07)
- Phone audit (Playwright, 360px and 390px, 17 pages + menu, settings and language pop-ups): no horizontal overflow; oversized controls on Library, Duas, Surah list, Privacy/Terms tabs, Support, reader bottom bar and Quran Settings.
- New CSS block MOB2 at the end of style.css (max-width:600px), after MOB1: base font 15px, smaller icons, list rows, Duas folders, pills, chips, bottom-bar name and settings buttons. Desktop unchanged.
- Result at 360px: Surah list rows 73→60px, Duas folders 119→93px, Library tiles 121→103px, Privacy tabs 67→40px, reader name 62→46px. style.css?v=20261107a on all 17 pages.

## SPF3 — Support page text and Apply button (2026-11-07)
- Bug: the dialog label rule `.sp-sec` (small uppercase) also hit the page sections (`section.sp-sec`), so FAQ/Tester text showed tiny uppercase and "Apply to join" was a full-width bar. Fix: rule scoped to `.sp-dlg .sp-sec`; `.sp-sec > .btn` is a normal-size button (141x46px at 360/390/820/1280px).
- Privacy tabs on phones wrap to 2 rows (no cut-off text), checked at 320–430px.

## 2026-11-11 · App release update (website only)
- Quran app page: "What's new · Version 1.0.6 (18)" card (9 items). Azan app page: "What's new · Version 0.1.6 (13)" card (6 items).
- Azan "Phones" text (Azan page + Support FAQ): phones now open straight in landscape (no "Open anyway" notice).
- Prayer page: "Complete Azan" sound removed; menu = Short Azan / Beep / Off, default Short Azan; old saved "complete" setting migrates to Short Azan. "Complete Azan" key removed from all 16 translation files.
- 19 new strings translated into all 16 languages; i18n V=20261111a; style.css adds .ap-new/.ap-list (?v=20261111a on Quran/Azan pages); prayer.js ?v=20261111a.
- Islamic content unchanged. assets/audio/azan/complete/ no longer used (removed with git rm).
- Tests: en/ar/ps/ta/fr/ur pages render, RTL ok, no overflow at 390/1280, 0 JS errors; translations applied; prayer menu + migration ok.



## THEMES1 — theme list on the Quran app page (2026-11-11)
- What's new: "11 colour themes" corrected to 15 themes (System, Light, Dark, OLED, White Green + 10 Quran themes).
- New "Themes" card after What's new: App themes (5) and Quran themes (10) as chips; text translated into all 16 languages; CSS block THEMES1; quran/index.html style.css?v=20261111b.


## SN1 — official Surah names, new frame, owner's Bismillah (2026-11-11)
- Same as the Quran app (commits 9368de9, 6b7b01e, e3dddd5, 5f381bd): Surah names use the King Fahd Complex font QCF4_QBSML, unmodified (assets/fonts/QCF4_QBSML.ttf + KFGQPC_NOTICE.txt); Surah n = U+F100 + n - 1; aria-label "سورة <name>". Used in the Surah list, reader frame, bottom bar, info pop-up and side list.
- New Surah frame = the app's surah_header_v3_frame_only.png (assets/img/surah-frame.png, lossless re-save). Bismillah = the owner's Thuluth artwork (assets/img/surah-basmalah.png) as a mask in the frame colour, under the (i) button; not on Surah 1 or 9; plain title mode keeps the Quran-text Bismillah.
- Removed from use: Surah Name V2 font (unlicensed), frame.png and frame-bism.png (old artwork with built-in Bismillah). Credits updated on Terms & Credits.
- style.css/lib.js ?v=20261111c on all pages; reader.js ?v=20261111c.

## B1 — reader options from the app (Nov 11)
- Clean Mushaf text alignment (Settings → Reading): Right (default: justified, last line right) or Centered. Clean Mushaf only; included in Reset.
- Bold Quran text (Settings → Text): crisp stroke (~medium weight), works with Tajweed colours; off by default.
- Page background White Green (#DCEEE2, brand #166A4B), sampled from the app's reader_bg_11_white_green.jpg.
- Uthmani (King Fahd font) only: display maps U+06E3→U+06DC (52:37) and U+06EB→U+06EC (12:11) so the Tajweed and Mushaf+ text no longer shows dotted circles. Checked: the KFGQPC text (assets/data/qpc) already uses U+06DC and U+06EC there; stored and copied text unchanged.
- Labels in 16 languages. Files: sura/index.html, reader.js, style.css (?v=20261111d), i18n/*.json.

## C1 — prayer card, sounds, Azkar counter, restore defaults, Quran page (Nov 11)
- Current prayer rule as the apps (S1_NO_CURRENT_PRAYER_AFTER_SUNRISE_V1), shared PT.curOf in prayer-core.js: Fajr until sunrise, none sunrise→Dhuhr, Isha current until Fajr. Home card + Prayer page highlight the CURRENT prayer (before: the next one).
- Home prayer card: icon per prayer (PT.icon), "−h:mm:ss" under the current prayer for 90 min after its Azan, countdown on the right of the next-prayer line.
- Prayer page sounds: Azan recordings removed (no licence, as the apps). Choices: Notification sound (default; old short/complete migrate) / Beep (Web Audio tone, no file) / Silent (silent notification). Folder assets/audio/azan/ no longer used → git rm.
- Azkar: counter shows "0 / 3" ("tap to count" removed); 100× dhikr: three taps within 0.7 s → Done ✓. Tasbih page: "Tap to count" label removed.
- Quran reader Backup & reset: "Restore from backup file" (renamed), "Reset Quran settings", new "Restore default settings" (clears so.rs, so.pt, so.dopt, so.hopt, so.nm, so.svopt, so.sl, so.tafsir, so.qa, so.cal2, theme, rm; keeps bookmarks, favorites, highlights, notes, saved, tasbih, location, language).
- Quran app page: features Prayer times and Azan, Qibla; "Private by design" no longer says internet-only; What's new line added. Privacy page Location section for the Quran app: waiting for the app agent's text/permissions.
- Test PASS (fake clock): morning none, Asr+10 min "−0:10:05", Dhuhr+100 min hidden, before Fajr = Isha; prayer page current = Asr, 3 sound options; Azkar 0 / 3 and triple tap Done ✓; restore keeps bookmarks/location/lang; 360 px no overflow; 0 JS errors.

## D1 — content check against the app (Nov 11)
- 99 Names: assets/data/names99.json is byte-identical to the app's names_of_allah_99.json (Ar-Rahman first, Al-Ahad after Al-Wahid, 1–99). No change.
- Duas & Adhkar: app duas_adhkar_catalog.dart sha256 42a027b61264 = the one duas.json was generated from (includes Hisn al-Muslim 92 in Morning & Evening and the corrected sources/gradings). No change.
- Tasbih: dhikr choices already in Arabic (TB4). No change.
- Rub al-Hizb (۞): Mushaf+ Tajweed words now keep the sign with the next word (as the word-by-word data and the app), so those ayahs keep their Tajweed colours (before: word count mismatch → plain). Surah 2: 19/19 ayahs with ۞ coloured, 0 JS errors. reader.js ?v=20261111f.
- Not on the website yet (app has them): Names meanings and Duas/Adhkar text in the app languages (ar bn es fa fr id ms tr ur).
