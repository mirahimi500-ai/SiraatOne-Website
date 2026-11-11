// 99 Names: rendered only from assets/data/names99.json (from the SiraatOne Quran app; Nov 2026: Al-Ahad added, Allah not numbered - see the enumeration note).
// Layout = the Islamic Calendar style: top bar, summary card, view pill, list + side cards (selected name, sources).
(function () {
  var $ = function (id) { return document.getElementById(id); }, esc = SO.esc, all = [], selId = null;
  var DEF = { view: 'cards', font: 'uthmani', meaning: true, nums: true, tts: true, size: '1', refs: true };
  var O = Object.assign({}, DEF, SO.get('so.nm', {}));
  function save() { SO.set('so.nm', O); }
  // Meanings in the page language (the app's files: SiraatOne translation, written with reference to reliable sources);
  // in English, the app's explanation page for each Name (S1_NAMES_EXPLANATIONS_V1, English only for now).
  var LANG = (window.SOI18N && SOI18N.lang) || 'en', LM = null, EXP = null, EXPP = null;
  function mean(x) { return (LM && LM.m[x.id - 1]) || x.meaning_en || ''; }
  function explain() { if (LANG !== 'en') return Promise.resolve(null); if (!EXPP) EXPP = SO.j('../assets/data/names99-explain-en.json?v=20261111').then(function (d) { EXP = d; return d; }).catch(function () { return null; }); return EXPP; }
  function short(t) { var m = String(t || '').match(/^[\s\S]*?[.!?](?=\s|$)/); t = m ? m[0] : String(t || ''); return t.length > 200 ? t.slice(0, 197).replace(/\s+\S*$/, '') + '…' : t; }
  // Full explanation in a pop-up in the middle of the screen (side card "More details" or the ⓘ on each Name)
  var pop = null, popId = 0;
  function popUp(id) {
    explain().then(function (d) { var e = d && d.names[id - 1], x = all[id - 1]; if (!e || !x) return; popId = id;
      if (!pop) { pop = document.createElement('div'); pop.className = 'modal nx-modal'; pop.id = 'nm-pop'; pop.hidden = true; pop.setAttribute('role', 'dialog'); pop.setAttribute('aria-modal', 'true'); pop.setAttribute('aria-labelledby', 'nx-title'); pop.setAttribute('translate', 'no');
        pop.innerHTML = '<div class="modal-card nx-card"><div class="nx-top"><button type="button" class="ts-rb" data-nxgo="-1" aria-label="Previous name">‹</button><b id="nx-title"></b><button type="button" class="ts-rb" data-nxgo="1" aria-label="Next name">›</button><button type="button" class="icon-btn nx-x" data-nxclose aria-label="Close">✕</button></div><div class="nx-body" id="nx-body"></div></div>';
        document.body.appendChild(pop);
        pop.addEventListener('click', function (ev) { var g = ev.target.closest('[data-nxgo]'); if (g) { var n = popId + +g.getAttribute('data-nxgo'); popUp(n < 1 ? 99 : n > 99 ? 1 : n); return; } if (ev.target === pop || ev.target.closest('[data-nxclose]')) closePop(); });
        document.addEventListener('keydown', function (ev) { if (!pop.hidden && ev.key === 'Escape') closePop(); }); }
      $('nx-title').textContent = 'Name ' + id + ' of 99';
      $('nx-body').innerHTML = '<div class="nx-hd"><p class="nm-dar nf-' + O.font + '" lang="ar" dir="rtl">' + esc(x.arabic) + '</p><p class="nx-tl">' + esc(e.transliteration) + '</p><p class="nm-dmean">' + esc(mean(x)) + '</p></div>' + expHtml(e);
      $('nx-body').scrollTop = 0; if (pop.hidden) { pop.hidden = false; document.documentElement.classList.add('nx-open'); pop.querySelector('[data-nxclose]').focus(); }
    }); }
  function closePop() { if (!pop) return; pop.hidden = true; document.documentElement.classList.remove('nx-open'); }
  document.addEventListener('click', function (ev) { var b = ev.target.closest('.nx-more'); if (b) popUp(+b.getAttribute('data-nx')); });
  function expHtml(e) {
    var sec = function (t, b) { return '<section class="nx-sec"><h3>' + t + '</h3>' + b + '</section>'; }, ref = function (t) { return '<p class="nx-ref">' + esc(t) + '</p>'; }, h = '', src = {};
    e.scholars.forEach(function (x) { if (x.url) src[x.scholar + ': ' + x.book] = x.url; }); e.hadith.forEach(function (x) { if (x.url) src[x.ref] = x.url; });
    if (e.established === 'not_established_as_name' && e.established_note) h += '<div class="nx-about"><b>About this Name</b><p>' + esc(e.established_note) + '</p></div>';
    h += sec('Meaning', '<p>' + esc(e.summary) + '</p>');
    if (e.quran.length) h += sec('From the Quran', e.quran.map(function (a) { return (a.arabic ? '<p class="nx-ar" lang="ar" dir="rtl">﴿' + esc(a.arabic) + '﴾</p>' : '') + (a.translation ? '<p>“' + esc(a.translation) + '”</p>' : '') + ref('(' + a.ref + ')' + (a.note ? ' ' + a.note : '')); }).join('') + ref('Quran translation: Saheeh International, QuranEnc.com. Arabic text: Quran.com.'));
    if (e.hadith.length) h += sec('From the Sunnah', e.hadith.map(function (x) { return '<p>' + esc(x.text) + '</p>' + ref(x.ref + ' · ' + x.grade); }).join(''));
    if (e.scholars.length) h += sec('What the scholars said', e.scholars.map(function (x) { return '<p><b>' + esc(x.scholar) + ':</b> ' + esc(x.text) + '</p>' + ref('— ' + x.book); }).join(''));
    if (e.notes.length) h += sec('Good to know', '<ul>' + e.notes.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul>');
    if (e.lessons.length) h += sec('Lessons for the believer', e.lessons.map(function (x) { return '<p>' + esc(x.text) + '</p>' + (x.ref ? ref(x.ref) : ''); }).join(''));
    if (e.dua && e.dua.text) h += sec("Du'a", '<p>' + esc(e.dua.text) + '</p>' + (e.dua.ref ? ref(e.dua.ref) : ''));
    var ks = Object.keys(src); if (ks.length) h += sec('Sources', '<ul class="nx-src">' + ks.map(function (k) { return '<li><a href="' + esc(src[k]) + '" target="_blank" rel="noopener">' + esc(k) + '</a></li>'; }).join('') + '</ul>' + ref('Explanation by SiraatOne from the scholars and hadith cited above.'));
    return h;
  }
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
    $('nm-detail').innerHTML = '<div class="ts-hh"><b>Name ' + x.id + ' of 99</b><small>' + arNum(x.id) + '</small></div><p class="nm-dar nf-' + O.font + '" lang="ar" dir="rtl">' + esc(x.arabic) + '</p><p class="nm-dmean">' + esc(mean(x)) + '</p>' + (LANG === 'en' ? '<p class="nx-tl" id="nm-tl"></p>' : '') +
      '<div class="ts-ctl"><button type="button" class="ts-rb" id="nm-prev" aria-label="Previous name">‹</button>' + (window.speechSynthesis ? '<button type="button" class="btn btn-ghost sm" id="nm-say">🔈 Pronounce</button>' : '') + '<button type="button" class="ts-rb" id="nm-next" aria-label="Next name">›</button></div>' + (LANG === 'en' ? '<div class="nm-exp" id="nm-exp" translate="no"></div>' : '');
    if (LANG === 'en') explain().then(function (d) { var e = d && d.names[x.id - 1]; if (!e || selId !== x.id || !$('nm-exp')) return; $('nm-tl').textContent = e.transliteration;
      $('nm-exp').innerHTML = '<p class="nx-short">' + esc(short(e.summary)) + '</p><button type="button" class="btn btn-ghost sm nx-more" data-nx="' + x.id + '">More details ›</button>'; });
    $('nm-prev').onclick = function () { pick(x.id === 1 ? 99 : x.id - 1); }; $('nm-next').onclick = function () { pick(x.id === 99 ? 1 : x.id + 1); };
    if ($('nm-say')) $('nm-say').onclick = function () { var o = O.tts; O.tts = true; speak(x.arabic); O.tts = o; };
    $('nm-hero').innerHTML = '<div class="cl-hd"><small>' + esc($('n-title').textContent) + '</small><b lang="ar" dir="rtl">' + esc(x.arabic) + '</b><span>' + esc(mean(x)) + '</span><em>Name ' + x.id + ' of 99</em></div><div class="cl-hn"><small>Al-Asma al-Husna</small><b lang="ar" dir="rtl" class="nm-ht">' + esc(window.NM_AR || '') + '</b><span>99 names · tap a name to see it here</span></div>';
    document.querySelectorAll('#names .name-card').forEach(function (c) { c.classList.toggle('sel', +c.dataset.id === x.id); });
  }
  function pick(id) { selId = id; detail(); var c = document.querySelector('#names [data-id="' + id + '"]'); if (c) c.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); }
  function render() {
    var f = $('nf').value.trim(), v = f.toLowerCase();
    var items = all.filter(function (x) { return !v || String(x.id) === v || (mean(x).toLowerCase().indexOf(v) > -1 || (x.meaning_en || '').toLowerCase().indexOf(v) > -1) || x.arabic.indexOf(f) > -1; });
    $('names').innerHTML = items.length ? items.map(function (x) { return '<li class="name-card' + (x.id === selId ? ' sel' : '') + '" data-id="' + x.id + '" tabindex="0"><span class="nn">' + x.id + '</span><span class="na" lang="ar" dir="rtl">' + esc(x.arabic) + '</span><span class="nm">' + esc(mean(x)) + '</span>' + (LANG === 'en' ? '<button type="button" class="nm-i" data-nx="' + x.id + '" aria-label="More about this Name">i</button>' : '') + '</li>'; }).join('') : '<li class="empty">No name found.</li>';
  }
  $('names').addEventListener('click', function (e) { var c = e.target.closest('.name-card'); if (!c) return; selId = +c.dataset.id; detail();
    var i = e.target.closest('.nm-i'); if (i) { popUp(selId); return; } speak(c.querySelector('.na').textContent); });
  $('names').addEventListener('keydown', function (e) { var c = e.target.closest('.name-card'); if (c && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); c.click(); } });
  var MLS = ['ar', 'ur', 'fa', 'tr', 'id', 'ms', 'bn', 'fr', 'es'];
  Promise.all([SO.j('../assets/data/names99.json?v=20261111'), MLS.indexOf(LANG) > -1 ? SO.j('../assets/data/names99-' + LANG + '.json?v=20261111').catch(function () { return null; }) : null]).then(function (r) {
    var d = r[0]; if (r[1] && r[1].m && r[1].m.length === 99) LM = r[1];
    if (!d.names || d.names.length !== 99) throw 0;
    all = d.names; selId = all[0].id; window.NM_AR = d.arabic_title || '';
    $('n-title').textContent = d.title || '99 Names of Allah';
    var r = [];
    if (d.core_hadith_reference) r.push('<p><b>' + esc(d.core_hadith_reference) + '</b> — ' + esc(d.core_hadith_status || '') + '</p>');
    if (d.enumeration_reference) r.push('<p><b>' + esc(d.enumeration_reference) + '</b> — ' + esc(d.enumeration_status || '') + '</p>');
    r.push('<p translate="no">' + esc(LM ? LM.cite : 'SiraatOne translation, written with reference to reliable sources') + '</p>');
    if (d.meaning_note && !LM) r.push('<p>' + esc(d.meaning_note) + '</p>');
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
