// Reader v2: Clean Mushaf / Mushaf+ (word-by-word) / Verse List, settings panel, status bar, bottom bar.
// Quran text only from assets/data (validated by scripts/*.ps1). Personal data stays in this browser.
(function () {
  var n = parseInt(new URLSearchParams(location.search).get('n'), 10);
  var $ = function (id) { return document.getElementById(id); }, esc = SO.esc, root = document.documentElement;
  if (!(n >= 1 && n <= 114)) { location.replace('../read/'); return; }
  var DEF = { mode: 'verse', script: 'uthmani', ar: 1.9, tr: 1, header: true, meaning: true, deco: true, bg: 'app', nav: 'surah', hide: true, compact: true, awake: false, auto: false, speed: 3 };
  var S = Object.assign({}, DEF, SO.get('so.rs', {}));
  var ch, sura, idx, wbw = null, bism = null, AR = null, BI = null;
  // Quran script: naskh = Uthmani text in Amiri Quran; uthmani = QPC Hafs (KFGQPC); indopak = IndoPak Nastaleeq
  function loadScript() {
    var dir = S.script === 'uthmani' ? 'qpc' : S.script === 'indopak' ? 'indopak' : null;
    if (!dir) { AR = sura.ar; BI = bism; document.body.dataset.script = 'naskh'; return Promise.resolve(); }
    return Promise.all([SO.j('../assets/data/' + dir + '/' + n + '.json'), bism ? SO.j('../assets/data/' + dir + '/1.json') : null])
      .then(function (x) { if (x[0].ar.length !== sura.ar.length) throw 0; AR = x[0].ar; BI = x[1] ? x[1].ar[0] : null; document.body.dataset.script = S.script; })
      .catch(function () { AR = sura.ar; BI = bism; document.body.dataset.script = 'naskh'; });
  }
  function save() { SO.set('so.rs', S); }
  function arNum(i) { return Number(i).toLocaleString('ar-EG'); }
  function end(i) { return '<span class="end">﴿' + arNum(i) + '﴾</span>'; }

  // ---------- apply settings ----------
  function apply(rerender) {
    root.style.setProperty('--ar-size', S.ar + 'rem'); root.style.setProperty('--tr-size', S.tr + 'rem');
    document.body.dataset.bg = S.bg;
    $('head').hidden = !S.header; $('s-meta').hidden = !S.meaning;
    var useImg = S.header && S.deco, withB = useImg && !!bism;
    $('frame').classList.toggle('plain', !useImg); $('frame').classList.toggle('bism', withB);
    var im = $('frame-img'); im.hidden = !useImg;
    if (useImg) {
      var u = 'url(../assets/img/' + (withB ? 'frame-bism.png' : 'frame.png') + ')';
      var canMask = window.CSS && (CSS.supports('mask-image', u) || CSS.supports('-webkit-mask-image', u));
      if (canMask) { im.style.webkitMaskImage = u; im.style.maskImage = u; im.classList.remove('raw'); }
      else { im.style.backgroundImage = u; im.classList.add('raw'); } // old browsers: original colours
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
    document.querySelectorAll('[data-out]').forEach(function (o) { var k = o.getAttribute('data-out'); o.textContent = k === 'speed' ? S.speed : Math.round(S[k] * 16); });
    if (ch) navLinks();
    if (rerender && sura) render();
  }

  // ---------- data ----------
  Promise.all([SO.j('../assets/data/chapters.json'), SO.j('../assets/data/sura/' + n + '.json'),
               n === 1 || n === 9 ? null : SO.j('../assets/data/sura/1.json'), SO.j('../assets/data/index.json').catch(function () { return null; })])
    .then(function (r) {
      ch = r[0].chapters; sura = r[1]; idx = r[3]; var c = ch[n - 1];
      if (sura.ar.length !== c.verses || sura.en.length !== c.verses) throw 0;
      if (r[2]) bism = r[2].ar[0]; // Bismillah = verse 1:1 from source data
      document.title = c.name_simple + ' — SiraatOne';
      $('s-ar').innerHTML = SO.sname(n, 'سورة ' + c.name_arabic);
      $('s-en').textContent = c.name_simple;
      var m = c.meaning + ' · ' + c.verses + ' ayahs · ' + (c.place === 'makkah' ? 'Makki' : 'Madani');
      if (idx) { var p = SO.pos(idx, n, 1); m += ' · Juz ' + p.juz + ' · Page ' + p.page; }
      $('s-meta').textContent = m;
      $('bb-name').innerHTML = arNum(n) + ' - ' + SO.sname(n, c.name_arabic);
      loadScript().then(function () { apply(false); render(); });
    })
    .catch(function () { $('s-en').textContent = 'This sura could not be loaded. Please refresh.'; });

  function render() {
    var go = S.mode === 'plus' && !wbw ? SO.j('../assets/data/wbw/' + n + '.json').then(function (d) { wbw = d.w; }).catch(function () { wbw = false; }) : Promise.resolve();
    go.then(function () {
      var c = ch[n - 1], h = '', mode = S.mode === 'plus' && !wbw ? 'verse' : S.mode;
      $('s-bism').textContent = BI || '';
      document.body.dataset.mode = mode;
      if (mode === 'clean') {
        h = '<p class="flow" lang="ar" dir="rtl">' + AR.map(function (a, i) {
          return '<span class="aya" id="' + (i + 1) + '" data-a="' + (i + 1) + '">' + esc(a) + ' ' + end(i + 1) + '</span>';
        }).join(' ') + '</p>';
      } else {
        h = '<ol class="cards">' + AR.map(function (a, i) {
          var k = n + ':' + (i + 1), top = '<div class="c-top"><span class="c-num">' + (i + 1) + '</span>' + marks(k) + '<button type="button" class="more" data-a="' + (i + 1) + '" aria-label="Ayah ' + k + ' actions">•••</button></div>';
          var ar = mode === 'plus'
            ? '<div class="words" lang="ar" dir="rtl">' + wbw[i].map(function (w) { return '<span class="w"><span class="wa">' + esc(w[0]) + '</span><span class="wt" dir="ltr">' + esc(w[1] || '') + '</span></span>'; }).join('') + end(i + 1) + '</div>'
            : '<p class="ar" lang="ar" dir="rtl">' + esc(a) + ' ' + end(i + 1) + '</p>';
          return '<li class="card-a" id="' + (i + 1) + '" data-a="' + (i + 1) + '">' + top + ar + '<p class="tr">' + esc(sura.en[i]) + '</p></li>';
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
      es.forEach(function (e) { if (!e.isIntersecting) return; var a = +e.target.getAttribute('data-a'); SO.set('so.last', { s: n, a: a }); status(a); });
    }, { rootMargin: '-90px 0px -70% 0px' });
    document.querySelectorAll('#body [data-a][id]').forEach(function (el) { io.observe(el); });
    status(1);
  }
  function status(a) {
    var c = ch[n - 1], j = idx ? SO.pos(idx, n, a) : null;
    $('st-en').textContent = n + '-' + c.name_simple + ' · ' + n + ':' + a + (j ? ' · Juz ' + j.juz + ' · Page ' + j.page : '');
    $('st-ar').textContent = arNum(n) + ' - ' + c.name_arabic + (j ? ' / الجزء ' + arNum(j.juz) : '');
  }

  // ---------- prev / next (by Surah or Juz) ----------
  function navLinks() {
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
    var t = e.target.closest('.more, .aya'); if (!t) return;
    cur = n + ':' + t.getAttribute('data-a');
    $('sh-key').textContent = ch[n - 1].name_simple + ' ' + cur;
    $('sheet').querySelector('[data-a="bm"]').setAttribute('aria-pressed', SO.has('so.bm', cur));
    $('sheet').querySelector('[data-a="fav"]').setAttribute('aria-pressed', SO.has('so.fav', cur));
    $('sh-note').value = SO.get('so.notes', {})[cur] || '';
    $('sheet').hidden = false;
  });
  $('sheet').addEventListener('click', function (e) {
    if (e.target === $('sheet') || e.target.closest('[data-close]')) { closeSheet(); return; }
    var b = e.target.closest('[data-a]'); if (!b) return;
    var a = b.getAttribute('data-a');
    if (a === 'copy') {
      var i = +cur.split(':')[1] - 1, txt = sura.ar[i] + '\n' + sura.en[i] + '\n— ' + ch[n - 1].name_simple + ' ' + cur;
      if (navigator.clipboard) navigator.clipboard.writeText(txt).then(function () { b.querySelector('span').textContent = 'Copied'; setTimeout(function () { b.querySelector('span').textContent = 'Copy'; }, 1200); });
      return;
    }
    b.setAttribute('aria-pressed', SO.toggle(a === 'bm' ? 'so.bm' : 'so.fav', cur));
  });
  function closeSheet() {
    var notes = SO.get('so.notes', {}), v = $('sh-note').value.trim();
    if (cur) { if (v) notes[cur] = v; else delete notes[cur]; SO.set('so.notes', notes); }
    $('sheet').hidden = true;
    var el = $(cur && cur.split(':')[1]); if (el) { var m = el.querySelector('.marks'); if (m) m.outerHTML = marks(cur); }
    cur = null;
  }

  // ---------- settings modal ----------
  $('open-set').onclick = function () { $('settings').hidden = false; };
  $('settings').addEventListener('click', function (e) {
    if (e.target === $('settings') || e.target.closest('[data-close]')) { $('settings').hidden = true; return; }
    var tab = e.target.closest('[data-p]');
    if (tab) { var p = tab.getAttribute('data-p');
      document.querySelectorAll('.mtabs button').forEach(function (b) { b.setAttribute('aria-selected', b === tab); });
      document.querySelectorAll('[data-pane]').forEach(function (s) { s.hidden = s.getAttribute('data-pane') !== p; }); return; }
    var seg = e.target.closest('.seg button');
    if (seg) { var k = seg.parentNode.getAttribute('data-set'); S[k] = seg.getAttribute('data-v'); save(); if (k === 'script') loadScript().then(function () { apply(false); render(); }); else apply(k === 'mode'); return; }
    if (e.target.id === 'reset') { S = Object.assign({}, DEF); save(); apply(true); }
  });
  $('settings').addEventListener('input', function (e) {
    var k = e.target.getAttribute('data-set'); if (!k) return;
    S[k] = e.target.type === 'checkbox' ? e.target.checked : parseFloat(e.target.value); save(); apply(false);
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
})();
