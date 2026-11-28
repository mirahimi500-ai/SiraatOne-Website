// My Ibadah — the app's private checklist (S1_MY_IBADAH_V1 … S1_IBADAH_ONE_PAGE_V1): the five Fard prayers (prayed / made up / excused),
// fasting (shared with the Islamic Calendar's fasted marks), Morning & Evening adhkar, Al-Kahf on Friday, the daily Quran goal,
// a month calendar with five dots a day, the month's results and the hadith on consistency. Saved only in this browser.
(function () {
  'use strict';
  var root = document.getElementById('ib'); if (!root) return;
  var $ = function (s) { return root.querySelector(s); }, esc = SO.esc;
  var lang = (document.documentElement.lang || 'en').slice(0, 2), D, T, DY, TL;
  var FARD = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'], GOALS = [0, 1, 2, 5, 10, 20];
  var PC = { fajr: '#5856D6', dhuhr: '#32ADE6', asr: '#007AFF', maghrib: '#FF2D55', isha: '#AF52DE' };
  var XC = { fast: '#AF52DE', adhkarMorning: '#FF9500', adhkarEvening: '#5856D6', kahf: '#1F9D5C', quran: '#1F9D5C' };
  var XI = { fast: '<path d="M19.5 14.5A8 8 0 1 1 9.5 4.5a6.3 6.3 0 0 0 10 10z"/>', adhkarMorning: '<path d="M4 18h16M7 14.5a5 5 0 0 1 10 0M12 4v3M5.2 7.2l2 2M18.8 7.2l-2 2"/>',
    adhkarEvening: '<path d="M17.5 15.5A7 7 0 1 1 10.5 5a5.6 5.6 0 0 0 7 10.5z"/><path d="M18 3.5l.75 1.75 1.75.75-1.75.75L18 8.5l-.75-1.75L15.5 6l1.75-.75z"/>',
    kahf: '<path d="M3 5.5C5.5 4 8.5 4 12 6c3.5-2 6.5-2 9-.5V19c-2.5-1.5-5.5-1.5-9 .5-3.5-2-6.5-2-9-.5z"/><path d="M12 6v13.5"/>' };
  var DEF = { days: {}, goal: 0, track: { adhkar: true, kahf: true, fast: true } };
  var ST = Object.assign({}, DEF, SO.get('so.ib', {})); ST.days = ST.days || {}; ST.track = Object.assign({}, DEF.track, ST.track);
  var F = SO.get('so.fast', {}) || {}, sel = null, mon = null;
  function save() { SO.set('so.ib', ST); }
  function t(k, a) { var s = T[k] != null ? T[k] : D.ib.en[k] != null ? D.ib.en[k] : k; if (a) for (var x in a) s = s.split('{' + x + '}').join(a[x]); return s; }
  function key(d) { return d.getUTCFullYear() + '-' + (d.getUTCMonth() + 1) + '-' + d.getUTCDate(); } // same keys as the Islamic Calendar's fasted marks
  function U(y, m, d) { return new Date(Date.UTC(y, m - 1, d)); }
  function addDays(d, n) { return new Date(d.getTime() + n * 864e5); }
  // prayer times (same engine and settings as the Prayer page)
  var L = SO.get('so.ploc', null), PS = window.PT && PT.ok ? PT.settings() : null;
  function ptOf(d) { if (!L || !PS) return null; try { return PT.times(PS, L, d.getUTCFullYear(), d.getUTCMonth() + 1, d.getUTCDate()); } catch (e) { return null; } }
  function todayU() { var n = new Date(); if (L && window.PT) { var y = PT.ymd(L, n); return U(y.year, y.month, y.day); } return U(n.getFullYear(), n.getMonth() + 1, n.getDate()); }
  function prayerDay() { var d = todayU(), pt = ptOf(d); return pt && new Date() < pt.fajr ? addDays(d, -1) : d; } // before Fajr it is still yesterday
  // Hijri (the Islamic Calendar page's settings)
  var C = Object.assign({ cal: 'islamic-umalqura', adj: 0 }, SO.get('so.cal2', {}) || {}), HF = null;
  try { HF = new Intl.DateTimeFormat('en-u-ca-' + C.cal + '-nu-latn', { timeZone: 'UTC', day: 'numeric', month: 'numeric', year: 'numeric' }); } catch (e) {}
  function H(d) { if (!HF) return null; var o = {}; HF.formatToParts(new Date(d.getTime() + (+C.adj || 0) * 864e5)).forEach(function (p) { o[p.type] = p.value; }); return { y: parseInt(o.year, 10), m: +o.month, d: +o.day }; }
  function fastKey(d) { var h = H(d); if (!h) return null; var wd = d.getUTCDay(); // WidgetIslamicDays.fastKey
    if (h.m === 10 && h.d === 1) return 'eidFitr'; if (h.m === 12 && h.d === 10) return 'eidAdha'; if (h.m === 12 && h.d >= 11 && h.d <= 13) return 'tashriq';
    if (h.m === 9) return 'ramadanFast'; if (h.m === 12 && h.d === 9) return 'arafahFast'; if (h.m === 1 && h.d === 10) return 'ashuraFast'; if (h.m === 1 && h.d === 9) return 'tasuaFast';
    if (h.d >= 13 && h.d <= 15) return 'whiteDays'; if (wd === 1 || wd === 4) return 'sunnahFast'; if (h.m === 10 && h.d >= 2) return 'sixShawwal'; return null; }
  function forbidden(d) { var k = fastKey(d); return k === 'eidFitr' || k === 'eidAdha' || k === 'tashriq'; }
  // records
  function rec(d) { return ST.days[key(d)] || {}; }
  function status(d, item) { if (item === 'fast' && F[key(d)]) return 'done'; return rec(d)[item] || null; }
  function setS(d, item, v) { var k = key(d);
    if (item === 'fast') { F = SO.get('so.fast', {}) || {}; if (v === 'done') F[k] = 1; else delete F[k]; SO.set('so.fast', F); if (v === 'done') v = null; }
    var r = Object.assign({}, ST.days[k]); if (v == null) delete r[item]; else r[item] = v; if (Object.keys(r).length) ST.days[k] = r; else delete ST.days[k]; save(); }
  function pagesRead(d) { var r = rec(d); if (r.quranPages) return r.quranPages.split(',').filter(Boolean).length; return +r.quranCount || 0; }
  function extras(d) { var x = [];
    if (ST.track.fast && !forbidden(d)) x.push('fast');
    if (ST.track.adhkar) x.push('adhkarMorning', 'adhkarEvening');
    if (ST.track.kahf && d.getUTCDay() === 5) x.push('kahf');
    return x; }
  function xName(k, d) { if (k === 'adhkarMorning') return t('remindMorning').split(' (')[0].split('（')[0]; if (k === 'adhkarEvening') return t('remindEvening').split(' (')[0].split('（')[0];
    if (k === 'kahf') return t('kahf'); var fk = fastKey(d); return t('fasting') + (fk ? ' · ' + (DY[fk] || D.days.en[fk] || '') : ''); }
  function fmtTime(d) { try { return PT.fmt(PS, L, d); } catch (e) { return ''; } }
  // ---------- the day card ----------
  function drawDay() {
    var pd = prayerDay(), d = sel || pd, isToday = +d === +pd, pt = ptOf(d), now = new Date();
    $('#ib-dt').textContent = isToday ? t('today') : d.toLocaleDateString(lang === 'en' ? undefined : lang, { timeZone: 'UTC', weekday: 'long', day: 'numeric', month: 'long' });
    var h = H(d); $('#ib-dh').textContent = d.toLocaleDateString(lang === 'en' ? undefined : lang, { timeZone: 'UTC', day: 'numeric', month: 'short', year: 'numeric' }) + (h ? ' · ' + h.d + '/' + h.m + '/' + h.y + ' AH' : '');
    $('#ib-fard').innerHTML = FARD.map(function (k) { var s = status(d, k), on = !(isToday && pt && pt[k] > now) || (isToday && pt && now < pt.fajr);
      return '<button type="button" class="ib-chip' + (s ? ' s-' + s : '') + '" data-p="' + k + '"' + (on ? '' : ' disabled') + ' style="--pc:' + PC[k] + '" aria-pressed="' + !!s + '">' + (window.PT ? PT.icon(k) : '') + '<b>' + PT.NAME[k] + '</b><small>' + (s ? t(s === 'done' ? 'prayed' : s) : '') + '</small></button>'; }).join('');
    var xs = extras(d), all = FARD.every(function (k) { return status(d, k); }) && xs.every(function (k) { return status(d, k) === 'done'; });
    $('#ib-sunnah').innerHTML = xs.map(function (k) { var dn = status(d, k) === 'done', fard = k === 'fast' && fastKey(d) === 'ramadanFast',
      tag = k === 'adhkarMorning' ? t('bestBeforeSunrise') : k === 'kahf' ? t('bestBeforeMaghrib') : k === 'adhkarEvening' && pt ? t('until', { time: fmtTime(pt.isha) }) : '';
      return '<button type="button" class="ib-tile' + (dn ? ' done' : '') + '" data-x="' + k + '" style="--tc:' + XC[k] + '" aria-pressed="' + dn + '"><span class="ib-tic"><svg viewBox="0 0 24 24" aria-hidden="true">' + XI[k] + '</svg></span><b>' + esc(xName(k, d)) + '</b><small>' + esc(dn ? (k === 'fast' ? t('fasted') : t('doneToday')) : tag) + '</small><em class="ib-tag">' + esc(fard ? t('fard') : t('sunnah')) + '</em></button>'; }).join('') +
      (ST.goal > 0 ? (function () { var r = pagesRead(d), dn = status(d, 'quran') === 'done', pct = Math.min(1, r / ST.goal), C2 = 2 * Math.PI * 15;
        return '<button type="button" class="ib-tile ib-q' + (dn ? ' done' : '') + '" data-x="quran" style="--tc:' + XC.quran + '" aria-pressed="' + dn + '"><span class="ib-ring"><svg viewBox="0 0 36 36" aria-hidden="true"><circle cx="18" cy="18" r="15" class="trk"/><circle cx="18" cy="18" r="15" class="val" stroke-dasharray="' + C2.toFixed(1) + '" stroke-dashoffset="' + (C2 * (1 - (dn ? 1 : pct))).toFixed(1) + '" transform="rotate(-90 18 18)"/></svg></span><b>' + esc(t('quranTile')) + '</b><small>' + esc(t('quranProgress', { read: r, goal: ST.goal })) + '</small><em class="ib-tag">' + esc(t('sunnah')) + '</em></button>'; })() : '');
    $('#ib-all').hidden = !all; $('#ib-all').textContent = t('allDone');
  }
  // ---------- month calendar, results ----------
  function drawMonth() {
    var pd = prayerDay(); mon = mon || { y: pd.getUTCFullYear(), m: pd.getUTCMonth() + 1 };
    var first = U(mon.y, mon.m, 1), n = new Date(Date.UTC(mon.y, mon.m, 0)).getUTCDate(), fd = 0;
    try { var wi = new Intl.Locale(navigator.language || 'en-US'); fd = ((wi.weekInfo || (wi.getWeekInfo && wi.getWeekInfo()) || {}).firstDay || 7) % 7; } catch (e) {}
    $('#ib-mt').textContent = first.toLocaleDateString(lang === 'en' ? undefined : lang, { timeZone: 'UTC', month: 'long', year: 'numeric' });
    var head = ''; for (var i = 0; i < 7; i++) head += '<span class="ib-wd">' + U(2026, 11, 1 + ((fd + i) % 7)).toLocaleDateString(lang === 'en' ? undefined : lang, { timeZone: 'UTC', weekday: 'narrow' }) + '</span>'; // 1 Nov 2026 = Sunday
    var cells = '', lead = (first.getUTCDay() - fd + 7) % 7; for (i = 0; i < lead; i++) cells += '<span></span>';
    for (var d = 1; d <= n; d++) { var x = U(mon.y, mon.m, d), fut = x > pd, isT = +x === +pd, shown = +x === +(sel || pd);
      var dots = fut ? '' : FARD.map(function (k) { var s = status(x, k); return '<i class="' + (s ? 's-' + s : '') + '"></i>'; }).join('');
      cells += '<button type="button" class="ib-cell' + (isT ? ' today' : '') + (shown ? ' shown' : '') + (status(x, 'fast') === 'done' ? ' fasted' : '') + '" data-d="' + key(x) + '"' + (fut ? ' disabled' : '') + '><b>' + d + '</b><span class="ib-dots">' + dots + '</span>' + (status(x, 'kahf') === 'done' ? '<em class="ib-book" aria-hidden="true">▮</em>' : '') + '</button>'; }
    $('#ib-grid').innerHTML = head + cells;
    // results (S1_MY_IBADAH_MONTH_RESULTS_V1): prayers kept (prayed or made up; excused left out), fasts, adhkar days, Al-Kahf, best streak
    var prayed = 0, exp = 0, fasts = 0, adh = 0, kahf = 0, run = 0, best = 0;
    for (d = 1; d <= n; d++) { x = U(mon.y, mon.m, d); if (x > pd) break; var comp = true;
      FARD.forEach(function (k) { var s = status(x, k); if (!s) comp = false; if (s === 'excused') return; exp++; if (s === 'done' || s === 'qada') prayed++; });
      run = comp ? run + 1 : 0; if (run > best) best = run;
      if (status(x, 'fast') === 'done') fasts++; if (status(x, 'adhkarMorning') === 'done' || status(x, 'adhkarEvening') === 'done') adh++; if (status(x, 'kahf') === 'done') kahf++; }
    var share = exp ? prayed / exp : 0, cheer = !exp ? '' : share >= 0.9 ? t('cheerHigh') : share >= 0.5 ? t('cheerMid') : t('cheerLow'), C3 = 2 * Math.PI * 40;
    $('#ib-sum').innerHTML = '<h2>' + esc(t('thisMonth')) + '</h2><div class="ib-res"><div class="ib-bring"><svg viewBox="0 0 96 96" aria-hidden="true"><circle cx="48" cy="48" r="40" class="trk"/><circle cx="48" cy="48" r="40" class="val" stroke-dasharray="' + C3.toFixed(1) + '" stroke-dashoffset="' + (C3 * (1 - share)).toFixed(1) + '" transform="rotate(-90 48 48)"/></svg><div><b>' + Math.round(share * 100) + '%</b><small>' + esc(t('prayers', { a: prayed, b: exp })) + '</small></div></div>' +
      '<div class="ib-stats">' + [[fasts, t('statFasts'), XC.fast], [adh, t('statAdhkar'), XC.adhkarMorning], [kahf, t('statKahf'), XC.kahf], [best, t('statStreak'), '#FF3B30']].map(function (s) { return '<div style="--tc:' + s[2] + '"><b>' + s[0] + '</b><small>' + esc(s[1]) + '</small></div>'; }).join('') + '</div></div>' + (cheer ? '<p class="ib-cheer">' + esc(cheer) + '</p>' : '');
  }
  function draw() { drawDay(); drawMonth(); var pd = prayerDay(), done = FARD.filter(function (k) { return status(pd, k); }).length; var hb = document.getElementById('ib-hero-n'); if (hb) hb.textContent = done + ' / 5'; }
  // ---------- prayer options (press and hold / right-click): Prayed, Made up (qada), Excused, Clear ----------
  var menuFor = null;
  function openMenu(btn) { var m = $('#ib-menu'), d = sel || prayerDay(); menuFor = btn.getAttribute('data-p');
    m.innerHTML = '<b>' + esc(PT.NAME[menuFor]) + '</b>' + [['done', t('prayed')], ['qada', t('qada')], ['excused', t('excused')], ['', t('clear')]].map(function (o) { return '<button type="button" data-s="' + o[0] + '"' + ((status(d, menuFor) || '') === o[0] ? ' aria-pressed="true"' : '') + '>' + esc(o[1]) + '</button>'; }).join('');
    var r = btn.getBoundingClientRect(), pr = root.getBoundingClientRect(); m.style.top = (r.bottom - pr.top + 6) + 'px'; m.style.left = Math.max(0, Math.min(pr.width - 220, r.left - pr.left)) + 'px'; m.hidden = false; }
  function wire() {
    var lp = null, lpDone = false;
    root.addEventListener('pointerdown', function (e) { var b = e.target.closest('[data-p]'); if (!b || b.disabled) return; lpDone = false; clearTimeout(lp); lp = setTimeout(function () { lpDone = true; if (navigator.vibrate) navigator.vibrate(15); openMenu(b); }, 500); });
    ['pointerup', 'pointerleave', 'pointercancel'].forEach(function (k) { root.addEventListener(k, function () { clearTimeout(lp); }); });
    root.addEventListener('contextmenu', function (e) { var b = e.target.closest('[data-p]'); if (b && !b.disabled) { e.preventDefault(); openMenu(b); } });
    root.addEventListener('click', function (e) {
      var d = sel || prayerDay(), b;
      if ((b = e.target.closest('#ib-menu [data-s]'))) { setS(d, menuFor, b.getAttribute('data-s') || null); $('#ib-menu').hidden = true; draw(); return; }
      if (!e.target.closest('#ib-menu')) $('#ib-menu').hidden = true;
      if ((b = e.target.closest('[data-p]'))) { if (lpDone) { lpDone = false; return; } var k = b.getAttribute('data-p'); setS(d, k, status(d, k) ? null : 'done'); draw(); return; }
      if ((b = e.target.closest('[data-x]'))) { var x = b.getAttribute('data-x'); setS(d, x, status(d, x) === 'done' ? null : 'done'); draw(); return; }
      if ((b = e.target.closest('[data-d]'))) { var q = b.getAttribute('data-d').split('-'), nd = U(+q[0], +q[1], +q[2]); sel = +nd === +prayerDay() ? null : nd; draw(); document.getElementById('ib-day').scrollIntoView({ behavior: 'smooth', block: 'nearest' }); return; }
      if (e.target.closest('#ib-mprev') || e.target.closest('#ib-mnext')) { var s = e.target.closest('#ib-mprev') ? -1 : 1, nm = new Date(Date.UTC(mon.y, mon.m - 1 + s, 1)); mon = { y: nm.getUTCFullYear(), m: nm.getUTCMonth() + 1 }; drawMonth(); return; }
      if (e.target.closest('#ib-today')) { sel = null; mon = null; draw(); }
    });
    // settings
    var g = document.getElementById('ib-goal'); g.innerHTML = GOALS.map(function (n) { return '<option value="' + n + '">' + esc(n === 0 ? t('quranGoalOff') : n === 1 ? t('quranPage1') : n === 20 ? t('quranJuz1') + ' (20)' : t('quranPagesN', { n: n })) + '</option>'; }).join('');
    g.value = String(ST.goal); g.onchange = function () { ST.goal = +this.value; save(); draw(); };
    ['adhkar', 'kahf', 'fast'].forEach(function (k) { var c = document.getElementById('ib-t-' + k); c.checked = !!ST.track[k]; c.onchange = function () { ST.track[k] = this.checked; save(); draw(); }; });
    addEventListener('storage', function (e) { if (e.key === 'so.ib' || e.key === 'so.fast') { ST = Object.assign({}, DEF, SO.get('so.ib', {})); ST.track = Object.assign({}, DEF.track, ST.track); F = SO.get('so.fast', {}) || {}; draw(); } });
    setInterval(drawDay, 60000);
  }
  fetch(root.getAttribute('data-src')).then(function (r) { return r.json(); }).then(function (d) {
    D = d; T = d.ib[lang] || d.ib.en; DY = d.days[lang] || d.days.en; TL = d.tl[lang] || d.tl.en;
    document.querySelectorAll('[data-t]').forEach(function (e) { e.textContent = t(e.getAttribute('data-t')); });
    document.title = t('title') + ' — SiraatOne'; wire(); draw();
  }).catch(function () { root.innerHTML = '<p class="hint">My Ibadah could not load. Please refresh the page.</p>'; });
})();
