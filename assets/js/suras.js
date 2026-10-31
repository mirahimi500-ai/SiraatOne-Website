// Renders the sura list from assets/data/chapters.json (built from Quran Foundation API by scripts/fetch-chapters.ps1).
(function () {
  var list = document.getElementById('sura-list'), q = document.getElementById('sura-search');
  if (!list) return;
  var all = [];
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]; }); }
  function render(items) {
    if (!items.length) { list.innerHTML = '<li class="muted">No sura found.</li>'; return; }
    list.innerHTML = items.map(function (c) {
      return '<li><a class="sura" href="sura/?n=' + c.id + '">' +
        '<span class="num">' + c.id + '</span>' +
        '<span class="en"><b>' + esc(c.name_simple) + '</b><span>' + esc(c.meaning) + ' · ' + c.verses + ' verses · ' + (c.place === 'makkah' ? 'Makki' : 'Madani') + '</span></span>' +
        '<span class="ar" lang="ar" dir="rtl">' + esc(c.name_arabic) + '</span></a></li>';
    }).join('');
  }
  fetch('assets/data/chapters.json').then(function (r) { if (!r.ok) throw 0; return r.json(); })
    .then(function (d) { all = d.chapters || []; render(all); })
    .catch(function () { list.innerHTML = '<li class="muted">Sura list could not be loaded. Please refresh.</li>'; });
  if (q) q.addEventListener('input', function () {
    var v = q.value.trim().toLowerCase().replace(/[-' ]/g, '');
    render(!v ? all : all.filter(function (c) {
      return String(c.id) === v || c.name_simple.toLowerCase().replace(/[-' ]/g, '').indexOf(v) > -1 ||
        c.meaning.toLowerCase().indexOf(v) > -1 || c.name_arabic.indexOf(q.value.trim()) > -1;
    }));
  });
})();
