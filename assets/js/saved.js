// Saved ayahs: Bookmarks / Favorites / Highlights / Notes (same browser data as the Quran reader: so.bm, so.fav, so.hl, so.notes).
// Layout = the Islamic Calendar style. Arabic + translation from the website's verified Quran data (assets/data/sura).
(function () {
  var $ = function (id) { return document.getElementById(id); }, esc = SO.esc, ch = null, filt = 0;
  var HL = { yellow: '#FDE047', amber: '#FBBF24', orange: '#FB923C', red: '#F87171', pink: '#F472B6', purple: '#C084FC', indigo: '#818CF8', blue: '#60A5FA', teal: '#2DD4BF', green: '#4ADE80' };
  var T = { bookmarks: 'Bookmarks', favorites: 'Favorites', highlights: 'Highlights', notes: 'Notes' };
  var DEF = { sort: 'mushaf', size: '1', ar: true, tr: true, conf: true };
  var O = Object.assign({}, DEF, SO.get('so.svopt', {})), tab = T[location.hash.slice(1)] ? location.hash.slice(1) : 'bookmarks';
  function saveO() { SO.set('so.svopt', O); }
  function data() { return { bookmarks: SO.get('so.bm', []), favorites: SO.get('so.fav', []), highlights: SO.get('so.hl', {}), notes: SO.get('so.notes', {}) }; }
  function keys(t, d) { var k = Array.isArray(d[t]) ? d[t].slice() : Object.keys(d[t]); k = k.filter(function (x) { return /^\d+:\d+$/.test(x); });
    if (O.sort === 'mushaf') k.sort(function (a, b) { var x = a.split(':'), y = b.split(':'); return x[0] - y[0] || x[1] - y[1]; }); else k.reverse(); return k; }
  function remove(t, k) { var key = { bookmarks: 'so.bm', favorites: 'so.fav', highlights: 'so.hl', notes: 'so.notes' }[t], v = SO.get(key, Array.isArray(data()[t]) ? [] : {});
    if (Array.isArray(v)) v = v.filter(function (x) { return x !== k; }); else delete v[k]; SO.set(key, v); }
  function draw() {
    var d = data(), ks = keys(tab, d), q = $('sv2-q').value.trim().toLowerCase();
    document.querySelectorAll('#sv2-pill [data-t]').forEach(function (b) { b.setAttribute('aria-selected', b.dataset.t === tab); b.textContent = T[b.dataset.t] + ' (' + keys(b.dataset.t, d).length + ')'; });
    $('sv2-sum').innerHTML = Object.keys(T).map(function (t) { return '<div><small>' + T[t] + '</small><b>' + keys(t, d).length + '</b></div>'; }).join('');
    var per = {}; ks.forEach(function (k) { var s = +k.split(':')[0]; per[s] = (per[s] || 0) + 1; });
    $('sv2-surahs').innerHTML = Object.keys(per).sort(function (a, b) { return a - b; }).map(function (s) { return '<li><button type="button" data-s="' + s + '" aria-pressed="' + (+s === filt) + '"><span>' + s + '. ' + esc(ch[s - 1].name_simple) + '</span><b>' + per[s] + '</b></button></li>'; }).join('') || '<li class="hint">Nothing here yet.</li>';
    if (filt && !per[filt]) filt = 0;
    var list = ks.filter(function (k) { return !filt || +k.split(':')[0] === filt; });
    var last = list[0]; $('sv2-hero').innerHTML = '<div class="cl-hd"><small>' + T[tab] + '</small><b>' + list.length + (list.length === 1 ? ' ayah' : ' ayahs') + '</b><span>' + (filt ? 'in ' + esc(ch[filt - 1].name_simple) : 'in ' + Object.keys(per).length + ' surahs') + '</span></div>' +
      '<div class="cl-hn"><small>' + (O.sort === 'mushaf' ? 'First in Mushaf order' : 'Most recent') + '</small><b>' + (last ? esc(ch[last.split(':')[0] - 1].name_simple) + ' ' + last : '—') + '</b><span>' + (last ? '<a href="../sura/?n=' + last.split(':')[0] + '#' + last.split(':')[1] + '">Open in the reader →</a>' : 'Save ayahs from the reader: tap an ayah → ' + T[tab].replace(/s$/, '')) + '</span></div>';
    if (!list.length) { $('sv2-list').innerHTML = '<li class="empty">' + (tab === 'notes' ? 'No notes yet. Open any ayah in the reader and write a note.' : 'Nothing saved yet. Open any ayah in the reader and tap ' + T[tab].replace(/s$/, '').replace('Highlight', 'a highlight colour') + '.') + '</li>'; return; }
    var need = {}; list.forEach(function (k) { need[k.split(':')[0]] = 1; });
    Promise.all(Object.keys(need).map(function (s) { return SO.j('../assets/data/sura/' + s + '.json').then(function (j) { return [s, j]; }).catch(function () { return [s, null]; }); })).then(function (rs) {
      var S = {}; rs.forEach(function (r) { S[r[0]] = r[1]; });
      var html = list.map(function (k) { var p = k.split(':'), j = S[p[0]], i = +p[1] - 1, ar = j ? j.ar[i] : '', en = j ? j.en[i] : '', hc = d.highlights[k], note = d.notes[k];
        var hay = (ch[p[0] - 1].name_simple + ' ' + k + ' ' + en + ' ' + (note || '')).toLowerCase(); if (q && hay.indexOf(q) < 0) return '';
        return '<li class="sv2-item"' + (hc && HL[hc] ? ' style="--hl:' + HL[hc] + '"' : '') + '><div class="sv2-top"><a href="../sura/?n=' + p[0] + '#' + p[1] + '"><b>' + esc(ch[p[0] - 1].name_simple) + '</b> <span>' + k + '</span></a>' + (hc ? '<i class="sv2-dot" title="' + hc + '"></i>' : '') + '<button type="button" class="act sv2-rm" data-k="' + k + '" aria-label="Remove from ' + T[tab] + '">✕</button></div>' +
          (O.ar && ar ? '<p class="sv2-ar" lang="ar" dir="rtl">' + esc(ar) + '</p>' : '') + (O.tr && en ? '<p class="sv2-en">' + esc(en) + '</p>' : '') + (note ? '<p class="sv2-note">📝 ' + esc(note) + '</p>' : '') + '</li>'; }).join('');
      $('sv2-list').innerHTML = html || '<li class="empty">No match.</li>';
    });
  }
  $('sv2-list').onclick = function (e) { var b = e.target.closest('.sv2-rm'); if (!b) return; if (O.conf && !confirm('Remove ' + b.dataset.k + ' from ' + T[tab] + '?')) return; remove(tab, b.dataset.k); draw(); };
  $('sv2-pill').onclick = function (e) { var b = e.target.closest('[data-t]'); if (!b) return; tab = b.dataset.t; filt = 0; history.replaceState(null, '', '#' + tab); draw(); };
  $('sv2-surahs').onclick = function (e) { var b = e.target.closest('[data-s]'); if (!b) return; filt = filt === +b.dataset.s ? 0 : +b.dataset.s; draw(); };
  $('sv2-all').onclick = function () { filt = 0; draw(); };
  var tm; $('sv2-q').oninput = function () { clearTimeout(tm); tm = setTimeout(draw, 200); };
  function opts() { document.documentElement.style.setProperty('--sv-size', O.size); $('o-sort').value = O.sort; $('o-size').value = O.size; ['ar', 'tr', 'conf'].forEach(function (k) { $('o-' + k).checked = O[k]; }); }
  ['sort', 'size'].forEach(function (k) { $('o-' + k).onchange = function () { O[k] = this.value; saveO(); opts(); draw(); }; });
  ['ar', 'tr', 'conf'].forEach(function (k) { $('o-' + k).onchange = function () { O[k] = this.checked; saveO(); draw(); }; });
  $('o-reset').onclick = function () { O = Object.assign({}, DEF); saveO(); opts(); draw(); };
  $('sv2-menu').onclick = function (e) { e.stopPropagation(); this.setAttribute('aria-expanded', $('sv2-pop').classList.toggle('open')); };
  document.addEventListener('click', function (e) { if (!e.target.closest('#sv2-pop')) $('sv2-pop').classList.remove('open'); });
  $('sv2-back').onclick = function (e) { if (history.length > 1 && document.referrer.indexOf(location.host) > -1) { e.preventDefault(); history.back(); } };
  window.addEventListener('hashchange', function () { if (T[location.hash.slice(1)]) { tab = location.hash.slice(1); filt = 0; draw(); } });
  SO.j('../assets/data/chapters.json').then(function (d) { ch = d.chapters; opts(); draw(); }).catch(function () { $('sv2-list').innerHTML = '<li class="empty">Could not load. Please refresh.</li>'; });
})();
