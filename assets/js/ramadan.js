// Ramadan Tools — the app's Ramadan screen (S1_IOS_RAMADAN_V2, S1_RAMADAN_ONE_PAGE_V1): a ring (the fasting day from Fajr to Maghrib,
// else the month) with the time left, "Day n", Suhoor ends / Iftar, the odd-night note of the last ten; a 30-day tracker for Fasts
// (shared with the Islamic Calendar's fasted marks) and Taraweeh; one Juz a day; the Iftar dua; Zakat al-Fitr and fasts to make up.
// Dates are estimates (Umm al-Qura + the calendar adjustment), never a moon-sighting announcement. Saved only in this browser.
(function () {
  'use strict';
  var root = document.getElementById('rm'); if (!root) return;
  var $ = function (s) { return root.querySelector(s); }, esc = SO.esc;
  var lang = (document.documentElement.lang || 'en').slice(0, 2), D, R, TL;
  var C = Object.assign({ cal: 'islamic-umalqura', adj: 0 }, SO.get('so.cal2', {}) || {}), HF = null;
  try { HF = new Intl.DateTimeFormat('en-u-ca-' + C.cal + '-nu-latn', { timeZone: 'UTC', day: 'numeric', month: 'numeric', year: 'numeric' }); } catch (e) {}
  var L = SO.get('so.ploc', null), PS = window.PT && PT.ok ? PT.settings() : null;
  var F = SO.get('so.fast', {}) || {}, TAR = SO.get('so.rtar', {}) || {}, mode = 'fast', tick = null;
  function t(k, a) { var s = R[k] != null ? R[k] : TL[k] != null ? TL[k] : D.rt.en[k] != null ? D.rt.en[k] : D.tl.en[k] != null ? D.tl.en[k] : k; if (a) for (var x in a) s = s.split('{' + x + '}').join(a[x]); return s; }
  function U(y, m, d) { return new Date(Date.UTC(y, m - 1, d)); }
  function addDays(d, n) { return new Date(d.getTime() + n * 864e5); }
  function key(d) { return d.getUTCFullYear() + '-' + (d.getUTCMonth() + 1) + '-' + d.getUTCDate(); } // the Islamic Calendar's fasted keys
  function H(d) { if (!HF) return null; var o = {}; HF.formatToParts(addDays(d, +C.adj || 0)).forEach(function (p) { o[p.type] = p.value; }); return { y: parseInt(o.year, 10), m: +o.month, d: +o.day }; }
  function fromH(y, m, d) { var est = U(622, 7, 16 + Math.round((y - 1) * 354.367 + (m - 1) * 29.5306 + d - 1));
    for (var i = -20; i <= 20; i++) { var x = addDays(est, i), h = H(x); if (h && h.y === y && h.m === m && h.d === d) return x; } return null; }
  // the civil day of the saved prayer location (not the device), as the app
  function todayU() { var n = new Date(); if (L && window.PT) { var y = PT.ymd(L, n); return U(y.year, y.month, y.day); } return U(n.getFullYear(), n.getMonth() + 1, n.getDate()); }
  function ptOf(d) { if (!L || !PS) return null; try { return PT.times(PS, L, d.getUTCFullYear(), d.getUTCMonth() + 1, d.getUTCDate()); } catch (e) { return null; } }
  function tm(d) { return PT.fmt(PS, L, d); }
  function dStr(d) { return d.toLocaleDateString(lang !== 'en' ? lang + '-u-nu-latn' : 'en-GB', { timeZone: 'UTC', weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }); }
  // RamadanCalendarOverviewService.forCivilDate
  function overview(T0) { var h = H(T0); if (!h) return null; var y = h.m <= 9 ? h.y : h.y + 1, first = fromH(y, 9, 1); if (!first) return null;
    var n = 0; while (n < 31) { var x = H(addDays(first, n)); if (!x || x.m !== 9) break; n++; } if (n !== 29 && n !== 30) return null;
    return { y: y, first: first, days: n, day: h.m === 9 && h.y === y && h.d >= 1 && h.d <= n ? h.d : null }; }
  // RamadanFastingTimelineService.forNow
  function timeline(O, T0, now) { if (!L || !PS) return null;
    try {
      if (O.day == null) { var ff = ptOf(O.first); if (!ff || !(ff.fajr > now)) return null; return { ph: 'beforeRamadan', target: ff.fajr }; }
      var p = ptOf(T0); if (!p || !(p.fajr < p.maghrib)) return null;
      if (now < p.fajr) return { ph: 'beforeFajr', target: p.fajr, fajr: p.fajr, maghrib: p.maghrib };
      if (now < p.maghrib) return { ph: 'beforeIftar', target: p.maghrib, fajr: p.fajr, maghrib: p.maghrib };
      if (O.day >= O.days) return { ph: 'finalIftar', target: null, fajr: p.fajr, maghrib: p.maghrib };
      var nx = ptOf(addDays(T0, 1)); if (!nx) return null; return { ph: 'afterIftar', target: nx.fajr, fajr: p.fajr, maghrib: p.maghrib };
    } catch (e) { return null; } }
  function left(ms) { var m = Math.max(0, Math.floor(ms / 6e4)), d = Math.floor(m / 1440), h = Math.floor(m % 1440 / 60), mi = m % 60;
    return d > 0 ? t('remainingDays', { days: d, hours: h, minutes: mi }) : h > 0 ? t('remainingHours', { hours: h, minutes: mi }) : t('remainingMinutes', { minutes: mi }); }
  function ring(p, sz, sw) { var r = (sz - sw) / 2, c = 2 * Math.PI * r;
    return '<svg viewBox="0 0 ' + sz + ' ' + sz + '" aria-hidden="true"><defs><linearGradient id="rm-g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#5856D6"/><stop offset="1" stop-color="#FF9500"/></linearGradient></defs>' +
      '<circle class="trk" cx="' + sz / 2 + '" cy="' + sz / 2 + '" r="' + r + '" stroke-width="' + sw + '"/><circle class="val" cx="' + sz / 2 + '" cy="' + sz / 2 + '" r="' + r + '" stroke-width="' + sw + '" stroke-dasharray="' + c.toFixed(2) + '" stroke-dashoffset="' + (c * (1 - Math.max(0, Math.min(1, p)))).toFixed(2) + '" transform="rotate(-90 ' + sz / 2 + ' ' + sz / 2 + ')"/></svg>'; }
  function svg(p) { return '<svg viewBox="0 0 24 24" aria-hidden="true">' + p + '</svg>'; }
  var IC = { suhoor: '<path d="M3 18h18M6.5 14.5a5.5 5.5 0 0 1 11 0M12 5v3M5 8l1.8 1.8M19 8l-1.8 1.8"/>', iftar: '<path d="M19.5 14.5A8 8 0 1 1 9.5 4.5a6.3 6.3 0 0 0 10 10z"/>',
    star: '<path d="M12 3l1.8 5.4L19 10l-5.2 1.6L12 17l-1.8-5.4L5 10l5.2-1.6z"/>', book: '<path d="M3 5.5C5.5 4 8.5 4 12 6c3.5-2 6.5-2 9-.5V19c-2.5-1.5-5.5-1.5-9 .5-3.5-2-6.5-2-9-.5z"/><path d="M12 6v13.5"/>',
    give: '<path d="M12 21s-6.5-4-6.5-9a3.5 3.5 0 0 1 6.5-1.8A3.5 3.5 0 0 1 18.5 12c0 5-6.5 9-6.5 9z"/>', rep: '<path d="M4 12a8 8 0 0 1 14-5.3M20 12a8 8 0 0 1-14 5.3"/><path d="M18 3v4h-4M6 21v-4h4"/>',
    cal: '<rect x="3.5" y="5" width="17" height="15" rx="2"/><path d="M3.5 10h17M8 3v4M16 3v4"/>', duas: '<path d="M7 21v-4.5L4.5 12V6.5a1.2 1.2 0 0 1 2.4 0V11"/><path d="M6.9 9.5V4.8a1.2 1.2 0 0 1 2.4 0v6.7L11 14v7"/><path d="M17 21v-4.5l2.5-4.5V6.5a1.2 1.2 0 0 0-2.4 0V11"/><path d="M17.1 9.5V4.8a1.2 1.2 0 0 0-2.4 0v6.7L13 14v7"/>' };
  function note(ti, b) { return '<section class="ts-card rm-note"><b>' + esc(ti) + '</b><p>' + esc(b) + '</p></section>'; }
  var O = null, T0 = null;
  function hero() { var now = new Date(), TLn = timeline(O, T0, now), day = O.day, tot = O.days, prog = 0;
    if (TLn && TLn.ph === 'beforeIftar') prog = (now - TLn.fajr) / (TLn.maghrib - TLn.fajr); else if (day != null) prog = day / Math.max(1, tot);
    var night = day == null ? null : TLn && TLn.ph === 'beforeFajr' ? day : day + 1, odd = night != null && night >= 21 && night <= tot && night % 2 === 1;
    var txt = TLn && TLn.target ? left(TLn.target - now) : day == null ? '—' : day + ' / ' + tot;
    var HL = { beforeRamadan: 'beforeRamadan', beforeFajr: 'beforeFajr', beforeIftar: 'beforeIftar', afterIftar: 'afterIftar', finalIftar: 'finalIftar' }[TLn && TLn.ph];
    var h = '<div class="rm-top"><div class="rm-ring">' + ring(prog, 124, 10) + '<b id="rm-left">' + esc(txt) + '</b></div><div class="rm-hd">' +
      '<b>' + esc(day == null ? t('upcomingRamadan') : t('ramadanCalendarDay', { day: day })) + '</b><small>' + esc(t('hijriYear', { year: O.y })) + '</small>' +
      (HL ? '<em>' + esc(t(HL + 'Headline')) + '</em>' : '') +
      (day == null ? '<small>' + esc(t('firstFastingDay', { date: dStr(O.first) })) + '</small>' : '') +
      (day == null && TLn && TLn.target ? '<small>' + esc(t('firstEstimatedFajr', { time: tm(TLn.target) })) + '</small>' : '') + '</div></div>';
    if (HL) h += '<p class="rm-help">' + esc(t(HL + 'Helper')) + '</p>';
    else if (!L) h += '<p class="rm-msg"><b>' + esc(t('locationRequiredTitle')) + '</b><span>' + esc(t('locationRequiredBody')) + '</span> <a href="../prayer/">' + esc(window.SOI18N ? SOI18N.t('Prayer Times') : 'Prayer Times') + ' ›</a></p>';
    else h += '<p class="rm-msg"><b>' + esc(t('countdownUnavailableTitle')) + '</b><span>' + esc(t('countdownUnavailableBody')) + '</span></p>';
    if (TLn && TLn.fajr) h += '<div class="rm-times"><div style="--tc:#5856D6"><i class="rm-ic">' + svg(IC.suhoor) + '</i><small>' + esc(t('ramSuhoorEnds')) + '</small><b>' + esc(tm(TLn.fajr)) + '</b></div>' +
      '<div style="--tc:#FF9500"><i class="rm-ic">' + svg(IC.iftar) + '</i><small>' + esc(t('ramIftar')) + '</small><b>' + esc(tm(TLn.maghrib)) + '</b></div></div>';
    if (odd) h += '<p class="rm-odd">' + svg(IC.star) + '<span>' + esc(t('ramOddNight', { n: night })) + '</span></p>';
    if (L && L.name) h += '<p class="rm-place">' + esc(L.name) + '</p>';
    $('#rm-hero').innerHTML = h; }
  function nights() { return (TAR[O.y] || []).slice(); }
  function dateOf(day) { return addDays(O.first, day - 1); }
  function tracker() { var ns = nights(), fasted = 0, h = '';
    for (var d = 1; d <= O.days; d++) { var dt = dateOf(d), fut = dt > T0, on = mode === 'tar' ? ns.indexOf(d) > -1 : !!F[key(dt)]; if (F[key(dt)]) fasted++;
      h += '<button type="button" class="rm-day' + (on ? ' on' : '') + (d >= 21 ? ' ten' : '') + '" data-d="' + d + '"' + (fut ? ' disabled' : '') + ' aria-pressed="' + on + '" aria-label="' + d + '">' + d + (d >= 21 && d % 2 ? '<i>' + svg(IC.star) + '</i>' : '') + '</button>'; }
    $('#rm-grid').innerHTML = h; $('#rm-grid').className = 'rm-grid ' + (mode === 'tar' ? 'tar' : 'fast');
    $('#rm-counts').textContent = t('ramCounts', { fasts: fasted, nights: ns.length });
    root.querySelectorAll('#rm-mode button').forEach(function (b) { b.setAttribute('aria-selected', b.getAttribute('data-m') === mode); }); }
  function quran() { var day = O.day, last = SO.get('so.last', null), j = D.juz, jz = day != null ? Math.max(1, Math.min(30, day)) : null;
    var href = last && last.s ? '../sura/?n=' + last.s + (last.a > 1 ? '#' + last.a : '') : jz && j ? '../sura/?n=' + j[jz - 1][0] + (j[jz - 1][1] > 1 ? '#' + j[jz - 1][1] : '') : '../read/';
    $('#rm-quran').innerHTML = '<i class="rm-tic" style="--tc:#1F9D5C">' + svg(IC.book) + '</i><div>' + (jz ? (j ? '<a href="../sura/?n=' + j[jz - 1][0] + (j[jz - 1][1] > 1 ? '#' + j[jz - 1][1] : '') + '"><b>' + esc(t('ramJuzToday', { n: jz })) + '</b></a>' : '<b>' + esc(t('ramJuzToday', { n: jz })) + '</b>') : '') +
      '<small>' + esc(t('ramJuzNote')) + '</small></div><a class="btn btn-ghost sm" href="' + href + '">' + esc(t('ramContinue')) + '</a>'; }
  function duties() { var q = Math.max(0, +SO.get('so.rqada', 0) || 0);
    $('#rm-duties').innerHTML = '<div class="rm-row"><i class="rm-tic" style="--tc:#1F9D5C">' + svg(IC.give) + '</i><div><b>' + esc(t('ramZakat')) + '</b><small>' + esc(t('ramZakatNote')) + '</small><a class="rm-src" href="https://sunnah.com/bukhari:1503" target="_blank" rel="noopener">Sahih al-Bukhari 1503</a></div><a class="btn btn-ghost sm" href="../zakat/">Zakat ›</a></div>' +
      '<div class="rm-row"><i class="rm-tic" style="--tc:#007AFF">' + svg(IC.rep) + '</i><div><b>' + esc(t('ramQada')) + '</b><small>' + esc(t('ramQadaNote')) + '</small><span class="rm-src"><a href="../sura/?n=2#184">Quran 2:184</a> · <a href="https://sunnah.com/bukhari:1950" target="_blank" rel="noopener">Sahih al-Bukhari 1950</a></span></div>' +
      '<div class="rm-step"><button type="button" class="ts-rb" data-q="-1" aria-label="−"' + (q ? '' : ' disabled') + '>−</button><b id="rm-q">' + q + '</b><button type="button" class="ts-rb" data-q="1" aria-label="+">+</button></div></div>'; }
  function draw() { T0 = todayU(); O = overview(T0);
    var notes = ''; if (!O) notes += note(t('dateUnavailableTitle'), t('dateUnavailableBody'));
    $('#rm-notes').innerHTML = notes; root.classList.toggle('no-ov', !O);
    if (O) { hero(); tracker(); quran(); }
    duties();
    $('#rm-est').textContent = t('estimateNoticeBody', { adjustment: (+C.adj > 0 ? '+' : '') + (+C.adj || 0) }) + '\n' + t('monthMayBeginAtSunset');
    var hd = document.getElementById('rm-hero-n'); if (hd) hd.textContent = O ? (O.day != null ? O.day + ' / ' + O.days : O.y + ' AH') : '—';
    var hs = document.getElementById('rm-hero-s'); if (hs) hs.textContent = O ? (O.day != null ? t('calRamadan') : t('upcomingRamadan')) : '';
  }
  root.addEventListener('click', function (e) {
    var m = e.target.closest('#rm-mode button'); if (m) { mode = m.getAttribute('data-m'); tracker(); return; }
    var c = e.target.closest('.rm-day'); if (c && !c.disabled && O) { var d = +c.getAttribute('data-d');
      if (mode === 'tar') { var ns = nights(), i = ns.indexOf(d); if (i > -1) ns.splice(i, 1); else ns.push(d); ns.sort(function (a, b) { return a - b; }); TAR = SO.get('so.rtar', {}) || {}; TAR[O.y] = ns; SO.set('so.rtar', TAR); }
      else { F = SO.get('so.fast', {}) || {}; var k = key(dateOf(d)); if (F[k]) delete F[k]; else F[k] = 1; SO.set('so.fast', F); }
      if (navigator.vibrate) try { navigator.vibrate(8); } catch (x) {}
      tracker(); return; }
    var q = e.target.closest('[data-q]'); if (q) { SO.set('so.rqada', Math.max(0, (+SO.get('so.rqada', 0) || 0) + +q.getAttribute('data-q'))); duties(); }
  });
  window.addEventListener('storage', function (e) { if (/^so\.(fast|rtar|rqada|cal2|ploc|pt)$/.test(e.key || '')) { F = SO.get('so.fast', {}) || {}; TAR = SO.get('so.rtar', {}) || {}; draw(); } });
  Promise.all([fetch(root.getAttribute('data-src')).then(function (r) { return r.json(); }), SO.j('../assets/data/index.json').catch(function () { return null; })]).then(function (r) {
    D = r[0]; D.juz = r[1] && r[1].juz; R = D.rt[lang] || D.rt.en; TL = D.tl[lang] || D.tl.en;
    root.querySelectorAll('[data-t]').forEach(function (e) { e.textContent = t(e.getAttribute('data-t')); });
    document.querySelectorAll('.tb-top [data-t], .cl-hero [data-t]').forEach(function (e) { e.textContent = t(e.getAttribute('data-t')); });
    $('#rm-dua').innerHTML = '<p class="rm-ar" lang="ar" dir="rtl">' + esc(D.dua.ar) + '</p><p class="rm-tl">' + esc(D.dua.tl) + '</p><p class="rm-en" lang="en">' + esc(D.dua.en) + '</p><a class="rm-src" href="https://sunnah.com/abudawud:2357" target="_blank" rel="noopener">' + esc(D.dua.src) + '</a>'; // the meaning stays English until the owner's review, as the app
    draw(); clearInterval(tick); tick = setInterval(function () { if (document.hidden || !O) return; if (key(todayU()) !== key(T0)) draw(); else hero(); }, 15000);
  }).catch(function () { $('#rm-notes').innerHTML = '<section class="ts-card rm-note"><b>Ramadan Tools</b><p>Could not load. Please refresh.</p></section>'; });
})();
