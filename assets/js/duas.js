// Duas & Adhkar: data copied unchanged from the SiraatOne Quran app (assets/data/duas.json).
// Quranic duas: Arabic is resolved from the verified Quran text (like the app), meaning from the site's verified translation.
(function () {
  var $ = function (id) { return document.getElementById(id); }, esc = SO.esc;
  var O = Object.assign({ tab: 'morning', font: 'uthmani', size: 1, tr: true, mean: true, num: true, cat: '' }, SO.get('so.dopt', {}));
  var D, CH, saved = SO.get('so.duafav', []), counts = {};
  function save() { SO.set('so.dopt', O); }
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
    return saved.filter(function (id) { return D.entries[id]; });
  }
  function card(e, i, qt) {
    var ev = O.tab === 'evening', ar = qt ? qt.ar : (ev && e.eveningArabic) || e.arabic, me = qt ? (qt.en + ' (Saheeh International)') : (ev && e.eveningMeaningEn) || e.meaningEn;
    var tl = (ev && e.eveningTransliteration) || e.transliteration, pu = (ev && e.eveningPurposeEn) || e.purposeEn;
    var rep = O.tab === 'morning' ? e.morningRepetitions : O.tab === 'evening' ? e.eveningRepetitions : null, key = e.id + ':' + O.tab, done = counts[key] || 0;
    return '<li class="dua" data-id="' + e.id + '"><div class="d-top">' + (O.num ? '<span class="c-num">' + (i + 1) + '</span>' : '') + '<b>' + esc(e.title) + '</b>' +
      '<button type="button" class="act d-fav" aria-pressed="' + (saved.indexOf(e.id) > -1) + '" aria-label="Save"><svg viewBox="0 0 24 24"><path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z"/></svg></button></div>' +
      (ar ? '<p class="d-ar" lang="ar" dir="rtl">' + esc(ar) + '</p>' : '') +
      (O.tr && tl ? '<p class="d-tl">' + esc(tl) + '</p>' : '') + (O.mean && me ? '<p class="d-me">' + esc(me) + '</p>' : '') +
      (pu ? '<p class="d-meta"><b>Virtue:</b> ' + esc(pu) + '</p>' : '') + (e.whenToSayEn ? '<p class="d-meta"><b>When:</b> ' + esc(e.whenToSayEn) + '</p>' : '') + (e.practiceEn ? '<p class="d-meta"><b>Practice:</b> ' + esc(e.practiceEn) + '</p>' : '') +
      (rep ? '<button type="button" class="d-count' + (done >= rep ? ' done' : '') + '" data-k="' + key + '" data-max="' + rep + '">' + (done >= rep ? 'Done ✓' : done + ' / ' + rep + ' — tap to count') + '</button>' : '') +
      '<details class="d-src"><summary>Source' + (e.quran ? ' · Quran ' + e.quran[0] + ':' + e.quran[1] + (e.quran[2] > e.quran[1] ? '-' + e.quran[2] : '') : '') + '</summary>' +
      e.sources.map(function (s) { return '<p><b>' + esc(s[0]) + '</b><br>' + esc(s[1]) + '</p>'; }).join('') + '</details></li>';
  }
  function render() {
    document.querySelectorAll('#d-tabs button').forEach(function (b) { b.setAttribute('aria-selected', b.dataset.t === O.tab); });
    var cs = $('d-cat'), showCat = O.tab === 'prophetic' || O.tab === 'quranic'; cs.hidden = !showCat;
    if (showCat) { var have = Object.keys(D.categoryTitles).filter(function (k) { return (D.categories[k] || []).some(function (id) { return D.entries[id].collection === O.tab; }); });
      if (have.indexOf(O.cat) < 0) O.cat = '';
      cs.innerHTML = '<option value="">All categories</option>' + have.map(function (k) { return '<option value="' + k + '">' + esc(D.categoryTitles[k]) + '</option>'; }).join(''); cs.value = O.cat; } else O.cat = '';
    var q = $('d-q').value.trim().toLowerCase(), list = ids().map(function (id) { return D.entries[id]; }).filter(function (e) { return !q || (e.title + ' ' + (e.meaningEn || '') + ' ' + (e.category || '')).toLowerCase().indexOf(q) > -1; });
    document.body.dataset.dfont = O.font; document.documentElement.style.setProperty('--d-size', O.size);
    if (!list.length) { $('d-list').innerHTML = '<li class="empty">' + (O.tab === 'saved' ? 'Nothing saved yet. Tap ♡ on any dua.' : 'No dua found.') + '</li>'; return; }
    Promise.all(list.map(function (e) { return e.quran ? quranText(e.quran) : null; })).then(function (qs) { $('d-list').innerHTML = list.map(function (e, i) { return card(e, i, qs[i]); }).join(''); });
  }
  SO.j('../assets/data/duas.json').then(function (d) {
    D = d; $('d-note').textContent = d.note;
    $('d-font').value = O.font; $('d-size').value = String(O.size); $('d-tr').checked = O.tr; $('d-mean').checked = O.mean; $('d-num').checked = O.num;
    render();
  }).catch(function () { $('d-list').innerHTML = '<li class="empty">Could not load. Please refresh.</li>'; });
  $('d-tabs').onclick = function (e) { var b = e.target.closest('button'); if (!b) return; O.tab = b.dataset.t; save(); render(); };
  $('d-cat').onchange = function () { O.cat = this.value; save(); render(); };
  $('d-font').onchange = function () { O.font = this.value; save(); render(); };
  $('d-size').onchange = function () { O.size = +this.value; save(); render(); };
  [['d-tr', 'tr'], ['d-mean', 'mean'], ['d-num', 'num']].forEach(function (p) { $(p[0]).onchange = function () { O[p[1]] = this.checked; save(); render(); }; });
  var tm; $('d-q').oninput = function () { clearTimeout(tm); tm = setTimeout(render, 200); };
  $('d-list').onclick = function (e) {
    var f = e.target.closest('.d-fav');
    if (f) { var id = f.closest('.dua').dataset.id, i = saved.indexOf(id); if (i > -1) saved.splice(i, 1); else saved.unshift(id); SO.set('so.duafav', saved); f.setAttribute('aria-pressed', i < 0); return; }
    var c = e.target.closest('.d-count');
    if (c) { var k = c.dataset.k, mx = +c.dataset.max; counts[k] = Math.min(mx, (counts[k] || 0) + 1);
      if (navigator.vibrate) navigator.vibrate(counts[k] >= mx ? [40, 40, 80] : 10);
      c.classList.toggle('done', counts[k] >= mx); c.textContent = counts[k] >= mx ? 'Done ✓' : counts[k] + ' / ' + mx + ' — tap to count'; }
  };
})();
