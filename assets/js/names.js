// 99 Names: rendered only from assets/data/names99.json (from the SiraatOne Quran app; Nov 2026: Al-Ahad added, Allah not numbered - see the enumeration note).
// Layout = the Islamic Calendar style: top bar, summary card, view pill, list + side cards (selected name, sources).
(function () {
  var $ = function (id) { return document.getElementById(id); }, esc = SO.esc, all = [], selId = null;
  var DEF = { view: 'cards', font: 'uthmani', meaning: true, nums: true, tts: true, size: '1', refs: true };
  var O = Object.assign({}, DEF, SO.get('so.nm', {}));
  function save() { SO.set('so.nm', O); }
  function arNum(n) { return Number(n).toLocaleString('ar-EG'); }
  function opts() {
    document.documentElement.style.setProperty('--nm-size', O.size); $('refs-card').hidden = !O.refs;
    $('names').className = 'name-grid nv-' + O.view + ' nf-' + O.font + (O.meaning ? '' : ' no-mean') + (O.nums ? '' : ' no-num');
    document.querySelectorAll('#nm-view [data-v]').forEach(function (b) { b.setAttribute('aria-selected', b.dataset.v === O.view); });
    ['font', 'size'].forEach(function (k) { $('nm-' + k).value = O[k]; }); ['meaning', 'nums', 'tts', 'refs'].forEach(function (k) { $('nm-' + k).checked = O[k]; });
  }
  function speak(t) { if (!O.tts || !window.speechSynthesis) return; var u = new SpeechSynthesisUtterance(t); u.lang = 'ar'; var v = speechSynthesis.getVoices().filter(function (x) { return /^ar/i.test(x.lang); })[0]; if (v) u.voice = v; speechSynthesis.cancel(); speechSynthesis.speak(u); }
  function detail() {
    var x = all.filter(function (n) { return n.id === selId; })[0] || all[0]; if (!x) return;
    $('nm-detail').innerHTML = '<div class="ts-hh"><b>Name ' + x.id + ' of 99</b><small>' + arNum(x.id) + '</small></div><p class="nm-dar nf-' + O.font + '" lang="ar" dir="rtl">' + esc(x.arabic) + '</p><p class="nm-dmean">' + esc(x.meaning_en || '') + '</p>' +
      '<div class="ts-ctl"><button type="button" class="ts-rb" id="nm-prev" aria-label="Previous name">‹</button>' + (window.speechSynthesis ? '<button type="button" class="btn btn-ghost sm" id="nm-say">🔈 Pronounce</button>' : '') + '<button type="button" class="ts-rb" id="nm-next" aria-label="Next name">›</button></div>';
    $('nm-prev').onclick = function () { pick(x.id === 1 ? 99 : x.id - 1); }; $('nm-next').onclick = function () { pick(x.id === 99 ? 1 : x.id + 1); };
    if ($('nm-say')) $('nm-say').onclick = function () { var o = O.tts; O.tts = true; speak(x.arabic); O.tts = o; };
    $('nm-hero').innerHTML = '<div class="cl-hd"><small>' + esc($('n-title').textContent) + '</small><b lang="ar" dir="rtl">' + esc(x.arabic) + '</b><span>' + esc(x.meaning_en || '') + '</span><em>Name ' + x.id + ' of 99</em></div><div class="cl-hn"><small>Al-Asma al-Husna</small><b lang="ar" dir="rtl" class="nm-ht">' + esc(window.NM_AR || '') + '</b><span>99 names · tap a name to see it here</span></div>';
    document.querySelectorAll('#names .name-card').forEach(function (c) { c.classList.toggle('sel', +c.dataset.id === x.id); });
  }
  function pick(id) { selId = id; detail(); var c = document.querySelector('#names [data-id="' + id + '"]'); if (c) c.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); }
  function render() {
    var f = $('nf').value.trim(), v = f.toLowerCase();
    var items = all.filter(function (x) { return !v || String(x.id) === v || (x.meaning_en || '').toLowerCase().indexOf(v) > -1 || x.arabic.indexOf(f) > -1; });
    $('names').innerHTML = items.length ? items.map(function (x) { return '<li class="name-card' + (x.id === selId ? ' sel' : '') + '" data-id="' + x.id + '" tabindex="0"><span class="nn">' + x.id + '</span><span class="na" lang="ar" dir="rtl">' + esc(x.arabic) + '</span><span class="nm">' + esc(x.meaning_en || '') + '</span></li>'; }).join('') : '<li class="empty">No name found.</li>';
  }
  $('names').addEventListener('click', function (e) { var c = e.target.closest('.name-card'); if (!c) return; selId = +c.dataset.id; detail(); speak(c.querySelector('.na').textContent); });
  $('names').addEventListener('keydown', function (e) { var c = e.target.closest('.name-card'); if (c && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); c.click(); } });
  SO.j('../assets/data/names99.json?v=2').then(function (d) {
    if (!d.names || d.names.length !== 99) throw 0;
    all = d.names; selId = all[0].id; window.NM_AR = d.arabic_title || '';
    $('n-title').textContent = d.title || '99 Names of Allah';
    var r = [];
    if (d.core_hadith_reference) r.push('<p><b>' + esc(d.core_hadith_reference) + '</b> — ' + esc(d.core_hadith_status || '') + '</p>');
    if (d.enumeration_reference) r.push('<p><b>' + esc(d.enumeration_reference) + '</b> — ' + esc(d.enumeration_status || '') + '</p>');
    if (d.meaning_note) r.push('<p>' + esc(d.meaning_note) + '</p>');
    $('refs').innerHTML = r.join('');
    opts(); render(); detail();
  }).catch(function () { $('names').innerHTML = '<li class="empty">Could not load. Please refresh.</li>'; });
  $('nf').addEventListener('input', render);
  $('nm-view').onclick = function (e) { var b = e.target.closest('[data-v]'); if (!b) return; O.view = b.dataset.v; save(); opts(); };
  ['font', 'size'].forEach(function (k) { $('nm-' + k).onchange = function () { O[k] = this.value; save(); opts(); detail(); }; });
  ['meaning', 'nums', 'tts', 'refs'].forEach(function (k) { $('nm-' + k).onchange = function () { O[k] = this.checked; save(); opts(); }; });
  $('nm-reset').onclick = function () { O = Object.assign({}, DEF); save(); opts(); detail(); };
  $('nm-menu').onclick = function (e) { e.stopPropagation(); this.setAttribute('aria-expanded', $('nm-tools').classList.toggle('open')); };
  document.addEventListener('click', function (e) { if (!e.target.closest('#nm-tools')) $('nm-tools').classList.remove('open'); });
  $('nm-back').onclick = function (e) { if (history.length > 1 && document.referrer.indexOf(location.host) > -1) { e.preventDefault(); history.back(); } };
})();
