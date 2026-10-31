// SiraatOne — theme toggle + mobile menu. No tracking, no third-party code.
(function () {
  var root = document.documentElement;
  // Theme (System / Light / Dark / OLED, as in the app) + Reduce motion. Saved in this browser only.
  var t = document.getElementById('theme-toggle');
  function get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function set(k, v) { try { if (v === null) localStorage.removeItem(k); else localStorage.setItem(k, v); } catch (e) {} }
  function applyTheme(v) {
    root.classList.toggle('oled', v === 'oled');
    if (v === 'light' || v === 'dark') root.setAttribute('data-theme', v);
    else if (v === 'oled') root.setAttribute('data-theme', 'dark');
    else root.removeAttribute('data-theme');
    if (t) { t.textContent = { light: '\u2600', dark: '\u263E', oled: '\u25CF' }[v] || 'A'; t.setAttribute('aria-label', 'Theme: ' + (v || 'system')); }
  }
  applyTheme(get('theme') || 'system');
  if (t) {
    var pop = document.createElement('div'); pop.className = 'theme-pop'; pop.hidden = true;
    pop.innerHTML = '<b>Theme</b>' + ['system', 'light', 'dark', 'oled'].map(function (v) {
      return '<button type="button" data-th="' + v + '">' + { system: 'System', light: 'Light', dark: 'Dark', oled: 'OLED (pure black)' }[v] + '</button>'; }).join('') +
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
})();
