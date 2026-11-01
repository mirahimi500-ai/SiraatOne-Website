// 99 Names: rendered only from assets/data/names99.json (from the SiraatOne Quran app; Nov 2026: Al-Ahad added, Allah not numbered (see enumeration note)).
(function () {
  var list = document.getElementById('names'), f = document.getElementById('nf'), esc = SO.esc, all = [];
  var O = Object.assign({ view: 'cards', font: 'uthmani', meaning: true, nums: true, tts: true }, SO.get('so.nm', {})); // same options as the app
  var $ = function (id) { return document.getElementById(id); };
  function opts() { list.className = 'name-grid nv-' + O.view + ' nf-' + O.font + (O.meaning ? '' : ' no-mean') + (O.nums ? '' : ' no-num'); }
  [['nm-view', 'view'], ['nm-font', 'font']].forEach(function (p) { $(p[0]).value = O[p[1]]; $(p[0]).onchange = function () { O[p[1]] = this.value; SO.set('so.nm', O); opts(); }; });
  [['nm-meaning', 'meaning'], ['nm-nums', 'nums'], ['nm-tts', 'tts']].forEach(function (p) { $(p[0]).checked = O[p[1]]; $(p[0]).onchange = function () { O[p[1]] = this.checked; SO.set('so.nm', O); opts(); }; });
  opts();
  // Tap to pronounce: the browser's own Arabic text-to-speech (like the app's device TTS). Nothing is sent to us.
  list.addEventListener('click', function (e) {
    var c = e.target.closest('.name-card'); if (!c || !O.tts || !window.speechSynthesis) return;
    var u = new SpeechSynthesisUtterance(c.querySelector('.na').textContent); u.lang = 'ar';
    var v = speechSynthesis.getVoices().filter(function (x) { return /^ar/i.test(x.lang); })[0]; if (v) u.voice = v;
    speechSynthesis.cancel(); speechSynthesis.speak(u);
  });
  function render() {
    var v = f.value.trim().toLowerCase();
    var items = all.filter(function (x) { return !v || String(x.id) === v || (x.meaning_en || '').toLowerCase().indexOf(v) > -1 || x.arabic.indexOf(f.value.trim()) > -1; });
    list.innerHTML = items.length ? items.map(function (x) {
      return '<li class="name-card"><span class="nn">' + x.id + '</span><span class="na" lang="ar" dir="rtl">' + esc(x.arabic) + '</span><span class="nm">' + esc(x.meaning_en || '') + '</span></li>';
    }).join('') : '<li class="empty">No name found.</li>';
  }
  SO.j('../assets/data/names99.json?v=2').then(function (d) {
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
