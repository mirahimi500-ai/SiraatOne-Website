// Sura reader. Text comes only from assets/data/sura/N.json (built + validated by scripts/fetch-quran.ps1).
(function () {
  var n = parseInt(new URLSearchParams(location.search).get('n'), 10);
  var $ = function (id) { return document.getElementById(id); };
  if (!(n >= 1 && n <= 114)) { location.replace('../'); return; }
  var root = document.documentElement;
  function get(k, d) { try { return localStorage.getItem(k) || d; } catch (e) { return d; } }
  function set(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  var fs = parseFloat(get('arSize', '1.9')), showTr = get('showTr', '1') === '1';
  function applyFs() { root.style.setProperty('--ar-size', fs + 'rem'); }
  function applyTr() { document.body.classList.toggle('no-tr', !showTr); $('tr-toggle').setAttribute('aria-pressed', showTr); }
  applyFs(); applyTr();
  $('fs-up').onclick = function () { fs = Math.min(3.2, fs + 0.15); set('arSize', fs); applyFs(); };
  $('fs-down').onclick = function () { fs = Math.max(1.3, fs - 0.15); set('arSize', fs); applyFs(); };
  $('tr-toggle').onclick = function () { showTr = !showTr; set('showTr', showTr ? '1' : '0'); applyTr(); };
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]; }); }
  function arNum(i) { return Number(i).toLocaleString('ar-EG'); }
  function j(u) { return fetch(u).then(function (r) { if (!r.ok) throw 0; return r.json(); }); }
  Promise.all([j('../assets/data/chapters.json'), j('../assets/data/sura/' + n + '.json'), n === 1 || n === 9 ? null : j('../assets/data/sura/1.json')])
    .then(function (r) {
      var c = r[0].chapters[n - 1], s = r[1];
      if (s.ar.length !== c.verses || s.en.length !== c.verses) throw 0;
      document.title = c.name_simple + ' — SiraatOne';
      $('s-ar').textContent = c.name_arabic;
      $('s-en').textContent = n + '. ' + c.name_simple;
      $('s-meta').textContent = c.meaning + ' · ' + c.verses + ' verses · ' + (c.place === 'makkah' ? 'Makki' : 'Madani');
      if (r[2]) { $('s-bism').textContent = r[2].ar[0]; $('s-bism').hidden = false; } // Bismillah = verse 1:1, from source data
      $('ayat').innerHTML = s.ar.map(function (a, i) {
        return '<li id="' + (i + 1) + '"><p class="ar" lang="ar" dir="rtl">' + esc(a) + ' <span class="end">﴿' + arNum(i + 1) + '﴾</span></p>' +
          '<p class="tr"><a class="vk" href="#' + (i + 1) + '">' + n + ':' + (i + 1) + '</a> ' + esc(s.en[i]) + '</p></li>';
      }).join('');
      var all = r[0].chapters;
      if (n > 1) { $('prev').href = '?n=' + (n - 1); $('prev').textContent = '← ' + all[n - 2].name_simple; $('prev').hidden = false; }
      if (n < 114) { $('next').href = '?n=' + (n + 1); $('next').textContent = all[n].name_simple + ' →'; $('next').hidden = false; }
      if (location.hash) { var t = document.getElementById(location.hash.slice(1)); if (t) t.scrollIntoView(); }
    })
    .catch(function () { $('s-en').textContent = 'This sura could not be loaded. Please refresh.'; });
})();
