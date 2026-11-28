// SiraatOne — theme toggle + mobile menu. No tracking, no third-party code.
(function () {
  var root = document.documentElement;
  // Theme (System / Light / Dark / OLED, as in the app) + Reduce motion. Saved in this browser only.
  var t = document.getElementById('theme-toggle');
  function get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function set(k, v) { try { if (v === null) localStorage.removeItem(k); else localStorage.setItem(k, v); } catch (e) {} }
  // FXK1: animation strength 0–150% (100 = normal, 0 = off = html.rm); --fxk scales every effect's movement (style.css FXK1)
  function fxLevel() { if (get('rm') === '1') return 0; var v = parseInt(get('fx'), 10); return isNaN(v) ? 100 : Math.max(0, Math.min(150, v)); }
  function applyFx(v) { root.classList.toggle('rm', v === 0); root.classList.toggle('fxk', v > 0 && v !== 100); if (v > 0 && v !== 100) root.style.setProperty('--fxk', v / 100); else root.style.removeProperty('--fxk'); }
  function applyTheme(v) {
    root.classList.toggle('oled', v === 'oled');
    if (v === 'light' || v === 'dark') root.setAttribute('data-theme', v);
    else if (v === 'oled') root.setAttribute('data-theme', 'dark');
    else root.removeAttribute('data-theme');
    if (t) { t.textContent = { light: '\u2600', dark: '\u263E', oled: '\u25CF' }[v] || 'A'; t.setAttribute('aria-label', 'Theme: ' + (v || 'system')); }
  }
  var th0 = get('theme'); if (th0 && ['light', 'dark', 'oled'].indexOf(th0) < 0) { set('theme', null); th0 = null; } // themes tried on Nov 11 -> System
  applyTheme(th0 || 'system');
  if (t) {
    var pop = document.createElement('div'); pop.className = 'theme-pop'; pop.hidden = true;
    pop.innerHTML = '<b>Theme</b>' + ['system', 'light', 'dark', 'oled'].map(function (v) {
      return '<button type="button" data-th="' + v + '">' + { system: 'System', light: 'Light', dark: 'Dark', oled: 'OLED (pure black)' }[v] + '</button>'; }).join('') +
      '<b>Animation</b><div class="fx-sl"><input type="range" id="fx-range" min="0" max="150" step="10" aria-label="Animation strength"><output id="fx-out">100%</output></div><small class="fx-hint">0% = off · 100% = normal · 150% = extra</small>'; // FXK1: animation strength 0–150%
    t.parentNode.style.position = 'relative'; t.parentNode.appendChild(pop);
    var mark = function () { var c = get('theme') || 'system'; pop.querySelectorAll('[data-th]').forEach(function (b) { b.setAttribute('aria-pressed', b.getAttribute('data-th') === c); }); var lv = fxLevel(); pop.querySelector('#fx-range').value = lv; pop.querySelector('#fx-out').textContent = lv + '%'; };
    t.addEventListener('click', function (e) { e.stopPropagation(); pop.hidden = !pop.hidden; mark(); });
    pop.addEventListener('click', function (e) { e.stopPropagation(); 
      var b = e.target.closest('[data-th]'); if (!b) return; var v = b.getAttribute('data-th'); set('theme', v === 'system' ? null : v); applyTheme(v); mark(); });
    pop.querySelector('#fx-range').addEventListener('input', function () { var v = +this.value; pop.querySelector('#fx-out').textContent = v + '%'; applyFx(v); set('fx', v === 100 ? null : String(v)); set('rm', v === 0 ? '1' : null); });
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
    tb.innerHTML = IT.map(function (t) { return '<a class="d-' + t[0] + '" href="' + base + t[1] + '"' + (t[0] === here ? ' aria-current="page"' : '') + '><svg viewBox="0 0 24 24" aria-hidden="true">' + t[3] + '</svg><span>' + t[2] + '</span></a>'; }).join('');
    document.body.appendChild(tb); document.body.classList.add('has-tabbar');
    // no duplicates: a Quick access tile whose page is already in the taskbar is not shown
    IT.forEach(function (t) { if (!t[1]) return; document.querySelectorAll('.tiles a[href="' + base + t[1] + '"]').forEach(function (x) { x.classList.add('in-bar'); }); });
  }
})();
// Site footer: developer and legal links (every page except the Quran reader)
(function () {
  if (document.querySelector('.rd-wrap') || document.querySelector('.site-footer')) return;
  var lg = document.querySelector('.logo'), b = lg ? lg.getAttribute('href') : '';
  var f = document.createElement('footer'); f.className = 'site-footer';
  f.innerHTML = '<div class="wrap"><span translate="no">© ' + new Date().getFullYear() + ' Zaiba Technologies, LLC · Pennsylvania, USA</span><nav aria-label="Legal"><a href="' + b + 'privacy/">Privacy</a><a href="' + b + 'terms/">Terms &amp; Credits</a><a href="' + b + 'delete-account/">Delete account</a><a href="' + b + 'support/">Support</a></nav></div>';
  var m = document.querySelector('main'); if (m && m.parentNode) m.parentNode.insertBefore(f, m.nextSibling); else document.body.appendChild(f);
  var tbar = document.querySelector('nav.tabbar'); if (tbar && f.parentNode) f.parentNode.insertBefore(tbar, f); // Dock sits above the footer at the page end
})();
// SG1: ?set=1 opens this page's settings panel (used by the Home search).
if (/[?&]set=1/.test(location.search)) window.addEventListener('load', function () { setTimeout(function () { var b = document.querySelector('#open-set,#pt-menu,#cl-menu,#d-menu,#nm-menu,#sv2-menu,#tb-menu'); if (b) b.click(); }, 400); });

