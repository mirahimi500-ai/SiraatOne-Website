// 99 Names: rendered only from assets/data/names99.json (copied unchanged from the SiraatOne Quran app's reviewed data).
(function () {
  var list = document.getElementById('names'), f = document.getElementById('nf'), esc = SO.esc, all = [];
  function render() {
    var v = f.value.trim().toLowerCase();
    var items = all.filter(function (x) { return !v || String(x.id) === v || (x.meaning_en || '').toLowerCase().indexOf(v) > -1 || x.arabic.indexOf(f.value.trim()) > -1; });
    list.innerHTML = items.length ? items.map(function (x) {
      return '<li class="name-card"><span class="nn">' + x.id + '</span><span class="na" lang="ar" dir="rtl">' + esc(x.arabic) + '</span><span class="nm">' + esc(x.meaning_en || '') + '</span></li>';
    }).join('') : '<li class="empty">No name found.</li>';
  }
  SO.j('../assets/data/names99.json').then(function (d) {
    if (!d.names || d.names.length !== 99) throw 0;
    all = d.names;
    document.getElementById('n-ar').textContent = d.arabic_title || '';
    document.getElementById('n-title').textContent = d.title || '99 Names of Allah';
    var r = [];
    if (d.core_hadith_reference) r.push('<p><b>' + esc(d.core_hadith_reference) + '</b> — ' + esc(d.core_hadith_status || '') + '</p>');
    if (d.enumeration_reference) r.push('<p><b>' + esc(d.enumeration_reference) + '</b> — ' + esc(d.enumeration_status || '') + '</p>');
    if (d.meaning_note) r.push('<p>' + esc(d.meaning_note) + '</p>');
    document.getElementById('refs').innerHTML = r.length ? '<h2 class="sec-h">Sources</h2>' + r.join('') : '';
    render();
  }).catch(function () { list.innerHTML = '<li class="empty">Could not load. Please refresh.</li>'; });
  f.addEventListener('input', render);
})();
