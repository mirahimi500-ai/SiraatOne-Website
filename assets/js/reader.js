// Reader v2: Clean Mushaf / Mushaf+ (word-by-word) / Verse List, settings panel, status bar, bottom bar.
// Quran text only from assets/data (validated by scripts/*.ps1). Personal data stays in this browser.
(function () {
  var qs = new URLSearchParams(location.search), n = parseInt(qs.get('n'), 10), P = parseInt(qs.get('p'), 10);
  if (!(n >= 1) && P >= 1 && P <= 604) n = 1; // set from the page index below
  var $ = function (id) { return document.getElementById(id); }, esc = SO.esc, root = document.documentElement;
  if (!(n >= 1 && n <= 114)) { location.replace('../read/'); return; }
  var DEF = { frame: 'classic', mode: 'clean', script: 'uthmani', ar: 1.9, tr: 1, header: true, meaning: true, deco: true, bg: 'app', nav: 'surah', hide: true, awake: false, auto: false, speed: 3, paging: 'scroll', tajweed: true, legend: true, reciter: 'Alafasy', repeat: 'off', autoNext: true, follow: true, tapWord: true, rate: 1, vol: 1, lh: 2.3, pad: 48, tlay: 'ayah', nums: true, numsRight: false, showAr: true, showTr: true, showWbw: true, trid: 20, tfInline: false, asNext: true, asResume: true, asEta: true, wgap: 8, align: 'right', bold: false };
  var S = Object.assign({}, DEF, SO.get('so.rs', {}));
  // one-time move to the new defaults (Nov 2026) for browsers that saved older settings
  if ((S.dv || 0) < 2) { S.mode = 'clean'; S.paging = 'scroll'; S.tajweed = true; S.script = 'uthmani'; S.reciter = 'Alafasy'; S.dv = 2; SO.set('so.rs', S); }
  if (S.dv < 3) { S.meaning = false; S.dv = 3; SO.set('so.rs', S); } // the meaning line under the frame starts off (details are in the i button)
  S.bg = { cream: 'classic', sepia: 'sand', night: 'forest', whitegreen: 'app' }[S.bg] || S.bg; // old values -> app backgrounds
  var HL = { yellow: '#FDE047', amber: '#FBBF24', orange: '#FB923C', red: '#F87171', pink: '#F472B6', purple: '#C084FC', indigo: '#818CF8', blue: '#60A5FA', teal: '#2DD4BF', green: '#4ADE80' };
  function hl(k) { var c = SO.get('so.hl', {})[k]; return c && HL[c] ? ' style="--hl:' + HL[c] + '" data-hl="' + c + '"' : ''; }
  var ch, sura, idx, wbw = null, bism = null, AR = null, BI = null, CACHE = {};
  var pageMode = false;
  // Tajweed: rules projected onto the SELECTED Mushaf text (TJ = port of the app's projector). Fail-closed per verse.
  var TJD = {};
  function getTj(s) {
    if (!S.tajweed) return Promise.resolve(null);
    if (TJD[s] !== undefined) return Promise.resolve(TJD[s]);
    return SO.j('../assets/data/tajweed/' + s + '.json').then(function (d) { return (TJD[s] = d.ar); }).catch(function () { return (TJD[s] = null); });
  }
  // Tajweed = the app's method (quran_unicode_tajweed_text.dart): show Quran Foundation's text_uthmani_tajweed
  // segments in the selected font. Uthmani (KFGQPC) only: U+0672 -> U+0670 and U+06DF -> U+06E0 (1:1, as the app does).
  // The ayah marker comes from the source's own end segment (no second marker).
  function tjSource(markup, mark) {
    var segs = tjSegs(markup); if (!segs) return null;
    var out = '', endTxt = '';
    segs.forEach(function (g) {
      if (g.rule === 'endMarker') { endTxt = g.text.trim(); return; }
      var t = g.text, cls = g.rule && g.rule !== 'unknown' ? g.rule : null;
      out += cls ? '<span class="tj-' + cls + '">' + esc(t) + '</span>' : esc(t);
    });
    out = out.replace(/\s+$/, '');
    if (mark && endTxt && S.nums) out += ' ' + (S.script === 'naskh' ? '' : '<span class="tj-end">' + esc(endTxt) + '</span>');
    return out;
  }
  // 1:1 character mapping of the Tajweed source to the selected font. Uthmani (KFGQPC): as the app. Naskh / IndoPak fonts
  // lack the source's placeholders, so they get the standard Uthmani letters (checked against sura text, e.g. 2:2, 2:29):
  // U+0672 -> U+0670 (dagger alef), U+066E -> U+0649 (alef maksura before dagger alef).
  function tjText(t) { return S.script === 'uthmani' ? t.replace(/\u0672/g, '\u0670').replace(/\u06DF/g, '\u06E0') : t.replace(/\u0672/g, '\u0670').replace(/\u066E/g, '\u0649'); }
  // Segments with mapped text. Naskh / IndoPak: a coloured part must never start with a bare vowel mark (the browser would
  // draw it on a dotted circle), so the letter it belongs to moves into the same part (letter + its marks share one colour).
  var MK = '\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06DC\u06DF-\u06E4\u06E7\u06E8\u06EA-\u06ED', MK0 = new RegExp('^[' + MK + ']'), MKT = new RegExp('[^\\s' + MK + '][' + MK + ']*$');
  function tjSegs(markup) {
    var segs = TJ.parse(markup); if (!segs) return null;
    segs = segs.map(function (g) { return { rule: g.rule, text: g.rule === 'endMarker' ? g.text : tjText(g.text) }; });
    if (S.script === 'uthmani') return segs;
    for (var k = 1; k < segs.length; k++) {
      var g = segs[k], p = segs[k - 1]; if (g.rule === 'endMarker' || p.rule === 'endMarker' || !MK0.test(g.text)) continue;
      var m = p.text.match(MKT); if (!m) continue;
      p.text = p.text.slice(0, -m[0].length); g.text = m[0] + g.text;
    }
    return segs.filter(function (g) { return g.text !== ''; });
  }
  function fmt(a, s, i, noMark) {
    var m = tjMarkup(s, i);
    return (m && tjSource(m, !noMark)) || esc(a);
  }
  function tjMarkup(s, i) {
    var m = S.tajweed && TJD[s] && TJD[s][i];
    // same single, exact repair as the app (known Quran Foundation markup defect at 32:3)
    if (m && s === 32 && i === 2) m = m.replace('<tajweed class=ham_wasl>ٱ</tajweed>فْتَرَ>ٮٰ</tajweed>هُ', '<tajweed class=ham_wasl>ٱ</tajweed>فْتَرَ<tajweed class=madda_normal>ٮٰ</tajweed>هُ');
    return m || null;
  }
  // Mushaf+: the same Tajweed colours word by word. Used only when the word count matches the word-by-word data exactly
  // (otherwise that ayah stays plain: fail-closed, never a wrong split).
  // the Rub al-Hizb sign (۞) is not a word: it stays with the next word, as in the word-by-word data and the app
  function tjWords(s, i, count) {
    var m = tjMarkup(s, i), segs = m && tjSegs(m); if (!segs) return null;
    var out = [], cur = '';
    segs.forEach(function (g) {
      if (g.rule === 'endMarker') return;
      var cls = g.rule && g.rule !== 'unknown' ? g.rule : null, t = g.text;
      t.split(/(\s+)/).forEach(function (p) { if (!p) return; if (/^\s+$/.test(p)) { if (cur && cur.replace(/<[^>]+>/g, '') === '\u06DE') cur += ' '; else if (cur) { out.push(cur); cur = ''; } return; } cur += cls ? '<span class="tj-' + cls + '">' + esc(p) + '</span>' : esc(p); });
    });
    if (cur) out.push(cur);
    return out.length === count ? out : null;
  }

  // word-by-word languages list (only the ones downloaded)
  SO.j('../assets/data/wbw-langs.json').catch(function () { return [{ code: 'en', name: 'English' }]; }).then(function (l) { var sel = $('wbw-lang'); if (!sel || !l || !l.length) return;
    sel.innerHTML = l.map(function (x) { return '<option value="' + x.code + '">' + esc(x.name) + '</option>'; }).join(''); sel.value = S.wbwLang || 'en'; $('wbw-lang-row').hidden = false;
    sel.onchange = function () { S.wbwLang = this.value; save(); render(); }; }).catch(function () {});
  var RTLW = { ur: 1, fa: 1, ps: 1, ku: 1 };
  // Translations: 20 = Saheeh International (inside sura/*.json); others from assets/data/tr/<id>/<sura>.json (scripts/fetch-translations.ps1)
  var TRM = null, TRT = null;
  function trInfo() { return TRM && TRM.filter(function (t) { return t.id === +S.trid; })[0]; }
  function getTr(s) { if (+S.trid === 20 || !trInfo()) return Promise.resolve(null); return SO.j('../assets/data/tr/' + S.trid + '/' + s + '.json').then(function (d) { return d.t; }).catch(function () { return null; }); }
  function trAttr() { var t = trInfo(); return t && +S.trid !== 20 ? ' dir="' + t.dir + '"' : ''; }
  function trUI() {
    var L = $('tr-lang'), I = $('tr-id'), t = trInfo() || TRM.filter(function (x) { return x.id === 20; })[0];
    var cap = function (w) { return w.replace(/(^|[ -])\w/g, function (m) { return m.toUpperCase(); }); };
    var langs = []; TRM.forEach(function (x) { if (langs.indexOf(x.lang) < 0) langs.push(x.lang); });
    langs.sort(function (a, b) { return a === 'english' ? -1 : b === 'english' ? 1 : a < b ? -1 : 1; });
    L.innerHTML = langs.map(function (l) { return '<option value="' + esc(l) + '"' + (t && l === t.lang ? ' selected' : '') + '>' + esc(cap(l)) + '</option>'; }).join('');
    I.innerHTML = TRM.filter(function (x) { return x.lang === L.value; }).map(function (x) { return '<option value="' + x.id + '"' + (t && x.id === t.id ? ' selected' : '') + '>' + esc(x.name + (x.author && x.author !== x.name ? ' — ' + x.author : '')) + '</option>'; }).join('');
    $('tp-lang').innerHTML = L.innerHTML; $('tp-lang').value = L.value; $('tp-id').innerHTML = I.innerHTML; $('tp-id').value = I.value; $('tp-box').hidden = false;
    var c = trInfo(); $('src-tr').textContent = 'Translation: ' + (c ? c.name : 'Saheeh International') + '.';
  }
  SO.j('../assets/data/translations.json').then(function (d) {
    TRM = d.translations; $('tr-box').hidden = false; trUI();
    if (+S.trid !== 20 && sura) reloadText();
    $('tr-lang').onchange = function () { var f = TRM.filter(function (x) { return x.lang === $('tr-lang').value; })[0]; S.trid = f.id; save(); trUI(); reloadText(); };
    $('tr-id').onchange = function () { S.trid = +this.value; save(); trUI(); reloadText(); };
  }).catch(function () {});

  function dirFor() { return S.script === 'uthmani' ? 'qpc' : S.script === 'indopak' ? 'indopak' : null; }
  // one sura in the chosen script: { ar, en, base }
  function getSura(s) {
    var d = dirFor(), key = s + '|' + d + '|' + S.trid;
    if (!CACHE[key]) CACHE[key] = Promise.all([SO.j('../assets/data/sura/' + s + '.json'), d ? SO.j('../assets/data/' + d + '/' + s + '.json').catch(function () { return null; }) : null, getTr(s)])
      .then(function (x) { var ok = x[1] && x[1].ar.length === x[0].ar.length, t = x[2] && x[2].length === x[0].en.length ? x[2] : x[0].en; return { ar: ok ? x[1].ar : x[0].ar, en: t, base: x[0].ar, styled: !!ok }; });
    return CACHE[key];
  }
  function elFor(k) { var p = k.split(':'); return document.getElementById(pageMode || +p[0] !== n ? 'a' + p[0] + '_' + p[1] : p[1]); }
  // Quran script: naskh = Uthmani text in Amiri Quran; uthmani = QPC Hafs (KFGQPC); indopak = IndoPak Nastaleeq
  function loadScript() {
    return Promise.all([getSura(n), bism ? getSura(1) : null, getTj(n), bism ? getTj(1) : null]).then(function (x) {
      AR = x[0].ar; BI = x[1] ? x[1].ar[0] : null; TRT = x[0].en;
      document.body.dataset.tj = S.tajweed && x[2] ? '1' : '0';
      document.body.dataset.script = !x[0].styled ? 'naskh' : S.script;
    });
  }
  function save() { SO.set('so.rs', S); }
  function arNum(i) { return Number(i).toLocaleString('ar-EG'); }
  // QPC Hafs (Arabic-Indic digits) / IndoPak (font glyph in Private Use Area U+E000-F8FF) texts already end with their own ayah-number glyph: never add a second one
  // Bismillah above a sura = text of 1:1 without its ayah-number glyph (it is not an ayah of that sura)
  // King Fahd (UthmanicHafs) font only: it draws the small low seen (52:37) at U+06DC and the ishmam sign (12:11) at U+06EC;
  // the standard code points show a dotted circle. Display only, same as the app: the stored and copied text is unchanged.
  function kf(h) { h = h.replace(/\u06DE/g, '<span class="rsg">\u06DE</span>'); return document.body.dataset.script === 'uthmani' ? h.replace(/\u06E3/g, '\u06DC').replace(/\u06EB/g, '\u06EC') : h; } // S1_RUB_SIGN_LARGER_V1: ۞ 2 px larger
  // S1_MUSHAF_MARGIN_MARKS_V1: ۞ Hizb quarter marks from the canonical Rub' starts (none at 1:1); Arabic Mushaf terms in every language
  var RQ = null;
  function rqOf(s, a) { if (!idx || !idx.rub) return 0; if (!RQ) { RQ = {}; idx.rub.forEach(function (x, i) { if (i) RQ[x[0] * 1000 + x[1]] = i + 1; }); } return RQ[s * 1000 + a] || 0; }
  function rqLabel(r) { return ['الحزب', 'ربع الحزب', 'نصف الحزب', 'ثلاثة أرباع الحزب'][(r - 1) % 4] + ' ' + arNum(Math.floor((r - 1) / 4) + 1); }
  function placeRq() { var B = $('body'); if (!B) return;
    B.querySelectorAll('.rqm').forEach(function (x) { x.remove(); });
    B.querySelectorAll('.flow').forEach(function (f) { var fr = f.getBoundingClientRect(), pg = f.closest('.mb-pg'), side = pg ? (pg.classList.contains('even') ? 'l' : 'r') : 'l';
      f.querySelectorAll('.rq').forEach(function (q) { var m = document.createElement('span'); m.className = 'rqm rqm-' + side; m.setAttribute('aria-hidden', 'true');
        m.style.top = Math.round(q.getBoundingClientRect().top - fr.top) + 'px'; m.innerHTML = '<b>\u06DE</b>' + rqLabel(+q.getAttribute('data-rq')).split(' ').map(function (w) { return '<i>' + w + '</i>'; }).join(''); f.appendChild(m); }); }); }
  var rqT = 0; function rqSoon() { cancelAnimationFrame(rqT); rqT = requestAnimationFrame(function () { fitBook(); placeRq(); }); }
  function noNum(a) { return (a || '').replace(/\s*([\u06DD]?[\u0660-\u0669\u06F0-\u06F9]+|[\uE000-\uF8FF]+)\s*$/, ''); }
  function hasNum(a) { return /([\u0660-\u0669\u06F0-\u06F9]|[\uE000-\uF8FF])\s*$/.test(a || ''); }
  // narrow info pill placed inside the Mushaf at the start of every sura and every Juz
  function jzStart(s, a) { if (!idx) return false; for (var i = 0; i < idx.juz.length; i++) if (idx.juz[i][0] === s && idx.juz[i][1] === a) return true; return false; }
  function mpill(s, a) { var c = ch[s - 1], p = idx ? SO.pos(idx, s, a) : null;
    return '<div class="mpill" role="note"><span>' + s + ' · ' + esc(c.name_simple) + (p ? ' · Juz ' + p.juz + ' · Page ' + p.page : '') + '</span><span lang="ar" dir="rtl">' + arNum(s) + ' · ' + c.name_arabic + (p ? ' · الجزء ' + arNum(p.juz) + ' · صفحة ' + arNum(p.page) : '') + '</span></div>'; }
  // the same decorated frame (large name inside, Bismillah drawn in the frame) for every sura start, as at the top
  function frameHtml(s) {
    var useImg = S.header && S.deco, nm = '<span class="frame-name" lang="ar" dir="rtl">' + SO.sname(s, 'سورة ' + ch[s - 1].name_arabic) + '</span>', h;
    if (useImg) { var u = 'url(../assets/img/surah-frame.png)';
      h = '<div class="frame" aria-hidden="true"><div class="fimg ready" style="-webkit-mask-image:' + u + ';mask-image:' + u + '"></div>' + nm + '</div>'; }
    else h = '<div class="frame plain" aria-hidden="true">' + nm + '</div>';
    return '<header class="sura-head">' + h + '</header>';
  }
  // SN1: Bismillah under the (i) button: the owner's Thuluth artwork (tinted with the frame colour) with the frame, the Quran text otherwise; none for Surah 1 and 9
  var BIS_TXT = 'بِسۡمِ ٱللَّهِ ٱلرَّحۡمَٰنِ ٱلرَّحِيمِ';
  function bismHtml(s, b1) {
    if (s === 1 || s === 9) return '';
    if (S.header && S.deco && !pageMode && !(S.mode === 'verse' && S.tlay === 'list')) return '<div class="bism-img" role="img" lang="ar" aria-label="' + BIS_TXT + '"></div>';
    return b1 ? '<p class="bismillah" lang="ar" dir="rtl">' + fmt(noNum(b1), 1, 0, true) + '</p>' : '';
  }
  // clean flow for ayahs a1..a2 of sura s, split by a pill at each Juz start
  function flowHtml(s, d, a1, a2, idf) {
    var h = '<p class="flow" lang="ar" dir="rtl">';
    for (var a = a1; a <= a2; a++) {
      if (a > a1 && jzStart(s, a)) h += '</p>' + mpill(s, a) + '<p class="flow" lang="ar" dir="rtl">';
      var rq = rqOf(s, a); h += '<span class="aya" id="' + idf(a) + '" data-s="' + s + '" data-a="' + a + '"' + hl(s + ':' + a) + '>' + (rq ? '<span class="rq" data-rq="' + rq + '"></span>' : '') + fmt(d[a - 1], s, a - 1) + (S.nums && !(S.tajweed && TJD[s] ? S.script !== 'naskh' : hasNum(d[a - 1])) ? ' ' + end(a) : '') + '</span> ';
    }
    return h + '</p>';
  }
  // Mushaf+: the ayah-end sign exactly as in the selected Mushaf text (its own number glyph, drawn by the Mushaf font)
  function ownEnd(i) { if (!S.nums) return ''; var mk = (AR[i] || '').match(/([\u06DD]?[\u0660-\u0669\u06F0-\u06F9]+|[\uE000-\uF8FF]+)\s*$/);
    return mk ? '<span class="end-own">' + esc(mk[1]) + '</span>' : end(i + 1); }
  function end(i) { return '<span class="end">﴿' + arNum(i) + '﴾</span>'; }

  // ---------- apply settings ----------
  function apply(rerender) {
    S.title = !S.header ? 'off' : S.deco ? 'frame' : 'plain'; S.meaning = false;
    root.style.setProperty('--ar-size', S.ar + 'rem'); root.style.setProperty('--tr-size', S.tr + 'rem'); root.style.setProperty('--lh', S.lh); root.style.setProperty('--pad', S.pad + 'px'); root.style.setProperty('--wgap', (S.wgap === undefined ? 8 : S.wgap) + 'px');
    document.body.classList.toggle('nums-right', !!S.numsRight); document.body.classList.toggle('no-wbw', !S.showWbw);
    document.body.dataset.bg = S.bg; document.body.dataset.align = S.align === 'center' ? 'center' : 'right'; document.body.classList.toggle('q-bold', !!S.bold);
    $('head').hidden = !S.header; $('s-meta').hidden = !S.meaning; $('s-meta').classList.toggle('sr', !S.meaning); $('s-meta').classList.toggle('s-mean', !!S.meaning);
    var useImg = S.header && S.deco;
    $('frame').classList.toggle('plain', !useImg); $('frame').classList.remove('bism');
    var im = $('frame-img'); im.hidden = !useImg;
    if (useImg) {
      var u = 'url(../assets/img/surah-frame.png)';
      var canMask = window.CSS && (CSS.supports('mask-image', u) || CSS.supports('-webkit-mask-image', u));
      // Show the frame only after its image has loaded; before that the coloured box would show as a dark block.
      if (im.classList.contains('ready') && (im.style.maskImage || im.style.webkitMaskImage || im.style.backgroundImage)) canMask = null; // already shown: no blink
      else im.classList.remove('ready');
      if (canMask === null) {} else if (canMask) { im.classList.remove('raw'); var pre = new Image();
        pre.onload = function () { im.style.webkitMaskImage = u; im.style.maskImage = u; im.classList.add('ready'); };
        pre.src = u.slice(4, -1); }
      else { im.style.backgroundImage = u; im.classList.add('raw', 'ready'); } // old browsers: original colours
    }
    var bImg = useImg && !pageMode && !(S.mode === 'verse' && S.tlay === 'list');
    $('s-bism').hidden = !bism || bImg; $('s-bimg').hidden = !bism || !bImg;
    $('status').hidden = false; document.body.classList.add('has-status'); // the info pill is part of every Mushaf
    wake(); autoScroll();
    document.querySelectorAll('[data-set]').forEach(function (el) {
      var k = el.getAttribute('data-set');
      if (el.classList.contains('seg')) el.querySelectorAll('button').forEach(function (b) { b.setAttribute('aria-pressed', b.getAttribute('data-v') === String(S[k])); });
      else if (el.type === 'checkbox') el.checked = !!S[k];
      else el.value = S[k];
    });
    document.querySelectorAll('[data-out]').forEach(function (o) { var k = o.getAttribute('data-out'); o.textContent = k === 'rate' ? S.rate + '×' : k === 'vol' ? Math.round(S.vol * 100) + '%' : k === 'speed' ? S.speed : k === 'lh' ? (+S.lh).toFixed(1) : k === 'pad' ? S.pad + 'px' : k === 'wgap' ? S.wgap + 'px' : Math.round(S[k] * 16); });
    var pf = $('pframe-row'); if (pf) pf.hidden = !(S.mode === 'clean' && S.paging === 'page');
    deps();
    if (ch) navLinks();
    if (rerender && sura) render();
  }

  // grey out options that do not apply to the selected reading mode (they work again when that mode is chosen)
  function deps() {
    var m = S.mode, on = {
      paging: m === 'clean', align: m === 'clean', tlay: m === 'verse', showAr: m === 'verse', showTr: m === 'verse', tfInline: m !== 'clean',
      wgap: m !== 'clean' && S.showWbw, showWbw: m !== 'clean', tapWord: m === 'plus' || m === 'clean' || (m === 'verse' && S.showWbw), numsRight: m !== 'clean' && S.nums,
      tajweed: true, legend: !!S.tajweed, nav: !(m === 'clean' && S.paging === 'page'),
      speed: S.auto, asNext: S.auto, asResume: S.auto, asEta: S.auto };
    var wl = $('wbw-lang'); if (wl) { wl.disabled = !on.wgap; wl.closest('.sl').classList.toggle('dis', !on.wgap); }
    Object.keys(on).forEach(function (k) {
      document.querySelectorAll('#settings [data-set="' + k + '"]').forEach(function (el) {
        var box = el.closest('.tg, .sl, .pick') || el, h = box.previousElementSibling;
        box.classList.toggle('dis', !on[k]); if (el.matches('input,select')) el.disabled = !on[k];
        if (el.classList.contains('seg')) el.querySelectorAll('button').forEach(function (b) { b.disabled = !on[k]; });
        if (h && h.tagName === 'H3' && el.classList.contains('seg')) h.classList.toggle('dis', !on[k]);
      });
    });
  }
  // ---------- data ----------
  Promise.all([SO.j('../assets/data/chapters.json'), SO.j('../assets/data/index.json').catch(function () { return null; })])
    .then(function (r0) {
      ch = r0[0].chapters; idx = r0[1];
      pageMode = S.mode === 'clean' && S.paging === 'page' && !!idx;
      if (pageMode && !(P >= 1 && P <= 604)) { var t0 = parseInt(location.hash.slice(1), 10) || 1; P = SO.pos(idx, n, t0).page; history.replaceState(null, '', '?p=' + P); }
      if (pageMode) n = idx.page[P - 1][0];
      if (!pageMode && qs.get('p') && idx) { var st = idx.page[P - 1]; location.replace('?n=' + st[0] + '#' + st[1]); throw 'redirect'; }
      document.body.classList.toggle('pg-mode', pageMode);
      return Promise.all([r0, SO.j('../assets/data/sura/' + n + '.json'), n === 1 || n === 9 ? null : SO.j('../assets/data/sura/1.json')]);
    })
    .then(function (rr) {
      var r = [rr[0][0], rr[1], rr[2], rr[0][1]];
      sura = r[1]; var c = ch[n - 1];
      if (sura.ar.length !== c.verses || sura.en.length !== c.verses) throw 0;
      if (r[2]) bism = r[2].ar[0]; // Bismillah = verse 1:1 from source data
      head();
      loadScript().then(function () { apply(false); render(); setTimeout(AUD.auto, 400); });
    })
    .catch(function (e) { if (e !== 'redirect') $('s-en').textContent = 'This sura could not be loaded. Please refresh.'; });

  function head() { var c = ch[n - 1];
    document.title = c.name_simple + ' — SiraatOne';
    $('s-ar').innerHTML = SO.sname(n, 'سورة ' + c.name_arabic);
    $('s-en').textContent = c.name_simple;
    var m = c.meaning + ' · ' + c.verses + ' ayahs · ' + (c.place === 'makkah' ? 'Makki' : 'Madani');
    if (idx) { var p = SO.pos(idx, n, 1); m += ' · Juz ' + p.juz + ' · Page ' + p.page; }
    $('s-meta').textContent = m;
    $('bb-name').innerHTML = arNum(n) + ' - ' + SO.sname(n, c.name_arabic); }

  var LEG = [['maddNormal', 'Madd — Normal'], ['qalqalah', 'Qalqalah'], ['ikhfa', 'Ikhfa'], ['idghamWithGhunnah', 'Idgham with Ghunnah'], ['iqlab', 'Iqlab'], ['ghunnah', 'Ghunnah']]; // labels from the app
  function legend() { return S.tajweed && S.legend && document.body.dataset.tj === '1' ? '<div class="tj-legend">' + LEG.map(function (l) { return '<span class="tj-' + l[0] + '">' + l[1] + '</span>'; }).join('') + '</div>' : ''; }
  // ---------- Page by Page: a digital Mushaf book (S1_MUSHAF_BOOK_V1, S1_MUSHAF_FRAME_STYLES_V1, S1_MUSHAF_TWO_PAGE_V1) ----------
  function pgLast() { var b = document.querySelector('.mbook.spread'); return b ? (P % 2 ? P : P - 1) + 1 : P; }
  function spreadOn() { return innerWidth > innerHeight && innerWidth >= 600; }
  function pageSegs(p) { var st = idx.page[p - 1], en = idx.page[p] || null, segs = [];
    for (var s = st[0]; s <= (en ? (en[1] === 1 ? en[0] - 1 : en[0]) : 114); s++) {
      var a1 = s === st[0] ? st[1] : 1, a2 = en && s === en[0] ? en[1] - 1 : ch[s - 1].verses; if (a2 >= a1) segs.push([s, a1, a2]); }
    return segs; }
  function pageHtml(p, segs, data, b1, spread) {
    var st = idx.page[p - 1], top = segs[0][0], j = SO.pos(idx, st[0], st[1]).juz, h = '', open = p <= 2;
    segs.forEach(function (g, i) { var s = g[0], d = data[i];
      if (g[1] === 1) { // Surah start: name only in the header when it opens the page, else a small calligraphy cartouche; then the Basmalah (font)
        if (!(i === 0 && st[1] === 1)) h += '<div class="mb-cart" data-sinfo="' + s + '" role="button" tabindex="0" aria-label="Surah information">' + SO.sname(s, 'سورة ' + ch[s - 1].name_arabic) + '</div>';
        if (s !== 1 && s !== 9 && b1) h += '<p class="bismillah mb-bism" lang="ar" dir="rtl">' + fmt(noNum(b1), 1, 0, true) + '</p>'; }
      h += flowHtml(s, d.ar, g[1], g[2], function (a) { return 'a' + s + '_' + a; }); });
    var side = p % 2 ? 'odd' : 'even';
    return '<article class="mb-pg ' + side + (open ? ' mb-open' : '') + '" data-p="' + p + '"><div class="mb-band" aria-hidden="true"></div>' +
      '<header class="mb-head"><span class="mb-juz" lang="ar">الجزء ' + arNum(j) + '</span><span class="mb-sname" data-sinfo="' + top + '" role="button" tabindex="0" aria-label="Surah information">' + SO.sname(top, 'سورة ' + ch[top - 1].name_arabic) + '</span></header>' +
      '<div class="mb-text">' + (open ? '<div class="mb-med">' + h + '</div>' : h) + '</div>' +
      '<footer class="mb-foot"><span class="mb-pn" lang="ar">' + arNum(p) + '</span></footer></article>';
  }
  function fitBook() { // every page fills its frame like a printed page: only its line spacing changes (0.8–2.2×); a page that cannot fit grows
    var bk = document.querySelector('.mbook'); if (!bk) return;
    var pgs = bk.querySelectorAll('.mb-pg:not(.mb-open)'), H = Math.max(480, Math.min(innerHeight - 150, 1400));
    pgs.forEach(function (pg) { var t = pg.querySelector('.mb-text'); pg.style.minHeight = H + 'px'; t.style.setProperty('--mbl', 1);
      var room = H - (pg.offsetHeight - t.offsetHeight), fits = function (k) { t.style.setProperty('--mbl', k); return t.offsetHeight <= room; };
      var lo, hi, i;
      if (fits(1)) { lo = 1; hi = 2.2; for (i = 0; i < 7; i++) { var m = (lo + hi) / 2; if (fits(m)) lo = m; else hi = m; } t.style.setProperty('--mbl', lo.toFixed(3)); }
      else if (fits(0.8)) { lo = 0.8; hi = 1; for (i = 0; i < 6; i++) { var m2 = (lo + hi) / 2; if (fits(m2)) lo = m2; else hi = m2; } t.style.setProperty('--mbl', lo.toFixed(3)); }
      else t.style.setProperty('--mbl', 1); });
  }
  // MBTURN1 (owner: "turn the page like a real Quran Mushaf"): the next pages are built and waiting underneath; the leaf turns on the spine in 3D (right-to-left
  // like a printed Mushaf), its back shows the next page, light and shadow follow the angle; drag a page to turn it by hand. No reload. 0% animation = instant.
  function noTurn() { return document.documentElement.classList.contains('rm') || (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches); }
  function fxK() { var v = parseFloat(document.documentElement.style.getPropertyValue('--fxk')); return isNaN(v) ? 1 : v; }
  function spreadPages(pp) { var sp = spreadOn(), p1 = sp ? (pp % 2 ? pp : pp - 1) : pp; return sp && p1 < 604 ? [p1, p1 + 1] : [p1]; }
  function buildPages(pages) { // → Promise of { html: [one <article> per page], tj }
    var sp = spreadOn(), sg = pages.map(pageSegs), flat = [].concat.apply([], sg);
    return Promise.all(flat.map(function (g) { return getSura(g[0]); }).concat([getSura(1)]).concat(flat.map(function (g) { return getTj(g[0]); })).concat([getTj(1)])).then(function (all) {
      var b1 = all[flat.length].ar[0], k = 0;
      return { tj: S.tajweed && TJD[flat[0][0]] ? '1' : '0', html: pages.map(function (p, pi) { var d = sg[pi].map(function () { return all[k++]; }); return kf(pageHtml(p, sg[pi], d, b1, sp)); }) };
    }); }
  var TURN = null, PRE = {};
  function curPg() { var bk = document.querySelector('.mbook'), sp = !!(bk && bk.classList.contains('spread')), p1 = sp ? (P % 2 ? P : P - 1) : P;
    return { bk: bk, sp: sp, p1: p1, step: sp ? 2 : 1, last: sp ? Math.min(604, p1 + 1) : p1 }; }
  function target(dir) { var c = curPg(); return dir === 'next' ? (c.last < 604 ? c.last + 1 : 0) : (c.p1 > 1 ? Math.max(1, c.p1 - c.step) : 0); }
  function pre(q) { var pages = spreadPages(q), key = pages.join(','); return PRE[key] || (PRE[key] = buildPages(pages)); }
  function prefetch() { var keep = {}; ['next', 'prev'].forEach(function (d) { var q = target(d); if (q) { var key = spreadPages(q).join(','); keep[key] = pre(q); } }); PRE = keep; }
  function setupTurn(dir) { // builds the turn on top of the current book; resolves to a turn object with set(angle 0–180), done(), undo()
    var c = curPg(), q = target(dir); if (!q || !c.bk) return null;
    return pre(q).then(function (B) {
      if (!document.body.contains(c.bk)) return null;
      var bk = c.bk, pgs = bk.querySelectorAll(':scope > .mb-pg'), mk = function (h) { var t = document.createElement('div'); t.innerHTML = h; return t.firstElementChild; };
      var nw = B.html.map(mk), right = pgs[0], left = pgs[pgs.length - 1], fwd = true, hingeR, frontEl, backEl, swapOld, swapNew;
      if (c.sp) {
        if (dir === 'next') { hingeR = true; frontEl = left; backEl = nw[0]; swapOld = left; swapNew = nw[1] || null; }   // lift the left page; its back is the new right page; the new left page waits underneath
        else { hingeR = false; frontEl = right; backEl = nw[nw.length - 1]; swapOld = right; swapNew = nw[0]; }       // lift the right page; its back is the new left page; the new right page waits underneath
      } else if (dir === 'next') { hingeR = true; frontEl = right; backEl = null; swapOld = right; swapNew = nw[0]; }
      else { hingeR = true; frontEl = nw[0]; backEl = null; swapOld = null; swapNew = null; fwd = false; }              // the previous page comes back over the current one
      var ref = swapOld || right, R = { l: ref.offsetLeft, t: ref.offsetTop, w: ref.offsetWidth, h: ref.offsetHeight };
      var leaf = document.createElement('div'); leaf.className = 'mb-leaf ' + (hingeR ? 'hinge-r' : 'hinge-l'); leaf.style.cssText = 'left:' + R.l + 'px;top:' + R.t + 'px;width:' + R.w + 'px;height:' + R.h + 'px;transform-origin:' + (hingeR ? 'right' : 'left') + ' center';
      var face = function (cls, el) { var f = document.createElement('div'); f.className = 'mb-face ' + cls; if (el) { el.style.width = R.w + 'px'; el.style.minHeight = R.h + 'px'; f.appendChild(el); } else { var pa = document.createElement('div'); pa.className = 'mb-paper'; f.appendChild(pa); }
        var sh = document.createElement('i'); sh.className = 'mb-shade'; f.appendChild(sh); leaf.appendChild(f); return sh; };
      if (swapOld && swapNew) bk.replaceChild(swapNew, swapOld); else if (swapOld) swapOld.style.visibility = 'hidden';
      var shF = face('front', frontEl), shB = face('back', backEl);
      var castA = document.createElement('i'), castB = document.createElement('i'); castA.className = 'mb-cast ' + (hingeR ? 'from-r' : 'from-l'); castB.className = 'mb-cast ' + (hingeR ? 'from-l' : 'from-r');
      castA.style.cssText = 'left:' + R.l + 'px;top:' + R.t + 'px;width:' + R.w + 'px;height:' + R.h + 'px';
      var other = c.sp ? (dir === 'next' ? right : left) : null;
      if (other) castB.style.cssText = 'left:' + other.offsetLeft + 'px;top:' + other.offsetTop + 'px;width:' + other.offsetWidth + 'px;height:' + other.offsetHeight + 'px';
      var stage = document.createElement('div'); stage.className = 'mb-stage' + (c.sp ? '' : ' clip'); // one page: the turning page is clipped at the book edge (no sideways scroll)
      stage.appendChild(castA); if (other) stage.appendChild(castB); stage.appendChild(leaf); bk.appendChild(stage);
      bk.classList.add('turning'); document.documentElement.classList.add('mb-turning'); fitBook();
      var sgn = hingeR ? 1 : -1, lift = 26 * Math.min(fxK(), 1.5);
      var T = { q: q, dir: dir, fwd: fwd, a: fwd ? 0 : 180, raf: 0,
        set: function (a) { T.a = a; var r = a * Math.PI / 180, sn = Math.sin(r);
          leaf.style.transform = 'translateZ(' + (sn * lift).toFixed(1) + 'px) rotateY(' + (sgn * a).toFixed(2) + 'deg)';
          shF.style.opacity = (Math.min(a, 90) / 90 * .42).toFixed(3); shB.style.opacity = (Math.max(0, 180 - Math.max(a, 90)) / 90 * .38).toFixed(3);
          castA.style.opacity = (a < 90 ? sn * .55 : 0).toFixed(3); castB.style.opacity = (a > 90 ? sn * .55 : 0).toFixed(3); },
        clean: function () { cancelAnimationFrame(T.raf); bk.classList.remove('turning'); document.documentElement.classList.remove('mb-turning'); },
        undo: function () { T.clean(); if (swapOld && swapNew) { frontEl.style.width = ''; frontEl.style.minHeight = ''; bk.replaceChild(swapOld === frontEl ? frontEl : swapOld, swapNew); } if (swapOld) swapOld.style.visibility = ''; if (stage.parentNode) stage.parentNode.removeChild(stage); fitBook(); TURN = null; },
        done: function () { T.clean(); P = q; try { history.pushState(null, '', '?p=' + q); } catch (e) {} renderPage(true); } };
      T.set(T.a); return T;
    }); }
  function runTurn(T, to, ms, cb) { var from = T.a, t0 = performance.now();
    var f = function (now) { var x = Math.min(1, (now - t0) / ms), e = x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; T.set(from + (to - from) * e); if (x < 1) T.raf = requestAnimationFrame(f); else cb(); };
    T.raf = requestAnimationFrame(f); }
  function turnMs() { return Math.round(700 + 150 * Math.min(fxK(), 1.5)); }
  function goPage(q, dir) { if (q < 1 || q > 604 || TURN) return;
    var go = function () { P = q; try { history.pushState(null, '', '?p=' + q); } catch (e) { location.href = '?p=' + q; return; } renderPage(true); };
    if (noTurn() || q !== target(dir)) return go();
    var pr = setupTurn(dir); if (!pr) return go(); TURN = 'wait';
    pr.then(function (T) { if (!T) { TURN = null; return go(); } TURN = T; runTurn(T, T.fwd ? 180 : 0, turnMs(), T.done); }).catch(function () { TURN = null; go(); }); }
  addEventListener('popstate', function () { if (!pageMode) return; var p = parseInt(new URLSearchParams(location.search).get('p'), 10); if (p >= 1 && p <= 604 && p !== P) { if (TURN && TURN.undo) TURN.undo(); TURN = null; P = p; renderPage(true); } });
  // drag a page to turn it (mouse or finger): Arabic order — pull a page to the right for the next page, to the left for the previous one
  var DRAG = null, noClick = 0;
  document.addEventListener('pointerdown', function (e) {
    if (!pageMode || TURN || e.button || noTurn()) return; var pg = e.target.closest('.mbook > .mb-pg'); if (!pg || e.target.closest('.mb-sname,.mb-cart,.rq,button,a,input')) return;
    DRAG = { x: e.clientX, y: e.clientY, t: performance.now(), on: false, T: null, dir: null, w: pg.offsetWidth, id: e.pointerId, vx: 0, lx: e.clientX, lt: performance.now() }; });
  document.addEventListener('pointermove', function (e) { var D = DRAG; if (!D || e.pointerId !== D.id) return; var dx = e.clientX - D.x, dy = e.clientY - D.y, now = performance.now();
    D.vx = (e.clientX - D.lx) / Math.max(1, now - D.lt); D.lx = e.clientX; D.lt = now;
    if (!D.on) { if (Math.abs(dx) < 14 || Math.abs(dx) < Math.abs(dy) * 1.3) { if (Math.abs(dy) > 24) DRAG = null; return; }
      D.dir = dx > 0 ? 'next' : 'prev'; if (!target(D.dir)) { DRAG = null; return; } D.on = true; TURN = 'wait'; document.documentElement.classList.add('mb-drag'); try { getSelection().removeAllRanges(); } catch (x) {}
      var pr = setupTurn(D.dir); if (!pr) { TURN = null; DRAG = null; return; } pr.then(function (T) { if (!T) { TURN = null; return; } TURN = T; D.T = T; if (DRAG !== D) { T.undo(); } }); }
    D.p = Math.max(0, Math.min(1, (D.dir === 'next' ? dx : -dx) / (D.w * (curPg().sp ? 1.5 : 1.1))));
    if (D.T) D.T.set(D.T.fwd ? D.p * 180 : 180 - D.p * 180); });
  var dragEnd = function (e) { var D = DRAG; if (!D || (e && e.pointerId !== D.id)) return; DRAG = null; document.documentElement.classList.remove('mb-drag'); if (!D.on) return;
    noClick = performance.now();
    var finish = function (T) { var fast = (D.dir === 'next' ? D.vx : -D.vx) > .45, ok = (D.p || 0) > .3 || fast, end = T.fwd ? 180 : 0, start = T.fwd ? 0 : 180, ms = turnMs();
      if (ok) runTurn(T, end, Math.max(180, ms * Math.abs(end - T.a) / 180), T.done); else runTurn(T, start, Math.max(160, ms * .6 * Math.abs(start - T.a) / 180), T.undo); };
    if (D.T) finish(D.T); else { var w = setInterval(function () { if (D.T) { clearInterval(w); finish(D.T); } else if (TURN === null) clearInterval(w); }, 30); } };
  document.addEventListener('pointerup', dragEnd); document.addEventListener('pointercancel', dragEnd);
  document.addEventListener('click', function (e) { if (performance.now() - noClick < 350 && e.target.closest('.mbook')) { e.preventDefault(); e.stopPropagation(); } }, true);
  function renderPage(turned) {
    var pages = spreadPages(P), sp = pages.length > 1, p1 = pages[0]; n = idx.page[p1 - 1][0];
    buildPages(pages).then(function (B) {
      document.body.dataset.tj = B.tj;
      var kp = KEEP; KEEP = null; TURN = null;
      $('body').innerHTML = '<div class="mbook' + (sp ? ' spread' : '') + '" data-frame="' + esc(S.frame || 'classic') + '">' + B.html.join('') + '</div>';
      fitBook(); placeRq(); hold(kp);
      if (turned) { var bk = document.querySelector('.mbook'), top = bk ? bk.getBoundingClientRect().top + scrollY - 70 : 0; if (scrollY > top) scrollTo(0, Math.max(0, top)); }
      var st = idx.page[p1 - 1], last = pages[pages.length - 1], step = pages.length;
      $('bb-name').textContent = 'صفحة ' + arNum(p1) + (pages.length > 1 ? ' – ' + arNum(last) : '');
      var pr = $('prev'), nx = $('next'), pv = Math.max(1, p1 - step), nv = last + 1;
      pr.href = p1 > 1 ? '?p=' + pv : '#'; pr.classList.toggle('off', p1 === 1); pr.title = p1 > 1 ? 'Page ' + pv : '';
      nx.href = last < 604 ? '?p=' + nv : '#'; nx.classList.toggle('off', last >= 604); nx.title = last < 604 ? 'Page ' + nv : '';
      pr.onclick = function (e) { e.preventDefault(); if (p1 > 1) goPage(pv, 'prev'); };
      nx.onclick = function (e) { e.preventDefault(); if (last < 604) goPage(nv, 'next'); };
      document.title = 'Page ' + p1 + (pages.length > 1 ? '–' + last : '') + ' — SiraatOne';
      SO.set('so.last', { s: st[0], a: st[1] }); status(st[1], st[0]); ibShown(pages);
      if (document.fonts && document.fonts.ready) document.fonts.ready.then(rqSoon);
      prefetch();
    });
  }
  function render() {
    if (pageMode) { renderPage(); return; }
    var needW = S.mode === 'plus' || (S.mode === 'verse' && S.showWbw);
    var go = needW && !wbw ? SO.j('../assets/data/wbw/' + n + '.json').then(function (d) { wbw = d.w; }).catch(function () { wbw = false; }) : Promise.resolve();
    // word meanings in another language (scripts/fetch-wbw-langs.ps1); per ayah, used only if the word count matches, else English
    go = go.then(function () { if (!wbw || !needW) return; var L = S.wbwLang || 'en'; if (wbw.lang === L) return;
      var base = wbw.base || wbw.map(function (v) { return v.map(function (w) { return w[1]; }); });
      return (L === 'en' ? Promise.resolve(null) : SO.j('../assets/data/wbw-' + L + '/' + n + '.json').catch(function () { return null; })).then(function (d) {
        var t = d && d.t; wbw.forEach(function (v, i) { var g = t && t[i] && t[i].length === v.length ? t[i] : base[i]; v.forEach(function (w, j) { w[1] = g[j]; }); });
        wbw.base = base; wbw.lang = t ? L : 'en'; }); });
    go.then(function () {
      var c = ch[n - 1], h = '', mode = S.mode === 'plus' && !wbw ? 'verse' : S.mode;
      $('s-bism').innerHTML = BI ? fmt(noNum(BI), 1, 0, true) : '';
      document.body.dataset.mode = mode;
      if (mode === 'clean') {
        h = mpill(n, 1) + flowHtml(n, AR, 1, AR.length, function (a) { return String(a); });
      } else {
        var showAr = S.showAr || !S.showTr, showTr = S.showTr && mode !== 'clean';
        h = '<ol class="cards tl-' + (mode === 'plus' ? 'ayah' : S.tlay) + '">' + AR.map(function (a, i) {
          var k = n + ':' + (i + 1), top = '<div class="c-top">' + (S.nums ? '<span class="c-num">' + (i + 1) + '</span>' : '') + marks(k) + '<button type="button" class="more" data-a="' + (i + 1) + '" aria-label="Ayah ' + k + ' actions">•••</button></div>';
          var ar = mode === 'plus' || (mode === 'verse' && S.showWbw && wbw)
            ? '<div class="words" lang="ar" dir="rtl">' + (function () { var tw = tjWords(n, i, wbw[i].length); return wbw[i].map(function (w, j) { return '<span class="w" data-w="' + (j + 1) + '" data-wa="' + (i + 1) + '"><span class="wa' + (tw ? ' tjw' : '') + '">' + (tw ? tw[j] : esc(w[0])) + '</span><span class="wt" dir="' + (RTLW[wbw.lang] ? 'rtl' : 'ltr') + '">' + esc(w[1] || '') + '</span></span>'; }).join(''); })() + ownEnd(i) + '</div>'
            : '<p class="ar" lang="ar" dir="rtl">' + fmt(a, n, i) + (S.nums && !(S.tajweed && TJD[n] ? S.script !== 'naskh' : hasNum(a)) ? ' ' + end(i + 1) : '') + '</p>';
          var rq = rqOf(n, i + 1);
          return (i === 0 || jzStart(n, i + 1) ? '<li class="mpill-li">' + mpill(n, i + 1) + '</li>' : '') + (rq ? '<li class="rq-li" aria-hidden="true"><span class="rqc" lang="ar" dir="rtl"><b>\u06DE</b> ' + rqLabel(rq) + '</span></li>' : '') + '<li class="card-a" id="' + (i + 1) + '" data-a="' + (i + 1) + '"' + hl(k) + '>' + top + (showAr ? ar : '') + (showTr ? '<p class="tr"' + trAttr() + '>' + esc((TRT || sura.en)[i]) + '</p>' : '') + (S.tfInline && mode !== 'clean' ? '<div class="tf-inl" data-tf="' + (i + 1) + '"></div>' : '') + '</li>';
        }).join('') + '</ol>';
      }
      if (S.tfInline && mode !== 'clean') setTimeout(tfFill, 0);
      if (S.mode === 'plus' && wbw === false) h = '<p class="empty">Word-by-word is not available yet. Showing Verse List.</p>' + h;
      var kp = KEEP; KEEP = null;
      if (kp && kp.s && kp.s !== n) { location.replace('?n=' + kp.s + '#' + kp.a); return; } // was reading a later Surah of the continuous Mushaf
      $('body').innerHTML = kf(h); rqSoon();
      var t = kp ? kp.a : parseInt(location.hash.slice(1), 10);
      if (kp) hold(kp); else if (t > 1 && $(String(t))) jumpTo($(String(t))); else scrollTo(0, 0);
      SO.set('so.last', { s: n, a: t > 0 && t <= c.verses ? t : 1 }); ibShown([pageOf(n, t > 0 && t <= c.verses ? t : 1)]);
      tail = n; observe(); more();
    });
  }
  function marks(k) {
    return '<span class="marks">' + (SO.has('so.bm', k) ? '<i title="Bookmarked" class="m-bm"></i>' : '') + (SO.has('so.fav', k) ? '<i title="Favorite" class="m-fav"></i>' : '') + (SO.get('so.notes', {})[k] ? '<i title="Note" class="m-note"></i>' : '') + '</span>';
  }

  // ---------- last read + compact status ----------
  // S1_MY_IBADAH_QURAN_GOAL_V1: a Mushaf page counts once a day for My Ibadah's Quran goal after 15 s on it (pages only flipped past do not count)
  var ibT = null, ibP = '';
  function pageOf(s, a) { var L = idx && idx.page; if (!L) return 0; var lo = 0, hi = L.length - 1; while (lo < hi) { var m = (lo + hi + 1) >> 1; if (L[m][0] < s || (L[m][0] === s && L[m][1] <= a)) lo = m; else hi = m - 1; } return lo + 1; }
  function ibShown(ps) { var k = ps.join(','); if (k === ibP) return; ibP = k; clearTimeout(ibT); var st = SO.get('so.ib', null); if (!st || !(st.goal > 0) || !ps[0]) return;
    ibT = setTimeout(function () { if (ibP === k) ibDay(function (dk) { ibCount(ps, dk); }); }, 15000); }
  function ibDay(cb) { // the prayer day (before Fajr it is still yesterday), as My Ibadah shows it
    var L = SO.get('so.ploc', null), n = new Date(), K = function (d) { return d.getUTCFullYear() + '-' + (d.getUTCMonth() + 1) + '-' + d.getUTCDate(); };
    var go = function () { try { if (L && window.PT && PT.ok) { var y = PT.ymd(L, n), d = new Date(Date.UTC(y.year, y.month - 1, y.day)), pt = PT.times(PT.settings(), L, y.year, y.month, y.day); if (n < pt.fajr) d = new Date(d.getTime() - 864e5); return cb(K(d)); } } catch (e) {} cb(K(new Date(Date.UTC(n.getFullYear(), n.getMonth(), n.getDate())))); };
    if (!L || window.PT) return go();
    var add = function (src, next) { var e = document.createElement('script'); e.src = src; e.onload = next; e.onerror = go; document.head.appendChild(e); };
    add('../assets/js/vendor/adhan.umd.min.js?v=4.4.3', function () { add('../assets/js/prayer-core.js?v=20261127t', go); }); }
  function ibCount(ps, dk) { var st = SO.get('so.ib', null); if (!st || !(st.goal > 0)) return; st.days = st.days || {};
    Object.keys(st.days).forEach(function (o) { var r = st.days[o]; if (o !== dk && r && r.quranPages) { r = Object.assign({}, r); r.quranCount = String(r.quranPages.split(',').filter(Boolean).length); delete r.quranPages; st.days[o] = r; } });
    var r = Object.assign({}, st.days[dk]), set = (r.quranPages || '').split(',').filter(Boolean), ch = false;
    ps.forEach(function (p) { if (p >= 1 && p <= 604 && set.indexOf(String(p)) < 0) { set.push(String(p)); ch = true; } }); if (!ch) return;
    r.quranPages = set.join(','); if (set.length >= st.goal) r.quran = 'done'; st.days[dk] = r; SO.set('so.ib', st); }
  var io;
  function observe() {
    if (io) io.disconnect(); if (!('IntersectionObserver' in window)) return;
    io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (!e.isIntersecting || pageMode) return; var a = +e.target.getAttribute('data-a'), s = +e.target.getAttribute('data-s') || n; SO.set('so.last', { s: s, a: a }); status(a, s); ibShown([pageOf(s, a)]); });
    }, { rootMargin: '-90px 0px -70% 0px' });
    document.querySelectorAll('#body [data-a][id]').forEach(function (el) { io.observe(el); });
    status(1);
  }
  // Clean Mushaf + No Paging = one continuous Mushaf: the next sura is added below as you reach the end (no Next needed)
  var tail = 0, busy = false;
  function more() {
    if (busy || pageMode || S.mode !== 'clean' || !tail || tail >= 114) return;
    if (document.documentElement.scrollHeight - innerHeight - scrollY > 2500) return;
    var s = tail + 1; busy = true;
    Promise.all([getSura(s), getTj(s), bism ? null : getSura(1)]).then(function (x) {
      busy = false; if (tail !== s - 1 || S.mode !== 'clean') return;
      var d = x[0].ar, b1 = (x[2] || {}).ar ? x[2].ar[0] : BI, sec = document.createElement('section'); sec.className = 'sura-next'; sec.setAttribute('data-sura', s);
      sec.innerHTML = kf(mpill(s, 1) + frameHtml(s) + ibtn(s) + bismHtml(s, b1) + flowHtml(s, d, 1, d.length, function (a) { return 'a' + s + '_' + a; }));
      $('body').appendChild(sec); rqSoon(); tail = s; if (AUD.prep) AUD.prep(s);
      if (io) sec.querySelectorAll('[data-a]').forEach(function (el) { io.observe(el); });
      more();
    }).catch(function () { busy = false; });
  }
  addEventListener('scroll', function () { if (tail) more(); }, { passive: true });
  var visS = 0;
  function status(a, s) {
    if (s && s !== visS && !pageMode) { visS = s; if (S.nav !== 'juz') { $('bb-name').innerHTML = arNum(s) + ' - ' + SO.sname(s, ch[s - 1].name_arabic); navFor(s); } }
    s = s || n; var c = ch[s - 1], j = idx ? SO.pos(idx, s, a) : null;
    $('st-en').textContent = s + ' · ' + c.name_simple + (j ? ' · Juz ' + j.juz + ' · Page ' + j.page : '');
    $('st-ar').textContent = arNum(s) + ' · ' + c.name_arabic + (j ? ' · الجزء ' + arNum(j.juz) + ' · صفحة ' + arNum(j.page) : '');
  }

  // ---------- prev / next (by Surah or Juz) ----------
  // jump to the start of a sura / Juz: its info pill (and frame) sits just under the top pill; the toolbar stays shown
  try { history.scrollRestoration = 'manual'; } catch (e) {}
  var navLock = 0;
  function jumpTo(el) {
    var t = el.parentNode && el.parentNode.classList.contains('flow') && el === el.parentNode.firstElementChild ? el.parentNode : el, pv;
    while ((pv = t.previousElementSibling) && /(^| )(mpill|mpill-li|sura-head|bismillah)( |$)/.test(pv.className)) t = pv;
    navLock = Date.now() + 1200; $('bar').classList.remove('hid');
    if (t === $('body').firstElementChild && !pageMode) { scrollTo(0, 0); return; }
    // the site header may slide in/out after the jump, so place by where the top pill will settle
    var fix = function () { var hd = document.querySelector('.site-header'), st = $('status'),
      pillB = (document.body.classList.contains('hdr-hid') || !hd ? 8 : hd.offsetHeight + 16) + st.offsetHeight;
      scrollTo(0, Math.max(0, t.getBoundingClientRect().top + scrollY - pillB - 10)); };
    fix(); setTimeout(fix, 60); setTimeout(fix, 450);
  }
  function goSura(v, e) { if (v === n && !pageMode) { e.preventDefault(); navLock = Date.now() + 1200; scrollTo(0, 0); history.replaceState(null, '', '?n=' + n); return; } var sec = document.querySelector('.sura-next[data-sura="' + v + '"]'); if (!sec) return;
    e.preventDefault(); jumpTo(sec.firstElementChild); history.replaceState(null, '', '?n=' + v); status(1, v); }
  function navFor(v) { var p = $('prev'), x = $('next');
    p.onclick = function (e) { goSura(v - 1, e); }; x.onclick = function (e) { goSura(v + 1, e); };
    p.href = v > 1 ? '?n=' + (v - 1) : '#'; p.title = v > 1 ? ch[v - 2].name_simple : ''; p.classList.toggle('off', v === 1);
    x.href = v < 114 ? '?n=' + (v + 1) : '#'; x.title = v < 114 ? ch[v].name_simple : ''; x.classList.toggle('off', v === 114); }
  function navLinks() {
    if (pageMode) return;
    var p = $('prev'), x = $('next');
    p.onclick = x.onclick = null;
    if (S.nav === 'juz' && idx) { // Juz mode: the bar shows the Juz you are reading; arrows go to the previous / next Juz start
      p.href = x.href = '#'; p.title = 'Previous Juz'; x.title = 'Next Juz'; juzLabel();
      p.onclick = function (e) { e.preventDefault(); goJuz(-1); }; x.onclick = function (e) { e.preventDefault(); goJuz(1); };
    } else {
      var v = visS || n; $('bb-name').innerHTML = arNum(v) + ' - ' + SO.sname(v, ch[v - 1].name_arabic); navFor(v);
    }
  }

  function topAyah() { var els = $('body').querySelectorAll('.aya[data-a], .card-a[data-a]'); for (var i = 0; i < els.length; i++) if (els[i].getBoundingClientRect().bottom > 90) return [+els[i].getAttribute('data-s') || n, +els[i].getAttribute('data-a')]; return [n, 1]; }
  function curJuz() { var t = topAyah(); return SO.pos(idx, t[0], t[1]).juz; }
  function juzLabel() { if (pageMode || S.nav !== 'juz' || !idx) return; var j = curJuz(), t = 'الجزء ' + arNum(j);
    if ($('bb-name').textContent !== t) { $('bb-name').textContent = t; if (S.auto) asLay(); }
    $('prev').classList.toggle('off', j <= 1); $('next').classList.toggle('off', j >= 30); }
  function goJuz(d) {
    var j = curJuz() + d, t = idx.juz[j - 1]; if (!t) return;
    var el = elFor(t[0] + ':' + t[1]);
    if (el) { jumpTo(el); history.replaceState(null, '', '?n=' + t[0] + '#' + t[1]); status(t[1], t[0]); $('bar').classList.remove('hid'); juzLabel(); }
    else location.href = '?n=' + t[0] + '#' + t[1];
  }
  var jzT = null; addEventListener('scroll', function () { if (S.nav === 'juz' && !jzT) jzT = setTimeout(function () { jzT = null; juzLabel(); }, 200); }, { passive: true });

  // ---------- ayah action sheet ----------
  var cur = null;
  // WBW1 Clean Mushaf: tap a word to hear it (words are not separate elements there, so the tapped word is found from the tap point).
  // Tap the ayah number, or press and hold an ayah, for the ayah options.
  var LET = /[ء-يٮ-ۓۺ-ۿ-]/, lpT = null, lpDone = false;
  function tapClean() { return S.mode === 'clean' && S.tapWord; }
  function caretAt(x, y) { if (document.caretRangeFromPoint) return document.caretRangeFromPoint(x, y);
    var p = document.caretPositionFromPoint && document.caretPositionFromPoint(x, y); if (!p) return null; var r = document.createRange(); r.setStart(p.offsetNode, p.offset); return r; }
  function textRange(el, from, to) { var tw = document.createTreeWalker(el, NodeFilter.SHOW_TEXT), nd, pos = 0, r = document.createRange(), st = false;
    while ((nd = tw.nextNode())) { var L = nd.nodeValue.length;
      if (!st && from <= pos + L) { r.setStart(nd, from - pos); st = true; }
      if (st && to <= pos + L) { r.setEnd(nd, to - pos); return r; } pos += L; } return null; }
  function wordAt(aya, x, y) {
    var r = caretAt(x, y); if (!r || !aya.contains(r.startContainer)) return null;
    var el = r.startContainer.nodeType === 3 ? r.startContainer.parentNode : r.startContainer; if (el.closest && el.closest('.end, .end-own')) return null;
    var pre = document.createRange(); pre.setStart(aya, 0); pre.setEnd(r.startContainer, r.startOffset);
    var before = pre.toString(), full = aya.textContent, head = before.match(/\S*$/)[0], rest = full.slice(before.length).match(/^\S*/)[0], tok = head + rest;
    if (!LET.test(tok)) return null;
    var idx = (before.slice(0, before.length - head.length).split(/\s+/).filter(function (t) { return LET.test(t); })).length + 1, st = before.length - head.length;
    return { i: idx, r: textRange(aya, st, st + tok.length) };
  }
  function flashWord(r) { try { if (!r || !window.CSS || !CSS.highlights || !window.Highlight) return; CSS.highlights.set('so-word', new Highlight(r)); clearTimeout(flashWord.t); flashWord.t = setTimeout(function () { CSS.highlights.delete('so-word'); }, 900); } catch (e) {} }
  function openSheet(t) {
    cur = (t.getAttribute('data-s') || n) + ':' + t.getAttribute('data-a');
    $('sh-key').textContent = ch[+cur.split(':')[0] - 1].name_simple + ' ' + cur;
    $('sheet').querySelector('[data-a="bm"]').setAttribute('aria-pressed', SO.has('so.bm', cur));
    $('sheet').querySelector('[data-a="fav"]').setAttribute('aria-pressed', SO.has('so.fav', cur));
    $('sh-note').value = SO.get('so.notes', {})[cur] || '';
    var hc = SO.get('so.hl', {})[cur] || ''; document.querySelectorAll('#sh-hl button').forEach(function (b) { b.setAttribute('aria-pressed', b.getAttribute('data-c') === hc); });
    winShow($('sheet'));
  }
  $('body').addEventListener('pointerdown', function (e) {
    var a = e.target.closest('.aya'); lpDone = false; if (!a || !tapClean() || e.button) return; var x = e.clientX, y = e.clientY;
    var stop = function (ev) { if (ev && ev.type === 'pointermove' && Math.abs(ev.clientX - x) + Math.abs(ev.clientY - y) < 12) return; clearTimeout(lpT); ['pointerup', 'pointercancel', 'pointermove'].forEach(function (k) { removeEventListener(k, stop); }); };
    lpT = setTimeout(function () { lpDone = true; stop(); if (navigator.vibrate) navigator.vibrate(15); openSheet(a); }, 550);
    ['pointerup', 'pointercancel', 'pointermove'].forEach(function (k) { addEventListener(k, stop); });
  });
  $('body').addEventListener('contextmenu', function (e) { if (tapClean() && e.target.closest('.aya')) e.preventDefault(); });
  $('body').addEventListener('click', function (e) {
    if (lpDone) { lpDone = false; return; }
    var w = e.target.closest('.w');
    if (w && S.tapWord) { AUD.word(n, +w.getAttribute('data-wa'), +w.getAttribute('data-w')); return; }
    var t = e.target.closest('.more, .aya'); if (!t) return;
    if (tapClean() && t.classList.contains('aya')) { var hit = wordAt(t, e.clientX, e.clientY); if (hit) { flashWord(hit.r); AUD.word(+(t.getAttribute('data-s') || n), +t.getAttribute('data-a'), hit.i); return; } }
    openSheet(t);
  });
  $('sheet').addEventListener('click', function (e) {
    if (e.target === $('sheet') || e.target.closest('[data-close]')) { closeSheet(); return; }
    var sw = e.target.closest('#sh-hl button');
    if (sw) { var all = SO.get('so.hl', {}), c = sw.getAttribute('data-c');
      if (!c || all[cur] === c) delete all[cur]; else all[cur] = c; SO.set('so.hl', all); SO.stamp('hl', cur, !!all[cur], true); // recolouring keeps the first time
      var el = elFor(cur); if (el) { if (all[cur]) { el.style.setProperty('--hl', HL[all[cur]]); el.setAttribute('data-hl', all[cur]); } else { el.style.removeProperty('--hl'); el.removeAttribute('data-hl'); } }
      document.querySelectorAll('#sh-hl button').forEach(function (b) { b.setAttribute('aria-pressed', b.getAttribute('data-c') === (all[cur] || '')); }); return; }
    var b = e.target.closest('[data-a]'); if (!b) return;
    var a = b.getAttribute('data-a');
    if (a === 'tafsir' || a === 'trans') { var k0 = cur; closeSheet(); if (a === 'tafsir') openTafsir(k0); else showTrans(k0); return; }
    if (a === 'play') { var kp = cur.split(':'); closeSheet(); AUD.start(+kp[0], +kp[1]); return; }
    if (a === 'copy') {
      var ks = cur.split(':'), i = +ks[1] - 1;
      getSura(+ks[0]).then(function (d) { var txt = d.base[i] + '\n' + d.en[i] + '\n— ' + ch[+ks[0] - 1].name_simple + ' ' + cur;
      if (navigator.clipboard) navigator.clipboard.writeText(txt).then(function () { b.querySelector('span').textContent = 'Copied'; setTimeout(function () { b.querySelector('span').textContent = 'Copy'; }, 1200); }); });
      return;
    }
    var on = SO.toggle(a === 'bm' ? 'so.bm' : 'so.fav', cur); SO.stamp(a === 'bm' ? 'bm' : 'fav', cur, on); b.setAttribute('aria-pressed', on);
  });
  // windows (Settings, ayah menu, tafsir, translation, info, panel) open and close with a smooth slide
  // keep the reading position when a setting changes the layout or re-draws the page (no jump):
  // the first ayah at the top of the screen stays at the same place on the screen
  var KEEP = null;
  function anchor() { var els = document.querySelectorAll('#body [data-a][id]'), top = 120;
    for (var i = 0; i < els.length; i++) { var r = els[i].getBoundingClientRect(); if (r.bottom > top) return { s: +els[i].getAttribute('data-s') || (pageMode ? 0 : n), id: els[i].id, a: +els[i].getAttribute('data-a'), off: r.top }; }
    return null; }
  function restore(k) { var el = k && document.getElementById(k.id); if (el) scrollTo(0, Math.max(0, el.getBoundingClientRect().top + scrollY - k.off)); }
  function hold(k) { if (!k) return; restore(k); requestAnimationFrame(function () { restore(k); }); setTimeout(function () { restore(k); }, 150); }
  function winShow(el) { clearTimeout(el._ht); el.classList.remove('closing'); el.hidden = false; }
  function winHide(el) { if (el.hidden || el.classList.contains('closing')) return;
    if (document.documentElement.classList.contains('rm')) { el.hidden = true; return; }
    el.classList.add('closing'); el._ht = setTimeout(function () { el.hidden = true; el.classList.remove('closing'); }, 300); }
  function closeSheet() {
    var notes = SO.get('so.notes', {}), v = $('sh-note').value.trim();
    if (cur) { var was = notes[cur]; if (v) notes[cur] = v; else delete notes[cur]; SO.set('so.notes', notes);
      if (v && !was) SO.stamp('note', cur, true); else if (!v && was) SO.stamp('note', cur, false); else if (v && was && v !== was) SO.stamp('noteE', cur, true); } // saving the same text is not an edit
    winHide($('sheet'));
    var el = cur && elFor(cur); if (el) { var m = el.querySelector('.marks'); if (m) m.outerHTML = marks(cur); }
    cur = null;
  }

  // ---------- audio (same sources as the app: Quran Foundation ayah CDN + word audio) ----------
  var AUD = (function () {
    var el = new Audio(), nx = new Audio(), wordEl = new Audio(), q = [], qi = -1, playing = false, unlocked = false; el.preload = nx.preload = 'auto'; // GAP1: nx = next ayah, preloaded
    // official URLs from the Quran Foundation API (recitation 7 Alafasy, recitation 6 Husary)
    var BASE = { Alafasy: 'https://verses.quran.foundation/Alafasy/mp3/', Husary: 'https://mirrors.quranicaudio.com/everyayah/Husary_64kbps/' };
    var names = { Alafasy: 'Mishary Rashid Alafasy', Husary: 'Mahmoud Khalil Al-Hussary' };
    // full-surah reciters (MP3Quran.net, same filter as the app: Hafs, https, all 114 suras) from assets/data/reciters.json
    var REC = {}; function full() { return /^m:/.test(S.reciter) && REC[S.reciter]; }
    var url = function (s, a) { var r = full(); if (r) return r.server + ('00' + s).slice(-3) + '.mp3'; return (BASE[S.reciter] || BASE.Alafasy) + ('00' + s).slice(-3) + ('00' + a).slice(-3) + '.mp3'; };
    // GAPLESS1: Alafasy and Husary play the whole surah as one file (Quran Foundation / Quran.com audio) and follow the ayahs
    // with the official ayah start times saved in assets/data/timing/<reciter>/<n>.json (scripts/fetch-recitation-timings.ps1).
    // If a timing file or the surah audio cannot load, the player falls back to one file per ayah.
    var TM = {}, curT = null, tickT = null, bad = {};
    function timed() { return !full() && (S.reciter === 'Alafasy' || S.reciter === 'Husary') && !bad[S.reciter]; }
    function prep(sn) { if (!timed()) return; var k = S.reciter + '/' + sn; if (TM[k] !== undefined) return;
      TM[k] = null; SO.j('../assets/data/timing/' + k + '.json').then(function (d) { if (d && d.u && d.t && d.t.length) TM[k] = d; }).catch(function () {}); }
    function tget(sn) { return timed() ? TM[S.reciter + '/' + sn] || null : null; }
    function tick() {
      if (qi < 0 || !curT || !playing || !q[qi]) return; var it = q[qi], a = it[1], ms = el.currentTime * 1000, nxt = a < curT.t.length ? curT.t[a] : Infinity;
      if (ms < nxt - 40) return;
      if (S.repeat === 'ayah') { el.currentTime = (a === 1 ? 0 : curT.t[a - 1]) / 1000; return; }
      var nk = q[qi + 1]; if (nk && nk[0] === it[0] && nk[1] === a + 1) { qi++; mark(true); ui(); SO.set('so.last', { s: it[0], a: a + 1 }); pre(); return; }
      if (a < curT.t.length) { el.pause(); onEnd(); }
    }
    SO.j('../assets/data/reciters.json').then(function (d) {
      d.reciters.forEach(function (r) { REC['m:' + r.id] = r; names['m:' + r.id] = r.name; });
      var sel = $('rec-full'); $('rec-box').hidden = false;
      sel.innerHTML += d.reciters.map(function (r) { return '<option value="m:' + r.id + '">' + esc(r.name + (d.reciters.filter(function (x) { return x.name === r.name; }).length > 1 ? ' — ' + r.moshaf : '')) + '</option>'; }).join('');
      sel.value = full() ? S.reciter : '';
      sel.onchange = function () { if (!this.value) return; S.reciter = this.value; save(); apply(false); if (qi >= 0) start(q[qi][0], q[qi][1] || 1); };
    }).catch(function () {});
    function queue(sn) { sn = sn || n; // PLAY1: queue for the sura being played (continuous Mushaf can show several suras)
      if (full()) { if (!pageMode) return [[sn, 0]]; var u = []; document.querySelectorAll('#body .aya').forEach(function (x) { if (u.indexOf(+x.dataset.s) < 0) u.push(+x.dataset.s); }); return u.map(function (s) { return [s, 0]; }); }
      if (pageMode) return Array.prototype.map.call(document.querySelectorAll('#body .aya'), function (x) { return [+x.dataset.s, +x.dataset.a]; });
      var out = []; for (var a = 1; a <= ch[sn - 1].verses; a++) out.push([sn, a]); return out;
    }
    function mark(on) {
      document.querySelectorAll('.playing').forEach(function (x) { x.classList.remove('playing'); });
      if (!on || qi < 0 || !q[qi][1]) return; var it = q[qi], x = elFor(it[0] + ':' + it[1]);
      if (x) { x.classList.add('playing'); if (S.follow) x.scrollIntoView({ block: 'center', behavior: 'smooth' }); }
    }
    function ui() {
      $('abar').hidden = qi < 0; document.body.classList.toggle('audio-on', qi >= 0);
      if (qi < 0) return; var it = q[qi];
      $('ab-key').textContent = ch[it[0] - 1].name_simple + (it[1] ? ' ' + it[0] + ':' + it[1] : ' · full surah'); $('ab-rec').textContent = names[S.reciter] || S.reciter;
      $('ab-toggle').innerHTML = playing ? '<svg viewBox="0 0 24 24" class="fillico"><path d="M7 5h4v14H7zM13 5h4v14h-4z"/></svg>' : '<svg viewBox="0 0 24 24" class="fillico"><path d="M8 5.5v13l11-6.5z"/></svg>';
      $('ab-toggle').setAttribute('aria-label', playing ? 'Pause' : 'Play');
      $('ab-speed').textContent = S.rate + '×'; $('ab-repeat').textContent = 'Repeat: ' + S.repeat;
    }
    function play(i) {
      if (i < 0 || i >= q.length) return stop();
      var T = q[i][1] ? tget(q[i][0]) : null; prep(q[i][0]);
      if (T) return playT(i, T);
      curT = null; qi = i; var u = url(q[i][0], q[i][1]);
      if (nx.src === u && !nx.error) { var t = el; el = nx; nx = t; nx.pause(); } else { nx.pause(); el.src = u; } // GAP1: the preloaded next ayah starts at once
      try { el.currentTime = 0; } catch (e) {}
      el.playbackRate = S.rate; el.volume = S.vol;
      el.play().then(function () { playing = true; ui(); }).catch(function () { playing = false; ui(); });
      mark(true); ui(); if (q[i][1]) SO.set('so.last', { s: q[i][0], a: q[i][1] });
      pre();
    }
    function playT(i, T) {
      qi = i; curT = T; var it = q[i], from = it[1] === 1 ? 0 : T.t[it[1] - 1] / 1000;
      if (el.src === T.u && el.readyState > 0) { if (Math.abs(el.currentTime - from) > 0.25) el.currentTime = from; }
      else { if (nx.src === T.u && !nx.error) { var t = el; el = nx; nx = t; } else el.src = T.u; nx.pause();
        if (el.readyState > 0) el.currentTime = from; else if (from) { el._seek = from; } }
      el.playbackRate = S.rate; el.volume = S.vol;
      el.play().then(function () { playing = true; ui(); }).catch(function () { playing = false; ui(); });
      clearInterval(tickT); tickT = setInterval(tick, 100);
      mark(true); ui(); SO.set('so.last', { s: it[0], a: it[1] }); pre();
    }
    // GAP1: load the next ayah while this one plays, so there is no wait between ayahs
    function nextKey() { if (S.repeat === 'ayah' || !q[qi] || full()) return null; if (qi + 1 < q.length) return q[qi + 1]; if (S.repeat === 'surah') return q[0];
      var cs = q[qi][0]; return !pageMode && cs < 114 && elFor((cs + 1) + ':1') ? [cs + 1, 1] : null; }
    function pre() { var k = nextKey(); if (!k) return; var u;
      if (curT) { if (k[0] === q[qi][0] && S.repeat !== 'surah') { if (q[qi][1] < curT.t.length) return; } prep(k[0]); var T2 = tget(k[0]); if (!T2 || T2.u === el.src) return; u = T2.u; }
      else u = url(k[0], k[1]);
      if (nx.src !== u) { nx.src = u; try { nx.load(); } catch (e) {} } }
    var SIL = 'data:audio/mpeg;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjYwLjE2LjEwMAAAAAAAAAAAAAAA/+M4wAAAAAAAAAAAAEluZm8AAAAPAAAAAwAAAbAAqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq1dXV1dXV1dXV1dXV1dXV1dXV1dXV1dXV1dXV1dXV1dXV////////////////////////////////////////////AAAAAExhdmM2MC4zMQAAAAAAAAAAAAAAACQC8AAAAAAAAAGw9wruFgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA/+MYxAAAAANIAAAAAExBTUUzLjEwMFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV/+MYxDsAAANIAAAAAFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV/+MYxHYAAANIAAAAAFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV'; // 50 ms of silence, used once to allow the second player on iPhone
    function unlock() { if (unlocked) return; unlocked = true; if (!nx.src) nx.src = SIL; nx.muted = true; // iPhone: allow the second player once, during the tap
      var pr = nx.play(); if (pr && pr.then) pr.then(function () { nx.pause(); try { nx.currentTime = 0; } catch (e) {} nx.muted = false; }).catch(function () { nx.muted = false; }); else nx.muted = false; }
    function onEnd() {
      if (S.repeat === 'ayah') return play(qi);
      if (qi + 1 < q.length) return play(qi + 1);
      if (S.repeat === 'surah') return play(0);
      if (pageMode && pgLast() < 604) { location.href = '?p=' + (pgLast() + 1) + '&play=1'; return; }
      var cs = q[qi] ? q[qi][0] : n;
      if (!pageMode && cs < 114 && elFor((cs + 1) + ':1')) return start(cs + 1, 1); // next sura already on screen (continuous Mushaf)
      if (!pageMode && S.autoNext && cs < 114) { location.href = '?n=' + (cs + 1) + '&play=1'; return; }
      stop();
    }
    [el, nx].forEach(function (x) {
      x.addEventListener('ended', function () { if (x === el) onEnd(); });
      x.addEventListener('loadedmetadata', function () { if (x._seek) { try { x.currentTime = x._seek; } catch (e) {} x._seek = 0; } });
      x.addEventListener('error', function () { if (x !== el || qi < 0) return;
        if (curT) { bad[S.reciter] = true; curT = null; clearInterval(tickT); return play(qi); } // surah file failed: one file per ayah instead
        playing = false; ui(); $('ab-rec').textContent = 'Audio could not be loaded'; });
    });
    function start(s, a) { q = queue(pageMode ? 0 : s); var i = 0; q.forEach(function (it, k) { if (it[0] === s && (it[1] === a || !it[1])) i = k; }); play(i); unlock(); }
    function stop() { el.pause(); nx.pause(); clearInterval(tickT); curT = null; playing = false; qi = -1; mark(false); ui(); }
    function toggle() { if (qi < 0) { var t = topAyah(); return start(t[0], t[1]); } // PLAY1: start from the ayah you are reading
      if (playing) { el.pause(); playing = false; ui(); } else el.play().then(function () { playing = true; ui(); }).catch(function () {}); }
    function word(s, a, w) { wordEl.src = 'https://audio.qurancdn.com/wbw/' + [s, a, w].map(function (x) { return ('00' + x).slice(-3); }).join('_') + '.mp3'; wordEl.volume = S.vol; wordEl.play().catch(function () {}); }
    $('play').onclick = toggle; $('ab-toggle').onclick = toggle; $('ab-close').onclick = stop;
    $('ab-prev').onclick = function () { if (qi > 0) play(qi - 1); };
    $('ab-next').onclick = function () { if (qi + 1 < q.length) play(qi + 1); };
    $('ab-speed').onclick = function () { var R = [0.75, 1, 1.25, 1.5, 2, 0.5]; S.rate = R[(R.indexOf(S.rate) + 1) % R.length] || 1; el.playbackRate = S.rate; save(); apply(false); ui(); };
    $('ab-repeat').onclick = function () { var R = ['off', 'ayah', 'surah']; S.repeat = R[(R.indexOf(S.repeat) + 1) % 3]; save(); apply(false); ui(); };
    prep(n);
    return { start: start, stop: stop, toggle: toggle, word: word, prep: prep, live: function () { el.playbackRate = S.rate; el.volume = S.vol; ui(); }, auto: function () { if (qs.get('play') === '1') setTimeout(function () { start(pageMode ? idx.page[P - 1][0] : n, pageMode ? idx.page[P - 1][1] : 1); }, 300); } };
  })();
  function reloadText() { CACHE = {}; TJD = {}; loadScript().then(function () { apply(false); render(); }); }
  // switch between page-by-page and scrolling (different URLs)
  function route() {
    var want = S.mode === 'clean' && S.paging === 'page';
    if (!idx || want === pageMode) return false;
    switchPaging(want, anchor());
    return true;
  }
  // Continuous <-> Page by Page in place (no page reload): same ayah, Settings stay open
  function switchPaging(want, kp) {
    var to = kp && kp.s ? [kp.s, kp.a] : pageMode ? idx.page[P - 1] : [n, 1];
    if (AUD.stop) AUD.stop();
    pageMode = want; document.body.classList.toggle('pg-mode', pageMode);
    var nn = to[0];
    if (pageMode) { P = SO.pos(idx, to[0], to[1]).page; nn = idx.page[P - 1][0]; history.replaceState(null, '', '?p=' + P); }
    else history.replaceState(null, '', '?n=' + to[0] + '#' + to[1]);
    if (io) io.disconnect(); tail = 0; visS = 0; KEEP = null;
    var same = nn === n; n = nn; if (!same) wbw = null;
    (same ? Promise.resolve(null) : Promise.all([SO.j('../assets/data/sura/' + n + '.json'), n === 1 || n === 9 ? null : getSura(1)])).then(function (x) {
      if (x) { sura = x[0]; bism = x[1] ? x[1].base[0] : null; }
      head(); return loadScript();
    }).then(function () { apply(false); render(); if (pageMode) scrollTo(0, 0); })
      .catch(function () { location.href = pageMode ? '?p=' + P : '?n=' + to[0] + '#' + to[1]; }); // fallback: normal page load
  }
  document.addEventListener('keydown', function (e) {
    if (!pageMode || !$('settings').hidden || !$('sheet').hidden || /input|textarea/i.test(e.target.tagName)) return;
    var sp = document.querySelector('.mbook.spread'), p1 = sp ? (P % 2 ? P : P - 1) : P, step = sp ? 2 : 1;
    if (e.key === 'ArrowLeft' && p1 + step <= 604) goPage(p1 + step, 'next');   // Arabic page order: left = next
    if (e.key === 'ArrowRight' && p1 > 1) goPage(Math.max(1, p1 - step), 'prev');
  });
  var wasSpread = spreadOn(); addEventListener('resize', function () { if (pageMode && wasSpread !== spreadOn()) { KEEP = anchor(); render(); } wasSpread = spreadOn(); rqSoon(); });
  if (window.ResizeObserver) new ResizeObserver(function () { if (!document.querySelector('.mbook')) rqSoon(); else requestAnimationFrame(placeRq); }).observe($('body'));
  // ---------- settings modal ----------
  $('open-set').onclick = function () { winShow($('settings')); };
  $('settings').addEventListener('click', function (e) {
    if (e.target === $('settings') || e.target.closest('[data-close]')) { winHide($('settings')); return; }
    var tab = e.target.closest('[data-p]');
    if (tab) { var p = tab.getAttribute('data-p');
      document.querySelectorAll('.mtabs button').forEach(function (b) { b.setAttribute('aria-selected', b === tab); });
      document.querySelectorAll('[data-pane]').forEach(function (s) { s.hidden = s.getAttribute('data-pane') !== p; }); var mp = document.querySelector('#settings .mpanes'); if (mp) mp.scrollTop = 0; return; }
    var seg = e.target.closest('.seg button');
    if (seg) { var k = seg.parentNode.getAttribute('data-set'); S[k] = seg.getAttribute('data-v'); if (k === 'title') { S.header = S.title !== 'off'; S.deco = S.title === 'frame'; } save(); if (k === 'reciter' && $('rec-full')) $('rec-full').value = ''; if (route()) return; var kp = anchor(); if (k === 'script') { KEEP = kp; reloadText(); } else if (k === 'frame') { var bk = document.querySelector('.mbook'); if (bk) bk.setAttribute('data-frame', S.frame); apply(false); } else { var rr = k === 'mode' || k === 'tlay'; KEEP = rr ? kp : null; apply(rr); if (!rr) hold(kp); } return; }
    if (e.target.id === 'reset') { S = Object.assign({}, DEF); save(); if (!route()) { KEEP = anchor(); apply(true); } }
  });
  $('settings').addEventListener('input', function (e) {
    var k = e.target.getAttribute('data-set'); if (!k) return;
    S[k] = e.target.type === 'checkbox' ? e.target.checked : parseFloat(e.target.value); save();
    var kp = anchor();
    if (k === 'tajweed') { KEEP = kp; reloadText(); return; }
    if (k === 'showWbw') { KEEP = kp; apply(false); render(); return; } // word by word: Mushaf+ and Verse List
    if (k === 'rate' || k === 'vol') AUD.live();
    var rr = ['nums', 'showAr', 'showTr', 'legend', 'tfInline'].indexOf(k) > -1; KEEP = rr ? kp : null; apply(rr); if (!rr) hold(kp);
  });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') { if (!$('sheet').hidden) closeSheet(); winHide($('settings')); } });

  // ---------- behavior: hide toolbar, keep awake, auto scroll ----------
  var lastY = scrollY;
  addEventListener('scroll', function () {
    var y = scrollY, dy = y - lastY; if (asRun || Math.abs(dy) > 400 || Date.now() < navLock) { lastY = y; return; } if (Math.abs(dy) < 6) return; // jumps (opening a Juz / ayah link) never hide the toolbar // auto scroll handles the bar itself; ignore tiny moves: no flicker
    if (S.hide) $('bar').classList.toggle('hid', dy > 0 && y > 120); else $('bar').classList.remove('hid'); lastY = y;
  }, { passive: true });
  // tap an empty part of the page to show / hide the toolbar (like the app); taps on ayahs and words keep their own actions
  document.addEventListener('click', function (e) {
    if (!document.contains(e.target) || e.target.closest('.aya, .w, .more, .card-a, a, button, input, select, label, #bar, #settings, #sheet, .modal, #abar, .site-header')) return;
    $('bar').classList.toggle('hid'); if (asRun) asHide();
  });
  var lock = null;
  function wake() {
    if (S.awake && !lock && navigator.wakeLock) navigator.wakeLock.request('screen').then(function (l) { lock = l; l.addEventListener('release', function () { lock = null; }); }).catch(function () {});
    if (!S.awake && lock) { lock.release(); lock = null; }
  }
  document.addEventListener('visibilitychange', function () { if (document.visibilityState === 'visible') wake(); });
  // ---------- Auto scroll (advanced) ----------
  // Speed 1-20 = 6-120 pixels per second, time based (same speed on every screen), smooth sub-pixel steps.
  // Bottom-bar ↓ opens the control bar: play/pause, slower, faster, speed, time left, stop. Scrolling by hand pauses
  // (and resumes after 3 s if chosen). At the end it continues to the next surah / page if chosen. Screen kept awake while running.
  var raf = null, acc = 0, asRun = false, last = 0, resumeT = null, asLock = null, endT = null, hideT = null;
  // while running, the toolbar slides away after 3 s; tap the page to bring it back (it stays while you use it)
  function asHide() { clearTimeout(hideT); if (asRun && !$('bar').classList.contains('hid')) hideT = setTimeout(function () { if (asRun) $('bar').classList.add('hid'); }, 3000); }
  function pps() { return 6 + (Math.max(1, Math.min(20, +S.speed || 5)) - 1) * 6; }
  function atEnd() { return innerHeight + scrollY >= document.documentElement.scrollHeight - 4; }
  function eta() {
    if (!S.asEta) return '';
    var s2 = Math.max(0, (document.documentElement.scrollHeight - innerHeight - scrollY) / pps()), m = Math.floor(s2 / 60), r = Math.round(s2 % 60);
    return m ? m + ' min' + (r ? ' ' + r + ' s' : '') : r + ' s';
  }
  function asUi() {
    var bar = $('asbar'); bar.hidden = !S.auto; document.body.classList.toggle('as-on', !!S.auto); bar.classList.toggle('run', asRun);
    asLay();
    $('as-spd').textContent = S.speed; $('as-eta').textContent = asRun && S.asEta ? (eta() || '–') : 'speed';
    $('as-play').setAttribute('aria-label', asRun ? 'Pause' : 'Play'); $('as-slow').disabled = S.speed <= 1; $('as-fast').disabled = S.speed >= 20;
  }
  // place the controls in the free space between the sura name and settings; on narrow phones the arrows step aside
  // (their space stays, so the name does not move): − ▶ + on the right, speed and ✕ on the left
  function asLay() {
    var bar = $('bar'), a = $('asbar'), l = $('asl'), on = !!S.auto; l.hidden = true; document.body.classList.remove('as-split'); if (!on) return;
    var B = bar.getBoundingClientRect(), R = function (el) { return el.getBoundingClientRect(); };
    var nx = R($('next')), nm = R($('bb-name')), g = R($('open-set')), bk = R(bar.querySelector('a.bb-btn')), split = g.left - nx.right - 12 < 200;
    var L = (split ? nm.right : nx.right) + 6, w = g.left - 6 - L;
    a.style.left = (L - B.left) + 'px'; a.style.width = Math.max(0, w) + 'px';
    a.style.setProperty('--asm', Math.min(38, Math.floor(w * .38)) + 'px'); a.style.setProperty('--asb', Math.min(34, Math.floor((w - Math.min(38, w * .38) - 8) / 2)) + 'px');
    var info = bar.querySelector('.as-info'), x = $('as-close');
    if (split) { document.body.classList.add('as-split'); l.hidden = false; l.style.left = (bk.right + 6 - B.left) + 'px'; l.style.width = Math.max(0, nm.left - bk.right - 12) + 'px'; l.appendChild(info); l.appendChild(x); }
    else { a.appendChild(info); a.appendChild(x); }
  }
  addEventListener('resize', function () { if (S.auto) asLay(); }); if (document.fonts) document.fonts.ready.then(function () { if (S.auto) asLay(); });
  function holdAwake(on) { if (on && !asLock && navigator.wakeLock) navigator.wakeLock.request('screen').then(function (l) { asLock = l; }).catch(function () {}); if (!on && asLock) { asLock.release(); asLock = null; } }
  function finish() {
    asRun = false; asUi(); holdAwake(false); $('bar').classList.remove('hid');
    if (!S.asNext) return;
    endT = setTimeout(function () { try { sessionStorage.setItem('so.asgo', '1'); } catch (e) {}
      if (pageMode && pgLast() < 604) location.href = '?p=' + (pgLast() + 1); else if (!pageMode && n < 114) location.href = '?n=' + (n + 1); }, 1500);
  }
  function step(t) {
    var dt = last ? Math.min(100, t - last) / 1000 : 0; last = t;
    if (Math.abs(scrollY - acc) > 3) acc = scrollY; // start / resume from where the page is
    acc += pps() * dt; var dpr = devicePixelRatio || 1; scrollTo(0, Math.round(acc * dpr) / dpr); // sub-pixel steps: very smooth
    if (atEnd()) { raf = null; finish(); return; }
    if (S.asEta && (t | 0) % 500 < 20) $('as-eta').textContent = eta() || '–';
    raf = requestAnimationFrame(step);
  }
  function autoScroll() {
    if (S.auto && asRun && !raf) { last = 0; raf = requestAnimationFrame(step); holdAwake(true); }
    if ((!S.auto || !asRun) && raf) { cancelAnimationFrame(raf); raf = null; holdAwake(false); }
    asUi();
  }
  function asPlay(on) { acc = scrollY; clearTimeout(resumeT); clearTimeout(endT); clearTimeout(hideT); asRun = on === undefined ? !asRun : on; if (asRun && atEnd()) scrollTo(0, 0); if (!asRun) $('bar').classList.remove('hid'); autoScroll(); asHide(); }
  function asSpeed(d) { S.speed = Math.max(1, Math.min(20, (+S.speed || 5) + d)); save(); asUi(); var o = document.querySelector('[data-out="speed"]'); if (o) o.textContent = S.speed; var r = document.querySelector('[data-set="speed"]'); if (r) r.value = S.speed; }
  $('as-play').onclick = function () { asPlay(); };
  $('as-slow').onclick = function () { asSpeed(-1); asHide(); }; $('as-fast').onclick = function () { asSpeed(1); asHide(); };
  $('as-close').onclick = function () { asPlay(false); S.auto = false; save(); apply(false); }; // turns the whole feature off (same as the setting)
  // while it runs and the toolbar is away, the first tap anywhere only brings the toolbar back (does not open an ayah)
  document.addEventListener('click', function (e) { if (!asRun || !$('bar').classList.contains('hid') || !document.contains(e.target) || e.target.closest('#bar, #settings, #sheet, .modal, .site-header')) return;
    e.stopPropagation(); e.preventDefault(); $('bar').classList.remove('hid'); asHide(); }, true);
  $('bar').addEventListener('pointerdown', function () { clearTimeout(hideT); }); $('bar').addEventListener('pointerup', asHide);
  ['wheel', 'touchmove', 'keydown'].forEach(function (ev) { addEventListener(ev, function (e) {
    if (ev === 'keydown') { if (!S.auto || /INPUT|SELECT|TEXTAREA/.test(e.target.tagName) || !$('settings').hidden) return;
      if (e.key === 's' || e.key === 'S') { asPlay(); e.preventDefault(); return; }
      if (e.key === '+' || e.key === '=') { asSpeed(1); return; } if (e.key === '-') { asSpeed(-1); return; }
      if (e.key === 'Escape' && asRun) { asPlay(false); $('bar').classList.remove('hid'); return; }
      if (!/^(ArrowUp|ArrowDown|PageUp|PageDown|Home|End| )$/.test(e.key)) return; }
    if (!asRun || (e.target.closest && e.target.closest('#bar, #settings'))) return;
    asPlay(false); $('bar').classList.remove('hid'); if (S.asResume) resumeT = setTimeout(function () { asPlay(true); }, 3000); // reading by hand pauses it and shows the toolbar
  }, { passive: ev !== 'keydown' }); });
  // started from the previous surah / page: keep going
  (function () { var go = null; try { go = sessionStorage.getItem('so.asgo'); sessionStorage.removeItem('so.asgo'); } catch (e) {} if (go && S.auto) setTimeout(function () { asPlay(true); }, 1200); })();

  // ---------- Tafsir (same source as the app: spa5k/tafsir_api via jsDelivr), loaded when asked, shown unchanged ----------
  var TFB = 'https://cdn.jsdelivr.net/gh/spa5k/tafsir_api@main/tafsir/', TFL = null, tfKey = null;
  function fj(u) { return fetch(u).then(function (r) { if (!r.ok) throw 0; return r.json(); }); } // not cached: a failed load can be retried
  function tfShow() {
    var slug = $('tf-pick').value, p = tfKey.split(':'), box = $('tf-text'); SO.set('so.tafsir', slug);
    box.textContent = 'Loading…'; box.removeAttribute('dir');
    fj(TFB + slug + '/' + p[0] + '/' + p[1] + '.json').then(function (d) {
      var t = (d && d.text || '').trim();
      if (!t) { box.textContent = 'This tafsir has no separate text for this ayah (it may be explained together with nearby ayahs).'; return; }
      box.textContent = t; if (/[\u0590-\u08FF]/.test(t.slice(0, 80))) box.setAttribute('dir', 'rtl');
    }).catch(function () { box.textContent = 'The tafsir could not be loaded. Please check your connection and try again.'; });
  }
  function tfList() {
    if (TFL) return Promise.resolve(TFL);
    return fj(TFB + 'editions.json').then(function (d) {
      TFL = (Array.isArray(d) ? d : d.editions || []).filter(function (e) { return e && e.slug; });
      TFL.sort(function (a, b) { return a.language_name === b.language_name ? (a.name < b.name ? -1 : 1) : a.language_name === 'english' ? -1 : b.language_name === 'english' ? 1 : a.language_name < b.language_name ? -1 : 1; });
      var cap = function (w) { return String(w || '').replace(/(^|[ -])\w/g, function (m) { return m.toUpperCase(); }); };
      var opts = TFL.map(function (e) { return '<option value="' + esc(e.slug) + '">' + esc(cap(e.language_name) + ' — ' + e.name + (e.author_name ? ' (' + e.author_name + ')' : '')) + '</option>'; }).join('');
      $('tf-pick').innerHTML = opts; $('set-tf').innerHTML = opts;
      var sv = SO.get('so.tafsir', null); if (sv && TFL.some(function (e) { return e.slug === sv; })) { $('tf-pick').value = sv; $('set-tf').value = sv; }
      return TFL;
    });
  }
  $('open-set').addEventListener('click', function () { tfList().catch(function () { $('set-tf').innerHTML = '<option value="">Could not load — check your connection</option>'; }); });
  $('set-tf').onchange = function () { if (this.value) { SO.set('so.tafsir', this.value); $('tf-pick').value = this.value; } };
  function openTafsir(k) {
    tfKey = k; $('tf-key').textContent = k; winShow($('tafsir'));
    $('tf-text').textContent = 'Loading…';
    tfList().then(function () { $('tf-pick').onchange = function () { $('set-tf').value = this.value; tfShow(); }; tfShow(); })
      .catch(function () { $('tf-text').textContent = 'The tafsir list could not be loaded. Please check your connection and try again.'; });
  }
  $('tafsir').addEventListener('click', function (e) { if (e.target === $('tafsir') || e.target.closest('[data-close]')) winHide($('tafsir')); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') $('tafsir').hidden = true; });

  // ---------- Backup: export / import everything this site saved in this browser ----------
  function bkKeys() { var out = []; try { for (var i = 0; i < localStorage.length; i++) { var k = localStorage.key(i); if (k.indexOf('so.') === 0 || k === 'theme' || k === 'rm' || k === 'fx') out.push(k); } } catch (e) {} return out; }
  $('bk-export').onclick = function () {
    var data = {}; bkKeys().forEach(function (k) { data[k] = localStorage.getItem(k); });
    var blob = new Blob([JSON.stringify({ app: 'siraatone.com', version: 1, created: new Date().toISOString(), data: data }, null, 1)], { type: 'application/json' });
    var a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'siraatone-backup-' + new Date().toISOString().slice(0, 10) + '.json';
    document.body.appendChild(a); a.click(); setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 500);
    $('bk-msg').textContent = 'Backup saved (' + Object.keys(data).length + ' items).';
  };
  // Restore default settings (as the app): settings only; bookmarks, favorites, highlights, notes, saved items, tasbih counts, location and language stay
  $('bk-defaults').onclick = function () {
    var T = window.SOI18N ? SOI18N.t : function (x) { return x; };
    if (!confirm(T('Restore default settings? Bookmarks, favorites, highlights, notes, saved items, tasbih counts, location and language are kept.'))) return;
    ['so.rs', 'so.pt', 'so.dopt', 'so.hopt', 'so.nm', 'so.svopt', 'so.sl', 'so.tafsir', 'so.qa', 'so.cal2', 'theme', 'rm', 'fx'].forEach(function (k) { try { localStorage.removeItem(k); } catch (e) {} });
    location.reload(); };
  $('bk-file').onchange = function () {
    var f = this.files[0]; this.value = ''; if (!f) return;
    var r = new FileReader();
    r.onload = function () {
      var b; try { b = JSON.parse(r.result); } catch (e) { b = null; }
      if (!b || b.app !== 'siraatone.com' || !b.data || typeof b.data !== 'object') { $('bk-msg').textContent = 'This is not a SiraatOne website backup file. Nothing was changed.'; return; }
      var ks = Object.keys(b.data).filter(function (k) { return (k.indexOf('so.') === 0 || k === 'theme' || k === 'rm' || k === 'fx') && typeof b.data[k] === 'string'; });
      if (!confirm('Replace the data in this browser with this backup (' + ks.length + ' items)?')) return;
      try { bkKeys().forEach(function (k) { localStorage.removeItem(k); }); ks.forEach(function (k) { localStorage.setItem(k, b.data[k]); }); } catch (e) { $('bk-msg').textContent = 'Could not restore: browser storage is not available.'; return; }
      location.reload();
    };
    r.readAsText(f);
  };

  // ---------- Surah information (i button): name, meaning, details, translation, Tajweed colour key ----------
  // Same content as the app (quran_surah_info.dart): curated overview for 1-2 (copied unchanged), structural overview for the rest
  // built only from the app's verified metadata (assets/data/surah-info.json, scripts/export-surah-info.ps1).
  var CUR = {"1": {"meaning": "The Opening", "revelationPlace": "Makkah", "nameNote": "Al-Fatihah means “The Opening.” It opens the Quran and gathers central themes of praise, worship, reliance on Allah, and guidance.", "summary": "A concise prayer of praise and worship that affirms reliance on Allah and asks Him for guidance to the Straight Path.", "sourceLabel": "Curated SiraatOne overview; chapter metadata verified against Quran Foundation and the installed full-Quran metadata."}, "2": {"meaning": "The Cow", "revelationPlace": "Madinah", "nameNote": "Al-Baqarah is named after the story of the cow mentioned in verses 67–73. The name does not mean the Surah is only about that story.", "summary": "A Madinan Surah centered on divine guidance. It addresses faith, worship, community life and law, lessons from Bani Isra’il, and the responsibilities of a believing community.", "sourceLabel": "Curated SiraatOne overview; chapter metadata verified against Quran Foundation and the installed full-Quran metadata."}};
  // INFO2: every surah shown on the page has its own i button (continuous Mushaf and Mushaf pages), not only the first one
  function ibtn(s) { return '<div class="info-row"><button type="button" class="info-btn" data-sinfo="' + s + '" aria-label="Surah information">i</button></div>'; }
  // Quick Summary in the page language (the app's files surah_summary_{lang}.json, S1_SURAH_SUMMARY_9_LANGUAGES_V1); English fallback.
  var QSL = SO_QSL(), QS_TOPIC = { en: 'Topic:', ar: 'الموضوع:', ur: 'موضوع:', fa: 'موضوع:', tr: 'Konu:', id: 'Topik:', ms: 'Topik:', bn: 'বিষয়:', fr: 'Thème :', es: 'Tema:' },
    QS_SRC = { en: 'Quick Summary from SiraatOne.', ar: 'الملخص السريع من SiraatOne. نصوص الآيات من Quran.com.', ur: 'فوری خلاصہ: SiraatOne۔ آیات کا ترجمہ: QuranEnc.com۔', fa: 'خلاصهٔ سریع از SiraatOne. ترجمهٔ آیات: QuranEnc.com.',
      tr: 'Kısa Özet: SiraatOne. Âyet mealleri: QuranEnc.com.', id: 'Ringkasan Singkat dari SiraatOne. Kutipan ayat: QuranEnc.com.', ms: 'Ringkasan Ringkas daripada SiraatOne. Petikan ayat: QuranEnc.com.',
      bn: 'সংক্ষিপ্ত সারাংশ: SiraatOne। আয়াতের অনুবাদ: QuranEnc.com।', fr: 'Résumé rapide : SiraatOne. Citations coraniques : QuranEnc.com.', es: 'Resumen rápido de SiraatOne. Citas coránicas: QuranEnc.com.' };
  function SO_QSL() { var l = (window.SOI18N && SOI18N.lang) || 'en'; return ['ar', 'ur', 'fa', 'tr', 'id', 'ms', 'bn', 'fr', 'es'].indexOf(l) > -1 ? l : 'en'; }
  function qsum() { var en = function () { return SO.j('../assets/data/surah-summary.json').catch(function () { return null; }); };
    return QSL === 'en' ? en() : SO.j('../assets/data/surah-summary-' + QSL + '.json?v=20261111').catch(function () { QSL = 'en'; return en(); }); }
  // S1_SURAH_INFO_READER_V1: the whole window in one of the 10 languages (A− · language · A+), only sourced text; size remembered
  var SIL = null, SIX = null;
  function openInfo(n, lang) {
    var site = (window.SOI18N && SOI18N.lang) || 'en', L0 = ['en', 'ar', 'ur', 'fa', 'tr', 'id', 'ms', 'bn', 'fr', 'es'];
    var L = lang || SIL || (L0.indexOf(site) > -1 ? site : 'en'); SIL = L;
    var sumF = function (l) { return SO.j('../assets/data/surah-summary' + (l === 'en' ? '' : '-' + l) + '.json' + (l === 'en' ? '' : '?v=20261111')).catch(function () { return null; }); };
    Promise.all([SO.j('../assets/data/surah-info.json'), sumF(L), L === 'en' ? null : sumF('en'), SIX || SO.j('../assets/data/surah-info-i18n.json?v=20261128a')]).then(function (r) {
      var d = r[0], X = SIX = r[3], m = d.surahs[n - 1]; if (!m || m.number !== n) throw 0;
      var U = Object.assign({}, X.ui.en, X.ui[L] || {}), T = X.text[L], rtl = /^(ar|ur|fa)$/.test(L);
      var q = r[1] && r[1].s && r[1].s[n - 1], qL = L, fellBack = false;
      if (!q && L !== 'en' && r[2] && r[2].s && r[2].s[n - 1]) { q = r[2].s[n - 1]; qL = 'en'; fellBack = true; }
      var rt = (m.revelation_type || '').trim().toLowerCase(), place = ['makkah', 'mecca', 'makki', 'meccan'].indexOf(rt) > -1 ? 'Makkah' : ['madinah', 'medina', 'madani', 'medinan'].indexOf(rt) > -1 ? 'Madinah' : (rt ? rt[0].toUpperCase() + rt.slice(1) : 'Not specified');
      var pk = place === 'Makkah' ? 'makkah' : place === 'Madinah' ? 'madinah' : null;
      var mean = (m.meaning_en || '').trim() || m.name_en, cu = CUR[n];
      // name and meaning in the chosen language (Arabic-script languages: the official Arabic name; Persian: QuranEnc names)
      var dname = L === 'fa' ? X.faNames[n - 1] : /^(ar|ur)$/.test(L) ? m.name_ar : m.name_en;
      var dmean = L === 'ar' ? '' : L === 'fa' ? X.faMeanings[n - 1] : X.meanings[L] ? X.meanings[L][n - 1] : (cu ? cu.meaning : mean);
      var pages = m.page_start === m.page_end ? String(m.page_start) : m.page_start + '–' + m.page_end, juz = m.juz_start === m.juz_end ? String(m.juz_start) : m.juz_start + '–' + m.juz_end;
      var fill = function (k, o) { var v = T[k]; for (var x in o) v = v.split('{' + x + '}').join(o[x]); return v.replace('..', '.'); };
      var note, sum, src;
      if (T) { note = fill('nameNote', { name: dname, meaning: dmean });
        sum = [fill('summary', { name: dname, place: pk ? T[pk + 'Kind'] : '', ayahs: m.ayah_count }).replace('  ', ' '), fill('location', { pages: pages, juz: juz })].concat(m.revelation_order > 0 ? [fill('order', { order: m.revelation_order })] : []).concat(m.ruku_count > 0 ? [fill('ruku', { count: m.ruku_count })] : []).join(' ');
        src = T.source; }
      else { note = cu ? cu.nameNote : m.name_en + ' is commonly rendered in English as “' + mean + '.” This title information comes from the installed full-Quran chapter metadata.';
        sum = cu ? cu.summary : 'Surah ' + m.name_en + ' is a ' + place + ' chapter with ' + m.ayah_count + ' Ayahs, spanning ' + (m.page_start === m.page_end ? 'page ' : 'pages ') + pages + ' and Juz ' + juz + '.' + (m.revelation_order > 0 ? ' Its recorded revelation order is ' + m.revelation_order + '.' : '') + (m.ruku_count > 0 ? ' It contains ' + m.ruku_count + ' ' + (m.ruku_count === 1 ? 'Ruku' : 'Rukus') + '.' : '');
        src = cu ? cu.sourceLabel : 'Structural overview generated only from the verified installed full-Quran metadata. It is not presented as Tafsir or as an AI-generated thematic interpretation.'; }
      var plc = T && pk ? T[pk + 'Place'] : (cu ? cu.revelationPlace : place);
      var rows = [[U.revealed, plc], [U.ayahs, m.ayah_count], [U.pages, pages], [U.juz, juz]];
      if (m.revelation_order > 0) rows.push([U.order, m.revelation_order]);
      if (m.ruku_count > 0) rows.push([U.rukus, m.ruku_count]);
      var sz = +SO.get('so.siSize', 0) || 0;
      var bar = '<div class="si-bar" translate="no"><button type="button" class="icon-btn sm" data-si-size="-1" title="' + esc(U.smaller) + '" aria-label="' + esc(U.smaller) + '"' + (sz <= 0 ? ' disabled' : '') + '>A−</button>' +
        '<label class="si-lang" title="' + esc(U.language) + '"><span aria-hidden="true">🌐</span><select data-si-lang aria-label="' + esc(U.language) + '">' + L0.map(function (k) { return '<option value="' + k + '"' + (k === L ? ' selected' : '') + '>' + esc(X.names[k]) + '</option>'; }).join('') + '</select></label>' +
        '<button type="button" class="icon-btn sm" data-si-size="1" title="' + esc(U.larger) + '" aria-label="' + esc(U.larger) + '"' + (sz >= 2 ? ' disabled' : '') + '>A+</button></div>';
      var qs = q ? '<h3>' + esc(U.quick) + '</h3><div class="si-qs" lang="' + qL + '" dir="' + (/^(ar|ur|fa)$/.test(qL) ? 'rtl' : 'ltr') + '">' + (fellBack ? '<p class="hint">' + esc(U.shownInEnglish) + '</p>' : '') + '<p><b>' + QS_TOPIC[qL] + '</b> ' + esc(q[0]) + '</p><p>' + esc(q[1]) + '</p><p class="hint">' + QS_SRC[qL] + '</p></div>'
        : '<h3>' + esc(U.overview) + '</h3><p>' + esc(sum) + '</p><p class="hint">' + esc(src) + '</p>';
      var h = bar + '<div class="si-doc" translate="no" lang="' + L + '" dir="' + (rtl ? 'rtl' : 'ltr') + '" style="--si-k:' + [1, 1.15, 1.3][sz] + '"><p class="si-ar" lang="ar" dir="rtl">' + SO.sname(n, esc(m.name_ar)) + '</p><h2 class="si-en"' + (/^(ar|ur|fa)$/.test(L) ? ' lang="ar"' : '') + '>' + esc(dname) + '</h2>' + (dmean ? '<p class="si-mean">' + esc(dmean) + '</p>' : '') +
        '<div class="si-stats">' + rows.map(function (r) { return '<div><small>' + esc(r[0]) + '</small><b>' + esc(String(r[1])) + '</b></div>'; }).join('') + '</div>' +
        '<h3>' + esc(U.about) + '</h3><p>' + esc(note) + '</p>' + qs + '</div>';
      h += '<h3>Tajweed colours</h3>' + (S.tajweed && S.legend && document.body.dataset.tj === '1' ? '<div class="tj-legend">' + LEG.map(function (l) { return '<span class="tj-' + l[0] + '">' + l[1] + '</span>'; }).join('') + '</div>' : '<p class="hint">Tajweed colouring is off. Turn it on in Settings → Text.</p>');
      h += '<p class="hint">' + esc($('src-tr').parentNode.textContent) + '</p>';
      $('si-title').textContent = ''; $('si-body').innerHTML = h; $('si-body').setAttribute('data-n', n); if ($('sinfo').hidden) winShow($('sinfo'));
    }).catch(function () { $('si-title').textContent = ''; $('si-body').innerHTML = '<p class="hint">Surah information could not be loaded. Please refresh.</p>'; winShow($('sinfo')); });
  }
  $('si-body').addEventListener('change', function (e) { if (e.target.matches('[data-si-lang]')) openInfo(+$('si-body').getAttribute('data-n'), e.target.value); });
  $('si-body').addEventListener('click', function (e) { var b = e.target.closest('[data-si-size]'); if (!b) return;
    var z = Math.max(0, Math.min(2, (+SO.get('so.siSize', 0) || 0) + +b.getAttribute('data-si-size'))); SO.set('so.siSize', z);
    var doc = $('si-body').querySelector('.si-doc'); if (doc) doc.style.setProperty('--si-k', [1, 1.15, 1.3][z]);
    $('si-body').querySelectorAll('[data-si-size]').forEach(function (x) { x.disabled = (+x.getAttribute('data-si-size') < 0 && z <= 0) || (+x.getAttribute('data-si-size') > 0 && z >= 2); }); });
  $('s-info').onclick = function () { openInfo(n); };
  document.addEventListener('click', function (e) { var b = e.target.closest('[data-sinfo]'); if (b) openInfo(+b.getAttribute('data-sinfo')); });
  $('sinfo').addEventListener('click', function (e) { if (e.target === $('sinfo') || e.target.closest('[data-close]')) winHide($('sinfo')); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') $('sinfo').hidden = true; });
  // volume in the audio bar (saved with reader settings)
  $('ab-vol').value = S.vol; $('ab-vol').oninput = function () { S.vol = +this.value; save(); AUD.live(); if ($('settings').querySelector('[data-set=vol]')) apply(false); };
  // Quran text size slider in the ayah popup
  $('sh-size').value = S.ar; $('sh-size').oninput = function () { S.ar = +this.value; save(); apply(false); };
  $('trans').addEventListener('click', function (e) { if (e.target === $('trans') || e.target.closest('[data-close]')) winHide($('trans')); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') $('trans').hidden = true; });
  // translation popup with its own Language / Translator lists (same setting as Settings > Text)
  var trKey = null;
  function showTrans(k) {
    trKey = k; var kt = k.split(':');
    getSura(+kt[0]).then(function (d) { var t = trInfo(), x = $('tr-text');
      $('tr-key').textContent = k; $('tr-name').textContent = t ? t.name : 'Saheeh International'; x.textContent = d.en[+kt[1] - 1] || '';
      if (t && t.dir === 'rtl') x.setAttribute('dir', 'rtl'); else x.removeAttribute('dir'); winShow($('trans')); });
  }
  $('tp-lang').onchange = function () { if (!TRM) return; var v = this.value, f = TRM.filter(function (x) { return x.lang === v; })[0]; S.trid = f.id; save(); trUI(); reloadText(); showTrans(trKey); };
  $('tp-id').onchange = function () { S.trid = +this.value; save(); trUI(); reloadText(); showTrans(trKey); };

  // ---------- Quick access panel (same as the app's side panel, quran_quick_access_overlay.dart) ----------
  // Sections: Surahs (default), Bookmarks, Highlights, Notes, Favorites; shortcuts 18, 36, 55, 67; search; current surah highlighted.
  var QS = 'surahs', QSH = [18, 36, 55, 67], QT = { bm: 'Bookmarks', hl: 'Highlights', notes: 'Notes', fav: 'Favorites' };
  function qpSaved(sec) {
    var keys = sec === 'bm' ? SO.get('so.bm', []) : sec === 'fav' ? SO.get('so.fav', []) : Object.keys(SO.get(sec === 'hl' ? 'so.hl' : 'so.notes', {}));
    var notes = SO.get('so.notes', {});
    keys = keys.filter(function (k) { return /^\d+:\d+$/.test(k); }).sort(function (a, b) { var x = a.split(':'), y = b.split(':'); return x[0] - y[0] || x[1] - y[1]; });
    var h = '<button type="button" class="btn btn-ghost sm qp-back" data-back>← Surahs</button><b class="qp-sec">' + QT[sec] + '</b>';
    if (!keys.length) return h + '<p class="hint qp-empty">Nothing saved yet.</p>';
    var TS = SO.get('so.ts', {}) || {}, kind = sec === 'notes' ? 'note' : sec;
    return h + keys.map(function (k) { var p = k.split(':'), j = idx ? SO.pos(idx, +p[0], +p[1]).juz : 0, w = SO.when(TS[kind + ':' + k]), sub = 'Ayah ' + p[1] + (j ? ' • Juz ' + j : '') + (sec === 'notes' && notes[k] ? ' • ' + notes[k] : '') + (w ? ' · ' + w : '');
      return '<a class="qp-row qp-saved" href="?n=' + p[0] + '#' + p[1] + '"><span class="qp-ar" lang="ar" dir="rtl">' + SO.sname(+p[0], esc(ch[p[0] - 1].name_arabic)) + '</span><small>' + esc(sub) + '</small></a>'; }).join('') +
      '<a class="btn btn-ghost sm qp-all" href="../saved/#' + { bm: 'bookmarks', hl: 'highlights', notes: 'notes', fav: 'favorites' }[sec] + '">View all saved</a>';
  }
  function qpRender() {
    document.querySelectorAll('.qp-icons [data-q]').forEach(function (b) { b.setAttribute('aria-pressed', b.dataset.q === QS); });
    $('qp-short').hidden = $('qp-q').hidden = QS !== 'surahs';
    if (QS !== 'surahs') { $('qp-list').innerHTML = qpSaved(QS); return; }
    var q = $('qp-q').value.trim().toLowerCase().replace(/[-'\s]/g, '');
    $('qp-list').innerHTML = ch.filter(function (c) { return !q || String(c.id) === q || (c.name_simple + c.meaning).toLowerCase().replace(/[-'\s]/g, '').indexOf(q) > -1 || c.name_arabic.indexOf($('qp-q').value.trim()) > -1; }).map(function (c) {
      return '<a class="qp-row' + (c.id === n ? ' cur' : '') + '" href="?n=' + c.id + '"><span class="qp-n">' + c.id + '</span><span class="qp-d"><b>' + esc(c.meaning) + '</b><small>' + c.verses + ' Ayahs</small></span><span class="qp-ar" lang="ar" dir="rtl">' + SO.sname(c.id, esc(c.name_arabic)) + '</span></a>';
    }).join('') || '<p class="hint qp-empty">No matching surah.</p>';
  }
  $('bb-name').onclick = function () {
    if (!ch) return; QS = 'surahs'; $('qp-q').value = '';
    $('qp-short').innerHTML = QSH.map(function (x) { return '<a href="?n=' + x + '">' + esc(ch[x - 1].name_simple) + '</a>'; }).join('');
    qpRender(); winShow($('qpanel'));
    var c = $('qp-list').querySelector('.cur'); if (c) c.scrollIntoView({ block: 'center' });
  };
  $('qpanel').addEventListener('click', function (e) {
    if (e.target === $('qpanel') || e.target.closest('[data-close]')) { winHide($('qpanel')); return; }
    var b = e.target.closest('[data-q]'); if (b) { QS = QS === b.dataset.q ? 'surahs' : b.dataset.q; qpRender(); return; }
    if (e.target.closest('[data-back]')) { QS = 'surahs'; qpRender(); return; }
    if (e.target.closest('a')) $('qpanel').hidden = true;
  });
  $('qp-q').oninput = qpRender;
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') $('qpanel').hidden = true; });
  // reopen Settings (same tab) after switching between page-by-page and scrolling
  (function () { var t = null; try { t = sessionStorage.getItem('so.reopen'); sessionStorage.removeItem('so.reopen'); } catch (e) {}
    if (!t) return; var m = $('settings'); m.classList.add('instant'); setTimeout(function () { m.classList.remove('instant'); }, 600); winShow(m); var b = document.querySelector('.mtabs [data-p="' + t + '"]'); if (b) b.click(); })();
  // tafsir under each ayah (app setting "show tafsir in translation"): the tafsir chosen in Settings > Text, whole surah in one file
  function tfFill() {
    var slug = SO.get('so.tafsir', null) || 'en-tafisr-ibn-kathir', boxes = document.querySelectorAll('.tf-inl'); if (!boxes.length) return;
    boxes.forEach(function (b) { b.textContent = 'Loading tafsir…'; });
    fj(TFB + slug + '/' + n + '.json').then(function (d) { var a = Array.isArray(d) ? d : (d.ayahs || []), by = {}; a.forEach(function (x) { by[x.ayah] = x.text; });
      boxes.forEach(function (b) { var t = (by[b.dataset.tf] || '').trim(); b.innerHTML = t ? '<p' + (/[\u0590-\u08FF]/.test(t.slice(0, 60)) ? ' dir="rtl"' : '') + '>' + esc(t) + '</p>' : ''; }); })
      .catch(function () { boxes.forEach(function (b) { b.textContent = 'Tafsir could not be loaded.'; }); });
  }
})();