// POPFX1: menus, settings, sub-menus and pop-outs pop when tapped (capture phase: some menus stop the click)
(function () {
  if (!document.body.classList.contains('fx')) return;
  document.addEventListener('click', function (e) {
    if (document.documentElement.classList.contains('rm') || (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches)) return;
    var el = e.target.closest && e.target.closest('.theme-pop button, .lang-pop button, .ib-menu button, .tb-pop .tg, .modal-body .tg, .seg button, .pf-prev, .mtabs button, .mb-band');
    if (!el || e.target.matches('input[type=checkbox]') && e.detail === 0) return; // a label click also clicks its switch: pop once
    el.classList.remove('pop'); void el.offsetWidth; el.classList.add('pop');
    setTimeout(function () { el.classList.remove('pop'); }, 520);
  }, true);
})();
// APPUI2: iOS-style pop when a Home tile, Dock icon or card is tapped; a link opens 170 ms later so the pop is seen
(function () {
  if (!document.body.classList.contains('fx')) return;
  function calm() { return document.documentElement.classList.contains('rm') || (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches); }
  document.addEventListener('click', function (e) {
    if (calm()) return;
    var el = e.target.closest('.tile, #si-body .si-stats > div, #si-body .tj-legend span, .ib-chip, .ib-tile, .ib-cell, .rm-day, .rm-links .rm-row, .tabbar a, .mini, .btn, .list a, .d-sech, .nav a, .icon-btn, [role=tablist] button, .chip, .tb-mode button, .ts-rb, .ts-chip, .pt-bell, .nm-i, .info-btn, .bb-btn, .bb-name, .logo, .lib-add, .cl-c, .d-tile, .ts-stats a, .tasbih li > button, .d-sidea, summary, .site-footer a, .sheet-acts button, .hl-row button, .sheet-top .x, .ab, .modal-card button, .aya, .sura-head .frame, .bism-img, .mpill, .home2 .ts-card');
    if (!el || el.closest('.tiles.editing')) return;
    el.classList.remove('pop'); void el.offsetWidth; el.classList.add('pop');
    if (navigator.vibrate) try { navigator.vibrate(8); } catch (x) {}
    setTimeout(function () { el.classList.remove('pop'); }, 600);
    var a = el.matches('.tile, .tabbar a, .mini, .nav a') && e.target.closest('a[href]'), h = a && a.getAttribute('href');
    if (a && !e.defaultPrevented && e.button === 0 && !e.ctrlKey && !e.metaKey && !e.shiftKey && !e.altKey && a.target !== '_blank' && !a.hasAttribute('download') && h.charAt(0) !== '#') {
      e.preventDefault(); var u = a.href; setTimeout(function () { location.href = u; }, 170);
    }
  });
})();
// APPUI3: Dock magnifies under the mouse like macOS (desktop only)
(function () {
  var tb = document.querySelector('.tabbar'); if (!tb || !window.matchMedia || !matchMedia('(hover: hover) and (pointer: fine)').matches) return;
  var ics = [].slice.call(tb.querySelectorAll('a svg'));
  function calm() { return document.documentElement.classList.contains('rm') || matchMedia('(prefers-reduced-motion: reduce)').matches; }
  tb.addEventListener('mousemove', function (e) {
    if (calm()) return; tb.classList.add('mag');
    ics.forEach(function (s) { var r = s.getBoundingClientRect(), k = Math.max(0, 1 - Math.abs(e.clientX - (r.left + r.width / 2)) / 150);
      var f = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--fxk')) || 1; // FXK1: Dock moves with the animation strength
      s.style.transform = k ? 'translateY(' + (-12 * k * f).toFixed(1) + 'px) scale(' + (1 + .32 * k * f).toFixed(3) + ')' : ''; });
  });
  tb.addEventListener('mouseleave', function () { tb.classList.remove('mag'); ics.forEach(function (s) { s.style.transform = ''; }); });
  tb.addEventListener('mousedown', function (e) { var s = e.target.closest('a') && e.target.closest('a').querySelector('svg'); if (s) { var f = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--fxk')) || 1; s.style.transform = 'scale(' + (1 - .12 * f).toFixed(3) + ')'; } });
})();
