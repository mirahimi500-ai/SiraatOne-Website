// Home: Last Read card + Continue tile. Reads only this browser's saved position.
(function () {
  var last = SO.get('so.last', null); if (!last) return;
  Promise.all([SO.j('assets/data/chapters.json'), SO.j('assets/data/index.json').catch(function () { return null; })]).then(function (r) {
    var c = r[0].chapters[last.s - 1]; if (!c) return;
    var url = 'sura/?n=' + last.s + '#' + last.a;
    document.getElementById('lr-title').textContent = c.name_simple + ' · Ayah ' + last.a;
    var m = 'Surah ' + last.s;
    if (r[1]) { var p = SO.pos(r[1], last.s, last.a); m += ' · Page ' + p.page + ' · Juz ' + p.juz; }
    document.getElementById('lr-meta').textContent = m;
    var go = document.getElementById('lr-go'); go.href = url; go.textContent = 'Continue';
    var t = document.querySelector('[data-continue]'); if (t) t.href = url;
  });
  var t = document.querySelector('[data-continue]'); if (t) t.href = 'sura/?n=' + last.s + '#' + last.a;
})();
(function () { var t = document.querySelector('[data-continue]'); if (t && t.getAttribute('href') === '') t.href = 'sura/?n=1'; })();

// ----- Quick access: order, hide, add (like the app's Customize Home). Saved in this browser only.
(function () {
  var grid = document.querySelector('.tiles'), btn = document.getElementById('qa-edit'); if (!grid || !btn) return;
  var all = Array.prototype.map.call(grid.querySelectorAll('.tile'), function (x) { return x.getAttribute('data-id'); });
  var order = SO.get('so.qa', null) || all.slice();
  order = order.filter(function (id) { return all.indexOf(id) > -1; });
  function draw() {
    var tiles = {}; grid.querySelectorAll('.tile').forEach(function (x) { tiles[x.getAttribute('data-id')] = x; });
    all.forEach(function (id) { tiles[id].hidden = order.indexOf(id) < 0; });
    order.forEach(function (id) { grid.appendChild(tiles[id]); });
    all.forEach(function (id) { if (order.indexOf(id) < 0) grid.appendChild(tiles[id]); });
    var add = document.getElementById('qa-add'); if (add) add.remove();
    if (grid.classList.contains('editing') && all.some(function (id) { return order.indexOf(id) < 0; })) {
      var d = document.createElement('p'); d.id = 'qa-add'; d.className = 'hint qa-add'; d.innerHTML = 'To add a removed shortcut back, open <a href="apps/">App Library</a> and tap <b>+ Home</b>.'; grid.after(d);
    }
  }
  function tools(on) {
    grid.querySelectorAll('.tile').forEach(function (x) {
      var t = x.querySelector('.qa-t'); if (t) t.remove();
      if (on) { t = document.createElement('span'); t.className = 'qa-t';
        t.innerHTML = '<button type="button" data-mv="-1" aria-label="Move earlier">‹</button><button type="button" data-mv="1" aria-label="Move later">›</button><button type="button" data-mv="x" aria-label="Remove from Quick access">✕</button>'; x.appendChild(t); }
    });
  }
  btn.onclick = function () { var on = grid.classList.toggle('editing'); btn.textContent = on ? 'Done' : 'Edit'; tools(on); draw(); };
  grid.addEventListener('click', function (e) {
    var b = e.target.closest('[data-mv]'); if (!b) { if (grid.classList.contains('editing')) e.preventDefault(); return; }
    e.preventDefault(); var id = b.closest('.tile').getAttribute('data-id'), i = order.indexOf(id), mv = b.getAttribute('data-mv');
    if (mv === 'x') order.splice(i, 1); else { var k = i + (+mv); if (k >= 0 && k < order.length) { order.splice(i, 1); order.splice(k, 0, id); } }
    SO.set('so.qa', order); draw();
  });
  document.addEventListener('click', function (e) { var b = e.target.closest('[data-add]'); if (!b) return; order.push(b.getAttribute('data-add')); SO.set('so.qa', order); tools(true); draw(); });
  draw();
})();

