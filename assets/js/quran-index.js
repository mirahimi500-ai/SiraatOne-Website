// Quran index: quick suras, Surah / Juz / Hizb / Page / Search / Bookmarks / Favorites / Notes.
(function () {
  var QUICK = [67, 32, 18, 36, 55]; // same shortcuts as the SiraatOne Quran app
  var panel = document.getElementById('panel'), tools = document.getElementById('tools'), esc = SO.esc;
  var params = new URLSearchParams(location.search), ch, idx;
  var SL = Object.assign({ view: 'list', fs: 'current', meaning: true, nums: true }, SO.get('so.sl', {})); // sura list view (as in the app)
  function link(s, a) { return '../sura/?n=' + s + (a > 1 ? '#' + a : ''); }
  function name(s) { return ch[s - 1].name_simple; }
  function row(href, num, title, sub, right) {
    return '<li><a class="row" href="' + href + '">' + (num === '' ? '' : '<span class="num"><span>' + num + '</span></span>') + '<span class="en"><b>' + title + '</b><span>' + sub + '</span></span>' + (right || '') + '</a></li>';
  }
  function surahs(f) {
    var v = (f || '').trim(), n = v.toLowerCase().replace(/[-'’ ]/g, '');
    var items = ch.filter(function (c) { return !v || String(c.id) === v || c.name_simple.toLowerCase().replace(/[-'’ ]/g, '').indexOf(n) > -1 || c.meaning.toLowerCase().indexOf(n) > -1 || c.name_arabic.indexOf(v) > -1; });
    return items.length ? '<ol class="list two sv-' + SL.view + ' fs-' + SL.fs + '">' + items.map(function (c) {
      return row(link(c.id, 1), SL.nums ? c.id : '', esc(c.name_simple), (SL.meaning ? esc(c.meaning) + ' · ' : '') + c.verses + ' ayahs · ' + (c.place === 'makkah' ? 'Makki' : 'Madani'),
        '<span class="ar" lang="ar" dir="rtl">' + SO.sname(c.id, c.name_arabic) + '</span>');
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
  var allText = null;
  function loadAll() { if (!allText) { var a = []; for (var i = 1; i <= 114; i++) a.push(SO.j('../assets/data/sura/' + i + '.json')); allText = Promise.all(a); } return allText; }
  function search(q) {
    q = q.trim();
    if (q.length < 3) return Promise.resolve(q ? empty('Type at least 3 letters.') : empty('Search sura names, English words, or Arabic words.'));
    var isAr = /[؀-ۿ]/.test(q), nq = isAr ? plain(q) : q.toLowerCase();
    var names = ch.filter(function (c) { return c.name_simple.toLowerCase().indexOf(nq) > -1 || c.meaning.toLowerCase().indexOf(nq) > -1 || plain(c.name_arabic).indexOf(nq) > -1; });
    panel.innerHTML = empty('Searching…');
    return loadAll().then(function (all) {
      var hits = [], total = 0;
      all.forEach(function (d) { for (var i = 0; i < d.ar.length; i++) {
        var t = isAr ? plain(d.ar[i]) : d.en[i].toLowerCase();
        if (t.indexOf(nq) > -1) { total++; if (hits.length < 100) hits.push([d.n, i + 1, d.en[i]]); } } });
      var h = names.length ? '<h3 class="sub-h">Suras</h3><ol class="list two">' + names.map(function (c) { return row(link(c.id, 1), c.id, esc(c.name_simple), esc(c.meaning)); }).join('') + '</ol>' : '';
      h += '<h3 class="sub-h">Ayahs <small>' + total + ' found' + (total > 100 ? ' · showing 100' : '') + '</small></h3>';
      return h + (hits.length ? '<ol class="list">' + hits.map(function (x) { return row(link(x[0], x[1]), x[0] + ':' + x[1], esc(name(x[0])), esc(x[2])); }).join('') + '</ol>' : empty('No ayah found.'));
    });
  }
  var tab = 'surah';
  function show(t, push) {
    tab = t;
    Array.prototype.forEach.call(document.querySelectorAll('[data-tab]'), function (b) { b.setAttribute('aria-selected', b.getAttribute('data-tab') === t); });
    if (push) history.replaceState(null, '', '#' + t);
    tools.innerHTML = ''; var out;
    if (t === 'surah' || t === 'search') {
      tools.innerHTML = '<input class="search" id="f" type="search" autocomplete="off" placeholder="' + (t === 'surah' ? 'Filter by name, meaning or number' : 'Search the Quran (English or Arabic)') + '">';
      if (t === 'surah') tools.innerHTML += '<div class="sl-opts">' +
        '<select id="sl-view" aria-label="View"><option value="list">List</option><option value="small">Small icons</option><option value="cards">Large cards</option></select>' +
        '<select id="sl-fs" aria-label="Font size"><option value="small">Small</option><option value="current">Normal</option><option value="large">Large</option><option value="xl">Extra large</option></select>' +
        '<label><input type="checkbox" id="sl-meaning"> Meaning</label><label><input type="checkbox" id="sl-nums"> Numbers</label></div>';
      var f = document.getElementById('f'); if (t === 'search' && params.get('q')) f.value = params.get('q');
      if (t === 'surah') {
        var v = document.getElementById('sl-view'), z = document.getElementById('sl-fs'), m = document.getElementById('sl-meaning'), u = document.getElementById('sl-nums');
        v.value = SL.view; z.value = SL.fs; m.checked = SL.meaning; u.checked = SL.nums;
        var upd = function () { SL = { view: v.value, fs: z.value, meaning: m.checked, nums: u.checked }; SO.set('so.sl', SL); panel.innerHTML = surahs(f.value); };
        [v, z, m, u].forEach(function (x) { x.addEventListener('change', upd); });
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
})();
