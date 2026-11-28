// Prayer Times & Azan. Same calculation as the SiraatOne Azan app: the Adhan library (Batoul Apps, MIT) with the app's
// methods, defaults (ISNA, Standard Asr, automatic high-latitude rule: >48° one seventh, else middle of the night),
// Dubai tweak and -30..+30 min adjustments. Everything runs in the browser; location is stored only in this browser.
(function () {
  'use strict';
  var $ = function (id) { return document.getElementById(id); };
  var esc = SO.esc, A = window.adhan;
  var DEF = { style: 'ring', sky: true, m: 'ISNA', a: 'Shafi', h: 'auto', f: '12', view: 'day', snd: 'notif', vol: 0.8, on: { fajr: true, dhuhr: true, asr: true, maghrib: true, isha: true },
    adj: { fajr: 0, sunrise: 0, dhuhr: 0, asr: 0, maghrib: 0, isha: 0 } };
  var S = Object.assign({}, DEF, SO.get('so.pt', {})); S.on = Object.assign({}, DEF.on, S.on); S.adj = Object.assign({}, DEF.adj, S.adj); if (S.snd === 'complete' || S.snd === 'short') S.snd = 'notif'; // no Azan recordings (no licence), as in the apps
  var L = SO.get('so.ploc', null); // { lat, lng, name, tz }
  function save() { SO.set('so.pt', S); }
  var P = ['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha'], FIVE = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'];
  var NAME = { fajr: 'Fajr', sunrise: 'Sunrise', dhuhr: 'Dhuhr', asr: 'Asr', maghrib: 'Maghrib', isha: 'Isha' };
  var PC = { fajr: '#5856D6', sunrise: '#FF9500', dhuhr: '#32ADE6', asr: '#007AFF', maghrib: '#FF2D55', isha: '#AF52DE' }; // S1_IOS_PRAYER_TILES_V1: one colour per prayer, by the sky at its time
  var AR = { fajr: 'الفجر', sunrise: 'الشروق', dhuhr: 'الظهر', asr: 'العصر', maghrib: 'المغرب', isha: 'العشاء' };
  var HM = ['Muharram', 'Safar', "Rabi' al-Awwal", "Rabi' al-Akhir", 'Jumada al-Ula', 'Jumada al-Akhirah', 'Rajab', "Sha'ban", 'Ramadan', 'Shawwal', "Dhu al-Qa'dah", 'Dhu al-Hijjah'];

  if (!A) { $('pt-hero').innerHTML = '<p class="hint">Prayer times could not be loaded. Please refresh.</p>'; return; }

  // ---------- calculation (shared with the Home widget: prayer-core.js) ----------
  function params() { return PT.params(S, L); }
  function tz() { return (L && L.tz) || Intl.DateTimeFormat().resolvedOptions().timeZone; }
  function ymd(d) { var o = {}; new Intl.DateTimeFormat('en-US', { timeZone: tz(), year: 'numeric', month: 'numeric', day: 'numeric' }).formatToParts(d).forEach(function (x) { o[x.type] = +x.value; }); return o; }
  function times(y, m, d) { return new A.PrayerTimes(new A.Coordinates(L.lat, L.lng), new Date(y, m - 1, d), params()); }
  function tFmt(d) { return new Intl.DateTimeFormat((window.SOI18N && SOI18N.lang !== 'en' ? SOI18N.lang + '-u-nu-latn' : 'en-US'), { timeZone: tz(), hour: 'numeric', minute: '2-digit', hour12: S.f === '12' }).format(d); }
  function dFmt(y, m, d, o) { return new Intl.DateTimeFormat((window.SOI18N && SOI18N.lang !== 'en' ? SOI18N.lang + '-u-nu-latn' : 'en-GB'), Object.assign({ timeZone: 'UTC' }, o)).format(new Date(Date.UTC(y, m - 1, d))); }
  function hijri(y, m, d) {
    var adj = (SO.get('so.cal2', {}) || {}).adj || 0, o = {};
    new Intl.DateTimeFormat('en-u-ca-islamic-umalqura', { timeZone: 'UTC', day: 'numeric', month: 'numeric', year: 'numeric' }).formatToParts(new Date(Date.UTC(y, m - 1, d + adj)))
      .forEach(function (x) { o[x.type] = x.value; });
    return parseInt(o.day, 10) + ' ' + HM[parseInt(o.month, 10) - 1] + ' ' + parseInt(o.year, 10) + ' AH';
  }
  function isFri(y, m, d) { return new Date(Date.UTC(y, m - 1, d)).getUTCDay() === 5; }
  function label(k, y, m, d) { return k === 'dhuhr' && isFri(y, m, d) ? 'Jumuʿah' : NAME[k]; }
  function next(now) { // next of the five prayers (today or tomorrow's Fajr)
    var t = ymd(now), pt = times(t.year, t.month, t.day);
    for (var i = 0; i < FIVE.length; i++) if (pt[FIVE[i]] > now) return { k: FIVE[i], at: pt[FIVE[i]], y: t.year, m: t.month, d: t.day };
    var tm = ymd(new Date(now.getTime() + 864e5)); return { k: 'fajr', at: times(tm.year, tm.month, tm.day).fajr, y: tm.year, m: tm.month, d: tm.day };
  }
  function left(ms) { var s = Math.max(0, Math.floor(ms / 1000)), h = Math.floor(s / 3600), mi = Math.floor(s % 3600 / 60), se = s % 60;
    return (h ? h + 'h ' : '') + (h || mi ? mi + 'm ' : '') + (h ? '' : se + 's'); }

  // ---------- views ----------
  var day = null, mon = null;
  function draw() {
    document.querySelectorAll('#pt-view button').forEach(function (b) { b.setAttribute('aria-selected', b.dataset.v === S.view); });
    $('pt-day').hidden = S.view !== 'day'; $('pt-month').hidden = S.view !== 'month';
    var sg = PT.suggest(L), mo = sg && $('ps-m').querySelector('option[value="' + sg + '"]');
    $('pt-sug').hidden = !(mo && sg !== S.m); if (mo) $('pt-sug').innerHTML = 'Usually used here: <b>' + esc(mo.textContent) + '</b> <button type="button" class="btn btn-ghost sm" data-sug="' + sg + '">Use it</button>';
    $('pt-loc').innerHTML = L ? '<b>' + esc(L.name) + '</b><small>' + L.lat.toFixed(3) + ', ' + L.lng.toFixed(3) + ' · ' + esc(tz()) + '</small>' : 'Not set';
    if (!L) {
      $('pt-hero').innerHTML = '<div class="cl-hd"><small>Prayer Times</small><b>Set your location</b><span>Use your location or search a city to see today\'s prayer times.</span></div>';
      $('pt-list').innerHTML = ''; $('pt-tbl').innerHTML = ''; $('pt-extra').innerHTML = ''; return;
    }
    var t = ymd(new Date()); if (!day) day = t; if (!mon) mon = { year: t.year, month: t.month };
    drawDay(); drawMonth(); drawExtra(); tick();
  }
  function drawDay() {
    var pt = times(day.year, day.month, day.day), c = PT.curOf(times, ymd, new Date()), today = ymd(new Date());
    var isToday = day.year === today.year && day.month === today.month && day.day === today.day;
    $('pt-d1').textContent = dFmt(day.year, day.month, day.day, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    $('pt-d2').textContent = hijri(day.year, day.month, day.day) + (isToday ? ' · Today' : '');
    drawWeek(today);
    var tiles = S.style === 'sun' || S.style === 'cards'; $('pt-list').hidden = tiles; $('pt-tiles').hidden = !tiles; $('pt-tiles').className = 'pt-tiles' + (S.style === 'sun' ? ' row' : '');
    var bell = function (k) { return '<button type="button" class="pt-bell' + (S.on[k] ? ' on' : '') + '" data-bell="' + k + '" aria-pressed="' + !!S.on[k] + '" aria-label="Azan for ' + NAME[k] + '"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 16V11a6 6 0 0 1 12 0v5l1.5 2h-15z"/><path d="M10 20a2 2 0 0 0 4 0"/>' + (S.on[k] ? '' : '<path d="M4 4l16 16"/>') + '</svg></button>'; };
    $('pt-tiles').innerHTML = P.map(function (k) { var cur = isToday && c && c.k === k;
      return '<div class="pt-tile' + (cur ? ' now' : '') + (k === 'sunrise' ? ' sun' : '') + '" style="--pc:' + PC[k] + '"><span class="pt-tic">' + PT.icon(k) + '</span><b>' + label(k, day.year, day.month, day.day) + '</b><time>' + tFmt(pt[k]) + '</time>' + (FIVE.indexOf(k) > -1 ? bell(k) : '<span class="pt-bell-x"></span>') + '</div>'; }).join('');
    $('pt-list').innerHTML = P.map(function (k) {
      var cur = isToday && c && c.k === k, five = FIVE.indexOf(k) > -1;
      return '<li class="pt-row' + (cur ? ' now' : '') + (k === 'sunrise' ? ' sun' : '') + '" style="--pc:' + PC[k] + '"><span class="pt-n">' + PT.icon(k) + '<b>' + label(k, day.year, day.month, day.day) + '</b><small lang="ar" dir="rtl">' + AR[k] + '</small></span>' +
        '<time>' + tFmt(pt[k]) + '</time>' + (five ? '<button type="button" class="pt-bell' + (S.on[k] ? ' on' : '') + '" data-bell="' + k + '" aria-pressed="' + !!S.on[k] + '" aria-label="Azan for ' + NAME[k] + '">' +
        '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 16V11a6 6 0 0 1 12 0v5l1.5 2h-15z"/><path d="M10 20a2 2 0 0 0 4 0"/>' + (S.on[k] ? '' : '<path d="M4 4l16 16"/>') + '</svg></button>' : '<span class="pt-bell-x"></span>') + '</li>';
    }).join('');
  }
  function drawMonth() {
    var n = new Date(Date.UTC(mon.year, mon.month, 0)).getUTCDate(), today = ymd(new Date()), h = '<thead><tr><th>Date</th>' + P.map(function (k) { return '<th>' + NAME[k] + '</th>'; }).join('') + '</tr></thead><tbody>';
    $('pt-m1').textContent = dFmt(mon.year, mon.month, 1, { month: 'long', year: 'numeric' });
    $('pt-m2').textContent = hijri(mon.year, mon.month, 1) + ' – ' + hijri(mon.year, mon.month, n);
    for (var d = 1; d <= n; d++) {
      var pt = times(mon.year, mon.month, d), td = mon.year === today.year && mon.month === today.month && d === today.day;
      h += '<tr' + (td ? ' class="now"' : isFri(mon.year, mon.month, d) ? ' class="fri"' : '') + '><th>' + dFmt(mon.year, mon.month, d, { weekday: 'short', day: 'numeric' }) + '</th>' + P.map(function (k) { return '<td>' + tFmt(pt[k]) + '</td>'; }).join('') + '</tr>';
    }
    $('pt-tbl').innerHTML = h + '</tbody>';
  }
  function drawExtra() {
    var t = ymd(new Date()), pt = times(t.year, t.month, t.day), sn = new A.SunnahTimes(pt), q = A.Qibla(new A.Coordinates(L.lat, L.lng));
    var dirs = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
    var ex = PT.extras(S, L, t.year, t.month, t.day);
    $('pt-avoid').innerHTML = ex.avoid.map(function (a) { return '<li><span>' + a[0] + '</span><b>' + tFmt(a[1]) + ' – ' + tFmt(a[2]) + '</b></li>'; }).join('');
    $('pt-extra').innerHTML = '<li><span>Ishraq / Duha</span><b>' + tFmt(ex.ishraq) + ' – ' + tFmt(ex.duhaEnd) + '</b></li><li><span>Middle of the night</span><b>' + tFmt(sn.middleOfTheNight) + '</b></li><li><span>Qiyam al-Layl (last third)</span><b>' + tFmt(sn.lastThirdOfTheNight) + '</b></li>' +
      '<li><span>Qibla direction</span><b>' + q.toFixed(1) + '° ' + dirs[Math.round(q / 45) % 8] + '</b></li>';
  }
  // ---------- S1_AZAN_STYLES_V1: Ring / Sun path / Cards; S1_AZAN_SKY_V1: sky by the prayer time ----------
  function prevAt(now) { var t = ymd(now), pt = times(t.year, t.month, t.day), best = null;
    P.forEach(function (k) { if (pt[k] <= now && (!best || pt[k] > best)) best = pt[k]; });
    if (best) return best; var y = ymd(new Date(now.getTime() - 864e5)); return times(y.year, y.month, y.day).isha; }
  function sky(now) { var b = document.body, on = !!(S.sky && L), c = PT.curOf(times, ymd, now), k = c ? c.k : 'sunrise';
    P.forEach(function (x) { b.classList.toggle('sky-' + x, on && x === k); }); b.classList.toggle('sky', on); }
  function sunPath(now) {
    var t = ymd(now), pt = times(t.year, t.month, t.day), t0 = +pt.fajr, t1 = +pt.isha, sr = +pt.sunrise, mg = +pt.maghrib, W = 300, H = 120, hz = 78;
    var X = function (ms) { return 14 + (W - 28) * Math.min(1, Math.max(0, (ms - t0) / (t1 - t0))); };
    var Y = function (ms) { return ms >= sr && ms <= mg ? hz - 58 * Math.sin(Math.PI * (ms - sr) / (mg - sr)) : hz + 16 * (ms < sr ? (sr - ms) / (sr - t0) : (ms - mg) / (t1 - mg)); };
    var pts = [], i, n = 60; for (i = 0; i <= n; i++) { var ms = t0 + (t1 - t0) * i / n; pts.push([X(ms), Y(ms), ms]); }
    var pathOf = function (a) { return a.map(function (p, j) { return (j ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1); }).join(''); };
    var done = pts.filter(function (p) { return p[2] <= +now; }), rest = pts.filter(function (p) { return p[2] >= +now; });
    var nowMs = Math.min(t1, Math.max(t0, +now)), sx = X(nowMs), sy = Y(nowMs), day = +now >= sr && +now <= mg;
    var g = '<line x1="6" y1="' + hz + '" x2="' + (W - 6) + '" y2="' + hz + '" class="hz"/>' + (done.length > 1 ? '<path d="' + pathOf(done) + '" class="arc done"/>' : '') + (rest.length > 1 ? '<path d="' + pathOf(rest) + '" class="arc rest"/>' : '') +
      P.map(function (k) { return '<circle cx="' + X(+pt[k]).toFixed(1) + '" cy="' + Y(+pt[k]).toFixed(1) + '" r="4.2" fill="' + PC[k] + '" class="dot"/>'; }).join('') +
      (day ? '<circle cx="' + sx.toFixed(1) + '" cy="' + sy.toFixed(1) + '" r="13" class="glow"/><circle cx="' + sx.toFixed(1) + '" cy="' + sy.toFixed(1) + '" r="7.5" class="sunb"/>'
        : '<path transform="translate(' + (sx - 8).toFixed(1) + ' ' + (sy - 9).toFixed(1) + ')" d="M12 2.5A7.5 7.5 0 1 0 15.5 16 6 6 0 0 1 12 2.5z" class="moon"/>');
    var rtl = document.documentElement.dir === 'rtl';
    return '<svg class="pt-path" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="Sun path today"><g' + (rtl ? ' transform="translate(' + W + ' 0) scale(-1 1)"' : '') + '>' + g + '</g></svg>';
  }
  function timer(now, nx) {
    var c = PT.curOf(times, ymd, now), pa = prevAt(now), fr = Math.min(1, Math.max(0, (now - pa) / (nx.at - pa))), nm = label(nx.k, nx.y, nx.m, nx.d);
    var since = c ? '<small class="pt-since">' + label(c.k, nx.y, nx.m, nx.d) + ' Azan ' + left(now - c.at) + ' ago</small>' : '';
    var cd = '<b class="pt-nm">' + nm + ' <span lang="ar" dir="rtl">' + AR[nx.k] + '</span></b><span class="pt-at">at ' + tFmt(nx.at) + ' · in ' + left(nx.at - now) + '</span>' + since;
    if (S.style === 'sun') return '<div class="cl-hd pt-sunp"><small>Next prayer</small>' + sunPath(now) + cd + '</div>';
    if (S.style === 'cards') return '<div class="cl-hd pt-big" style="--pc:' + PC[nx.k] + '"><span class="pt-tic big">' + PT.icon(nx.k) + '</span><div class="pt-bigt"><small>Next prayer</small>' + cd + '<div class="pt-prog" role="progressbar" aria-valuenow="' + Math.round(fr * 100) + '" aria-valuemin="0" aria-valuemax="100"><i style="width:' + (fr * 100).toFixed(1) + '%"></i></div></div></div>';
    var R = 52, C = 2 * Math.PI * R;
    return '<div class="cl-hd pt-ringw"><div class="pt-ring" style="--pc:' + PC[nx.k] + '"><svg viewBox="0 0 124 124" aria-hidden="true"><circle class="trk" cx="62" cy="62" r="' + R + '"/><circle class="val" cx="62" cy="62" r="' + R + '" stroke-dasharray="' + C.toFixed(1) + '" stroke-dashoffset="' + (C * (1 - fr)).toFixed(1) + '" transform="rotate(-90 62 62)"/></svg><div class="pt-ring-in"><span class="pt-tic">' + PT.icon(nx.k) + '</span><b>' + left(nx.at - now) + '</b></div></div><div class="pt-ringt"><small>Next prayer</small>' + cd + '</div></div>';
  }
  // ---------- S1_AZAN_WEEK_STRIP_V1: a 7-day week strip; tap a day, arrows / swipe for the week; Hijri day under each ----------
  function drawWeek(today) {
    var d0 = new Date(Date.UTC(day.year, day.month - 1, day.day)), dow = d0.getUTCDay(), fd = 0;
    try { var wi = new Intl.Locale(navigator.language || 'en-US'); fd = ((wi.weekInfo || (wi.getWeekInfo && wi.getWeekInfo()) || {}).firstDay || 7) % 7; } catch (e) {}
    var start = new Date(d0.getTime() - ((dow - fd + 7) % 7) * 864e5), h = '';
    for (var i = 0; i < 7; i++) { var x = new Date(start.getTime() + i * 864e5), y = x.getUTCFullYear(), m = x.getUTCMonth() + 1, d = x.getUTCDate();
      var isT = y === today.year && m === today.month && d === today.day, isS = y === day.year && m === day.month && d === day.day, hd = parseInt(hijri(y, m, d), 10);
      h += '<button type="button" class="pt-day' + (isT ? ' today' : '') + '" data-ymd="' + y + '-' + m + '-' + d + '" aria-pressed="' + isS + '"><small>' + dFmt(y, m, d, { weekday: 'narrow' }) + '</small><b>' + d + '</b><em>' + (isNaN(hd) ? '' : hd) + '</em></button>'; }
    $('pt-days').innerHTML = h; $('pt-today').hidden = day.year === today.year && day.month === today.month && day.day === today.day;
  }
  var lastK = '';
  function tick() {
    if (!L) return;
    var now = new Date(), nx = next(now), t = ymd(now);
    var ck = nx.k + nx.d + ((PT.curOf(times, ymd, now) || {}).k || '-');
    if (ck !== lastK) { lastK = ck; if (S.view === 'day' && day && day.day === t.day && day.month === t.month) drawDay(); }
    sky(now); $('pt-hero').innerHTML = timer(now, nx) +
      '<div class="cl-hn"><b>' + esc(L.name) + '</b><span>' + dFmt(t.year, t.month, t.day, { weekday: 'long', day: 'numeric', month: 'long' }) + '</span><span>' + hijri(t.year, t.month, t.day) + '</span><span>' + esc(methodName()) + '</span></div>';
    azanCheck(now);
  }
  function methodName() { var o = $('ps-m').querySelector('option[value="' + S.m + '"]'); return (o ? o.textContent.split(' — ')[0] : S.m) + ' · ' + (S.a === 'Hanafi' ? 'Hanafi Asr' : 'Standard Asr'); }

  // ---------- Azan (while this page is open) ----------
  // Sounds as in the apps, which no longer include Azan recordings (there is no licence for them): the device's
  // notification sound, a short beep made here in the browser (no audio file), or silent.
  var AC = null, fired = {};
  function actx() { try { AC = AC || new (window.AudioContext || window.webkitAudioContext)(); if (AC.state === 'suspended') AC.resume(); } catch (e) { AC = null; } return AC; }
  document.addEventListener('pointerdown', function () { if (S.snd === 'beep') actx(); }, { once: true }); // browsers allow sound only after a tap
  function beep() { var c = actx(); if (!c) return; var t0 = c.currentTime + 0.05;
    for (var i = 0; i < 3; i++) { var o = c.createOscillator(), g = c.createGain(), s = t0 + i * 0.45; o.type = 'sine'; o.frequency.value = 880; o.connect(g); g.connect(c.destination);
      g.gain.setValueAtTime(0, s); g.gain.linearRampToValueAtTime(0.5 * S.vol, s + 0.02); g.gain.setValueAtTime(0.5 * S.vol, s + 0.24); g.gain.linearRampToValueAtTime(0, s + 0.3); o.start(s); o.stop(s + 0.32); } }
  function play(k) { if (S.snd === 'beep') beep(); }
  function notify(k, at, y, m, d, tag) { if (!window.Notification || Notification.permission !== 'granted') return;
    try { var T = window.SOI18N ? SOI18N.t : function (x) { return x; }, nm = T(label(k, y, m, d)); new Notification(nm + ' — ' + tFmt(at), { body: T('It is time for {x} prayer').replace('{x}', nm) + ' · ' + L.name, icon: '../assets/img/logo.png', tag: tag, silent: S.snd !== 'notif' }); } catch (e) {} }
  function azanCheck(now) {
    var t = ymd(now), pt = times(t.year, t.month, t.day);
    FIVE.forEach(function (k) {
      var at = pt[k], id = t.year + '-' + t.month + '-' + t.day + k, d = now - at;
      if (d >= 0 && d < 60000 && !fired[id]) {
        fired[id] = 1; if (!S.on[k]) return;
        play(k);
        notify(k, at, t.year, t.month, t.day, id);
      }
    });
  }
  function notifUi() {
    var b = $('pa-notif'); if (!window.Notification) { b.hidden = true; return; }
    b.textContent = Notification.permission === 'granted' ? '✓ Notifications on' : Notification.permission === 'denied' ? 'Notifications blocked' : 'Allow notifications';
    b.disabled = Notification.permission !== 'default';
  }
  $('pa-notif').onclick = function () { if (window.Notification) Notification.requestPermission().then(notifUi); };
  $('pa-test').onclick = function () { var now = new Date(), x = L ? next(now) : { k: 'dhuhr', at: now, y: 0, m: 0, d: 0 };
    if (S.snd === 'beep') beep();
    if (window.Notification && Notification.permission === 'default') Notification.requestPermission().then(function () { notifUi(); if (L) notify(x.k, x.at, x.y, x.m, x.d, 'test'); });
    else if (L) notify(x.k, x.at, x.y, x.m, x.d, 'test'); };

  // ---------- location ----------
  function setLoc(l) { L = l; SO.set('so.ploc', L); day = mon = null; lastK = ''; draw(); }
  $('pt-gps').onclick = function () {
    var b = this; if (!navigator.geolocation) { b.textContent = 'Location not available'; return; }
    b.textContent = 'Finding you…';
    navigator.geolocation.getCurrentPosition(function (p) { b.textContent = 'Use my location';
      setLoc({ lat: +p.coords.latitude.toFixed(4), lng: +p.coords.longitude.toFixed(4), name: 'My location', tz: Intl.DateTimeFormat().resolvedOptions().timeZone }); },
    function () { b.textContent = 'Location blocked — search a city'; }, { enableHighAccuracy: false, timeout: 15000, maximumAge: 6e5 });
  };
  var qT = null, RES = [];
  $('pt-q').oninput = function () {
    var v = this.value.trim(); clearTimeout(qT); if (v.length < 2) { $('pt-res').innerHTML = ''; return; }
    qT = setTimeout(function () {
      fetch('https://geocoding-api.open-meteo.com/v1/search?count=6&language=en&format=json&name=' + encodeURIComponent(v)).then(function (r) { return r.json(); }).then(function (d) {
        RES = (d && d.results) || [];
        $('pt-res').innerHTML = RES.length ? RES.map(function (x, i) { return '<li><button type="button" class="d-sidea" data-r="' + i + '"><span>' + esc(x.name) + '<small>' + esc([x.admin1, x.country].filter(Boolean).join(', ')) + '</small></span><b>›</b></button></li>'; }).join('') : '<li class="hint">No places found.</li>';
      }).catch(function () { $('pt-res').innerHTML = '<li class="hint">City search is not available right now.</li>'; });
    }, 350);
  };
  $('pt-res').onclick = function (e) { var b = e.target.closest('[data-r]'); if (!b) return; var x = RES[+b.dataset.r];
    setLoc({ lat: +x.latitude.toFixed(4), lng: +x.longitude.toFixed(4), name: x.name + (x.country ? ', ' + x.country : ''), cc: x.country_code || '', tz: x.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone });
    $('pt-res').innerHTML = ''; $('pt-q').value = ''; };

  $('pt-sug').onclick = function (e) { var b = e.target.closest('[data-sug]'); if (!b) return; S.m = b.dataset.sug; save(); form(); lastK = ''; draw(); };
  // ---------- controls ----------
  $('pt-view').onclick = function (e) { var b = e.target.closest('[data-v]'); if (!b) return; S.view = b.dataset.v; save(); draw(); };
  $('pt-day').addEventListener('click', function (e) { var b = e.target.closest('[data-bell]'); if (b) { var k = b.dataset.bell; S.on[k] = !S.on[k]; save(); drawDay(); return; }
    var dd = e.target.closest('[data-ymd]'); if (dd && L) { var q = dd.dataset.ymd.split('-'); day = { year: +q[0], month: +q[1], day: +q[2] }; drawDay(); } });
  $('pt-today').onclick = function () { if (L) { day = ymd(new Date()); drawDay(); } };
  (function () { var x0 = null; $('pt-days').addEventListener('pointerdown', function (e) { x0 = e.clientX; }); $('pt-days').addEventListener('pointerup', function (e) { if (x0 === null || !L) return; var dx = e.clientX - x0; x0 = null; if (Math.abs(dx) > 40) shiftDay((dx < 0) !== (document.documentElement.dir === 'rtl') ? 7 : -7); }); })();
  function shiftDay(n) { var x = new Date(Date.UTC(day.year, day.month - 1, day.day + n)); day = { year: x.getUTCFullYear(), month: x.getUTCMonth() + 1, day: x.getUTCDate() }; drawDay(); }
  $('pt-dprev').onclick = function () { if (L) shiftDay(-7); }; $('pt-dnext').onclick = function () { if (L) shiftDay(7); };
  function shiftMon(n) { var x = new Date(Date.UTC(mon.year, mon.month - 1 + n, 1)); mon = { year: x.getUTCFullYear(), month: x.getUTCMonth() + 1 }; drawMonth(); }
  $('pt-mprev').onclick = function () { if (L) shiftMon(-1); }; $('pt-mnext').onclick = function () { if (L) shiftMon(1); };
  function form() {
    $('ps-m').value = S.m; $('ps-a').value = S.a; $('ps-h').value = S.h; $('ps-f').value = S.f; $('pa-s').value = S.snd; $('pa-v').value = S.vol; $('pa-vo').textContent = Math.round(S.vol * 100) + '%';
    document.querySelectorAll('[data-adj]').forEach(function (s) { s.value = S.adj[s.dataset.adj]; });
    $('ps-sky').checked = !!S.sky; document.querySelectorAll('#ps-st button').forEach(function (b) { b.setAttribute('aria-selected', b.dataset.v === S.style); });
  }
  $('ps-st').onclick = function (e) { var b = e.target.closest('[data-v]'); if (!b) return; S.style = b.dataset.v; save(); form(); lastK = ''; draw(); };
  $('ps-sky').onchange = function () { S.sky = this.checked; save(); draw(); if (!S.sky) sky(new Date()); };
  [['ps-m', 'm'], ['ps-a', 'a'], ['ps-h', 'h'], ['ps-f', 'f'], ['pa-s', 'snd']].forEach(function (x) { $(x[0]).onchange = function () { S[x[1]] = this.value; save(); if (S.snd === 'beep') actx(); lastK = ''; draw(); }; });
  $('pa-v').oninput = function () { S.vol = +this.value; $('pa-vo').textContent = Math.round(S.vol * 100) + '%'; save(); };
  document.querySelectorAll('[data-adj]').forEach(function (s) { s.onchange = function () { S.adj[s.dataset.adj] = +s.value; save(); lastK = ''; draw(); }; });
  $('ps-reset').onclick = function () { var v = S.view; S = JSON.parse(JSON.stringify(DEF)); S.view = v; save(); form(); lastK = ''; draw(); };
  $('pt-menu').onclick = function (e) { e.stopPropagation(); this.setAttribute('aria-expanded', $('pt-pop').classList.toggle('open')); };
  document.addEventListener('click', function (e) { if (!e.target.closest('#pt-pop') && !e.target.closest('.modal')) $('pt-pop').classList.remove('open'); });
  $('ps-adj').onclick = function () { $('pt-adjm').hidden = false; }; $('ps-about').onclick = function () { $('pt-aboutm').hidden = false; };
  document.querySelectorAll('#pt-adjm, #pt-aboutm').forEach(function (m) { m.addEventListener('click', function (e) { if (e.target === m || e.target.closest('[data-close]')) m.hidden = true; }); });

  form(); notifUi(); draw();
  setInterval(tick, 1000);
})();