// ----- Home summary cards (Islamic Calendar style): Hijri today + next Islamic day, Saved counts, Tasbih. Same browser data and settings as those pages.
(function () {
  var $ = function (id) { return document.getElementById(id); }; if (!$('hm-hijri')) return;
  var C = Object.assign({ cal: 'islamic-umalqura', adj: 0 }, SO.get('so.cal2', {}));
  var HM_EN = ['Muharram', 'Safar', "Rabi' al-Awwal", "Rabi' al-Akhir", 'Jumada al-Ula', 'Jumada al-Akhirah', 'Rajab', "Sha'ban", 'Ramadan', 'Shawwal', "Dhu al-Qa'dah", 'Dhu al-Hijjah'];
  var HM_AR = ['محرم', 'صفر', 'ربيع الأول', 'ربيع الآخر', 'جمادى الأولى', 'جمادى الآخرة', 'رجب', 'شعبان', 'رمضان', 'شوال', 'ذو القعدة', 'ذو الحجة'];
  var EV = [[1, 1, 'Islamic New Year'], [1, 10, 'Ashura'], [9, 1, 'Ramadan begins'], [10, 1, 'Eid al-Fitr'], [12, 9, 'Day of Arafah'], [12, 10, 'Eid al-Adha']]; // dates as on the Islamic Calendar page
  try {
    var f = new Intl.DateTimeFormat('en-u-ca-' + C.cal + '-nu-latn', { timeZone: 'UTC', day: 'numeric', month: 'numeric', year: 'numeric' });
    var H = function (d) { var o = {}; f.formatToParts(new Date(d.getTime() + C.adj * 864e5)).forEach(function (p) { o[p.type] = p.value; }); return { y: +parseInt(o.year, 10), m: +o.month, d: +o.day }; };
    var n = new Date(), t = new Date(Date.UTC(n.getFullYear(), n.getMonth(), n.getDate())), h = H(t);
    $('hm-hijri').textContent = Number(h.d).toLocaleString('ar-EG') + ' ' + HM_AR[h.m - 1] + ' ' + Number(h.y).toLocaleString('ar-EG', { useGrouping: false }) + ' هـ';
    $('hm-hijri-en').textContent = h.d + ' ' + HM_EN[h.m - 1] + ' ' + h.y + ' AH';
    $('hm-greg').textContent = t.toLocaleDateString(undefined, { timeZone: 'UTC', weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    for (var i = 0; i < 400; i++) { var d = new Date(t.getTime() + i * 864e5), x = H(d), e = EV.filter(function (v) { return v[0] === x.m && v[1] === x.d; })[0];
      if (e) { $('hm-next').textContent = e[2]; $('hm-next-d').innerHTML = (i === 0 ? 'Today' : 'in ' + i + (i === 1 ? ' day' : ' days')) + ' · ' + x.d + ' ' + HM_EN[x.m - 1] + ' · <a href="calendar/">Calendar →</a>'; break; } }
  } catch (e) {}
  var cnt = function (k, arr) { var v = SO.get(k, arr ? [] : {}); return (Array.isArray(v) ? v : Object.keys(v)).length; };
  $('hm-saved').innerHTML = [['Bookmarks', cnt('so.bm', 1), 'bookmarks'], ['Favorites', cnt('so.fav', 1), 'favorites'], ['Highlights', cnt('so.hl'), 'highlights'], ['Notes', cnt('so.notes'), 'notes']].map(function (r) { return '<a href="saved/#' + r[2] + '"><small>' + r[0] + '</small><b>' + r[1] + '</b></a>'; }).join('');
  var tb = SO.get('so.tb3', null), all = 0, life = 0;
  if (tb) { Object.keys(tb.dh.rows || {}).forEach(function (k) { all += tb.dh.rows[k].total || 0; }); life = tb.sv ? tb.sv.life : 0; }
  $('hm-tb').innerHTML = '<div><small>Dhikr total</small><b>' + all + '</b></div><div><small>Saved counters</small><b>' + life + '</b></div>';
})();
