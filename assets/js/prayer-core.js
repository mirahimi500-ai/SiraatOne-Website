// Shared prayer-time calculation (Prayer Times page + Home widget). Same as the SiraatOne Azan app: Adhan library,
// app methods and defaults (ISNA, Standard Asr, automatic high-latitude rule: >48° one seventh, else middle of the night),
// Dubai tweak, -30..+30 min adjustments. Settings: so.pt · location: so.ploc (this browser only).
var PT = (function () {
  var A = window.adhan;
  var DEF = { m: 'ISNA', a: 'Shafi', h: 'auto', f: '12', view: 'day', snd: 'notif', vol: 0.8, on: { fajr: true, dhuhr: true, asr: true, maghrib: true, isha: true },
    adj: { fajr: 0, sunrise: 0, dhuhr: 0, asr: 0, maghrib: 0, isha: 0 } };
  var P = ['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha'], FIVE = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'];
  var NAME = { fajr: 'Fajr', sunrise: 'Sunrise', dhuhr: 'Dhuhr', asr: 'Asr', maghrib: 'Maghrib', isha: 'Isha' };
  var AR = { fajr: 'الفجر', sunrise: 'الشروق', dhuhr: 'الظهر', asr: 'العصر', maghrib: 'المغرب', isha: 'العشاء' };
  function settings() { var S = Object.assign({}, DEF, SO.get('so.pt', {})); S.on = Object.assign({}, DEF.on, S.on); S.adj = Object.assign({}, DEF.adj, S.adj); return S; }
  function params(S, L) {
    var M = A.CalculationMethod, p = ({ ISNA: M.NorthAmerica, MWL: M.MuslimWorldLeague, UmmAlQura: M.UmmAlQura, Egyptian: M.Egyptian, Karachi: M.Karachi,
      Moonsighting: M.MoonsightingCommittee, Dubai: M.Dubai, Kuwait: M.Kuwait, Qatar: M.Qatar, Singapore: M.Singapore, Turkey: M.Turkey, Tehran: M.Tehran }[S.m] || M.NorthAmerica)();
    if (S.m === 'Dubai') { p.methodAdjustments.sunrise = 0; p.methodAdjustments.asr = 0; } // as the app: published UAE timetable
    p.madhab = S.a === 'Hanafi' ? A.Madhab.Hanafi : A.Madhab.Shafi;
    var R = A.HighLatitudeRule;
    p.highLatitudeRule = S.h === 'middle' ? R.MiddleOfTheNight : S.h === 'seventh' ? R.SeventhOfTheNight : S.h === 'angle' ? R.TwilightAngle
      : (Math.abs(L.lat) > 48 ? R.SeventhOfTheNight : R.MiddleOfTheNight);
    P.forEach(function (k) { p.adjustments[k] = +S.adj[k] || 0; });
    return p;
  }
  function tz(L) { return (L && L.tz) || Intl.DateTimeFormat().resolvedOptions().timeZone; }
  function ymd(L, d) { var o = {}; new Intl.DateTimeFormat('en-US', { timeZone: tz(L), year: 'numeric', month: 'numeric', day: 'numeric' }).formatToParts(d).forEach(function (x) { o[x.type] = +x.value; }); return o; }
  function times(S, L, y, m, d) { return new A.PrayerTimes(new A.Coordinates(L.lat, L.lng), new Date(y, m - 1, d), params(S, L)); }
  function fmt(S, L, d) { return new Intl.DateTimeFormat((window.SOI18N && SOI18N.lang !== 'en' ? SOI18N.lang + '-u-nu-latn' : 'en-US'), { timeZone: tz(L), hour: 'numeric', minute: '2-digit', hour12: S.f === '12' }).format(d); }
  // current prayer, as in the apps (S1_NO_CURRENT_PRAYER_AFTER_SUNRISE_V1): Fajr until sunrise; none from sunrise to Dhuhr
  // (a Fajr prayed then is late); Isha stays current until Fajr. T(y,m,d) = that day's times, Y(date) = {year, month, day}.
  function curOf(T, Y, now) { var t = Y(now), pt = T(t.year, t.month, t.day), k;
    if (now < pt.fajr) { var y = Y(new Date(now.getTime() - 864e5)); return { k: 'isha', at: T(y.year, y.month, y.day).isha }; }
    if (now < pt.sunrise) k = 'fajr'; else if (now < pt.dhuhr) return null; else k = now >= pt.isha ? 'isha' : now >= pt.maghrib ? 'maghrib' : now >= pt.asr ? 'asr' : 'dhuhr';
    return { k: k, at: pt[k] }; }
  function cur(S, L, now) { return curOf(function (y, m, d) { return times(S, L, y, m, d); }, function (d) { return ymd(L, d); }, now); }
  function since(ms) { var s = Math.max(0, Math.floor(ms / 1000)); return '\u2212' + Math.floor(s / 3600) + ':' + ('0' + Math.floor(s % 3600 / 60)).slice(-2) + ':' + ('0' + s % 60).slice(-2); } // "−h:mm:ss" (shown for 90 min after the Azan)
  var IC = { fajr: '<path d="M3 19h18"/><path d="M15.5 15.5a5.5 5.5 0 1 1-5-9 4.4 4.4 0 0 0 5 9z"/>',
    sunrise: '<path d="M3 19h18"/><path d="M7 19a5 5 0 0 1 10 0"/><path d="M12 6V4M5.6 12.6 4.2 11.2M18.4 12.6l1.4-1.4"/>',
    dhuhr: '<circle cx="12" cy="12" r="4"/><path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6 7 7M17 17l1.4 1.4M5.6 18.4 7 17M17 7l1.4-1.4"/>',
    asr: '<circle cx="12" cy="13" r="4"/><path d="M12 5v2M5 13h2M17 13h2M7 8l1.4 1.4M17 8l-1.4 1.4"/><path d="M3 20h18"/>',
    maghrib: '<path d="M3 19h18"/><path d="M7 19a5 5 0 0 1 10 0"/><path d="M12 5v5M9.5 7.5 12 10l2.5-2.5"/>',
    isha: '<path d="M19.5 14.5A8 8 0 1 1 9.5 4.5a6.3 6.3 0 0 0 10 10z"/><path d="M17 4v3M15.5 5.5h3"/>' };
  function icon(k) { return '<svg class="p-ic" viewBox="0 0 24 24" aria-hidden="true">' + (IC[k] || '') + '</svg>'; }
  function isFri(y, m, d) { return new Date(Date.UTC(y, m - 1, d)).getUTCDay() === 5; }
  function label(k, y, m, d) { return k === 'dhuhr' && isFri(y, m, d) ? 'Jumuʿah' : NAME[k]; }
  function next(S, L, now) { // next of the five prayers (today, or tomorrow's Fajr)
    var t = ymd(L, now), pt = times(S, L, t.year, t.month, t.day);
    for (var i = 0; i < FIVE.length; i++) if (pt[FIVE[i]] > now) return { k: FIVE[i], at: pt[FIVE[i]], y: t.year, m: t.month, d: t.day };
    var tm = ymd(L, new Date(now.getTime() + 864e5)); return { k: 'fajr', at: times(S, L, tm.year, tm.month, tm.day).fajr, y: tm.year, m: tm.month, d: tm.day };
  }
  function left(ms) { var s = Math.max(0, Math.floor(ms / 1000)), h = Math.floor(s / 3600), mi = Math.floor(s % 3600 / 60), se = s % 60;
    return (h ? h + 'h ' : '') + (h || mi ? mi + 'm ' : '') + (h ? '' : se + 's'); }
  // Other times, as in the SiraatOne Azan app: Ishraq/Duha from 20 min after sunrise (the app's safety margin);
  // the night is Maghrib -> next Fajr: middle of the night, and Qiyam = start of its last third (Adhan SunnahTimes).
  function extras(S, L, y, m, d) { var pt = times(S, L, y, m, d), sn = new A.SunnahTimes(pt);
    var M = 60000;
    return { ishraq: new Date(pt.sunrise.getTime() + 20 * M), duhaEnd: new Date(pt.dhuhr.getTime() - 10 * M), midnight: sn.middleOfTheNight, qiyam: sn.lastThirdOfTheNight,
      // times to avoid voluntary prayer, with the app's safety margins (20 min after sunrise, 10 min before Dhuhr and Maghrib)
      avoid: [['After sunrise', pt.sunrise, new Date(pt.sunrise.getTime() + 20 * M)], ['Zawal (sun at its height)', new Date(pt.dhuhr.getTime() - 10 * M), pt.dhuhr],
        ['Before sunset', new Date(pt.maghrib.getTime() - 10 * M), pt.maghrib]] }; }
  // usual calculation method by country (shown only as a suggestion)
  var CC = { US: 'ISNA', CA: 'ISNA', SA: 'UmmAlQura', AE: 'Dubai', KW: 'Kuwait', QA: 'Qatar', PK: 'Karachi', IN: 'Karachi', BD: 'Karachi', AF: 'Karachi',
    EG: 'Egyptian', MY: 'Singapore', SG: 'Singapore', ID: 'Singapore', BN: 'Singapore', TR: 'Turkey', IR: 'Tehran' };
  var TZC = { 'Asia/Karachi': 'PK', 'Asia/Kolkata': 'IN', 'Asia/Calcutta': 'IN', 'Asia/Dhaka': 'BD', 'Asia/Kabul': 'AF', 'Asia/Riyadh': 'SA', 'Asia/Dubai': 'AE', 'Asia/Kuwait': 'KW',
    'Asia/Qatar': 'QA', 'Africa/Cairo': 'EG', 'Asia/Kuala_Lumpur': 'MY', 'Asia/Singapore': 'SG', 'Asia/Jakarta': 'ID', 'Asia/Brunei': 'BN', 'Europe/Istanbul': 'TR', 'Asia/Tehran': 'IR' };
  function suggest(L) { if (!L) return null; var cc = L.cc || TZC[L.tz] || (/^America\/(New_York|Chicago|Denver|Los_Angeles|Phoenix|Anchorage|Detroit|Indiana|Kentucky|Boise|Toronto|Vancouver|Edmonton|Winnipeg|Halifax|Regina|St_Johns)/.test(L.tz || '') ? 'US' : null);
    return cc && CC[cc] ? CC[cc] : null; }
  return { extras: extras, suggest: suggest, ok: !!A, DEF: DEF, P: P, FIVE: FIVE, NAME: NAME, AR: AR, settings: settings, params: params, tz: tz, ymd: ymd, times: times, fmt: fmt, isFri: isFri, label: label, next: next, left: left, cur: cur, curOf: curOf, since: since, icon: icon };
})();
