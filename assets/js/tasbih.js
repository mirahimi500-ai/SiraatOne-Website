// Tasbih (like the app): the app's sourced dhikr phrases (tasbih_dhikr_catalog.dart, copied unchanged) + your own counters.
// Target, vibrate, sound at target, confirm reset, statistics. Saved in this browser only.
(function () {
  var $ = function (id) { return document.getElementById(id); }, esc = SO.esc;
  var CAT = [
    ['subhan_allah', 'Subhan Allah', 'سُبْحَانَ اللَّهِ', 'Sahih Muslim 596b–c (post-prayer remembrance)', 'https://sunnah.com/muslim:596b', 33],
    ['alhamdulillah', 'Alhamdulillah', 'الْحَمْدُ لِلَّهِ', 'Sahih Muslim 596b–c (post-prayer remembrance)', 'https://sunnah.com/muslim:596b', 33],
    ['allahu_akbar', 'Allahu Akbar', 'اللَّهُ أَكْبَرُ', 'Sahih Muslim 596b–c (post-prayer remembrance)', 'https://sunnah.com/muslim:596b', 34],
    ['la_ilaha_illallah', 'La ilaha illallah', 'لَا إِلَٰهَ إِلَّا اللَّهُ', 'Sahih Muslim 2691 (part of the reported Tahlil)', 'https://sunnah.com/muslim:2691', 0],
    ['subhan_allah_wa_bihamdihi', 'Subhan Allah wa bihamdihi', 'سُبْحَانَ اللَّهِ وَبِحَمْدِهِ', 'Sahih al-Bukhari 6405 (100 times daily)', 'https://sunnah.com/bukhari:6405', 100],
    ['subhan_allah_al_azim', 'Subhan Allah al-Azim', 'سُبْحَانَ اللَّهِ الْعَظِيمِ', 'Sahih al-Bukhari 6406', 'https://sunnah.com/bukhari:6406', 0],
    ['la_hawla', 'La hawla wa la quwwata illa billah', 'لَا حَوْلَ وَلَا قُوَّةَ إِلَّا بِاللَّهِ', 'Sahih al-Bukhari 6384', 'https://sunnah.com/bukhari:6384', 0],
    ['complete_tahlil', 'La ilaha illallah wahdahu', 'لَا إِلَٰهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ، وَهُوَ عَلَى كُلِّ شَيْءٍ قَدِيرٌ', 'Sahih Muslim 2691 (100 times daily)', 'https://sunnah.com/muslim:2691', 100]
  ];
  var old = SO.get('so.tb', null), D = SO.get('so.tb2', null);
  if (!D) { // first run: counters for the app phrases; keep earlier custom counters from the old page
    D = { cur: 'subhan_allah', c: {}, own: [], vib: true, snd: false, conf: true, stats: true, days: {}, total: 0 };
    CAT.forEach(function (x) { D.c[x[0]] = { n: 0, t: x[5] }; });
    if (old && old.list) { old.list.forEach(function (o, i) { if (o.n || o.name !== 'Tasbih') { var id = 'own' + i; D.own.push({ id: id, name: o.name }); D.c[id] = { n: o.n || 0, t: o.target || 0 }; } });
      ['vib', 'snd', 'conf', 'stats'].forEach(function (k) { if (k in old) D[k] = old[k]; }); D.days = old.days || {}; }
  }
  function save() { SO.set('so.tb2', D); }
  function today() { var d = new Date(); return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate(); }
  function item(id) { var a = CAT.filter(function (x) { return x[0] === id; })[0]; if (a) return { id: a[0], name: a[1], ar: a[2], src: a[3], url: a[4] };
    var o = D.own.filter(function (x) { return x.id === id; })[0]; return o ? { id: o.id, name: o.name, own: true } : null; }
  if (!item(D.cur)) D.cur = CAT[0][0];
  function c() { return D.c[D.cur] || (D.c[D.cur] = { n: 0, t: 0 }); }
  var actx; function beep() { try { actx = actx || new (window.AudioContext || window.webkitAudioContext)(); var o = actx.createOscillator(), g = actx.createGain(); o.frequency.value = 880; g.gain.value = .15; o.connect(g); g.connect(actx.destination); o.start(); o.stop(actx.currentTime + .18); } catch (e) {} }
  var C = 2 * Math.PI * 54;
  function ring() {
    var x = c(), p = x.t ? (x.n % x.t || (x.n ? x.t : 0)) / x.t : 0;
    $('tb-prog').style.strokeDasharray = C; $('tb-prog').style.strokeDashoffset = C * (1 - p);
    $('tb-n').textContent = x.n;
    $('tb-goal').textContent = x.t ? 'Round ' + (Math.floor(Math.max(x.n - 1, 0) / x.t) + 1) + ' · ' + (x.n % x.t || (x.n ? x.t : 0)) + ' / ' + x.t : 'No target';
    $('tb-st').hidden = !D.stats; $('tb-st').textContent = 'Today: ' + (D.days[today()] || 0) + ' · This dhikr: ' + x.n + ' · All time: ' + (D.total || 0);
  }
  function draw() {
    var it = item(D.cur), x = c();
    $('tb-chips').innerHTML = CAT.map(function (a) { return '<button type="button" class="tb-chip" data-id="' + a[0] + '" aria-pressed="' + (a[0] === D.cur) + '"><span lang="ar" dir="rtl">' + esc(a[2].length > 34 ? a[2].slice(0, 32) + '…' : a[2]) + '</span><small>' + esc(a[1]) + '</small></button>'; }).join('') +
      D.own.map(function (o) { return '<button type="button" class="tb-chip" data-id="' + o.id + '" aria-pressed="' + (o.id === D.cur) + '"><span>' + esc(o.name) + '</span><small>My counter</small></button>'; }).join('');
    $('tb-ar').textContent = it.ar || ''; $('tb-ar').hidden = !it.ar; $('tb-name').textContent = it.name;
    $('tb-src').innerHTML = it.src ? 'Source: <a href="' + it.url + '" target="_blank" rel="noopener">' + esc(it.src) + '</a>' : '';
    var sel = $('tb-target'), std = ['0', '33', '34', '99', '100'], v = String(x.t), co = sel.querySelector('[data-custom]');
    if (std.indexOf(v) < 0) { if (!co) { co = document.createElement('option'); co.dataset.custom = 1; sel.insertBefore(co, sel.lastChild); } co.value = v; co.textContent = v; } else if (co) co.remove();
    sel.value = v;
    ['vib', 'snd', 'conf', 'stats'].forEach(function (k) { $('tb-' + k).checked = !!D[k]; });
    $('tb-ren').hidden = $('tb-del').hidden = !it.own;
    ring();
    var a = $('tb-chips').querySelector('[aria-pressed=true]'); if (a) a.scrollIntoView({ block: 'nearest', inline: 'center' });
  }
  function inc() {
    var x = c(); x.n++; D.total = (D.total || 0) + 1; D.days[today()] = (D.days[today()] || 0) + 1;
    var hit = x.t && x.n % x.t === 0;
    if (D.vib && navigator.vibrate) navigator.vibrate(hit ? [60, 60, 120] : 12);
    if (hit && D.snd) beep();
    var r = $('tb-tap'); r.classList.remove('pulse', 'hit'); void r.offsetWidth; r.classList.add(hit ? 'hit' : 'pulse');
    ring(); clearTimeout(inc.t); inc.t = setTimeout(save, 250); // instant screen update, saved right after
  }
  // pointerdown = no click delay on phones; Enter/Space for keyboards
  $('tb-tap').addEventListener('pointerdown', function (e) { if (e.button > 0) return; e.preventDefault(); inc(); });
  $('tb-tap').addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); inc(); } });
  document.addEventListener('keydown', function (e) { if (e.code === 'Space' && e.target === document.body) { e.preventDefault(); inc(); } });
  window.addEventListener('pagehide', save);
  $('tb-undo').onclick = function () { var x = c(); if (x.n > 0) { x.n--; D.total = Math.max(0, (D.total || 0) - 1); save(); ring(); } };
  $('tb-reset').onclick = function () { if (!D.conf || confirm('Reset this counter to 0?')) { c().n = 0; save(); ring(); } };
  $('tb-target').onchange = function () { var v = this.value; if (v === 'c') { v = parseInt(prompt('Target number:', '33'), 10); if (!(v > 0)) { draw(); return; } } c().t = +v; save(); draw(); };
  ['vib', 'snd', 'conf', 'stats'].forEach(function (k) { $('tb-' + k).onchange = function () { D[k] = this.checked; save(); ring(); }; });
  $('tb-chips').onclick = function (e) { var b = e.target.closest('[data-id]'); if (!b) return; D.cur = b.dataset.id; save(); draw(); };
  $('tb-add').onclick = function () { var nm = prompt('Name for the new counter:', 'My counter ' + (D.own.length + 1)); if (!nm) return; var id = 'own' + Date.now(); D.own.push({ id: id, name: nm.slice(0, 40) }); D.c[id] = { n: 0, t: 33 }; D.cur = id; save(); draw(); };
  $('tb-ren').onclick = function () { var o = D.own.filter(function (x) { return x.id === D.cur; })[0]; if (!o) return; var r = prompt('New name:', o.name); if (!r) return; o.name = r.slice(0, 40); save(); draw(); };
  $('tb-del').onclick = function () { var i = D.own.findIndex(function (x) { return x.id === D.cur; }); if (i < 0 || !confirm('Delete "' + D.own[i].name + '"?')) return; delete D.c[D.cur]; D.own.splice(i, 1); D.cur = CAT[0][0]; save(); draw(); };
  $('tb-menu').onclick = function (e) { e.stopPropagation(); var o = $('tb-pop').classList.toggle('open'); this.setAttribute('aria-expanded', o); };
  document.addEventListener('click', function (e) { if ($('tb-pop').classList.contains('open') && !e.target.closest('#tb-pop')) $('tb-pop').classList.remove('open'); });
  $('tb-back').onclick = function (e) { if (history.length > 1 && document.referrer.indexOf(location.host) > -1) { e.preventDefault(); history.back(); } };
  draw();
})();
