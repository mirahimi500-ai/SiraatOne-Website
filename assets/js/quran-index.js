// Quran index: quick suras, Surah / Juz / Hizb / Page / Search / Bookmarks / Favorites / Notes.
(function () {
  var QUICK = [67, 32, 18, 36, 55]; // same shortcuts as the SiraatOne Quran app
  var panel = document.getElementById('panel'), tools = document.getElementById('tools'), esc = SO.esc;
  var params = new URLSearchParams(location.search), ch, idx;
  var SL = Object.assign({ view: 'list', fs: 'current', meaning: true, nums: true, ayahs: true, place: true, ar: true, only: 'all', sort: 'mushaf' }, SO.get('so.sl', {})); // sura list view (as in the app)
  function link(s, a) { return '../sura/?n=' + s + (a > 1 ? '#' + a : ''); }
  function name(s) { return ch[s - 1].name_simple; }
  function row(href, num, title, sub, right) {
    return '<li><a class="row" href="' + href + '">' + (num === '' ? '' : '<span class="num"><span>' + num + '</span></span>') + '<span class="en"><b>' + title + '</b><span>' + sub + '</span></span>' + (right || '') + '</a></li>';
  }
  function surahs(f) {
    var v = (f || '').trim(), n = nkey(v);
    var items = ch.filter(function (c) { return SL.only === 'all' || c.place === SL.only; }).filter(function (c) { return !v || String(c.id) === v || (n && nkey(c.name_simple).indexOf(n) > -1) || (v.length > 3 && QS.nameScore(c.name_simple, v) > 0) || (n && nkey(c.meaning).indexOf(n) > -1) || plain(c.name_arabic).indexOf(plain(v)) > -1; });
    if (SL.sort !== 'mushaf') items = items.slice().sort(function (a, b) { return SL.sort === 'short' ? a.verses - b.verses || a.id - b.id : b.verses - a.verses || a.id - b.id; });
    return items.length ? '<ol class="list two sv-' + SL.view + ' fs-' + SL.fs + '">' + items.map(function (c) {
      return row(link(c.id, 1), SL.nums ? c.id : '', esc(c.name_simple), [SL.meaning ? esc(c.meaning) : '', SL.ayahs ? c.verses + ' ayahs' : '', SL.place ? (c.place === 'makkah' ? 'Makki' : 'Madani') : ''].filter(Boolean).join(' · '),
        SL.ar ? '<span class="ar" lang="ar" dir="rtl">' + SO.sname(c.id, c.name_arabic) + '</span>' : '');
    }).join('') + '</ol>' : empty('No sura found.');
  }
  function starts(list, label) {
    return '<ol class="list grid3">' + list.map(function (x, i) {
      return row(link(x[0], x[1]), i + 1, label + ' ' + (i + 1), 'Starts ' + esc(name(x[0])) + ' ' + x[0] + ':' + x[1]);
    }).join('') + '</ol>';
  }
  function pages() {
    return '<div class="pages">' + idx.page.map(function (x, i) { return '<a href="' + link(x[0], x[1]) + '" title="' + esc(name(x[0])) + ' ' + x[0] + ':' + x[1] + '">' + (i + 1) + '</a>'; }).join('') + '</div>';
  }
  function empty(t) { return '<p class="empty">' + t + '</p>'; }
  function ayahList(keys, notes) {
    if (!keys.length) return Promise.resolve(empty(notes ? 'No notes yet. Open any ayah and tap the note icon.' : 'Nothing saved yet. Open any ayah and tap the icon to save it.'));
    var ss = {}; keys.forEach(function (k) { ss[k.split(':')[0]] = 1; });
    return Promise.all(Object.keys(ss).map(function (s) { return SO.j('../assets/data/sura/' + s + '.json'); })).then(function (all) {
      var by = {}; all.forEach(function (d) { by[d.n] = d; });
      return '<ol class="list">' + keys.map(function (k) {
        var p = k.split(':'), s = +p[0], a = +p[1], d = by[s]; if (!d) return '';
        var sub = notes ? esc(notes[k]) : esc(d.en[a - 1]);
        return row(link(s, a), k, esc(name(s)), sub.length > 180 ? sub.slice(0, 180) + '…' : sub);
      }).join('') + '</ol>';
    });
  }
  var plain = function (s) { return s.replace(/[ؐ-ًؚ-ٰٟۖ-ۭـ]/g, '').replace(/[أإآٱ]/g, 'ا').replace(/ى/g, 'ي').replace(/ة/g, 'ه'); };
  // Latin: ignore accents (Allāh = allah), case, hyphens; common spellings (yaseen = yasin).
  var loose = function (s) { return String(s).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase(); };
  var nkey = function (s) { return loose(s).replace(/[^a-z0-9]/g, '').replace(/ee/g, 'i').replace(/oo|ou/g, 'u').replace(/aa/g, 'a'); };
  var allText = null;
  function loadAll() { if (!allText) { var a = []; for (var i = 1; i <= 114; i++) a.push(SO.j('../assets/data/sura/' + i + '.json').catch(function () { return null; }));
    allText = Promise.all(a).then(function (all) { return all.filter(Boolean).map(function (d) { return { n: d.n, en: d.en, ar: d.ar, p: d.ar.map(plain), l: d.en.map(loose) }; }); }); } return allText; }
  // All ayah results, shown in steps (Show more) with matched words highlighted.
  var QR = null, QR_STEP = 50;
  function qrRows(n) { var from = QR.shown, to = Math.min(QR.hits.length, from + n); QR.shown = to;
    return QR.hits.slice(from, to).map(function (x) { return row(link(x[0], x[1]), x[0] + ':' + x[1], esc(name(x[0])), QR.ar ? '<span lang="ar" dir="rtl" class="qr-ar">' + esc(x[2]) + '</span>' : QS.mark(x[2], QR.T, esc)); }).join(''); }
  function qrMore() { var left = QR.hits.length - QR.shown; return left > 0 ? '<button type="button" class="qr-more" id="qr-more">Show ' + Math.min(left, 100) + ' more · ' + left.toLocaleString() + ' left</button>' : ''; }
  panel.addEventListener('click', function (e) { if (!e.target.closest('#qr-more') || !QR) return; var b = document.getElementById('qr-more');
    document.getElementById('qr-list').insertAdjacentHTML('beforeend', qrRows(100)); b.insertAdjacentHTML('afterend', qrMore()); b.remove(); });
  function search(q) {
    q = q.trim();
    var ref = q.match(/^(\d{1,3})\s*(?:[:.\s]\s*(\d{1,3}))?$/), go = '';
    if (ref && +ref[1] >= 1 && +ref[1] <= 114) { var c0 = ch[ref[1] - 1], a0 = Math.min(+ref[2] || 1, c0.verses);
      go = '<h3 class="sub-h">Go to</h3><ol class="list two">' + row(link(c0.id, a0), ref[2] ? c0.id + ':' + a0 : c0.id, esc(c0.name_simple), ref[2] ? 'Ayah ' + a0 : esc(c0.meaning)) + '</ol>'; }
    if (go && !ref[2]) return Promise.resolve(go);
    if (go) q = '';
    if (q.length < 3) return Promise.resolve(go || (q ? empty('Type at least 3 letters.') : empty('Search sura names, English words, Arabic words, or a reference like 2:255.')));
    var T = QS.terms(q), isAr = T.ar; // smart matching: stop words, word forms, synonyms, close spellings (qs.js)
    var names = ch.filter(function (c) { return isAr ? plain(c.name_arabic).indexOf(T.phrase) > -1 : QS.nameScore(c.name_simple, q) > 0 || QS.test(loose(c.meaning), T); });
    panel.innerHTML = empty('Searching…');
    return loadAll().then(function (all) {
      var hits = [], sur = {};
      all.forEach(function (d) { var src = isAr ? d.p : d.l; for (var i = 0; i < src.length; i++) if (QS.test(src[i], T)) { hits.push([d.n, i + 1, isAr ? d.ar[i] : d.en[i]]); sur[d.n] = 1; } });
      QR = { hits: hits, T: T, ar: isAr, shown: 0 };
      var h = names.length ? '<h3 class="sub-h">Suras</h3><ol class="list two">' + names.map(function (c) { return row(link(c.id, 1), c.id, esc(c.name_simple), esc(c.meaning)); }).join('') + '</ol>' : '';
      h += '<h3 class="sub-h">Ayahs <small>' + hits.length.toLocaleString() + ' found' + (hits.length ? ' in ' + Object.keys(sur).length + ' suras' : '') + '</small></h3>';
      return h + (hits.length ? '<ol class="list qr-list" id="qr-list">' + qrRows(QR_STEP) + '</ol>' + qrMore() : empty('No ayah found. Try another word or a sura name.'));
    }, function () { return empty('Search could not load. Check your connection and try again.'); });
  }
  var tab = 'surah';
  function show(t, push) {
    tab = t;
    Array.prototype.forEach.call(document.querySelectorAll('[data-tab]'), function (b) { b.setAttribute('aria-selected', b.getAttribute('data-tab') === t); });
    if (push) history.replaceState(null, '', '#' + t);
    tools.innerHTML = ''; var out; tools.classList.toggle('pop', t === 'surah'); tools.classList.remove('open'); document.getElementById('qx-menu').hidden = t !== 'surah'; document.getElementById('qx-title').textContent = t === 'surah' ? 'The Holy Quran' : { juz: 'Juz', hizb: 'Hizb', page: 'Page', search: 'Search', bookmarks: 'Bookmarks', highlights: 'Highlights', favorites: 'Favorites', notes: 'Notes' }[t] || ''; document.getElementById('qx-sub').hidden = t !== 'surah';
    if (t === 'surah' || t === 'search') {
      tools.innerHTML = '<input class="search" id="f" type="search" autocomplete="off" placeholder="' + (t === 'surah' ? 'Filter by name, meaning or number' : 'Search suras and ayahs (English or Arabic)') + '">';
      if (t === 'surah') tools.innerHTML += '<div class="sl-opts">' +
        '<select id="sl-view" aria-label="View"><option value="list">List</option><option value="small">Small icons</option><option value="cards">Large cards</option></select>' +
        '<select id="sl-fs" aria-label="Font size"><option value="small">Small</option><option value="current">Normal</option><option value="large">Large</option><option value="xl">Extra large</option></select>' +
        '<select id="sl-only" aria-label="Show"><option value="all">All suras</option><option value="makkah">Makki only</option><option value="madinah">Madani only</option></select>' +
        '<select id="sl-sort" aria-label="Order"><option value="mushaf">Mushaf order</option><option value="short">Shortest first</option><option value="long">Longest first</option></select>' +
        '<label><input type="checkbox" id="sl-meaning"> Meaning</label><label><input type="checkbox" id="sl-nums"> Numbers</label><label><input type="checkbox" id="sl-ayahs"> Ayah count</label><label><input type="checkbox" id="sl-place"> Makki / Madani</label><label><input type="checkbox" id="sl-ar"> Arabic name</label></div>';
      var f = document.getElementById('f'); if (t === 'search' && params.get('q')) f.value = params.get('q');
      if (t === 'surah') {
        var g = function (i) { return document.getElementById('sl-' + i); }, SEL = ['view', 'fs', 'only', 'sort'], BOX = ['meaning', 'nums', 'ayahs', 'place', 'ar'];
        SEL.forEach(function (k) { g(k).value = SL[k]; }); BOX.forEach(function (k) { g(k).checked = SL[k]; });
        var upd = function () { SEL.forEach(function (k) { SL[k] = g(k).value; }); BOX.forEach(function (k) { SL[k] = g(k).checked; }); SO.set('so.sl', SL); panel.innerHTML = surahs(f.value); };
        SEL.concat(BOX).forEach(function (k) { g(k).addEventListener('change', upd); });
      }
      var run = function () { var r = t === 'surah' ? surahs(f.value) : search(f.value); Promise.resolve(r).then(function (h) { if (tab === t) panel.innerHTML = h; }); };
      var tm; f.addEventListener('input', function () { clearTimeout(tm); tm = setTimeout(run, t === 'search' ? 300 : 0); });
      run(); if (t === 'search') f.focus(); return;
    }
    if (t === 'juz') out = starts(idx.juz, 'Juz');
    else if (t === 'hizb') out = starts(idx.hizb, 'Hizb');
    else if (t === 'page') out = pages();
    else if (t === 'bookmarks') out = ayahList(SO.get('so.bm', []));
    else if (t === 'favorites') out = ayahList(SO.get('so.fav', []));
    else if (t === 'highlights') out = ayahList(Object.keys(SO.get('so.hl', {})));
    else if (t === 'notes') { var n = SO.get('so.notes', {}); out = ayahList(Object.keys(n), n); }
    Promise.resolve(out).then(function (h) { if (tab === t) panel.innerHTML = h; });
  }
  Promise.all([SO.j('../assets/data/chapters.json'), SO.j('../assets/data/index.json')]).then(function (r) {
    ch = r[0].chapters; idx = r[1];
    document.getElementById('quick').innerHTML = QUICK.map(function (s) { return '<a class="chip" href="' + link(s, 1) + '">' + esc(name(s)) + '</a>'; }).join('');
    Array.prototype.forEach.call(document.querySelectorAll('[data-tab]'), function (b) { b.addEventListener('click', function () { show(b.getAttribute('data-tab'), true); }); });
    var start = params.get('tab') || location.hash.slice(1);
    show(document.querySelector('[data-tab="' + start + '"]') ? start : 'surah', false);
  }).catch(function () { panel.innerHTML = empty('Could not load. Please refresh.'); });
  document.getElementById('qx-menu').onclick = function (e) { e.stopPropagation(); var o = tools.classList.toggle('open'); this.setAttribute('aria-expanded', o); };
  document.addEventListener('click', function (e) { if (tools.classList.contains('open') && !e.target.closest('#tools')) tools.classList.remove('open'); });
  // side cards + last read (Islamic Calendar layout)
  (function () {
    var cnt = function (k, a) { var v = SO.get(k, a ? [] : {}); return (Array.isArray(v) ? v : Object.keys(v)).length; };
    document.getElementById('qx-saved').innerHTML = [['Bookmarks', cnt('so.bm', 1), 'bookmarks'], ['Favorites', cnt('so.fav', 1), 'favorites'], ['Highlights', cnt('so.hl'), 'highlights'], ['Notes', cnt('so.notes'), 'notes']].map(function (r) { return '<a href="../saved/#' + r[2] + '"><small>' + r[0] + '</small><b>' + r[1] + '</b></a>'; }).join('');
    var l = SO.get('so.last', null); if (!l) return;
    SO.j('../assets/data/chapters.json').then(function (d) { var c = d.chapters[l.s - 1]; if (!c) return;
      document.getElementById('qx-lr').textContent = c.name_simple + ' · Ayah ' + l.a;
      document.getElementById('qx-lr2').innerHTML = 'Surah ' + l.s + ' · <a href="../sura/?n=' + l.s + '#' + l.a + '">Continue reading →</a>'; });
  })();
  document.getElementById('qx-back').onclick = function (e) { if (history.length > 1 && document.referrer.indexOf(location.host) > -1) { e.preventDefault(); history.back(); } };
})();
