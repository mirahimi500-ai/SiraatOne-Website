// SiraatOne — theme toggle + mobile menu. No tracking, no third-party code.
(function () {
  var root = document.documentElement;
  // Theme: the app's 15 themes (System, Light, Dark, OLED, White Green + 10 Quran themes) + Reduce motion. Saved in this browser only.
  var t = document.getElementById('theme-toggle');
  function get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function set(k, v) { try { if (v === null) localStorage.removeItem(k); else localStorage.setItem(k, v); } catch (e) {} }
  var APP = [['system', 'System'], ['light', 'Light'], ['dark', 'Dark'], ['oled', 'OLED'], ['whitegreen', 'White Green', '#2E7D32']],
    QUR = [['classic', 'Classic Paper', '#F6F0E2'], ['sand', 'Warm Sand', '#E5CC9F'], ['fiber', 'Natural Fiber', '#ECE0C5'], ['ivory', 'Geometric Ivory', '#F3EFDE'], ['green', 'Subtle Green', '#F0F2E4'],
      ['blue', 'Deep Blue', '#121A2A'], ['royal', 'Royal Night', '#1C182A'], ['charcoal', 'Night Charcoal', '#CCB29B'], ['warmdark', 'Warm Dark', '#2A201A'], ['forest', 'Forest Dark', '#14261F']],
    QT = { whitegreen: 'light', classic: 'light', ivory: 'light', fiber: 'light', green: 'light', sand: 'light', charcoal: 'light', blue: 'dark', forest: 'dark', warmdark: 'dark', royal: 'dark' };
  function applyTheme(v) {
    root.classList.toggle('oled', v === 'oled');
    if (v === 'light' || v === 'dark') root.setAttribute('data-theme', v);
    else if (v === 'oled') root.setAttribute('data-theme', 'dark');
    else if (QT[v]) root.setAttribute('data-theme', QT[v]);
    else root.removeAttribute('data-theme');
    if (QT[v]) root.setAttribute('data-qt', v); else root.removeAttribute('data-qt');
    if (t) { t.textContent = { light: '\u2600', dark: '\u263E', oled: '\u25CF' }[v] || (QT[v] ? '\u25D1' : 'A'); t.setAttribute('aria-label', 'Theme: ' + (v || 'system')); }
  }
  applyTheme(get('theme') || 'system');
  if (t) {
    var pop = document.createElement('div'); pop.className = 'theme-pop'; pop.hidden = true;
    var btn = function (x) { return '<button type="button" data-th="' + x[0] + '">' + (x[2] ? '<i style="background:' + x[2] + '"></i>' : '') + x[1] + '</button>'; };
    pop.innerHTML = '<b>App themes</b>' + APP.map(btn).join('') + '<b>Quran themes</b>' + QUR.map(btn).join('') +
      '<label><input type="checkbox" id="rm-box"> Reduce motion</label>';
    t.parentNode.style.position = 'relative'; t.parentNode.appendChild(pop);
    var mark = function () { var c = get('theme') || 'system'; pop.querySelectorAll('[data-th]').forEach(function (b) { b.setAttribute('aria-pressed', b.getAttribute('data-th') === c); }); pop.querySelector('#rm-box').checked = root.classList.contains('rm'); };
    t.addEventListener('click', function (e) { e.stopPropagation(); pop.hidden = !pop.hidden; mark(); });
    pop.addEventListener('click', function (e) { e.stopPropagation(); var b = e.target.closest('[data-th]'); if (!b) return; var v = b.getAttribute('data-th'); set('theme', v === 'system' ? null : v); applyTheme(v); mark(); });
    pop.querySelector('#rm-box').addEventListener('change', function () { root.classList.toggle('rm', this.checked); set('rm', this.checked ? '1' : null); });
    document.addEventListener('click', function () { pop.hidden = true; });
  }
  var m = document.getElementById('menu-btn'), n = document.getElementById('site-nav');
  if (m && n) m.addEventListener('click', function () {
    var o = n.classList.toggle('open');
    m.setAttribute('aria-expanded', o ? 'true' : 'false');
  });
  // hide the top site bar when scrolling down, show it when scrolling up
  var ly = window.scrollY, nav = document.getElementById('site-nav');
  window.addEventListener('scroll', function () {
    var y = window.scrollY, open = nav && nav.classList.contains('open');
    document.body.classList.toggle('hdr-hid', !open && y > ly && y > 90);
    ly = y;
  }, { passive: true });
  var y = document.getElementById('year'); if (y) y.textContent = new Date().getFullYear();
  // Bottom taskbar like the app (Home / Quran / App Library); not on the sura reader, which has its own bar
  if (!document.getElementById('bar') && document.querySelector('main.dash') && !/\/apps\//.test(location.pathname)) { // home page only
    var lg = document.querySelector('.logo'), base = lg ? lg.getAttribute('href') : '';
    var path = location.pathname, here = /\/read\/|\/sura\//.test(path) ? 'quran' : /\/apps\//.test(path) ? 'apps' : /\/(names|duas|hadith|tasbih|calendar|prayer|privacy|terms|support|quran|azan)\//.test(path) ? '' : 'home';
    var IT = [['home', '', 'Home', '<path d="M4 11l8-6.5 8 6.5V20H4zM10 20v-5h4v5"/>'], ['quran', 'read/', 'Quran', '<path d="M3 5.5C5.5 4 8.5 4 12 6c3.5-2 6.5-2 9-.5V19c-2.5-1.5-5.5-1.5-9 .5-3.5-2-6.5-2-9-.5z"/><path d="M12 6v13.5"/>'], ['duas', 'duas/', 'Duas', '<path d="M7 21v-4.5L4.5 12V6.5a1.2 1.2 0 0 1 2.4 0V11"/><path d="M6.9 9.5V4.8a1.2 1.2 0 0 1 2.4 0v6.7L11 14v7"/><path d="M17 21v-4.5l2.5-4.5V6.5a1.2 1.2 0 0 0-2.4 0V11"/><path d="M17.1 9.5V4.8a1.2 1.2 0 0 0-2.4 0v6.7L13 14v7"/>'], ['hadith', 'hadith/', 'Hadith', '<path d="M5 4h11l3 3v13H5z"/><path d="M8 9h8M8 13h8M8 17h5"/>'], ['apps', 'apps/', '<i class="tb-x">App </i>Library', '<rect x="4" y="4" width="6" height="6" rx="1.5"/><rect x="14" y="4" width="6" height="6" rx="1.5"/><rect x="4" y="14" width="6" height="6" rx="1.5"/><rect x="14" y="14" width="6" height="6" rx="1.5"/>']];
    var tb = document.createElement('nav'); tb.className = 'tabbar'; tb.setAttribute('aria-label', 'App');
    tb.innerHTML = IT.map(function (t) { return '<a href="' + base + t[1] + '"' + (t[0] === here ? ' aria-current="page"' : '') + '><svg viewBox="0 0 24 24" aria-hidden="true">' + t[3] + '</svg><span>' + t[2] + '</span></a>'; }).join('');
    document.body.appendChild(tb); document.body.classList.add('has-tabbar');
    // no duplicates: a Quick access tile whose page is already in the taskbar is not shown
    IT.forEach(function (t) { if (!t[1]) return; document.querySelectorAll('.tiles a[href="' + base + t[1] + '"]').forEach(function (x) { x.classList.add('in-bar'); }); });
  }
})();
// SG1: ?set=1 opens this page's settings panel (used by the Home search).
if (/[?&]set=1/.test(location.search)) window.addEventListener('load', function () { setTimeout(function () { var b = document.querySelector('#open-set,#pt-menu,#cl-menu,#d-menu,#nm-menu,#sv2-menu,#tb-menu'); if (b) b.click(); }, 400); });
