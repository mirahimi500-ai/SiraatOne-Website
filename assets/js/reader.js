// Sura reader. Text comes only from assets/data/sura/N.json (built + validated by scripts/fetch-quran.ps1).
// Bookmarks, favorites, notes and last-read position are stored in this browser only.
(function () {
  var n = parseInt(new URLSearchParams(location.search).get('n'), 10);
  var $ = function (id) { return document.getElementById(id); }, esc = SO.esc;
  if (!(n >= 1 && n <= 114)) { location.replace('../read/'); return; }
  var root = document.documentElement;
  var fs = SO.get('so.arSize', 1.9), showTr = SO.get('so.showTr', true);
  function applyFs() { root.style.setProperty('--ar-size', fs + 'rem'); }
  function applyTr() { document.body.classList.toggle('no-tr', !showTr); $('tr-toggle').setAttribute('aria-pressed', showTr); }
  applyFs(); applyTr();
  $('fs-up').onclick = function () { fs = Math.min(3.2, +(fs + 0.15).toFixed(2)); SO.set('so.arSize', fs); applyFs(); };
  $('fs-down').onclick = function () { fs = Math.max(1.3, +(fs - 0.15).toFixed(2)); SO.set('so.arSize', fs); applyFs(); };
  $('tr-toggle').onclick = function () { showTr = !showTr; SO.set('so.showTr', showTr); applyTr(); };
  var IC = {
    bm: '<path d="M7 3.5h10v17l-5-4-5 4z"/>',
    fav: '<path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z"/>',
    note: '<rect x="4.5" y="4" width="15" height="16" rx="2"/><path d="M8 9h8M8 13h8M8 17h5"/>'
  };
  function btn(kind, key, label, on) {
    return '<button type="button" class="act" data-act="' + kind + '" data-k="' + key + '" aria-pressed="' + on + '" aria-label="' + label + '" title="' + label + '"><svg viewBox="0 0 24 24" aria-hidden="true">' + IC[kind] + '</svg></button>';
  }
  function arNum(i) { return Number(i).toLocaleString('ar-EG'); }
  Promise.all([SO.j('../assets/data/chapters.json'), SO.j('../assets/data/sura/' + n + '.json'),
               n === 1 || n === 9 ? null : SO.j('../assets/data/sura/1.json'), SO.j('../assets/data/index.json').catch(function () { return null; })])
    .then(function (r) {
      var c = r[0].chapters[n - 1], s = r[1], idx = r[3];
      if (s.ar.length !== c.verses || s.en.length !== c.verses) throw 0;
      document.title = c.name_simple + ' — SiraatOne';
      $('s-ar').textContent = c.name_arabic;
      $('s-en').textContent = n + '. ' + c.name_simple;
      var meta = c.meaning + ' · ' + c.verses + ' ayahs · ' + (c.place === 'makkah' ? 'Makki' : 'Madani');
      if (idx) { var p = SO.pos(idx, n, 1); meta += ' · Juz ' + p.juz + ' · Page ' + p.page; }
      $('s-meta').textContent = meta;
      if (r[2]) { $('s-bism').textContent = r[2].ar[0]; $('s-bism').hidden = false; } // Bismillah = verse 1:1 from source data
      var notes = SO.get('so.notes', {});
      $('ayat').innerHTML = s.ar.map(function (a, i) {
        var k = n + ':' + (i + 1), nt = notes[k] || '';
        return '<li id="' + (i + 1) + '" data-a="' + (i + 1) + '"><p class="ar" lang="ar" dir="rtl">' + esc(a) + ' <span class="end">﴿' + arNum(i + 1) + '﴾</span></p>' +
          '<p class="tr">' + esc(s.en[i]) + '</p>' +
          '<div class="ayah-bar"><a class="vk" href="#' + (i + 1) + '">' + k + '</a><span class="acts">' +
          btn('bm', k, 'Bookmark', SO.has('so.bm', k)) + btn('fav', k, 'Favorite', SO.has('so.fav', k)) + btn('note', k, 'Note', !!nt) + '</span></div>' +
          '<textarea class="note" data-k="' + k + '" placeholder="Your note (saved in this browser)"' + (nt ? '' : ' hidden') + '>' + esc(nt) + '</textarea></li>';
      }).join('');
      var all = r[0].chapters;
      if (n > 1) { $('prev').href = '?n=' + (n - 1); $('prev').textContent = '← ' + all[n - 2].name_simple; $('prev').hidden = false; }
      if (n < 114) { $('next').href = '?n=' + (n + 1); $('next').textContent = all[n].name_simple + ' →'; $('next').hidden = false; }
      var start = parseInt(location.hash.slice(1), 10);
      if (start > 1) { var t = document.getElementById(String(start)); if (t) t.scrollIntoView(); }
      SO.set('so.last', { s: n, a: start > 0 && start <= c.verses ? start : 1 });
      // remember the top-most visible ayah as "last read"
      if ('IntersectionObserver' in window) {
        var io = new IntersectionObserver(function (es) {
          es.forEach(function (e) { if (e.isIntersecting) SO.set('so.last', { s: n, a: +e.target.getAttribute('data-a') }); });
        }, { rootMargin: '-80px 0px -70% 0px' });
        Array.prototype.forEach.call(document.querySelectorAll('#ayat li'), function (li) { io.observe(li); });
      }
    })
    .catch(function () { $('s-en').textContent = 'This sura could not be loaded. Please refresh.'; });
  $('ayat').addEventListener('click', function (e) {
    var b = e.target.closest('.act'); if (!b) return;
    var k = b.getAttribute('data-k'), kind = b.getAttribute('data-act');
    if (kind === 'note') { var ta = b.closest('li').querySelector('.note'); ta.hidden = !ta.hidden; if (!ta.hidden) ta.focus(); return; }
    b.setAttribute('aria-pressed', SO.toggle(kind === 'bm' ? 'so.bm' : 'so.fav', k));
  });
  var tm;
  $('ayat').addEventListener('input', function (e) {
    if (!e.target.classList.contains('note')) return;
    var ta = e.target; clearTimeout(tm);
    tm = setTimeout(function () {
      var notes = SO.get('so.notes', {}), k = ta.getAttribute('data-k'), v = ta.value.trim();
      if (v) notes[k] = v; else delete notes[k];
      SO.set('so.notes', notes);
      ta.closest('li').querySelector('[data-act="note"]').setAttribute('aria-pressed', !!v);
    }, 400);
  });
})();
