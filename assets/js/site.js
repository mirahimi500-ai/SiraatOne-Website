// SiraatOne — theme toggle + mobile menu. No tracking, no third-party code.
(function () {
  var root = document.documentElement;
  var t = document.getElementById('theme-toggle');
  function cur() {
    var a = root.getAttribute('data-theme');
    if (a) return a;
    return window.matchMedia && matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  function label() { if (t) { var d = cur() === 'dark'; t.textContent = d ? '☀' : '☾'; t.setAttribute('aria-label', d ? 'Switch to light mode' : 'Switch to dark mode'); } }
  if (t) t.addEventListener('click', function () {
    var next = cur() === 'dark' ? 'light' : 'dark';
    root.setAttribute('data-theme', next);
    try { localStorage.setItem('theme', next); } catch (e) {}
    label();
  });
  label();
  var m = document.getElementById('menu-btn'), n = document.getElementById('site-nav');
  if (m && n) m.addEventListener('click', function () {
    var o = n.classList.toggle('open');
    m.setAttribute('aria-expanded', o ? 'true' : 'false');
  });
  var y = document.getElementById('year'); if (y) y.textContent = new Date().getFullYear();
})();
