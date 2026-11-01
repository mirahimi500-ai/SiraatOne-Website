// Reader v2: Clean Mushaf / Mushaf+ (word-by-word) / Verse List, settings panel, status bar, bottom bar.
// Quran text only from assets/data (validated by scripts/*.ps1). Personal data stays in this browser.
(function () {
  var qs = new URLSearchParams(location.search), n = parseInt(qs.get('n'), 10), P = parseInt(qs.get('p'), 10);
  if (!(n >= 1) && P >= 1 && P <= 604) n = 1; // set from the page index below
  var $ = function (id) { return document.getElementById(id); }, esc = SO.esc, root = document.documentElement;
  if (!(n >= 1 && n <= 114)) { location.replace('../read/'); return; }
  var DEF = { mode: 'clean', script: 'uthmani', ar: 1.9, tr: 1, header: true, meaning: true, deco: true, bg: 'app', nav: 'surah', hide: true, compact: true, awake: false, auto: false, speed: 3, paging: 'scroll', tajweed: true, legend: true, reciter: 'Alafasy', repeat: 'off', autoNext: true, follow: true, tapWord: true, rate: 1, vol: 1, lh: 2.3, pad: 48, tlay: 'ayah', nums: true, numsRight: false, showAr: true, showTr: true, showWbw: true, trid: 20 };
  var S = Object.assign({}, DEF, SO.get('so.rs', {}));
  // one-time move to the new defaults (Nov 2026) for browsers that saved older settings
  if ((S.dv || 0) < 2) { S.mode = 'clean'; S.paging = 'scroll'; S.tajweed = true; S.script = 'uthmani'; S.reciter = 'Alafasy'; S.dv = 2; SO.set('so.rs', S); }
  S.bg = { cream: 'classic', sepia: 'sand', night: 'forest' }[S.bg] || S.bg; // old values -> app backgrounds
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
    var segs = TJ.parse(markup); if (!segs) return null;
    var uth = S.script === 'uthmani', out = '', endTxt = '';
    segs.forEach(function (g) {
      if (g.rule === 'endMarker') { endTxt = g.text.trim(); return; }
      var t = uth ? g.text.replace(/\u0672/g, '\u0670').replace(/\u06DF/g, '\u06E0') : g.text;
      var cls = g.rule && g.rule !== 'unknown' ? g.rule : null;
      out += cls ? '<span class="tj-' + cls + '">' + esc(t) + '</span>' : esc(t);
    });
    out = out.replace(/\s+$/, '');
    if (mark && endTxt && S.nums) out += ' ' + (S.script === 'naskh' ? '' : '<span class="tj-end">' + esc(endTxt) + '</span>');
    return out;
  }
  function fmt(a, s, i, noMark) {
    var m = S.tajweed && TJD[s] && TJD[s][i];
    // same single, exact repair as the app (known Quran Foundation markup defect at 32:3)
    if (m && s === 32 && i === 2) m = m.replace('<tajweed class=ham_wasl>ٱ</tajweed>فْتَرَ>ٮٰ</tajweed>هُ', '<tajweed class=ham_wasl>ٱ</tajweed>فْتَرَ<tajweed class=madda_normal>ٮٰ</tajweed>هُ');
    return (m && tjSource(m, !noMark)) || esc(a);
  }

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
  function elFor(k) { var p = k.split(':'); return document.getElementById(pageMode ? 'a' + p[0] + '_' + p[1] : p[1]); }
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
  function noNum(a) { return (a || '').replace(/\s*([\u06DD]?[\u0660-\u0669\u06F0-\u06F9]+|[\uE000-\uF8FF]+)\s*$/, ''); }
  function hasNum(a) { return /([\u0660-\u0669\u06F0-\u06F9]|[\uE000-\uF8FF])\s*$/.test(a || ''); }
  function end(i) { return '<span class="end">﴿' + arNum(i) + '﴾</span>'; }

  // ---------- apply settings ----------
  function apply(rerender) {
    root.style.setProperty('--ar-size', S.ar + 'rem'); root.style.setProperty('--tr-size', S.tr + 'rem'); root.style.setProperty('--lh', S.lh); root.style.setProperty('--pad', S.pad + 'px');
    document.body.classList.toggle('nums-right', !!S.numsRight); document.body.classList.toggle('no-wbw', !S.showWbw);
    document.body.dataset.bg = S.bg;
    $('head').hidden = !S.header; $('s-meta').hidden = !S.meaning;
    var useImg = S.header && S.deco, withB = useImg && !!bism;
    $('frame').classList.toggle('plain', !useImg); $('frame').classList.toggle('bism', withB);
    var im = $('frame-img'); im.hidden = !useImg;
    if (useImg) {
      var u = 'url(../assets/img/' + (withB ? 'frame-bism.png' : 'frame.png') + ')';
      var canMask = window.CSS && (CSS.supports('mask-image', u) || CSS.supports('-webkit-mask-image', u));
      // Show the frame only after its image has loaded; before that the coloured box would show as a dark block.
      im.classList.remove('ready');
      if (canMask) { im.classList.remove('raw'); var pre = new Image();
        pre.onload = function () { im.style.webkitMaskImage = u; im.style.maskImage = u; im.classList.add('ready'); };
        pre.src = u.slice(4, -1); }
      else { im.style.backgroundImage = u; im.classList.add('raw', 'ready'); } // old browsers: original colours
    }
    $('s-bism').hidden = !bism || withB;
    $('status').hidden = !S.compact; document.body.classList.toggle('has-status', S.compact);
    wake(); autoScroll();
    document.querySelectorAll('[data-set]').forEach(function (el) {
      var k = el.getAttribute('data-set');
      if (el.classList.contains('seg')) el.querySelectorAll('button').forEach(function (b) { b.setAttribute('aria-pressed', b.getAttribute('data-v') === String(S[k])); });
      else if (el.type === 'checkbox') el.checked = !!S[k];
      else el.value = S[k];
    });
    document.querySelectorAll('[data-out]').forEach(function (o) { var k = o.getAttribute('data-out'); o.textContent = k === 'rate' ? S.rate + '×' : k === 'vol' ? Math.round(S.vol * 100) + '%' : k === 'speed' ? S.speed : k === 'lh' ? (+S.lh).toFixed(1) : k === 'pad' ? S.pad + 'px' : Math.round(S[k] * 16); });
    if (ch) navLinks();
    if (rerender && sura) render();
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
      document.title = c.name_simple + ' — SiraatOne';
      $('s-ar').innerHTML = SO.sname(n, 'سورة ' + c.name_arabic);
      $('s-en').textContent = c.name_simple;
      var m = c.meaning + ' · ' + c.verses + ' ayahs · ' + (c.place === 'makkah' ? 'Makki' : 'Madani');
      if (idx) { var p = SO.pos(idx, n, 1); m += ' · Juz ' + p.juz + ' · Page ' + p.page; }
      $('s-meta').textContent = m;
      $('bb-name').innerHTML = arNum(n) + ' - ' + SO.sname(n, c.name_arabic);
      loadScript().then(function () { apply(false); render(); setTimeout(AUD.auto, 400); });
    })
    .catch(function (e) { if (e !== 'redirect') $('s-en').textContent = 'This sura could not be loaded. Please refresh.'; });

  var LEG = [['maddNormal', 'Madd — Normal'], ['qalqalah', 'Qalqalah'], ['ikhfa', 'Ikhfa'], ['idghamWithGhunnah', 'Idgham with Ghunnah'], ['iqlab', 'Iqlab'], ['ghunnah', 'Ghunnah']]; // labels from the app
  function legend() { return S.tajweed && S.legend && document.body.dataset.tj === '1' ? '<div class="tj-legend">' + LEG.map(function (l) { return '<span class="tj-' + l[0] + '">' + l[1] + '</span>'; }).join('') + '</div>' : ''; }
  function renderPage() {
    var st = idx.page[P - 1], en = idx.page[P] || null, segs = [];
    for (var s = st[0]; s <= (en ? (en[1] === 1 ? en[0] - 1 : en[0]) : 114); s++) {
      var a1 = s === st[0] ? st[1] : 1, a2 = en && s === en[0] ? en[1] - 1 : ch[s - 1].verses;
      if (a2 >= a1) segs.push([s, a1, a2]);
    }
    Promise.all(segs.map(function (g) { return getSura(g[0]); }).concat([getSura(1)]).concat(segs.map(function (g) { return getTj(g[0]); })).concat([getTj(1)])).then(function (all) {
      all = all.slice(0, segs.length + 1); document.body.dataset.tj = S.tajweed && TJD[segs[0][0]] ? '1' : '0';
      var b1 = all[all.length - 1].ar[0], h = '';
      segs.forEach(function (g, i) {
        var s = g[0], d = all[i];
        if (g[1] === 1) h += '<div class="pg-title">' + SO.sname(s, 'سورة ' + ch[s - 1].name_arabic) + '</div>' + (s !== 1 && s !== 9 ? '<p class="bismillah" lang="ar" dir="rtl">' + fmt(noNum(b1), 1, 0, true) + '</p>' : '');
        h += '<p class="flow" lang="ar" dir="rtl">';
        for (var a = g[1]; a <= g[2]; a++) h += '<span class="aya" id="a' + s + '_' + a + '" data-s="' + s + '" data-a="' + a + '"' + hl(s + ':' + a) + '>' + fmt(d.ar[a - 1], s, a - 1) + (S.nums && !(S.tajweed && TJD[s] ? S.script !== 'naskh' : hasNum(d.ar[a - 1])) ? ' ' + end(a) : '') + '</span> ';
        h += '</p>';
      });
      $('body').innerHTML = '<div class="mpage">' + h + '<div class="pg-num">' + arNum(P) + '</div></div>';
      $('bb-name').textContent = 'صفحة ' + arNum(P);
      var pr = $('prev'), nx = $('next');
      pr.href = P > 1 ? '?p=' + (P - 1) : '#'; pr.classList.toggle('off', P === 1); pr.title = P > 1 ? 'Page ' + (P - 1) : '';
      nx.href = P < 604 ? '?p=' + (P + 1) : '#'; nx.classList.toggle('off', P === 604); nx.title = P < 604 ? 'Page ' + (P + 1) : '';
      document.title = 'Page ' + P + ' — SiraatOne';
      SO.set('so.last', { s: st[0], a: st[1] }); status(st[1], st[0]);
    });
  }
  function render() {
    if (pageMode) { renderPage(); return; }
    var go = S.mode === 'plus' && !wbw ? SO.j('../assets/data/wbw/' + n + '.json').then(function (d) { wbw = d.w; }).catch(function () { wbw = false; }) : Promise.resolve();
    go.then(function () {
      var c = ch[n - 1], h = '', mode = S.mode === 'plus' && !wbw ? 'verse' : S.mode;
      $('s-bism').innerHTML = BI ? fmt(noNum(BI), 1, 0, true) : '';
      document.body.dataset.mode = mode;
      if (mode === 'clean') {
        h = '<p class="flow" lang="ar" dir="rtl">' + AR.map(function (a, i) {
          return '<span class="aya" id="' + (i + 1) + '" data-a="' + (i + 1) + '"' + hl(n + ':' + (i + 1)) + '>' + fmt(a, n, i) + (S.nums && !(S.tajweed && TJD[n] ? S.script !== 'naskh' : hasNum(a)) ? ' ' + end(i + 1) : '') + '</span>';
        }).join(' ') + '</p>';
      } else {
        var showAr = S.showAr || !S.showTr, showTr = S.showTr && mode !== 'clean';
        h = '<ol class="cards tl-' + (mode === 'plus' ? 'ayah' : S.tlay) + '">' + AR.map(function (a, i) {
          var k = n + ':' + (i + 1), top = '<div class="c-top">' + (S.nums ? '<span class="c-num">' + (i + 1) + '</span>' : '') + marks(k) + '<button type="button" class="more" data-a="' + (i + 1) + '" aria-label="Ayah ' + k + ' actions">•••</button></div>';
          var ar = mode === 'plus'
            ? '<div class="words" lang="ar" dir="rtl">' + wbw[i].map(function (w, j) { return '<span class="w" data-w="' + (j + 1) + '" data-wa="' + (i + 1) + '"><span class="wa">' + esc(w[0]) + '</span><span class="wt" dir="ltr">' + esc(w[1] || '') + '</span></span>'; }).join('') + end(i + 1) + '</div>'
            : '<p class="ar" lang="ar" dir="rtl">' + fmt(a, n, i) + (S.nums && !(S.tajweed && TJD[n] ? S.script !== 'naskh' : hasNum(a)) ? ' ' + end(i + 1) : '') + '</p>';
          return '<li class="card-a" id="' + (i + 1) + '" data-a="' + (i + 1) + '"' + hl(k) + '>' + top + (showAr ? ar : '') + (showTr ? '<p class="tr"' + trAttr() + '>' + esc((TRT || sura.en)[i]) + '</p>' : '') + '</li>';
        }).join('') + '</ol>';
      }
      if (S.mode === 'plus' && wbw === false) h = '<p class="empty">Word-by-word is not available yet. Showing Verse List.</p>' + h;
      $('body').innerHTML = h;
      var t = parseInt(location.hash.slice(1), 10);
      if (t > 1 && $(String(t))) $(String(t)).scrollIntoView();
      SO.set('so.last', { s: n, a: t > 0 && t <= c.verses ? t : 1 });
      observe();
    });
  }
  function marks(k) {
    return '<span class="marks">' + (SO.has('so.bm', k) ? '<i title="Bookmarked" class="m-bm"></i>' : '') + (SO.has('so.fav', k) ? '<i title="Favorite" class="m-fav"></i>' : '') + (SO.get('so.notes', {})[k] ? '<i title="Note" class="m-note"></i>' : '') + '</span>';
  }

  // ---------- last read + compact status ----------
  var io;
  function observe() {
    if (io) io.disconnect(); if (!('IntersectionObserver' in window)) return;
    io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (!e.isIntersecting || pageMode) return; var a = +e.target.getAttribute('data-a'); SO.set('so.last', { s: n, a: a }); status(a); });
    }, { rootMargin: '-90px 0px -70% 0px' });
    document.querySelectorAll('#body [data-a][id]').forEach(function (el) { io.observe(el); });
    status(1);
  }
  function status(a, s) {
    s = s || n; var c = ch[s - 1], j = idx ? SO.pos(idx, s, a) : null;
    $('st-en').textContent = s + '-' + c.name_simple + ' · ' + s + ':' + a + (j ? ' · Juz ' + j.juz + ' · Page ' + j.page : '');
    $('st-ar').textContent = arNum(s) + ' - ' + c.name_arabic + (j ? ' / الجزء ' + arNum(j.juz) : '');
  }

  // ---------- prev / next (by Surah or Juz) ----------
  function navLinks() {
    if (pageMode) return;
    var p = $('prev'), x = $('next');
    if (S.nav === 'juz' && idx) {
      var cur = SO.pos(idx, n, 1).juz, pj = idx.juz[cur - 2], nj = idx.juz[cur];
      p.href = pj ? '?n=' + pj[0] + '#' + pj[1] : '#'; p.title = pj ? 'Juz ' + (cur - 1) : ''; p.classList.toggle('off', !pj);
      x.href = nj ? '?n=' + nj[0] + '#' + nj[1] : '#'; x.title = nj ? 'Juz ' + (cur + 1) : ''; x.classList.toggle('off', !nj);
    } else {
      p.href = n > 1 ? '?n=' + (n - 1) : '#'; p.title = n > 1 ? ch[n - 2].name_simple : ''; p.classList.toggle('off', n === 1);
      x.href = n < 114 ? '?n=' + (n + 1) : '#'; x.title = n < 114 ? ch[n].name_simple : ''; x.classList.toggle('off', n === 114);
    }
  }

  // ---------- ayah action sheet ----------
  var cur = null;
  $('body').addEventListener('click', function (e) {
    var w = e.target.closest('.w');
    if (w && S.tapWord) { AUD.word(n, +w.getAttribute('data-wa'), +w.getAttribute('data-w')); return; }
    var t = e.target.closest('.more, .aya'); if (!t) return;
    cur = (t.getAttribute('data-s') || n) + ':' + t.getAttribute('data-a');
    $('sh-key').textContent = ch[+cur.split(':')[0] - 1].name_simple + ' ' + cur;
    $('sheet').querySelector('[data-a="bm"]').setAttribute('aria-pressed', SO.has('so.bm', cur));
    $('sheet').querySelector('[data-a="fav"]').setAttribute('aria-pressed', SO.has('so.fav', cur));
    $('sh-note').value = SO.get('so.notes', {})[cur] || '';
    var hc = SO.get('so.hl', {})[cur] || ''; document.querySelectorAll('#sh-hl button').forEach(function (b) { b.setAttribute('aria-pressed', b.getAttribute('data-c') === hc); });
    $('sheet').hidden = false;
  });
  $('sheet').addEventListener('click', function (e) {
    if (e.target === $('sheet') || e.target.closest('[data-close]')) { closeSheet(); return; }
    var sw = e.target.closest('#sh-hl button');
    if (sw) { var all = SO.get('so.hl', {}), c = sw.getAttribute('data-c');
      if (!c || all[cur] === c) delete all[cur]; else all[cur] = c; SO.set('so.hl', all);
      var el = elFor(cur); if (el) { if (all[cur]) { el.style.setProperty('--hl', HL[all[cur]]); el.setAttribute('data-hl', all[cur]); } else { el.style.removeProperty('--hl'); el.removeAttribute('data-hl'); } }
      document.querySelectorAll('#sh-hl button').forEach(function (b) { b.setAttribute('aria-pressed', b.getAttribute('data-c') === (all[cur] || '')); }); return; }
    var b = e.target.closest('[data-a]'); if (!b) return;
    var a = b.getAttribute('data-a');
    if (a === 'tafsir') { closeSheet(); openTafsir(cur); return; }
    if (a === 'play') { var kp = cur.split(':'); closeSheet(); AUD.start(+kp[0], +kp[1]); return; }
    if (a === 'copy') {
      var ks = cur.split(':'), i = +ks[1] - 1;
      getSura(+ks[0]).then(function (d) { var txt = d.base[i] + '\n' + d.en[i] + '\n— ' + ch[+ks[0] - 1].name_simple + ' ' + cur;
      if (navigator.clipboard) navigator.clipboard.writeText(txt).then(function () { b.querySelector('span').textContent = 'Copied'; setTimeout(function () { b.querySelector('span').textContent = 'Copy'; }, 1200); }); });
      return;
    }
    b.setAttribute('aria-pressed', SO.toggle(a === 'bm' ? 'so.bm' : 'so.fav', cur));
  });
  function closeSheet() {
    var notes = SO.get('so.notes', {}), v = $('sh-note').value.trim();
    if (cur) { if (v) notes[cur] = v; else delete notes[cur]; SO.set('so.notes', notes); }
    $('sheet').hidden = true;
    var el = cur && elFor(cur); if (el) { var m = el.querySelector('.marks'); if (m) m.outerHTML = marks(cur); }
    cur = null;
  }

  // ---------- audio (same sources as the app: Quran Foundation ayah CDN + word audio) ----------
  var AUD = (function () {
    var el = new Audio(), wordEl = new Audio(), q = [], qi = -1, playing = false;
    // official URLs from the Quran Foundation API (recitation 7 Alafasy, recitation 6 Husary)
    var BASE = { Alafasy: 'https://verses.quran.foundation/Alafasy/mp3/', Husary: 'https://mirrors.quranicaudio.com/everyayah/Husary_64kbps/' };
    var names = { Alafasy: 'Mishary Rashid Alafasy', Husary: 'Mahmoud Khalil Al-Hussary' };
    // full-surah reciters (MP3Quran.net, same filter as the app: Hafs, https, all 114 suras) from assets/data/reciters.json
    var REC = {}; function full() { return /^m:/.test(S.reciter) && REC[S.reciter]; }
    var url = function (s, a) { var r = full(); if (r) return r.server + ('00' + s).slice(-3) + '.mp3'; return (BASE[S.reciter] || BASE.Alafasy) + ('00' + s).slice(-3) + ('00' + a).slice(-3) + '.mp3'; };
    SO.j('../assets/data/reciters.json').then(function (d) {
      d.reciters.forEach(function (r) { REC['m:' + r.id] = r; names['m:' + r.id] = r.name; });
      var sel = $('rec-full'); $('rec-box').hidden = false;
      sel.innerHTML += d.reciters.map(function (r) { return '<option value="m:' + r.id + '">' + esc(r.name + (d.reciters.filter(function (x) { return x.name === r.name; }).length > 1 ? ' — ' + r.moshaf : '')) + '</option>'; }).join('');
      sel.value = full() ? S.reciter : '';
      sel.onchange = function () { if (!this.value) return; S.reciter = this.value; save(); apply(false); if (qi >= 0) start(q[qi][0], q[qi][1] || 1); };
    }).catch(function () {});
    function queue() {
      if (full()) { if (!pageMode) return [[n, 0]]; var u = []; document.querySelectorAll('#body .aya').forEach(function (x) { if (u.indexOf(+x.dataset.s) < 0) u.push(+x.dataset.s); }); return u.map(function (s) { return [s, 0]; }); }
      if (pageMode) return Array.prototype.map.call(document.querySelectorAll('#body .aya'), function (x) { return [+x.dataset.s, +x.dataset.a]; });
      var out = []; for (var a = 1; a <= ch[n - 1].verses; a++) out.push([n, a]); return out;
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
      qi = i; el.src = url(q[i][0], q[i][1]); el.playbackRate = S.rate; el.volume = S.vol;
      el.play().then(function () { playing = true; ui(); }).catch(function () { playing = false; ui(); });
      mark(true); ui(); if (q[i][1]) SO.set('so.last', { s: q[i][0], a: q[i][1] });
    }
    el.addEventListener('ended', function () {
      if (S.repeat === 'ayah') return play(qi);
      if (qi + 1 < q.length) return play(qi + 1);
      if (S.repeat === 'surah') return play(0);
      if (pageMode && P < 604) { location.href = '?p=' + (P + 1) + '&play=1'; return; }
      if (!pageMode && S.autoNext && n < 114) { location.href = '?n=' + (n + 1) + '&play=1'; return; }
      stop();
    });
    el.addEventListener('error', function () { playing = false; ui(); $('ab-rec').textContent = 'Audio could not be loaded'; });
    function start(s, a) { q = queue(); var i = 0; q.forEach(function (it, k) { if (it[0] === s && (it[1] === a || !it[1])) i = k; }); play(i); }
    function stop() { el.pause(); playing = false; qi = -1; mark(false); ui(); }
    function toggle() { if (qi < 0) { var l = SO.get('so.last', null); return start(l && (pageMode || l.s === n) ? l.s : n, l && (pageMode || l.s === n) ? l.a : 1); }
      if (playing) { el.pause(); playing = false; ui(); } else el.play().then(function () { playing = true; ui(); }).catch(function () {}); }
    function word(s, a, w) { wordEl.src = 'https://audio.qurancdn.com/wbw/' + [s, a, w].map(function (x) { return ('00' + x).slice(-3); }).join('_') + '.mp3'; wordEl.volume = S.vol; wordEl.play().catch(function () {}); }
    $('play').onclick = toggle; $('ab-toggle').onclick = toggle; $('ab-close').onclick = stop;
    $('ab-prev').onclick = function () { if (qi > 0) play(qi - 1); };
    $('ab-next').onclick = function () { if (qi + 1 < q.length) play(qi + 1); };
    $('ab-speed').onclick = function () { var R = [0.75, 1, 1.25, 1.5, 2, 0.5]; S.rate = R[(R.indexOf(S.rate) + 1) % R.length] || 1; el.playbackRate = S.rate; save(); apply(false); ui(); };
    $('ab-repeat').onclick = function () { var R = ['off', 'ayah', 'surah']; S.repeat = R[(R.indexOf(S.repeat) + 1) % 3]; save(); apply(false); ui(); };
    return { start: start, stop: stop, toggle: toggle, word: word, live: function () { el.playbackRate = S.rate; el.volume = S.vol; ui(); }, auto: function () { if (qs.get('play') === '1') setTimeout(function () { start(pageMode ? idx.page[P - 1][0] : n, pageMode ? idx.page[P - 1][1] : 1); }, 300); } };
  })();
  function reloadText() { CACHE = {}; TJD = {}; loadScript().then(function () { apply(false); render(); }); }
  // switch between page-by-page and scrolling (different URLs)
  function route() {
    var want = S.mode === 'clean' && S.paging === 'page';
    if (!idx || want === pageMode) return false;
    if (want) { var l = SO.get('so.last', { s: n, a: 1 }); location.href = '?p=' + SO.pos(idx, l.s, l.a).page; }
    else { var st = idx.page[P - 1]; location.href = '?n=' + st[0] + '#' + st[1]; }
    return true;
  }
  document.addEventListener('keydown', function (e) {
    if (!pageMode || !$('settings').hidden || !$('sheet').hidden || /input|textarea/i.test(e.target.tagName)) return;
    if (e.key === 'ArrowLeft' && P < 604) location.href = '?p=' + (P + 1);   // Arabic page order: left = next
    if (e.key === 'ArrowRight' && P > 1) location.href = '?p=' + (P - 1);
  });
  // ---------- settings modal ----------
  $('open-set').onclick = function () { $('settings').hidden = false; };
  $('settings').addEventListener('click', function (e) {
    if (e.target === $('settings') || e.target.closest('[data-close]')) { $('settings').hidden = true; return; }
    var tab = e.target.closest('[data-p]');
    if (tab) { var p = tab.getAttribute('data-p');
      document.querySelectorAll('.mtabs button').forEach(function (b) { b.setAttribute('aria-selected', b === tab); });
      document.querySelectorAll('[data-pane]').forEach(function (s) { s.hidden = s.getAttribute('data-pane') !== p; }); return; }
    var seg = e.target.closest('.seg button');
    if (seg) { var k = seg.parentNode.getAttribute('data-set'); S[k] = seg.getAttribute('data-v'); save(); if (k === 'reciter' && $('rec-full')) $('rec-full').value = ''; if (route()) return; if (k === 'script') reloadText(); else apply(k === 'mode' || k === 'tlay'); return; }
    if (e.target.id === 'reset') { S = Object.assign({}, DEF); save(); apply(true); }
  });
  $('settings').addEventListener('input', function (e) {
    var k = e.target.getAttribute('data-set'); if (!k) return;
    S[k] = e.target.type === 'checkbox' ? e.target.checked : parseFloat(e.target.value); save();
    if (k === 'tajweed') { reloadText(); return; }
    if (k === 'rate' || k === 'vol') AUD.live();
    apply(['nums', 'showAr', 'showTr', 'legend'].indexOf(k) > -1);
  });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') { if (!$('sheet').hidden) closeSheet(); $('settings').hidden = true; } });

  // ---------- behavior: hide toolbar, keep awake, auto scroll ----------
  var lastY = scrollY;
  addEventListener('scroll', function () {
    var y = scrollY; if (S.hide) $('bar').classList.toggle('hid', y > lastY && y > 120); else $('bar').classList.remove('hid'); lastY = y;
  }, { passive: true });
  var lock = null;
  function wake() {
    if (S.awake && !lock && navigator.wakeLock) navigator.wakeLock.request('screen').then(function (l) { lock = l; l.addEventListener('release', function () { lock = null; }); }).catch(function () {});
    if (!S.awake && lock) { lock.release(); lock = null; }
  }
  document.addEventListener('visibilitychange', function () { if (document.visibilityState === 'visible') wake(); });
  var raf = null, acc = 0;
  function autoScroll() {
    if (S.auto && !raf) { var step = function () { acc += S.speed * 0.12; if (acc >= 1) { scrollBy(0, Math.floor(acc)); acc -= Math.floor(acc); } raf = requestAnimationFrame(step); }; raf = requestAnimationFrame(step); }
    if (!S.auto && raf) { cancelAnimationFrame(raf); raf = null; }
  }
  ['wheel', 'touchstart'].forEach(function (ev) { addEventListener(ev, function () { if (S.auto) { S.auto = false; save(); apply(false); } }, { passive: true }); });

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
  function openTafsir(k) {
    tfKey = k; $('tf-key').textContent = k; $('tafsir').hidden = false;
    if (TFL) return tfShow();
    $('tf-text').textContent = 'Loading…';
    fj(TFB + 'editions.json').then(function (d) {
      TFL = (Array.isArray(d) ? d : d.editions || []).filter(function (e) { return e && e.slug; });
      TFL.sort(function (a, b) { return a.language_name === b.language_name ? (a.name < b.name ? -1 : 1) : a.language_name === 'english' ? -1 : b.language_name === 'english' ? 1 : a.language_name < b.language_name ? -1 : 1; });
      var cap = function (w) { return String(w || '').replace(/(^|[ -])\w/g, function (m) { return m.toUpperCase(); }); };
      $('tf-pick').innerHTML = TFL.map(function (e) { return '<option value="' + esc(e.slug) + '">' + esc(cap(e.language_name) + ' — ' + e.name + (e.author_name ? ' (' + e.author_name + ')' : '')) + '</option>'; }).join('');
      var sv = SO.get('so.tafsir', null); if (sv && TFL.some(function (e) { return e.slug === sv; })) $('tf-pick').value = sv;
      $('tf-pick').onchange = tfShow; tfShow();
    }).catch(function () { $('tf-text').textContent = 'The tafsir list could not be loaded. Please check your connection and try again.'; });
  }
  $('tafsir').addEventListener('click', function (e) { if (e.target === $('tafsir') || e.target.closest('[data-close]')) $('tafsir').hidden = true; });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') $('tafsir').hidden = true; });

  // ---------- Backup: export / import everything this site saved in this browser ----------
  function bkKeys() { var out = []; try { for (var i = 0; i < localStorage.length; i++) { var k = localStorage.key(i); if (k.indexOf('so.') === 0 || k === 'theme' || k === 'rm') out.push(k); } } catch (e) {} return out; }
  $('bk-export').onclick = function () {
    var data = {}; bkKeys().forEach(function (k) { data[k] = localStorage.getItem(k); });
    var blob = new Blob([JSON.stringify({ app: 'siraatone.com', version: 1, created: new Date().toISOString(), data: data }, null, 1)], { type: 'application/json' });
    var a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'siraatone-backup-' + new Date().toISOString().slice(0, 10) + '.json';
    document.body.appendChild(a); a.click(); setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 500);
    $('bk-msg').textContent = 'Backup saved (' + Object.keys(data).length + ' items).';
  };
  $('bk-file').onchange = function () {
    var f = this.files[0]; this.value = ''; if (!f) return;
    var r = new FileReader();
    r.onload = function () {
      var b; try { b = JSON.parse(r.result); } catch (e) { b = null; }
      if (!b || b.app !== 'siraatone.com' || !b.data || typeof b.data !== 'object') { $('bk-msg').textContent = 'This is not a SiraatOne website backup file. Nothing was changed.'; return; }
      var ks = Object.keys(b.data).filter(function (k) { return (k.indexOf('so.') === 0 || k === 'theme' || k === 'rm') && typeof b.data[k] === 'string'; });
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
  $('s-info').onclick = function () {
    SO.j('../assets/data/surah-info.json').then(function (d) {
      var m = d.surahs[n - 1]; if (!m || m.number !== n) throw 0;
      var rt = (m.revelation_type || '').trim(), rl = rt.toLowerCase(), place = ['makkah', 'mecca', 'makki', 'meccan'].indexOf(rl) > -1 ? 'Makkah' : ['madinah', 'medina', 'madani', 'medinan'].indexOf(rl) > -1 ? 'Madinah' : rt || 'Not specified'; // same mapping as the app
      var mean = (m.meaning_en || '').trim() || m.name_en, cu = CUR[n];
      var pages = m.page_start === m.page_end ? 'page ' + m.page_start : 'pages ' + m.page_start + '–' + m.page_end;
      var juz = m.juz_start === m.juz_end ? 'Juz ' + m.juz_start : 'Juz ' + m.juz_start + '–' + m.juz_end;
      var note = cu ? cu.nameNote : m.name_en + ' is commonly rendered in English as “' + mean + '.” This title information comes from the installed full-Quran chapter metadata.';
      var sum = cu ? cu.summary : 'Surah ' + m.name_en + ' is a ' + place + ' chapter with ' + m.ayah_count + ' Ayahs, spanning ' + pages + ' and ' + juz + '.' +
        (m.revelation_order > 0 ? ' Its recorded revelation order is ' + m.revelation_order + '.' : '') + (m.ruku_count > 0 ? ' It contains ' + m.ruku_count + ' ' + (m.ruku_count === 1 ? 'Ruku' : 'Rukus') + '.' : '');
      var src = cu ? cu.sourceLabel : 'Structural overview generated only from the verified installed full-Quran metadata. It is not presented as Tafsir or as an AI-generated thematic interpretation.';
      var rows = [['Revealed in', cu ? cu.revelationPlace : place], ['Ayahs', m.ayah_count], ['Pages', pages.replace(/^pages? /, '')], ['Juz', juz.replace('Juz ', '')]];
      if (m.revelation_order > 0) rows.push(['Revelation order', m.revelation_order]);
      if (m.ruku_count > 0) rows.push(['Rukus', m.ruku_count]);
      var h = '<p class="si-ar" lang="ar" dir="rtl">' + SO.sname(n, esc(m.name_ar)) + '</p><h2 class="si-en">' + esc(m.name_en) + '</h2><p class="si-mean">' + esc(cu ? cu.meaning : mean) + '</p><div class="si-stats">' + rows.map(function (r) { return '<div><small>' + r[0] + '</small><b>' + esc(String(r[1])) + '</b></div>'; }).join('') + '</div>' +
        '<h3>About the name</h3><p>' + esc(note) + '</p><h3>Overview</h3><p>' + esc(sum) + '</p><p class="hint">' + esc(src) + '</p>';
      h += '<h3>Tajweed colours</h3>' + (S.tajweed && document.body.dataset.tj === '1' ? '<div class="tj-legend">' + LEG.map(function (l) { return '<span class="tj-' + l[0] + '">' + l[1] + '</span>'; }).join('') + '</div>' : '<p class="hint">Tajweed colouring is off. Turn it on in Settings → Text.</p>');
      $('si-title').textContent = ''; $('si-body').innerHTML = h; $('sinfo').hidden = false;
    }).catch(function () { $('si-title').textContent = ''; $('si-body').innerHTML = '<p class="hint">Surah information could not be loaded. Please refresh.</p>'; $('sinfo').hidden = false; });
  };
  $('sinfo').addEventListener('click', function (e) { if (e.target === $('sinfo') || e.target.closest('[data-close]')) $('sinfo').hidden = true; });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') $('sinfo').hidden = true; });
  // volume in the audio bar (saved with reader settings)
  $('ab-vol').value = S.vol; $('ab-vol').oninput = function () { S.vol = +this.value; save(); AUD.live(); if ($('settings').querySelector('[data-set=vol]')) apply(false); };
})();
