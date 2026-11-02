// Islamic Calendar (advanced). Based on the SiraatOne Quran app's calendar: Umm al-Qura conversion, manual adjustment -2..+2,
// Islamic Today, Hijri month grid, go to today, pick a Gregorian date, fast marks (long press) and total days fasted, "About Hijri dates".
// Website extras: Gregorian/Hijri views, calculation choice, week start, day panel, upcoming Islamic days with sources, converter, fasting stats.
// Everything is calculated in this browser (Intl calendars); nothing is sent anywhere.
(function () {
  var $ = function (id) { return document.getElementById(id); }, esc = SO.esc;
  var HM_EN = ['Muharram', 'Safar', "Rabi' al-Awwal", "Rabi' al-Akhir", 'Jumada al-Ula', 'Jumada al-Akhirah', 'Rajab', "Sha'ban", 'Ramadan', 'Shawwal', "Dhu al-Qa'dah", 'Dhu al-Hijjah'];
  var HM_AR = ['محرم', 'صفر', 'ربيع الأول', 'ربيع الآخر', 'جمادى الأولى', 'جمادى الآخرة', 'رجب', 'شعبان', 'رمضان', 'شوال', 'ذو القعدة', 'ذو الحجة']; // app: Unicode CLDR names
  var WD = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  // Islamic days [hijri month, from day, to day, title, kind, source label, url]. kind: fast = recommended fast, nofast = no fasting, day = special day
  var EV = [
    [1, 1, 1, 'Islamic New Year (1 Muharram)', 'day', '', ''],
    [1, 9, 9, "Tasu'a — recommended fast with Ashura", 'fast', 'Sahih Muslim 1134', 'https://sunnah.com/muslim:1134a'],
    [1, 10, 10, 'Ashura — recommended fast', 'fast', 'Sahih Muslim 1162', 'https://sunnah.com/muslim:1162b'],
    [9, 1, 1, 'Ramadan begins', 'day', 'Quran 2:185', '../sura/?n=2#185'],
    [9, 21, 30, 'Last ten nights of Ramadan — seek Laylat al-Qadr', 'day', 'Sahih al-Bukhari 2017', 'https://sunnah.com/bukhari:2017'],
    [10, 1, 1, 'Eid al-Fitr — no fasting', 'nofast', 'Sahih al-Bukhari 1990', 'https://sunnah.com/bukhari:1990'],
    [10, 2, 2, 'Six days of Shawwal may be fasted (any days in Shawwal)', 'fast', 'Sahih Muslim 1164', 'https://sunnah.com/muslim:1164'],
    [12, 1, 10, 'First ten days of Dhu al-Hijjah', 'day', 'Sahih al-Bukhari 969', 'https://sunnah.com/bukhari:969'],
    [12, 9, 9, 'Day of Arafah — recommended fast (for those not on Hajj)', 'fast', 'Sahih Muslim 1162', 'https://sunnah.com/muslim:1162b'],
    [12, 10, 10, 'Eid al-Adha — no fasting', 'nofast', 'Sahih al-Bukhari 1990', 'https://sunnah.com/bukhari:1990'],
    [12, 11, 13, 'Days of Tashreeq — no fasting', 'nofast', 'Sahih Muslim 1141', 'https://sunnah.com/muslim:1141']
  ];
  var WHITE = ['White days (13–15) — recommended fast', 'fast', "Sunan an-Nasa'i 2420", 'https://sunnah.com/nasai:2420'];
  var MONTHU = ['Monday and Thursday — recommended fast', 'fast', "Jami' at-Tirmidhi 747", 'https://sunnah.com/tirmidhi:747'];
  var DEF = { cal: 'islamic-umalqura', adj: 0, wk: 6, ev: true, sec: true, arn: false, fri: true, view: 'h' };
  var S = Object.assign({}, DEF, SO.get('so.cal2', {})); if (SO.get('so.calAdj', null) !== null && !SO.get('so.cal2', null)) S.adj = SO.get('so.calAdj', 0);
  var F = SO.get('so.fast', {}); // same keys as before: "Y-M-D"
  function save() { SO.set('so.cal2', S); }
  // ---- dates (all at UTC midnight) ----
  function U(y, m, d) { return new Date(Date.UTC(y, m, d)); }
  function today() { var n = new Date(); return U(n.getFullYear(), n.getMonth(), n.getDate()); }
  function add(d, n) { return new Date(d.getTime() + n * 864e5); }
  function key(d) { return d.getUTCFullYear() + '-' + (d.getUTCMonth() + 1) + '-' + d.getUTCDate(); }
  var fmtC = {};
  function H(d) { // Hijri date of a civil day, with the manual adjustment (as the app: shift the Gregorian day, then convert)
    var f = fmtC[S.cal] || (fmtC[S.cal] = new Intl.DateTimeFormat('en-u-ca-' + S.cal + '-nu-latn', { timeZone: 'UTC', day: 'numeric', month: 'numeric', year: 'numeric' }));
    var o = {}; f.formatToParts(add(d, S.adj)).forEach(function (p) { o[p.type] = p.value; });
    return { y: parseInt(o.year, 10), m: parseInt(o.month, 10), d: parseInt(o.day, 10) };
  }
  function fromH(y, m, d) { // Gregorian day for a Hijri date (search around an estimate)
    var est = U(622, 6, 16 + Math.round((y - 1) * 354.367 + (m - 1) * 29.5306 + d - 1));
    for (var i = -20; i <= 20; i++) { var t = add(est, i), h = H(t); if (h.y === y && h.m === m && h.d === d) return t; }
    return null;
  }
  function num(n) { return S.arn ? Number(n).toLocaleString('ar-EG', { useGrouping: false }) : String(n); }
  function gStr(d, o) { return d.toLocaleDateString(undefined, Object.assign({ timeZone: 'UTC' }, o || { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })); }
  function hStr(h) { return h.d + ' ' + HM_EN[h.m - 1] + ' ' + h.y + ' AH'; }
  function hAr(h) { return num(h.d) + ' ' + HM_AR[h.m - 1] + ' ' + num(h.y) + ' هـ'; }
  function events(d, h) {
    var out = EV.filter(function (e) { return e[0] === h.m && h.d >= e[1] && h.d <= e[2]; }).map(function (e) { return e.slice(3); });
    if (h.d >= 13 && h.d <= 15 && !(h.m === 12 && h.d === 13)) out.push(WHITE);
    var wd = d.getUTCDay(); if ((wd === 1 || wd === 4) && !out.some(function (e) { return e[1] === 'nofast'; }) && h.m !== 9) out.push(MONTHU);
    return out;
  }
  // ---- state ----
  var T = today(), sel = T, H0 = H(T), cur = { hy: H0.y, hm: H0.m, gy: T.getUTCFullYear(), gm: T.getUTCMonth() };
  function monthDays() {
    var list = [];
    if (S.view === 'h') { var st = fromH(cur.hy, cur.hm, 1); if (!st) return list; for (var d = st; H(d).m === cur.hm; d = add(d, 1)) list.push(d); }
    else { for (var g = U(cur.gy, cur.gm, 1); g.getUTCMonth() === cur.gm; g = add(g, 1)) list.push(g); }
    return list;
  }
  function draw() {
    var T = today(), h0 = H(T);
    // hero: Islamic Today
    var nx = upcoming(1)[0];
    $('cl-hero').innerHTML = '<div class="cl-hd"><small>Islamic Today</small><b lang="ar" dir="rtl">' + esc(hAr(h0)) + '</b><span>' + esc(hStr(h0)) + '</span><em>' + esc(gStr(T)) + '</em></div>' +
      '<div class="cl-hn">' + (nx ? '<small>Next</small><b>' + esc(nx.t) + '</b><span>' + (nx.n === 0 ? 'Today' : 'in ' + nx.n + (nx.n === 1 ? ' day' : ' days')) + ' · ' + esc(hStr(nx.h)) + '</span>' : '') + '</div>';
    document.querySelectorAll('#cl-view button').forEach(function (b) { b.setAttribute('aria-selected', b.dataset.v === S.view); });
    var days = monthDays();
    if (S.view === 'h') { $('cl-t1').innerHTML = esc(HM_EN[cur.hm - 1]) + ' ' + num(cur.hy) + ' AH <span lang="ar" dir="rtl">' + HM_AR[cur.hm - 1] + '</span>'; $('cl-t2').textContent = days.length ? gStr(days[0], { day: 'numeric', month: 'short', year: 'numeric' }) + ' – ' + gStr(days[days.length - 1], { day: 'numeric', month: 'short', year: 'numeric' }) + ' · ' + days.length + ' days' : ''; }
    else { var a = H(days[0]), z = H(days[days.length - 1]); $('cl-t1').textContent = gStr(days[0], { month: 'long', year: 'numeric' }); $('cl-t2').textContent = HM_EN[a.m - 1] + (a.m !== z.m ? ' – ' + HM_EN[z.m - 1] : '') + ' ' + (a.y !== z.y ? a.y + '–' + z.y : z.y) + ' AH'; }
    var wk = []; for (var i = 0; i < 7; i++) wk.push(WD[(S.wk + i) % 7].slice(0, 3)); $('cl-wk').innerHTML = wk.map(function (w) { return '<span>' + w + '</span>'; }).join('');
    var lead = days.length ? (days[0].getUTCDay() - S.wk + 7) % 7 : 0, html = '';
    for (i = 0; i < lead; i++) html += '<span class="cl-c empty"></span>';
    days.forEach(function (d) {
      var h = H(d), ev = S.ev ? events(d, h) : [], k = key(d), main = S.view === 'h' ? h.d : d.getUTCDate(), sec = S.view === 'h' ? d.getUTCDate() : h.d;
      var cls = 'cl-c' + (+d === +T ? ' today' : '') + (+d === +sel ? ' sel' : '') + (S.fri && d.getUTCDay() === 5 ? ' fri' : '') + (F[k] ? ' fasted' : '') + (ev.some(function (e) { return e[1] === 'nofast'; }) ? ' eid' : ev.some(function (e) { return e !== MONTHU && e !== WHITE; }) ? ' ev' : '');
      var dots = ev.filter(function (e) { return e !== MONTHU; }).slice(0, 3).map(function (e) { return '<i class="k-' + e[1] + '"></i>'; }).join('');
      html += '<button type="button" class="' + cls + '" data-k="' + k + '" aria-label="' + esc(gStr(d) + ', ' + hStr(h) + (F[k] ? ', fasted' : '')) + '"><b>' + num(main) + '</b>' + (S.sec ? '<small>' + num(sec) + '</small>' : '') + (dots ? '<span class="dots">' + dots + '</span>' : '') + (F[k] ? '<em>✓</em>' : '') + '</button>';
    });
    $('cl-grid').innerHTML = html;
    day(); up(); fastStats();
    ['cal', 'adj', 'wk'].forEach(function (x) { $('cs-' + x).value = String(S[x]); }); ['ev', 'sec', 'arn', 'fri'].forEach(function (x) { $('cs-' + x).checked = !!S[x]; });
  }
  function day() {
    var d = sel, h = H(d), k = key(d), ev = events(d, h), n = Math.round((d - today()) / 864e5);
    $('cl-day').innerHTML = '<div class="ts-hh"><b>' + esc(gStr(d, { weekday: 'long' })) + '</b><small>' + (n === 0 ? 'Today' : n > 0 ? 'in ' + n + (n === 1 ? ' day' : ' days') : -n + (n === -1 ? ' day ago' : ' days ago')) + '</small></div>' +
      '<p class="cl-dar" lang="ar" dir="rtl">' + esc(hAr(h)) + '</p><p class="cl-den">' + esc(hStr(h)) + '<br>' + esc(gStr(d, { day: 'numeric', month: 'long', year: 'numeric' })) + '</p>' +
      (ev.length ? '<ul class="cl-evs">' + ev.map(function (e) { return '<li class="k-' + e[1] + '"><b>' + esc(e[0]) + '</b>' + (e[2] ? '<a href="' + e[3] + '" target="_blank" rel="noopener">' + esc(e[2]) + '</a>' : '') + '</li>'; }).join('') + '</ul>' : '<p class="hint">No listed Islamic day.</p>') +
      '<button type="button" class="btn ' + (F[k] ? 'btn-primary' : 'btn-ghost') + ' sm" id="cl-fast">' + (F[k] ? '✓ Fasted — tap to clear' : 'Mark as fasted') + '</button>';
    $('cl-fast').onclick = function () { toggleFast(k); };
  }
  function upcoming(max) {
    var out = [], T = today(), seen = {};
    for (var i = 0; i < 400 && out.length < max; i++) {
      var d = add(T, i), h = H(d);
      EV.forEach(function (e) { if (e[0] === h.m && h.d === e[1] && !seen[e[3] + h.y]) { seen[e[3] + h.y] = 1; out.push({ t: e[3], k: e[4], s: e[5], u: e[6], d: d, h: h, n: i }); } });
    }
    return out.slice(0, max);
  }
  function up() {
    $('cl-up').innerHTML = upcoming(8).map(function (e) { return '<li class="k-' + e.k + '" data-k="' + key(e.d) + '"><b>' + esc(e.t) + '</b><span>' + esc(hStr(e.h)) + ' · ' + esc(gStr(e.d, { day: 'numeric', month: 'short', year: 'numeric' })) + '</span><em>' + (e.n === 0 ? 'Today' : e.n + 'd') + '</em></li>'; }).join('');
  }
  function fastStats() {
    var ks = Object.keys(F).filter(function (k) { return F[k]; }), hs = H(sel), m = 0, y = 0;
    ks.forEach(function (k) { var p = k.split('-'), h = H(U(+p[0], +p[1] - 1, +p[2])); if (h.y === hs.y) { y++; if (h.m === hs.m) m++; } });
    $('cf-all').textContent = num(ks.length); $('cf-m').textContent = num(m); $('cf-y').textContent = num(y);
  }
  function toggleFast(k) { if (F[k]) delete F[k]; else F[k] = 1; SO.set('so.fast', F); draw(); }
  function pickDate(d) { sel = d; var h = H(d); cur = { hy: h.y, hm: h.m, gy: d.getUTCFullYear(), gm: d.getUTCMonth() }; draw(); }
  // ---- grid: tap = select, long press / double-click = fast mark ----
  var lp, lpDone;
  function fromKey(k) { var p = k.split('-'); return U(+p[0], +p[1] - 1, +p[2]); }
  $('cl-grid').addEventListener('pointerdown', function (e) { var b = e.target.closest('[data-k]'); if (!b) return; lpDone = false; clearTimeout(lp); lp = setTimeout(function () { lpDone = true; if (navigator.vibrate) navigator.vibrate(20); toggleFast(b.dataset.k); }, 550); });
  ['pointerup', 'pointerleave', 'pointercancel'].forEach(function (t) { $('cl-grid').addEventListener(t, function () { clearTimeout(lp); }); });
  $('cl-grid').addEventListener('click', function (e) { var b = e.target.closest('[data-k]'); if (!b || lpDone) return; sel = fromKey(b.dataset.k); document.querySelectorAll('#cl-grid .sel').forEach(function (x) { x.classList.remove('sel'); }); b.classList.add('sel'); day(); fastStats(); });
  $('cl-grid').addEventListener('dblclick', function (e) { var b = e.target.closest('[data-k]'); if (b) toggleFast(b.dataset.k); });
  $('cl-grid').addEventListener('contextmenu', function (e) { if (e.target.closest('[data-k]')) e.preventDefault(); });
  $('cl-up').onclick = function (e) { var li = e.target.closest('[data-k]'); if (li) pickDate(fromKey(li.dataset.k)); };
  function step(n) {
    if (S.view === 'h') { cur.hm += n; if (cur.hm < 1) { cur.hm = 12; cur.hy--; } if (cur.hm > 12) { cur.hm = 1; cur.hy++; } }
    else { cur.gm += n; if (cur.gm < 0) { cur.gm = 11; cur.gy--; } if (cur.gm > 11) { cur.gm = 0; cur.gy++; } }
    draw();
  }
  $('cl-prev').onclick = function () { step(-1); }; $('cl-next').onclick = function () { step(1); };
  document.addEventListener('keydown', function (e) { if (e.target.closest('input,select,textarea')) return; if (e.key === 'ArrowLeft') step(-1); if (e.key === 'ArrowRight') step(1); });
  var sx; $('cl-grid').addEventListener('touchstart', function (e) { sx = e.touches[0].clientX; }, { passive: true });
  $('cl-grid').addEventListener('touchend', function (e) { var dx = e.changedTouches[0].clientX - sx; if (Math.abs(dx) > 60) step(dx < 0 ? 1 : -1); });
  $('cl-today').onclick = function () { pickDate(today()); };
  $('cl-date').onchange = function () { if (this.value) { var p = this.value.split('-'); pickDate(U(+p[0], +p[1] - 1, +p[2])); } };
  $('cl-view').onclick = function (e) { var b = e.target.closest('[data-v]'); if (!b) return; S.view = b.dataset.v; save(); pickDate(sel); };
  $('cl-fclear').onclick = function () { if (Object.keys(F).length && confirm('Clear all fasting marks?')) { F = {}; SO.set('so.fast', F); draw(); } };
  // ---- converter ----
  $('cv-m').innerHTML = HM_EN.map(function (m, i) { return '<option value="' + (i + 1) + '">' + (i + 1) + '. ' + m + '</option>'; }).join('');
  function conv() {
    var g = $('cv-g').value; if (g) { var p = g.split('-'), d = U(+p[0], +p[1] - 1, +p[2]), h = H(d); $('cv-go').innerHTML = '<b>' + esc(hStr(h)) + '</b> <span lang="ar" dir="rtl">' + esc(hAr(h)) + '</span>'; }
    var y = +$('cv-y').value, m = +$('cv-m').value, dd = +$('cv-d').value, r = y && m && dd ? fromH(y, m, dd) : null;
    $('cv-ho').innerHTML = r ? '<b>' + esc(gStr(r)) + '</b>' : (y ? 'No such date in this calculation (a Hijri month has 29 or 30 days).' : '');
  }
  ['cv-g', 'cv-d', 'cv-m', 'cv-y'].forEach(function (id) { $(id).addEventListener('input', conv); $(id).addEventListener('change', conv); });
  // ---- settings ----
  [['cal', 0], ['adj', 1], ['wk', 1]].forEach(function (x) { $('cs-' + x[0]).onchange = function () { S[x[0]] = x[1] ? +this.value : this.value; SO.set('so.calAdj', S.adj); save(); pickDate(sel); conv(); }; });
  ['ev', 'sec', 'arn', 'fri'].forEach(function (x) { $('cs-' + x).onchange = function () { S[x] = this.checked; save(); draw(); }; });
  $('cs-reset').onclick = function () { var v = S.view; S = Object.assign({}, DEF, { view: v }); save(); pickDate(sel); };
  $('cs-about').onclick = function () { $('cl-abouttx').textContent = 'Umm al-Qura table-based conversion. ' + (S.adj ? 'A manual adjustment of ' + (S.adj > 0 ? '+' : '') + S.adj + (Math.abs(S.adj) === 1 ? ' day' : ' days') + ' is applied. ' : 'No manual adjustment is applied. ') + 'Local moon-sighting or authority announcements can differ, so this screen does not label calculated dates as locally confirmed religious dates.' + (S.cal !== 'islamic-umalqura' ? ' You selected a different calculation (' + $('cs-cal').selectedOptions[0].textContent + ').' : ''); $('cl-about').hidden = false; };
  $('cl-about').addEventListener('click', function (e) { if (e.target === $('cl-about') || e.target.closest('[data-close]')) $('cl-about').hidden = true; });
  $('cl-menu').onclick = function (e) { e.stopPropagation(); this.setAttribute('aria-expanded', $('cl-pop').classList.toggle('open')); };
  document.addEventListener('click', function (e) { if (!e.target.closest('#cl-pop') && !e.target.closest('#cl-about')) $('cl-pop').classList.remove('open'); });
  $('cl-back').onclick = function (e) { if (history.length > 1 && document.referrer.indexOf(location.host) > -1) { e.preventDefault(); history.back(); } };
  $('cv-y').value = H0.y; $('cv-m').value = H0.m; $('cv-d').value = H0.d; $('cv-g').value = T.toISOString().slice(0, 10);
  draw(); conv();
})();
