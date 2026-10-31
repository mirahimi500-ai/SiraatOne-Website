// Home: Last Read card + Continue tile. Reads only this browser's saved position.
(function () {
  var last = SO.get('so.last', null); if (!last) return;
  Promise.all([SO.j('assets/data/chapters.json'), SO.j('assets/data/index.json').catch(function () { return null; })]).then(function (r) {
    var c = r[0].chapters[last.s - 1]; if (!c) return;
    var url = 'sura/?n=' + last.s + '#' + last.a;
    document.getElementById('lr-title').textContent = c.name_simple + ' · Ayah ' + last.a;
    var m = 'Surah ' + last.s;
    if (r[1]) { var p = SO.pos(r[1], last.s, last.a); m += ' · Page ' + p.page + ' · Juz ' + p.juz; }
    document.getElementById('lr-meta').textContent = m;
    var go = document.getElementById('lr-go'); go.href = url; go.textContent = 'Continue';
    var t = document.querySelector('[data-continue]'); if (t) t.href = url;
  });
  var t = document.querySelector('[data-continue]'); if (t) t.href = 'sura/?n=' + last.s + '#' + last.a;
})();
(function () { var t = document.querySelector('[data-continue]'); if (t && t.getAttribute('href') === '') t.href = 'sura/?n=1'; })();
