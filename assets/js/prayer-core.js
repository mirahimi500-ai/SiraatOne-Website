// Shared prayer-time calculation (Prayer Times page + Home widget). Same as the SiraatOne Azan app: Adhan library,
// app methods and defaults (ISNA, Standard Asr, automatic high-latitude rule: >48° one seventh, else middle of the night),
// Dubai tweak, -30..+30 min adjustments. Settings: so.pt · location: so.ploc (this browser only).
var PT = (function () {
  var A = window.adhan;
  var DEF = { m: 'ISNA', a: 'Shafi', h: 'auto', f: '12', view: 'day', snd: 'complete', vol: 0.8, on: { fajr: true, dhuhr: true, asr: true, maghrib: true, isha: true },
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
  function fmt(S, L, d) { return new Intl.DateTimeFormat('en-US', { timeZone: tz(L), hour: 'numeric', minute: '2-digit', hour12: S.f === '12' }).format(d); }
  function isFri(y, m, d) { return new Date(Date.UTC(y, m - 1, d)).getUTCDay() === 5; }
  function label(k, y, m, d) { return k === 'dhuhr' && isFri(y, m, d) ? 'Jumuʿah' : NAME[k]; }
  function next(S, L, now) { // next of the five prayers (today, or tomorrow's Fajr)
    var t = ymd(L, now), pt = times(S, L, t.year, t.month, t.day);
    for (var i = 0; i < FIVE.length; i++) if (pt[FIVE[i]] > now) return { k: FIVE[i], at: pt[FIVE[i]], y: t.year, m: t.month, d: t.day };
    var tm = ymd(L, new Date(now.getTime() + 864e5)); return { k: 'fajr', at: times(S, L, tm.year, tm.month, tm.day).fajr, y: tm.year, m: tm.month, d: tm.day };
  }
  function left(ms) { var s = Math.max(0, Math.floor(ms / 1000)), h = Math.floor(s / 3600), mi = Math.floor(s % 3600 / 60), se = s % 60;
    return (h ? h + 'h ' : '') + (h || mi ? mi + 'm ' : '') + (h ? '' : se + 's'); }
  return { ok: !!A, DEF: DEF, P: P, FIVE: FIVE, NAME: NAME, AR: AR, settings: settings, params: params, tz: tz, ymd: ymd, times: times, fmt: fmt, isFri: isFri, label: label, next: next, left: left };
})();
