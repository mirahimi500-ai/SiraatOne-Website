// Renders the sura list from assets/data/chapters.json (Quran Foundation data, fetched by scripts/fetch-chapters.ps1).
(function () {
  var list = document.getElementById('sura-list'), q = document.getElementById('sura-search');
  if (!list) return;
  var all = [], place = 'all';
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]; }); }
  function norm(s) { return String(s).toLowerCase().replace(/[-'’ ]/g, ''); }
  function render() {
    var v = q ? q.value.trim() : '', n = norm(v);
    var items = all.filter(function (c) {
      if (place !== 'all' && c.place !== place) return false;
      if (!v) return true;
      return String(c.id) === v || norm(c.name_simple).indexOf(n) > -1 || norm(c.meaning).indexOf(n) > -1 || c.name_arabic.indexOf(v) > -1;
    });
    if (!items.length) { list.innerHTML = '<li class="muted empty">No sura found.</li>'; return; }
    list.innerHTML = items.map(function (c) {
      return '<li><a class="sura" href="sura/?n=' + c.id + '">' +
        '<span class="num"><span>' + c.id + '</span></span>' +
        '<span class="en"><b>' + esc(c.name_simple) + '</b><span>' + esc(c.meaning) + '</span></span>' +
        '<span class="meta"><span class="ar" lang="ar" dir="rtl">' + esc(c.name_arabic) + '</span>' +
        '<span>' + c.verses + ' verses · ' + (c.place === 'makkah' ? 'Makki' : 'Madani') + '</span></span></a></li>';
    }).join('');
  }
  fetch('assets/data/chapters.json').then(function (r) { if (!r.ok) throw 0; return r.json(); })
    .then(function (d) { all = d.chapters || []; render(); })
    .catch(function () { list.innerHTML = '<li class="muted empty">Sura list could not be loaded. Please refresh.</li>'; });
  if (q) q.addEventListener('input', render);
  Array.prototype.forEach.call(document.querySelectorAll('.chip'), function (b) {
    b.addEventListener('click', function () {
      place = b.getAttribute('data-f');
      Array.prototype.forEach.call(document.querySelectorAll('.chip'), function (x) { x.classList.toggle('on', x === b); x.setAttribute('aria-pressed', x === b); });
      render();
    });
  });
})();
