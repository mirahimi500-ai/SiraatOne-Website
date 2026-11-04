// Home: Continue tile opens the last read position (this browser only).
(function () {
  var last = SO.get('so.last', null), t = document.querySelector('[data-continue]'); if (!last || !t) return;
  var sub = t.querySelector('.lr-sub'); t.href = 'sura/?n=' + last.s + '#' + last.a; if (sub) sub.textContent = 'Surah ' + last.s + ' · Ayah ' + last.a;
  SO.j('assets/data/chapters.json').then(function (d) { var c = d.chapters[last.s - 1]; if (c && sub) sub.textContent = c.name_simple + ' · Ayah ' + last.a; }).catch(function () {});
})();
(function () { var t = document.querySelector('[data-continue]'); if (t && t.getAttribute('href') === '') t.href = 'sura/?n=1'; })();

// ----- Quick access: order, hide, add (like the app's Customize Home). Saved in this browser only.
(function () {
  var grid = document.querySelector('.tiles'), btn = document.getElementById('qa-edit'); if (!grid || !btn) return;
  var all = Array.prototype.map.call(grid.querySelectorAll('.tile'), function (x) { return x.getAttribute('data-id'); });
  var order = SO.get('so.qa', null) || all.slice();
  order = order.filter(function (id) { return all.indexOf(id) > -1; });
  function draw() {
    var tiles = {}; grid.querySelectorAll('.tile').forEach(function (x) { tiles[x.getAttribute('data-id')] = x; });
    all.forEach(function (id) { tiles[id].hidden = order.indexOf(id) < 0; });
    order.forEach(function (id) { grid.appendChild(tiles[id]); });
    all.forEach(function (id) { if (order.indexOf(id) < 0) grid.appendChild(tiles[id]); });
    var add = document.getElementById('qa-add'); if (add) add.remove();
    if (grid.classList.contains('editing') && all.some(function (id) { return order.indexOf(id) < 0; })) {
      var d = document.createElement('p'); d.id = 'qa-add'; d.className = 'hint qa-add'; d.innerHTML = 'To add a removed shortcut back, open <a href="apps/">App Library</a> and tap <b>+ Home</b>.'; grid.after(d);
    }
  }
  function tools(on) {
    grid.querySelectorAll('.tile').forEach(function (x) {
      var t = x.querySelector('.qa-t'); if (t) t.remove();
      if (on) { t = document.createElement('span'); t.className = 'qa-t';
        t.innerHTML = '<button type="button" data-mv="-1" aria-label="Move earlier">‹</button><button type="button" data-mv="1" aria-label="Move later">›</button><button type="button" data-mv="x" aria-label="Remove from Quick access">✕</button>'; x.appendChild(t); }
    });
  }
  btn.onclick = function () { var on = grid.classList.toggle('editing'); btn.textContent = on ? 'Done' : 'Edit'; tools(on); draw(); };
  grid.addEventListener('click', function (e) {
    var b = e.target.closest('[data-mv]'); if (!b) { if (grid.classList.contains('editing')) e.preventDefault(); return; }
    e.preventDefault(); var id = b.closest('.tile').getAttribute('data-id'), i = order.indexOf(id), mv = b.getAttribute('data-mv');
    if (mv === 'x') order.splice(i, 1); else { var k = i + (+mv); if (k >= 0 && k < order.length) { order.splice(i, 1); order.splice(k, 0, id); } }
    SO.set('so.qa', order); draw();
  });
  document.addEventListener('click', function (e) { var b = e.target.closest('[data-add]'); if (!b) return; order.push(b.getAttribute('data-add')); SO.set('so.qa', order); tools(true); draw(); });
  draw();
})();

