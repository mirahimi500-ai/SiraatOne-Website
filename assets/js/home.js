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
    if (grid.classList.contains('editing')) {
      var hid = all.filter(function (id) { return order.indexOf(id) < 0; });
      if (hid.length) { var d = document.createElement('div'); d.id = 'qa-add'; d.className = 'qa-add';
        d.innerHTML = '<span>Add:</span>' + hid.map(function (id) { return '<button type="button" data-add="' + id + '">+ ' + tiles[id].querySelector('b').textContent + '</button>'; }).join('');
        grid.after(d); }
    }
  }
  function tools(on) {
    grid.querySelectorAll('.tile').forEach(function (x) {
      var t = x.querySelector('.qa-t'); if (t) t.remove();
      if (on) { t = document.createElement('span'); t.className = 'qa-t';
        t.innerHTML = '<button type="button" data-mv="-1" aria-label="Move earlier">‹</button><button type="button" data-mv="1" aria-label="Move later">›</button><button type="button" data-mv="x" aria-label="Hide">✕</button>'; x.appendChild(t); }
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
// ----- Ayah of the day: same verse for everyone on a given date (verse number from the date), verified data, with reference.
(function () {
  var box = document.getElementById('w-ayah'); if (!box) return;
  SO.j('assets/data/chapters.json').then(function (d) {
    var ch = d.chapters, total = ch.reduce(function (t, c) { return t + c.verses; }, 0), now = new Date(), day = Math.floor(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()) / 864e5);
    var k = (day * 2654435761 % total + total) % total, s = 0;
    while (k >= ch[s].verses) { k -= ch[s].verses; s++; }
    var sn = s + 1, a = k + 1;
    return SO.j('assets/data/sura/' + sn + '.json').then(function (x) {
      document.getElementById('wa-ar').textContent = x.ar[a - 1];
      document.getElementById('wa-tr').textContent = x.en[a - 1] + ' — ' + ch[s].name_simple + ' ' + sn + ':' + a;
      document.getElementById('wa-link').href = 'sura/?n=' + sn + '#' + a;
    });
  }).catch(function () { box.hidden = true; });
})();
// ----- Reading streak: consecutive days with Quran reading in this browser.
(function () {
  var days = SO.get('so.days', []), set = {}; days.forEach(function (d) { set[d] = 1; });
  var dkey = function (dt) { return dt.getFullYear() + '-' + ('0' + (dt.getMonth() + 1)).slice(-2) + '-' + ('0' + dt.getDate()).slice(-2); };
  var d = new Date(), n = 0; if (!set[dkey(d)]) d.setDate(d.getDate() - 1);
  while (set[dkey(d)]) { n++; d.setDate(d.getDate() - 1); }
  var e = document.getElementById('ws-n'); if (!e) return;
  e.textContent = n + (n === 1 ? ' day' : ' days');
  document.getElementById('ws-t').textContent = n ? (set[dkey(new Date())] ? 'You read today. Keep it up!' : 'Read today to keep your streak.') : 'Open the Quran today to start your streak.';
})();
