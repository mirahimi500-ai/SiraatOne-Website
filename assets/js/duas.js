// Duas & Adhkar: data copied unchanged from the SiraatOne Quran app (assets/data/duas.json).
// Quranic duas: Arabic is resolved from the verified Quran text (like the app), meaning from the site's verified translation.
(function () {
  var $ = function (id) { return document.getElementById(id); }, esc = SO.esc;
  var TAPS = {};
  var O = Object.assign({ tab: 'morning', font: 'uthmani', size: 1, tr: true, mean: true, num: true, virtue: true, when: true, prac: true, src: true, cnt: true, cat: '' }, SO.get('so.dopt', {}));
  var D, CH, saved = SO.get('so.duafav', []), counts = {};
  function save() { SO.set('so.dopt', O); }
  // The app's Dua translations for the page language (S1_DUAS_OWN_TRANSLATIONS_V1): SiraatOne translation from the Arabic original;
  // Quran verses quoted word for word from QuranEnc.com, with the app's own source lines. English stays as before.
  var DL = (window.SOI18N && SOI18N.lang) || 'en', LT = null;
  function pt(ps) { return ps ? ps.map(function (p) { return p[1]; }).join('\n') : ''; }
  function lf(e, f) { var x = LT && LT.e[e.id]; return x && x[f] && x[f].length ? x[f] : null; }
  function vref(v) { if (!v || !v.length) return ''; var a = v[0].split(':'), b = v[v.length - 1].split(':'); return a[0] === b[0] ? (v.length > 1 ? a[0] + ':' + a[1] + '–' + b[1] : v[0]) : v.join(', '); }
  function qcred(verses) { var s = LT.str; return (LT.q.version ? s.quranEncSource.replace('{version}', LT.q.version) : s.quranEncSourceNoVersion).replace('{title}', LT.q.title).replace('{verses}', verses); }
  function cred(ps) { var a = []; (ps || []).forEach(function (p) { var t = p[0] === 'Q' ? qcred(vref(p[2])) : LT.str.appTranslationSource; if (a.indexOf(t) < 0) a.push(t); }); return a.length ? '<p class="d-cred" translate="no">' + a.map(esc).join('<br>') + '</p>' : ''; }
  function foot(ps) { var f = []; (ps || []).forEach(function (p) { if (p[3]) f = f.concat(p[3]); }); return f.length ? '<p class="d-foot" translate="no">' + esc(f.join('\n')).replace(/\n/g, '<br>') + '</p>' : ''; }
  function br(t) { return esc(t).replace(/\n/g, '<br>'); }
  function arNum(i) { return Number(i).toLocaleString('ar-EG'); }
  function quranText(q) { // [surah, from, to] -> Promise {ar, en}
    var dir = O.font === 'uthmani' ? 'qpc' : O.font === 'indopak' ? 'indopak' : 'sura';
    return Promise.all([SO.j('../assets/data/' + dir + '/' + q[0] + '.json'), SO.j('../assets/data/sura/' + q[0] + '.json')]).then(function (x) {
      var ar = [], en = []; for (var a = q[1]; a <= q[2]; a++) { ar.push(x[0].ar[a - 1] + ' ﴿' + arNum(a) + '﴾'); en.push(x[1].en[a - 1]); }
      return { ar: ar.join(' '), en: en.join(' ') };
    });
  }
  function ids() {
    var t = O.tab, c = D.collections;
    if (t === 'morning' || t === 'evening') return c.morningEvening.filter(function (id) { return D.entries[id][t + 'Repetitions'] != null; });
    if (t === 'prophetic' || t === 'quranic') { var l = c[t]; return O.cat ? l.filter(function (id) { return (D.categories[O.cat] || []).indexOf(id) > -1; }) : l; }
    if (t === 'prayer') return c.prayerSalah;
    if (t === 'topic') return (D.categories[O.cat] || []).filter(function (id) { return D.entries[id]; });
    if (t === 'all') return Object.keys(D.entries);
    return saved.filter(function (id) { return D.entries[id]; });
  }
  function card(e, i, qt) {
    var ev = O.tab === 'evening', ar = qt ? qt.ar : (ev && e.eveningArabic) || e.arabic, me = qt ? (qt.en + ' (Saheeh International)') : (ev && e.eveningMeaningEn) || e.meaningEn;
    var tl = (ev && e.eveningTransliteration) || e.transliteration, pu = (ev && e.eveningPurposeEn) || e.purposeEn;
    var X = LT && LT.e[e.id], mx = '', ti = e.title, sr = e.sources;
    if (X) { var mp = (ev && lf(e, 'evening_meaning')) || lf(e, 'meaning');
      if (qt && e.quran && LT.qv) { var vs = []; for (var va = e.quran[1]; va <= e.quran[2]; va++) vs.push(LT.qv[e.quran[0] + ':' + va]); if (vs.every(Boolean)) mp = [['Q', vs.join(' '), [e.quran[0] + ':' + e.quran[1], e.quran[0] + ':' + e.quran[2]]]]; }
      if (mp) { me = pt(mp); mx = cred(mp) + foot(mp); } else if (qt && DL === 'ar') me = '';
      ti = pt(lf(e, 'title')) || ti; pu = pt((ev && lf(e, 'evening_purpose')) || lf(e, 'purpose')) || pu;
      if (lf(e, 'source_reference')) sr = [[pt(lf(e, 'source_reference')), pt(lf(e, 'source_assessment'))]]; }
    var wh = X ? pt(lf(e, 'when_to_say')) || e.whenToSayEn : e.whenToSayEn, pr = X ? pt(lf(e, 'practice')) || e.practiceEn : e.practiceEn;
    var rep = O.tab === 'morning' ? e.morningRepetitions : O.tab === 'evening' ? e.eveningRepetitions : null, key = e.id + ':' + O.tab, done = counts[key] || 0;
    return '<li class="dua" data-id="' + e.id + '"><div class="d-top">' + (O.num ? '<span class="c-num">' + (i + 1) + '</span>' : '') + '<b' + (X ? ' translate="no"' : '') + '>' + esc(ti) + '</b>' +
      '<button type="button" class="act d-fav" aria-pressed="' + (saved.indexOf(e.id) > -1) + '" aria-label="Save"><svg viewBox="0 0 24 24"><path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z"/></svg></button></div>' +
      (ar ? '<p class="d-ar" lang="ar" dir="rtl">' + esc(ar).replace(/[\u060C\u061B\u061F]/g, '<span class="ar-p">$&</span>') + '</p>' : '') +
      (O.tr && tl ? '<p class="d-tl">' + esc(tl) + '</p>' : '') + (O.mean && me ? '<p class="d-me"' + (X ? ' translate="no"' : '') + '>' + br(me) + '</p>' + mx : '') +
      (O.virtue && pu ? '<p class="d-meta"><b>Virtue:</b> <span translate="no">' + br(pu) + '</span></p>' : '') + (O.when && wh ? '<p class="d-meta"><b>When:</b> <span translate="no">' + br(wh) + '</span></p>' : '') + (O.prac && pr ? '<p class="d-meta"><b>Practice:</b> <span translate="no">' + br(pr) + '</span></p>' : '') +
      (O.cnt && rep ? '<button type="button" class="d-count' + (done >= rep ? ' done' : '') + '" data-k="' + key + '" data-max="' + rep + '">' + (done >= rep ? 'Done ✓' : done + ' / ' + rep) + '</button>' : '') +
      (O.src ? '<details class="d-src"><summary>Source' + (e.quran ? ' · Quran ' + e.quran[0] + ':' + e.quran[1] + (e.quran[2] > e.quran[1] ? '-' + e.quran[2] : '') : '') + '</summary>' +
      sr.map(function (s) { return '<p translate="no"><b>' + esc(s[0]) + '</b><br>' + br(s[1] || '') + '</p>'; }).join('') + '</details>' : '') + '</li>';
  }
  function render() {
    document.querySelectorAll('#d-tabs button').forEach(function (b) { b.setAttribute('aria-selected', b.dataset.t === O.tab); });
    $('d-cat').hidden = true;
    var q = $('d-q').value.trim().toLowerCase(), list = ids().map(function (id) { return D.entries[id]; }).filter(function (e) { if (!q) return true; if (!window.QS) return (e.title + ' ' + (e.meaningEn || '') + ' ' + (e.category || '') + ' ' + pt(lf(e, 'title')) + ' ' + pt(lf(e, 'meaning'))).toLowerCase().indexOf(q) > -1; var T = QS.terms(q);
      return T.ar ? QS.plain(e.arabic).indexOf(T.phrase) > -1 : QS.test(QS.loose([e.title, e.category, e.whenToSayEn, e.purposeEn, e.meaningEn, e.transliteration, pt(lf(e, 'title')), pt(lf(e, 'meaning'))].join(' ')), T); });
    document.body.dataset.dfont = O.font; document.documentElement.style.setProperty('--d-size', O.size);
    if (!list.length) { $('d-list').innerHTML = '<li class="empty">' + (O.tab === 'saved' ? 'Nothing saved yet. Tap ♡ on any dua.' : 'No dua found.') + '</li>'; return; }
    Promise.all(list.map(function (e) { return e.quran ? quranText(e.quran) : null; })).then(function (qs) { $('d-list').innerHTML = list.map(function (e, i) { return card(e, i, qs[i]); }).join(''); });
  }
  // Landing = the app's Duas & Adhkar screen: Collections folders, then "Browse Prophetic & Quranic Duas" topics (same labels and order as the app)
  var IC = {
    twilight: '<path d="M4 18h16M7 14.5a5 5 0 0 1 10 0M12 4v3M5.2 7.2l2 2M18.8 7.2l-2 2M2.5 14h2M19.5 14h2"/>',
    hands: '<path d="M7 21v-4.5L4.5 12V6.5a1.2 1.2 0 0 1 2.4 0V11"/><path d="M6.9 9.5V4.8a1.2 1.2 0 0 1 2.4 0v6.7L11 14v7"/><path d="M17 21v-4.5l2.5-4.5V6.5a1.2 1.2 0 0 0-2.4 0V11"/><path d="M17.1 9.5V4.8a1.2 1.2 0 0 0-2.4 0v6.7L13 14v7"/>',
    book: '<path d="M3 5.5C5.5 4 8.5 4 12 6c3.5-2 6.5-2 9-.5V19c-2.5-1.5-5.5-1.5-9 .5-3.5-2-6.5-2-9-.5z"/><path d="M12 6v13.5"/>',
    mosque: '<path d="M4 20V11h16v9M2.5 20h19M12 4c2.5 1.5 4 3.3 4 5.5H8C8 7.3 9.5 5.5 12 4zM12 2.5V4M10 20v-4a2 2 0 0 1 4 0v4"/>',
    heart: '<path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z"/>',
    explore: '<circle cx="12" cy="12" r="9"/><path d="M15.5 8.5l-2 5-5 2 2-5z"/>',
    shield: '<path d="M12 3l7 3v5.5c0 4.5-3 7.8-7 9.5-4-1.7-7-5-7-9.5V6z"/>',
    support: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="4"/><path d="M5.6 5.6l3.6 3.6M14.8 14.8l3.6 3.6M18.4 5.6l-3.6 3.6M9.2 14.8l-3.6 3.6"/>',
    wallet: '<rect x="3" y="6" width="18" height="13" rx="2"/><path d="M3 9.5h18M16 14h2"/>',
    home: '<path d="M4 11l8-6.5 8 6.5V20H4zM10 20v-5h4v5"/>',
    drop: '<path d="M12 3.5c3 4 6 7.2 6 10.5a6 6 0 0 1-12 0c0-3.3 3-6.5 6-10.5z"/>',
    food: '<path d="M7 3v8M5 3v5a2 2 0 0 0 4 0V3M7 11v10M16 21V3c-2 1-3.5 3.5-3.5 7H16"/>',
    family: '<circle cx="8" cy="6" r="2.2"/><circle cx="16" cy="6" r="2.2"/><circle cx="12" cy="12.5" r="1.8"/><path d="M4.5 20v-6a3.5 3.5 0 0 1 7 0M12.5 14a3.5 3.5 0 0 1 7 0v6M10 20v-2.5a2 2 0 0 1 4 0V20"/>',
    medical: '<rect x="3.5" y="6.5" width="17" height="13" rx="2"/><path d="M9 6.5V4.5h6v2M12 10v6M9 13h6"/>',
    travel: '<circle cx="11" cy="11" r="7.5"/><path d="M3.5 11h15M11 3.5c2.2 2.2 2.2 12.8 0 15M11 3.5c-2.2 2.2-2.2 12.8 0 15M16.5 16.5l4 4"/>',
    leaf: '<path d="M5 19c0-8 5-13 14-14 0 9-5 14-13 14z"/><path d="M5 19l8-8"/>',
    people: '<circle cx="9" cy="8" r="3"/><circle cx="17" cy="9" r="2.3"/><path d="M3.5 19.5a5.5 5.5 0 0 1 11 0M14.5 19.5a4.2 4.2 0 0 1 6.5-3.5"/>'
  };
  var COLS = [['morning', 'Morning/Evening', 'twilight'], ['prophetic', 'Prophetic', 'hands'], ['quranic', 'Quranic', 'book'], ['prayer', 'Prayer/Salah', 'salah']];
  var TOP = [['faithTawhidRelianceHereafter', 'Faith/Tawhid', 'mosque'], ['praiseDhikrGratitude', 'Praise/Dhikr', 'heart'], ['forgivenessRepentanceMercy', 'Forgive/Mercy', 'hands'], ['guidanceKnowledgeSteadfastness', 'Guidance/Knowledge', 'explore'], ['protectionFromEvilSpiritualHarm', 'Protection', 'shield'], ['distressFearTrialsCalamity', 'Distress/Fear', 'support'], ['provisionDebtWorldlyNeeds', 'Provision/Debt', 'wallet'], ['dailyRoutineSleepHomeClothing', 'Sleep/Home', 'home'], ['purificationMasjidAdhan', 'Purification/Masjid', 'drop'], ['foodDrinkFastingHospitality', 'Food/Fasting', 'food'], ['familyMarriageChildrenParents', 'Family/Marriage', 'family'], ['sicknessHealingDeathBereavement', 'Sickness/Death', 'medical'], ['travelHajjUmrahSacredRites', 'Travel/Hajj', 'travel'], ['natureWeatherTime', 'Nature/Weather', 'leaf'], ['mannersGatheringsBrotherhood', 'Manners/Brotherhood', 'people']];
  function tile(href, label, ic) { return '<a class="d-tile" href="' + href + '"><span class="d-ic">' + (ic === 'salah' ? '<i class="salah-ic" aria-hidden="true"></i>' : '<svg class="ico" viewBox="0 0 24 24" aria-hidden="true">' + IC[ic] + '</svg>') + '</span><b>' + esc(label).replace(/\//g, '/<wbr>') + '</b></a>'; }
  function landing() {
    $('d-cols').innerHTML = COLS.map(function (c) { return tile('#' + c[0], c[1], c[2]); }).join('');
    $('d-topics').innerHTML = TOP.filter(function (t) { return (D.categories[t[0]] || []).length; }).map(function (t) { return tile('#topic-' + t[0], t[1], t[2]); }).join('');
  }
  var TITLE = { morning: 'Morning & Evening Adhkar', evening: 'Morning & Evening Adhkar', prophetic: 'Prophetic Duas', quranic: 'Quranic Duas', prayer: 'Prayer/Salah', saved: 'Saved', all: 'Search results' };
  function route() {
    var h = decodeURIComponent(location.hash.slice(1)), home = !h;
    if (h.indexOf('topic-') === 0) { O.tab = 'topic'; O.cat = h.slice(6); }
    else if (h === 'search') { O.tab = 'all'; }
    else if (TITLE[h]) { O.tab = h === 'morning' && O.tab === 'evening' ? 'evening' : h; O.cat = ''; }
    else home = true;
    $('d-home').hidden = !home; $('d-view').hidden = home;
    side(); hero(home);
    if (home) { $('d-title').textContent = 'Duas & Adhkar'; return; }
    $('d-title').textContent = O.tab === 'topic' ? (D.categoryTitles[O.cat] || '') : TITLE[O.tab];
    $('d-tabs').hidden = !(O.tab === 'morning' || O.tab === 'evening');
    save(); render(); window.scrollTo(0, 0);
  }
  window.addEventListener('hashchange', route);
  // Back: inside a folder -> Duas & Adhkar; on the landing page -> previous page / Home
  $('d-backbtn').onclick = function (e) { if (location.hash.length > 1) { e.preventDefault(); location.hash = ''; } else if (history.length > 1 && document.referrer.indexOf(location.host) > -1) { e.preventDefault(); history.back(); } };
  function count(t) { var c = D.collections; return t === 'morning' ? c.morningEvening.length : t === 'prophetic' ? c.prophetic.length : t === 'quranic' ? c.quranic.length : t === 'prayer' ? c.prayerSalah.length : 0; }
  function side() {
    var cur = location.hash.slice(1);
    $('d-sidecols').innerHTML = COLS.map(function (c) { return '<li><a class="d-sidea" href="#' + c[0] + '" aria-current="' + (cur === c[0] || (c[0] === 'morning' && cur === 'evening')) + '"><span>' + esc(c[1]) + '</span><b>' + count(c[0]) + '</b></a></li>'; }).join('');
    $('d-savedn').textContent = saved.length ? saved.length + (saved.length === 1 ? ' dua saved in this browser.' : ' duas saved in this browser.') : 'Nothing saved yet. Tap ♡ on any dua.';
  }
  function hero(home) {
    var total = Object.keys(D.entries).length;
    if (home) { $('d-hero').innerHTML = '<div class="cl-hd"><small>Duas &amp; Adhkar</small><b lang="ar" dir="rtl">الأدعية والأذكار</b><span>' + total + ' duas · 4 collections · ' + Object.keys(D.categories).length + ' topics</span><em>From the SiraatOne Quran app\'s sourced catalog</em></div><div class="cl-hn"><small>Saved</small><b>' + saved.length + '</b><span><a href="#saved">Open saved duas →</a></span></div>'; return; }
    var n = ids().length, t = O.tab === 'topic' ? (D.categoryTitles[O.cat] || '') : TITLE[O.tab];
    $('d-hero').innerHTML = '<div class="cl-hd"><small>' + (O.tab === 'topic' ? 'Browse topic' : O.tab === 'saved' ? 'Your list' : O.tab === 'all' ? 'Search' : 'Collection') + '</small><b>' + esc(t) + '</b><span>' + n + (n === 1 ? ' dua' : ' duas') + (O.tab === 'morning' || O.tab === 'evening' ? ' · ' + (O.tab === 'morning' ? 'Morning' : 'Evening') : '') + '</span></div><div class="cl-hn"><small>All duas</small><b>' + total + '</b><span><a href="#">All collections →</a></span></div>';
  }
  $('d-hq').onkeydown = function (e) { if (e.key === 'Enter' && this.value.trim()) { $('d-q').value = this.value.trim(); location.hash = 'search'; } };
  var DLS = ['ar', 'ur', 'fa', 'tr', 'id', 'ms', 'bn', 'fr', 'es'];
  Promise.all([SO.j('../assets/data/duas.json'), DLS.indexOf(DL) > -1 ? SO.j('../assets/data/duas-' + DL + '.json?v=20261111').catch(function () { return null; }) : null]).then(function (r) {
    var d = r[0]; LT = r[1] && r[1].e ? r[1] : null;
    D = d; $('d-note').textContent = LT ? LT.str.notesTranslatedNote : d.note; if (LT) $('d-note').setAttribute('translate', 'no'); landing();
    $('d-font').value = O.font; $('d-size').value = String(O.size); $('d-tr').checked = O.tr; $('d-mean').checked = O.mean; $('d-num').checked = O.num; ['virtue', 'when', 'prac', 'src', 'cnt'].forEach(function (k) { $('d-' + k).checked = O[k]; });
    var pq = new URLSearchParams(location.search).get('q'); if (pq) $('d-q').value = pq; // from Home search
    route();
  }).catch(function () { $('d-list').innerHTML = '<li class="empty">Could not load. Please refresh.</li>'; });
  $('d-tabs').onclick = function (e) { var b = e.target.closest('button'); if (!b) return; O.tab = b.dataset.t; save(); render(); hero(false); };
  $('d-cat').onchange = function () { O.cat = this.value; save(); render(); };
  $('d-font').onchange = function () { O.font = this.value; save(); render(); };
  $('d-size').onchange = function () { O.size = +this.value; save(); render(); };
  [['d-tr', 'tr'], ['d-mean', 'mean'], ['d-num', 'num'], ['d-virtue', 'virtue'], ['d-when', 'when'], ['d-prac', 'prac'], ['d-src', 'src'], ['d-cnt', 'cnt']].forEach(function (p) { $(p[0]).onchange = function () { O[p[1]] = this.checked; save(); render(); }; });
  var tm; $('d-q').oninput = function () { clearTimeout(tm); tm = setTimeout(render, 200); };
  $('d-list').onclick = function (e) {
    var f = e.target.closest('.d-fav');
    if (f) { var id = f.closest('.dua').dataset.id, i = saved.indexOf(id); if (i > -1) saved.splice(i, 1); else saved.unshift(id); SO.set('so.duafav', saved); f.setAttribute('aria-pressed', i < 0); return; }
    var c = e.target.closest('.d-count');
    if (c) { var k = c.dataset.k, mx = +c.dataset.max, tn = Date.now(), tp = TAPS[k] = (TAPS[k] || []).filter(function (x) { return tn - x < 700; }).concat(tn);
      counts[k] = mx >= 100 && tp.length >= 3 ? mx : Math.min(mx, (counts[k] || 0) + 1); // as the app: three taps within 0.7 s finish a 100x dhikr
      if (navigator.vibrate) navigator.vibrate(counts[k] >= mx ? [40, 40, 80] : 10);
      c.classList.toggle('done', counts[k] >= mx); c.textContent = counts[k] >= mx ? 'Done ✓' : counts[k] + ' / ' + mx; }
  };
  // settings menu (☰): search, font, size, transliteration, meaning, numbers
  $('d-menu').onclick = function (e) { e.stopPropagation(); var t = $('d-tools'), o = t.classList.toggle('open'); this.setAttribute('aria-expanded', o); };
  document.addEventListener('click', function (e) { var t = $('d-tools'); if (t && t.classList.contains('open') && !e.target.closest('.d-tools')) { t.classList.remove('open'); $('d-menu').setAttribute('aria-expanded', 'false'); } });
  $('d-reset').onclick = function () { ['font', 'size', 'tr', 'mean', 'num', 'virtue', 'when', 'prac', 'src', 'cnt'].forEach(function (k) { delete O[k]; }); O = Object.assign({ font: 'uthmani', size: 1, tr: true, mean: true, num: true, virtue: true, when: true, prac: true, src: true, cnt: true }, O); save(); location.reload(); };
})();