// ----- Home summary cards (Islamic Calendar style): Hijri today + next Islamic day, Saved counts, Tasbih. Same browser data and settings as those pages.
(function () {
  var $ = function (id) { return document.getElementById(id); }; if (!$('hm-hijri')) return;
  var C = Object.assign({ cal: 'islamic-umalqura', adj: 0 }, SO.get('so.cal2', {}));
  var HM_EN = ['Muharram', 'Safar', "Rabi' al-Awwal", "Rabi' al-Akhir", 'Jumada al-Ula', 'Jumada al-Akhirah', 'Rajab', "Sha'ban", 'Ramadan', 'Shawwal', "Dhu al-Qa'dah", 'Dhu al-Hijjah'];
  var HM_AR = ['محرم', 'صفر', 'ربيع الأول', 'ربيع الآخر', 'جمادى الأولى', 'جمادى الآخرة', 'رجب', 'شعبان', 'رمضان', 'شوال', 'ذو القعدة', 'ذو الحجة'];
  var EV = [[1, 1, 'Islamic New Year'], [1, 10, 'Ashura'], [9, 1, 'Ramadan begins'], [10, 1, 'Eid al-Fitr'], [12, 9, 'Day of Arafah'], [12, 10, 'Eid al-Adha']]; // dates as on the Islamic Calendar page
  try {
    var f = new Intl.DateTimeFormat('en-u-ca-' + C.cal + '-nu-latn', { timeZone: 'UTC', day: 'numeric', month: 'numeric', year: 'numeric' });
    var H = function (d) { var o = {}; f.formatToParts(new Date(d.getTime() + C.adj * 864e5)).forEach(function (p) { o[p.type] = p.value; }); return { y: +parseInt(o.year, 10), m: +o.month, d: +o.day }; };
    var n = new Date(), t = new Date(Date.UTC(n.getFullYear(), n.getMonth(), n.getDate())), h = H(t);
    $('hm-hijri').textContent = Number(h.d).toLocaleString('ar-EG') + ' ' + HM_AR[h.m - 1] + ' ' + Number(h.y).toLocaleString('ar-EG', { useGrouping: false }) + ' هـ';
    $('hm-hijri-en').textContent = h.d + ' ' + HM_EN[h.m - 1] + ' ' + h.y + ' AH';
    $('hm-greg').textContent = t.toLocaleDateString(undefined, { timeZone: 'UTC', weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    for (var i = 0; i < 400; i++) { var d = new Date(t.getTime() + i * 864e5), x = H(d), e = EV.filter(function (v) { return v[0] === x.m && v[1] === x.d; })[0];
      if (e) { $('hm-next').textContent = e[2]; $('hm-next-d').innerHTML = (i === 0 ? 'Today' : 'in ' + i + (i === 1 ? ' day' : ' days')) + ' · ' + x.d + ' ' + HM_EN[x.m - 1] + ' · <a href="calendar/">Calendar →</a>'; break; } }
  } catch (e) {}
})();

// ---------- Prayer Times widget (same calculation and settings as the Prayer Times page) ----------
(function () {
  var body = document.getElementById('pw-body'); if (!body) return;
  if (!window.PT || !PT.ok) { document.getElementById('pw').hidden = true; return; }
  var esc = SO.esc, S = PT.settings(), L = SO.get('so.ploc', null), last = '';
  function empty() {
    body.innerHTML = '<a class="pw-empty" href="prayer/"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21s-6-5.6-6-11a6 6 0 0 1 12 0c0 5.4-6 11-6 11z"/><circle cx="12" cy="10" r="2.2"/></svg><span><b>Location required</b><small>Set your location to see prayer times</small></span><em>›</em></a>';
  }
  function draw() {
    if (!L) { empty(); return; }
    var now = new Date(), nx = PT.next(S, L, now), t = PT.ymd(L, now), pt = PT.times(S, L, t.year, t.month, t.day);
    var key = nx.k + nx.d;
    if (key !== last) {
      last = key;
      body.innerHTML = '<div class="pw-next"><small>' + esc(L.name) + ' · next prayer</small><div><b>' + PT.label(nx.k, nx.y, nx.m, nx.d) + '</b><span class="pw-at">' + PT.fmt(S, L, nx.at) + '</span></div>' +
        '<span class="pw-left" id="pw-left"></span></div>' +
        '<ol class="pw-list">' + PT.P.map(function (k) {
          var cls = (k === nx.k && nx.d === t.day ? 'now' : pt[k] < now ? 'past' : '') + (k === 'sunrise' ? ' sun' : '');
          return '<li class="' + cls + '"><span>' + PT.label(k, t.year, t.month, t.day) + '</span><b>' + PT.fmt(S, L, pt[k]) + '</b></li>';
        }).join('') + '</ol>';
      var ex = PT.extras(S, L, t.year, t.month, t.day);
      body.innerHTML += '<div class="pw-ex"><div><small>Ishraq / Duha</small><b>' + PT.fmt(S, L, ex.ishraq) + '</b></div><div><small>Midnight</small><b>' + PT.fmt(S, L, ex.midnight) + '</b></div>' +
        '<div><small>Qiyam (last third)</small><b>' + PT.fmt(S, L, ex.qiyam) + '</b></div></div>';
    }
    var el = document.getElementById('pw-left'); if (el) el.textContent = 'in ' + PT.left(nx.at - now);
  }
  draw(); setInterval(draw, 1000);
  addEventListener('storage', function (e) { if (e.key === 'so.ploc' || e.key === 'so.pt') { S = PT.settings(); L = SO.get('so.ploc', null); last = ''; draw(); } });
})();

// ---------- Small boxes under the prayer card: Saved, Tasbih (this browser's data) ----------
(function () {
  var $ = function (id) { return document.getElementById(id); }; if (!$('mn-sv')) return;
  var n = function (k, arr) { var v = SO.get(k, arr ? [] : {}); return (Array.isArray(v) ? v : Object.keys(v)).length; };
  $('mn-sv').textContent = n('so.bm', 1) + n('so.fav', 1) + n('so.hl') + n('so.notes');
  var tb = SO.get('so.tb3', null), all = 0;
  if (tb && tb.dh && tb.dh.rows) Object.keys(tb.dh.rows).forEach(function (k) { all += tb.dh.rows[k].total || 0; });
  $('mn-tb').textContent = all.toLocaleString();
})();

// SG2 Home smart search: one ranked list as you type. Suras (typo-tolerant), ayah references, pages & settings, dua folders, duas,
// your saved ayahs/notes, then Quran ayahs. Stop words, word forms and synonyms are handled by QS (assets/js/qs.js).
(function () {
  var form = document.querySelector('form.search-big'), inp = document.getElementById('home-q'); if (!form || !inp || !window.SO || !window.QS) return;
  var box = document.createElement('div'); box.className = 'sg'; box.id = 'hm-sg'; box.setAttribute('role', 'listbox'); box.hidden = true; form.appendChild(box);
  inp.setAttribute('role', 'combobox'); inp.setAttribute('aria-controls', 'hm-sg'); inp.setAttribute('aria-expanded', 'false'); inp.setAttribute('aria-autocomplete', 'list');
  var esc = SO.esc, L = QS.loose, C = null, TX = null, DU = null, sel = -1, tm, seq = 0;
  var I = { page: '<rect x="4" y="4" width="7" height="7" rx="2"/><rect x="13" y="4" width="7" height="7" rx="2"/><rect x="4" y="13" width="7" height="7" rx="2"/><rect x="13" y="13" width="7" height="7" rx="2"/>',
    set: '<path d="M4 7h9M17 7h3M4 17h3M11 17h9"/><circle cx="15" cy="7" r="2"/><circle cx="9" cy="17" r="2"/>',
    dua: '<path d="M19.5 14.5A8 8 0 1 1 9.5 4.5a6.5 6.5 0 0 0 10 10z"/>', folder: '<path d="M3.5 7.5a2 2 0 0 1 2-2h4l2 2h7a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-13a2 2 0 0 1-2-2z"/>',
    bm: '<path d="M7 4h10v16l-5-4-5 4z"/>', note: '<path d="M6 4h9l3 3v13H6z"/><path d="M9 12h6M9 16h4"/>', theme: '<circle cx="12" cy="12" r="4"/><path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M5.6 18.4L7 17M17 7l1.4-1.4"/>',
    time: '<circle cx="12" cy="12" r="8"/><path d="M12 8v4l3 2"/>', book: '<path d="M4 5.5A1.5 1.5 0 0 1 5.5 4H11v15H5.5A1.5 1.5 0 0 0 4 20.5zM20 5.5A1.5 1.5 0 0 0 18.5 4H13v15h5.5a1.5 1.5 0 0 1 1.5 1.5z"/>',
    app: '<rect x="7" y="3" width="10" height="18" rx="2.5"/><path d="M11 18h2"/>', help: '<circle cx="12" cy="12" r="8"/><path d="M9.8 9.5a2.3 2.3 0 0 1 4.4.8c0 1.6-2.2 2-2.2 3.4M12 17h.01"/>' };
  function ico(k) { return '<svg viewBox="0 0 24 24" aria-hidden="true">' + I[k] + '</svg>'; }
  var last = SO.get('so.last', null), rd = 'sura/?n=' + (last && last.s ? last.s : 1);
  // [name, description, link, extra words, icon, tag]
  var FEAT = [
    ['Read the Quran', 'Surah, Juz, Hizb or Page', 'read/', 'quran mushaf read surah sura index', 'book', 'Page'],
    ['Continue reading', 'Your last read ayah', last && last.s ? 'sura/?n=' + last.s + '#' + last.a : 'read/', 'last read continue resume', 'book', 'Page'],
    ['Juz list', '30 Juz (Para)', 'read/#juz', 'juz para sipara', 'book', 'Page'],
    ['Hizb list', '60 Hizb', 'read/#hizb', 'hizb', 'book', 'Page'],
    ['Mushaf pages', '604 pages', 'read/#page', 'page pages mushaf', 'book', 'Page'],
    ['Prayer Times & Azan', 'Today, month, Azan alerts', 'prayer/', 'prayer salah salat namaz times azan adhan fajr dhuhr zuhr asr maghrib isha jumuah iqama timetable month', 'time', 'Page'],
    ['Qibla direction', 'In Prayer Times', 'prayer/', 'qibla kaaba direction', 'time', 'Page'],
    ['Islamic Calendar', 'Hijri dates and fasting days', 'calendar/', 'hijri calendar date islamic month ramadan eid fasting', 'page', 'Page'],
    ['Duas & Adhkar', 'Morning, evening, topics', 'duas/', 'dua duas adhkar azkar dhikr supplication', 'dua', 'Page'],
    ['Hadith', 'Prophetic hadiths', 'hadith/', 'hadith hadees sunnah prophet', 'book', 'Page'],
    ['99 Names of Allah', 'Asma ul Husna', 'names/', 'names asma husna 99 allah', 'page', 'Page'],
    ['Tasbih counter', 'Dhikr counter with targets', 'tasbih/', 'tasbih tasbeeh counter dhikr subhanallah', 'page', 'Page'],
    ['Bookmarks', 'Your saved ayahs', 'saved/#bookmarks', 'saved bookmark', 'bm', 'Saved'],
    ['Favorites', 'Your saved ayahs', 'saved/#favorites', 'saved favorite favourite', 'bm', 'Saved'],
    ['Highlights', 'Your saved ayahs', 'saved/#highlights', 'saved highlight', 'bm', 'Saved'],
    ['Notes', 'Your ayah notes', 'saved/#notes', 'saved note', 'note', 'Saved'],
    ['App Library', 'All features', 'apps/', 'apps app library features', 'page', 'Page'],
    ['SiraatOne Quran app', 'Android phone & tablet', 'quran/', 'app android download play store phone', 'app', 'App'],
    ['SiraatOne Azan app', 'Android TV & tablet', 'azan/', 'app android tv tablet download play store', 'app', 'App'],
    ['Quran reader settings', 'Layout, font, translation, audio', rd + '&set=1', 'settings setting reader font size translation tajweed word tafsir reciter recitation audio layout mushaf', 'set', 'Settings'],
    ['Prayer settings', 'Method, madhab, location, Azan', 'prayer/?set=1', 'settings setting calculation method madhab hanafi asr location city azan sound notification', 'set', 'Settings'],
    ['Calendar settings', 'Hijri day adjustment', 'calendar/?set=1', 'settings setting hijri adjustment calendar', 'set', 'Settings'],
    ['Dua settings', 'Text and display', 'duas/?set=1', 'settings setting dua', 'set', 'Settings'],
    ['Names settings', 'Text and display', 'names/?set=1', 'settings setting names', 'set', 'Settings'],
    ['Saved settings', 'Saved ayahs options', 'saved/?set=1', 'settings setting saved bookmark', 'set', 'Settings'],
    ['Tasbih settings', 'Targets and counters', 'tasbih/?set=1', 'settings setting tasbih', 'set', 'Settings'],
    ['Theme', 'Light, dark or system', '#theme', 'theme dark light mode night', 'theme', 'Settings'],
    ['Support', 'Help and contact', 'support/', 'help contact email support', 'help', 'Page'],
    ['Privacy Policy', 'How data is used', 'privacy/', 'privacy policy data', 'help', 'Page'],
    ['Terms & Credits', 'Sources and licences', 'terms/', 'terms credits sources licence license', 'help', 'Page']
  ].map(function (f) { return { f: f, t: L(f[0]), d: L(f[1]), w: L(f[3]) }; });
  var DCOL = [['morning', 'Morning & Evening Adhkar', 'morningEvening', 'morning evening adhkar azkar'], ['prophetic', 'Prophetic Duas', 'prophetic', 'prophetic sunnah prophet'], ['quranic', 'Quranic Duas', 'quranic', 'quranic quran rabbana'], ['prayer', 'Prayer/Salah Duas', 'prayerSalah', 'prayer salah salat namaz']];
  function chs() { return C || (C = SO.j('assets/data/chapters.json').then(function (d) { return d.chapters; })); }
  function duas() { return DU || (DU = SO.j('assets/data/duas.json').then(function (d) {
    var F = DCOL.map(function (c) { return { h: '#' + c[0], t: c[1], s: (d.collections[c[2]] || []).length + ' duas', l: L(c[1]), w: L(c[3]) }; })
      .concat(Object.keys(d.categoryTitles).filter(function (k) { return (d.categories[k] || []).length; }).map(function (k) { var t = d.categoryTitles[k];
        return { h: '#topic-' + k, t: t, s: d.categories[k].length + ' duas', l: L(t), w: '' }; }))
      .concat([{ h: '#saved', t: 'Saved duas', s: 'Your saved duas', l: 'saved duas', w: 'favorite bookmark' }]);
    var E = Object.keys(d.entries).map(function (k) { var e = d.entries[k];
      return { t: e.title, c: e.category || '', lt: L(e.title), lc: L(e.category), lw: L((e.whenToSayEn || '') + ' ' + (e.purposeEn || '')), lm: L((e.meaningEn || '') + ' ' + (e.transliteration || '')), p: QS.plain(e.arabic) }; });
    return { F: F, E: E }; }, function () { return { F: [], E: [] }; })); }
  function text() { if (!TX) { var a = []; for (var i = 1; i <= 114; i++) a.push(SO.j('assets/data/sura/' + i + '.json').catch(function () { return null; }));
    TX = Promise.all(a).then(function (r) { return r.filter(Boolean).map(function (d) { return { n: d.n, en: d.en, p: d.ar.map(QS.plain), l: d.en.map(L) }; }); }); } return TX; }
  function href(s, a) { return 'sura/?n=' + s + (a > 1 ? '#' + a : ''); }
  function row(h, ic, title, sub, tag, cls) { return '<a role="option" class="' + (cls || '') + '" href="' + h + '"><span class="ic">' + ic + '</span><span class="t"><b>' + title + '</b>' + (sub ? '<span>' + sub + '</span>' : '') + '</span>' + (tag ? '<span class="tag">' + tag + '</span>' : '') + '</a>'; }
  function num(n) { return '<b class="nm">' + n + '</b>'; }
  function opts() { return box.querySelectorAll('a[role="option"]'); }
  function mark() { [].forEach.call(opts(), function (a, i) { a.classList.toggle('on', i === sel); a.setAttribute('aria-selected', i === sel); if (i === sel) a.scrollIntoView({ block: 'nearest' }); }); }
  function show(h) { box.innerHTML = h; box.hidden = !h; inp.setAttribute('aria-expanded', h ? 'true' : 'false'); sel = opts().length ? 0 : -1; mark(); }
  function go(a) { if (a.getAttribute('href') === '#theme') { show(''); var t = document.getElementById('theme-toggle'); if (t) t.click(); return; } location.href = a.getAttribute('href'); }
  function foot(q, nq, nd) { return '<div class="sg-f"><span class="kb"><kbd>↑</kbd><kbd>↓</kbd> move <kbd>Enter</kbd> open <kbd>Esc</kbd> close</span><span class="lk">' +
    (nd ? '<a href="duas/?q=' + encodeURIComponent(q) + '#search">Duas (' + nd + ')</a>' : '') + '<a href="read/?q=' + encodeURIComponent(q) + '&tab=search">Quran' + (nq ? ' (' + nq + ')' : '') + ' →</a></span></div>'; }
  function snip(en, T) { var l = L(en), i = -1; T.toks.some(function (v) { return v.some(function (x) { i = QS.pos(l, x); return i > -1; }); });
    if (l.length !== en.length || i < 0) return esc(en.length > 140 ? en.slice(0, 140) + '…' : en);
    var a = Math.max(0, en.lastIndexOf(' ', Math.max(0, i - 50)) + 1), b = Math.min(en.length, a + 150);
    return (a ? '…' : '') + QS.mark(en.slice(a, b), T, esc) + (b < en.length ? '…' : ''); }
  function saved(T, ch, ref) {
    var out = [], seen = {}, notes = SO.get('so.notes', {});
    var add = function (k, kind, txt) { if (seen[k] || out.length >= 3) return; var p = k.split(':'), c = ch[p[0] - 1]; if (!c) return;
      var hit = ref ? k === ref : !T.ar && (QS.nameScore(c.name_simple, T.phrase) >= 70 || (txt && QS.test(L(txt), T)));
      if (hit) { seen[k] = 1; out.push({ s: 85, h: row(href(+p[0], +p[1]), ico(kind === 'Note' ? 'note' : 'bm'), esc(c.name_simple) + ' ' + k, txt ? QS.mark(txt.length > 90 ? txt.slice(0, 90) + '…' : txt, T, esc) : 'Saved ayah', kind) }); } };
    Object.keys(notes).forEach(function (k) { add(k, 'Note', notes[k]); });
    SO.get('so.bm', []).forEach(function (k) { add(k, 'Bookmark'); }); SO.get('so.fav', []).forEach(function (k) { add(k, 'Favorite'); });
    Object.keys(SO.get('so.hl', {})).forEach(function (k) { add(k, 'Highlight'); });
    return out;
  }
  function rank(arr, lim) { return arr.sort(function (a, b) { return b.s - a.s; }).slice(0, lim); }
  function run() {
    var q = inp.value.trim(), my = ++seq; if (!q) return show('');
    if (box.hidden) show('<p class="sg-e">Searching…</p>');
    Promise.all([chs(), duas()]).then(function (R) {
      if (my !== seq) return;
      var ch = R[0], D = R[1], T = QS.terms(q), nt = T.toks.length;
      var ref = q.match(/^(\d{1,3})\s*(?:[:.\s]\s*(\d{1,3}))?$/);
      if (ref) { var c = ch[ref[1] - 1]; if (!c) return show('<p class="sg-e">There is no sura ' + esc(ref[1]) + '. Suras are numbered 1 to 114.</p>');
        var a = Math.min(+ref[2] || 1, c.verses), sv = ref[2] ? saved(T, ch, c.id + ':' + a) : [];
        return show(row(href(c.id, a), num(ref[2] ? c.id + ':' + a : c.id), esc(c.name_simple) + (ref[2] ? ' · Ayah ' + a : ''), esc(c.meaning) + ' · ' + c.verses + ' ayahs', ref[2] ? 'Ayah' : 'Sura') + sv.map(function (x) { return x.h; }).join('')); }
      var G = [];
      var S = []; ch.forEach(function (c) { var s = T.ar ? (QS.plain(c.name_arabic).indexOf(T.phrase) > -1 ? 95 : 0) : QS.nameScore(c.name_simple, q);
        if (!s && !T.ar && nt) { var m = QS.score([[L(c.meaning), 2]], T); if (m.n === nt) s = 40 + m.s; }
        if (s) S.push({ s: s, h: row(href(c.id, 1), num(c.id), esc(c.name_simple), esc(c.meaning) + ' · ' + c.verses + ' ayahs', 'Sura') }); });
      G.push(['Suras', rank(S, 4)]);
      var gen = !T.ar && T.words.length && T.words.every(function (w) { return /^(dua|duas|adhkar|azkar)$/.test(w); });
      var pass = function (m, relax) { return nt && (m.n === nt || (relax && nt > 1 && m.n >= nt - 1)); };
      var build = function (relax) {
        var F = [], DF = [], DD = [];
        if (!T.ar) FEAT.forEach(function (x) { var m = QS.score([[x.t, 3], [x.d, 1.5], [x.w, 1.2]], T); if (pass(m, relax)) F.push({ s: 25 * m.s / nt + (m.n === nt ? 0 : -30), h: row(x.f[2], ico(x.f[4]), QS.mark(x.f[0], T, esc), esc(x.f[1]), x.f[5]) }); });
        if (!T.ar) D.F.forEach(function (f) { var m = QS.score([[f.l, 3], [f.w, 1.2]], T); if (gen || pass(m, relax)) DF.push({ s: gen ? 96 : 25 * m.s / nt - 2, h: row('duas/' + f.h, ico('folder'), QS.mark(f.t, T, esc), esc(f.s), 'Dua folder') }); });
        if (!gen) D.E.forEach(function (e) { var s = 0;
          if (T.ar) s = e.p.indexOf(T.phrase) > -1 ? 60 : 0;
          else { var m = QS.score([[e.lt, 3], [e.lc, 2], [e.lw, 1.5], [e.lm, 1]], T); if (pass(m, relax)) s = 25 * m.s / nt + (m.n === nt ? 0 : -30); }
          if (s) DD.push({ s: s, h: row('duas/?q=' + encodeURIComponent(e.t) + '#search', ico('dua'), QS.mark(e.t, T, esc), esc(e.c), 'Dua') }); });
        return [F, DF, DD];
      };
      var B = build(false), rel = false;
      if (!S.length && !B[0].length && !B[1].length && !B[2].length && nt > 1) { B = build(true); rel = true; }
      G.push(['Pages & settings', rank(B[0], 4)], ['Dua folders', rank(B[1], gen ? 20 : 3)], [rel ? 'Related duas' : 'Duas', rank(B[2], 5)], ['Your saved', saved(T, ch)]);
      G = G.filter(function (g) { return g[1].length; }).sort(function (a, b) { return b[1][0].s - a[1][0].s; });
      var nd = 0; if (!T.ar) D.E.forEach(function (e) { if (QS.test(e.lt + ' ' + e.lc + ' ' + e.lw + ' ' + e.lm, T)) nd++; }); else D.E.forEach(function (e) { if (e.p.indexOf(T.phrase) > -1) nd++; });
      var head = G.map(function (g) { return '<h4>' + g[0] + '</h4>' + g[1].map(function (x) { return x.h; }).join(''); }).join('');
      if (q.length < 3) return show(head ? head + foot(q, 0, nd) : '<p class="sg-e">Keep typing…</p>');
      show(head + '<p class="sg-e sg-wait">Searching the Quran…</p>' + foot(q, 0, nd));
      text().then(function (all) {
        if (my !== seq) return;
        var ph = [], ot = [], total = 0;
        all.forEach(function (d) { var src = T.ar ? d.p : d.l; for (var i = 0; i < src.length; i++) {
          var hit = T.ar ? QS.test(src[i], T) : QS.test(src[i], T); if (!hit) continue; total++;
          var x = [d.n, i + 1, d.en[i]]; if (src[i].indexOf(T.phrase) > -1) { if (ph.length < 4) ph.push(x); } else if (ot.length < 4) ot.push(x); } });
        var hits = ph.concat(ot).slice(0, 4);
        var h = hits.length ? '<h4>Quran <small>' + total + ' ayahs</small></h4>' + hits.map(function (x) { return row(href(x[0], x[1]), num(x[0] + ':' + x[1]), esc(ch[x[0] - 1].name_simple), snip(x[2], T), '', 'ay'); }).join('') : '';
        var cur = sel; show(head + h + (head || h ? foot(q, total, nd) : '<p class="sg-e">No results for “' + esc(q) + '”. Try a sura name, a topic like travel, or a reference like 2:255.</p>'));
        if (cur > 0 && cur < opts().length) { sel = cur; mark(); }
      }, function () { if (my === seq) show(head + '<p class="sg-e">Could not load the Quran text. Check your connection.</p>'); });
    }, function () { if (my === seq) show('<p class="sg-e">Search could not load. Please refresh.</p>'); });
  }
  inp.addEventListener('input', function () { clearTimeout(tm); tm = setTimeout(run, 120); });
  inp.addEventListener('focus', function () { chs(); duas(); if (inp.value.trim() && box.hidden) run(); });
  inp.addEventListener('blur', function () { setTimeout(function () { show(''); }, 200); });
  inp.addEventListener('keydown', function (e) {
    var O = opts(), n = O.length;
    if (e.key === 'ArrowDown' && n) { e.preventDefault(); sel = (sel + 1) % n; mark(); }
    else if (e.key === 'ArrowUp' && n) { e.preventDefault(); sel = (sel - 1 + n) % n; mark(); }
    else if (e.key === 'Escape') show('');
    else if (e.key === 'Enter' && !box.hidden && sel > -1 && O[sel]) { e.preventDefault(); go(O[sel]); }
  });
  box.addEventListener('mousedown', function (e) { e.preventDefault(); });
  box.addEventListener('click', function (e) { var a = e.target.closest('a'); if (a) { e.preventDefault(); go(a); } });
  box.addEventListener('mousemove', function (e) { var a = e.target.closest('a[role="option"]'); if (!a) return; var i = [].indexOf.call(opts(), a); if (i > -1 && i !== sel) { sel = i; mark(); } });
})();
