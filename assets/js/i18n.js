// SiraatOne interface languages (I18N1). Translates the English interface text of each page into the chosen language,
// including text added later by the page scripts. Quran text, translations, duas, hadith and the legal pages are not changed.
// The choice is saved in this browser only (localStorage "so.lang"). Dictionaries: assets/i18n/<code>.json ("English": "translation").
(function () {
  var LANGS = [['en', 'English'], ['ar', 'العربية'], ['ur', 'اردو'], ['fa', 'فارسی'], ['ps', 'پښتو'], ['tr', 'Türkçe'], ['id', 'Bahasa Indonesia'], ['ms', 'Bahasa Melayu'],
    ['bn', 'বাংলা'], ['hi', 'हिन्दी'], ['ta', 'தமிழ்'], ['so', 'Soomaali'], ['sw', 'Kiswahili'], ['fr', 'Français'], ['es', 'Español'], ['de', 'Deutsch'], ['ru', 'Русский']];
  var RTL = { ar: 1, ur: 1, fa: 1, ps: 1 }, V = '20261111a';
  var root = document.documentElement, L = 'en', D = null, P = [], TK = [];
  try { L = localStorage.getItem('so.lang') || 'en'; } catch (e) {}
  if (!LANGS.some(function (x) { return x[0] === L; })) L = 'en';
  var me = document.currentScript && document.currentScript.src, BASE = me ? me.replace(/js\/i18n\.js.*$/, 'i18n/') : '/assets/i18n/';
  function done() { root.classList.remove('i18n-wait'); }
  function t(s) { return (D && s && full(s)) || s; }
  window.SOI18N = { lang: L, rtl: !!RTL[L], t: t };
  // ---------- translate ----------
  // exact phrase, then number patterns ("{n} ayahs"), then parts split by " · ", then known words (dictionary keys starting with "~")
  function pat(k) { for (var i = 0; i < P.length; i++) { var m = k.match(P[i][0]); if (m) { var j = 1; return P[i][1].replace(/\{[nx]\}/g, function (g) { var v = m[j++]; return g === '{x}' ? (D[v] || tok(v) || v) : v; }); } } return null; }
  function tok(k) { if (!TK.length || !/[A-Za-z]/.test(k)) return null; var s = k, m = k; // m marks what was replaced, so Latin-script results can be checked too
    for (var i = 0; i < TK.length; i++) { s = s.replace(TK[i][0], TK[i][1]); m = m.replace(TK[i][0], '$1\u0001'); }
    return s !== k && !/[A-Za-z]/.test(m.replace(/SiraatOne/g, '')) ? s : null; }
  function seg(k) { if (k.indexOf(' · ') < 0) return null; var ok = false, out = k.split(' · ').map(function (p) { var v = D[p] || pat(p) || tok(p); if (v) ok = true; return v || p; }); return ok ? out.join(' · ') : null; }
  function full(k) { return D[k] || pat(k) || seg(k) || tok(k); }
  function tr(s) { var k = s.replace(/\s+/g, ' ').trim(); if (!k || !/[A-Za-z]/.test(k)) return null; var v = full(k); if (!v) return null;
    return s.match(/^\s*/)[0] + v + s.match(/\s*$/)[0]; }
  var SKIP = 'script,style,code,pre,svg,[translate="no"],.notranslate,.doc';
  function skipEl(el) { if (el.matches(SKIP)) return true; var g = el.getAttribute('lang'); return !!(g && g !== 'en' && el !== root); }
  function inSkip(n) { for (var el = n.nodeType === 1 ? n : n.parentElement; el && el !== root; el = el.parentElement) if (skipEl(el)) return true; return false; }
  var AT = ['placeholder', 'aria-label', 'title', 'alt'];
  // remember what was last written, so our own changes are not translated again (no loops when a translation equals the English)
  var LT = new WeakMap(), LA = new WeakMap();
  function text(n) { if (LT.get(n) === n.nodeValue) return; var v = tr(n.nodeValue); if (v && v !== n.nodeValue) n.nodeValue = v; LT.set(n, n.nodeValue); }
  function attrs(el) { var m = LA.get(el) || {}; for (var i = 0; i < AT.length; i++) { var a = el.getAttribute(AT[i]); if (!a || m[AT[i]] === a) continue;
    var v = tr(a); if (v && v.trim() !== a) el.setAttribute(AT[i], v.trim()); m[AT[i]] = el.getAttribute(AT[i]); } LA.set(el, m); }
  function run(node) {
    if (!node || inSkip(node)) return;
    if (node.nodeType === 3) { text(node); return; }
    if (node.nodeType !== 1) return; attrs(node);
    var w = document.createTreeWalker(node, 5, { acceptNode: function (n) { if (n.nodeType === 1 && skipEl(n)) { if (!n.closest('[translate="no"],.notranslate,.doc')) attrs(n); return 2; } return 1; } }), n;
    while ((n = w.nextNode())) { if (n.nodeType === 3) text(n); else attrs(n); }
  }
  function title() { var x = document.title; document.title = D[x] || x.split(' — ').map(function (p) { return t(p); }).join(' — '); }
  function observe() {
    new MutationObserver(function (ms) { ms.forEach(function (m) {
      if (m.type === 'characterData') run(m.target);
      else if (m.type === 'attributes') { if (!m.target.closest('[translate="no"],.notranslate,.doc')) attrs(m.target); }
      else m.addedNodes.forEach(run);
    }); }).observe(document.body, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: AT });
  }
  // ---------- picker (next to the theme button) ----------
  function picker() {
    var th = document.getElementById('theme-toggle'); if (!th) return;
    var b = document.createElement('button'); b.type = 'button'; b.className = 'icon-btn lang-btn'; b.id = 'lang-toggle'; b.setAttribute('aria-label', 'Language'); b.setAttribute('aria-expanded', 'false'); b.title = 'Language';
    b.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8.5"/><path d="M3.5 12h17M12 3.5c2.3 2.4 3.5 5.2 3.5 8.5s-1.2 6.1-3.5 8.5c-2.3-2.4-3.5-5.2-3.5-8.5s1.2-6.1 3.5-8.5z"/></svg>';
    var pop = document.createElement('div'); pop.className = 'lang-pop'; pop.hidden = true; pop.setAttribute('role', 'menu');
    pop.innerHTML = '<p class="lang-h">Choose language</p>' + LANGS.map(function (x) {
      return '<button type="button" role="menuitemradio" translate="no" lang="' + x[0] + '" dir="' + (RTL[x[0]] ? 'rtl' : 'ltr') + '" data-lang="' + x[0] + '" aria-checked="' + (x[0] === L) + '"><span>' + x[1] + '</span>' + (x[0] === L ? '<b>✓</b>' : '') + '</button>'; }).join('');
    th.parentNode.insertBefore(b, th); th.parentNode.insertBefore(pop, th.nextSibling);
    b.onclick = function (e) { e.stopPropagation(); pop.hidden = !pop.hidden; b.setAttribute('aria-expanded', !pop.hidden); };
    pop.onclick = function (e) { var x = e.target.closest('[data-lang]'); if (!x) return; var c = x.getAttribute('data-lang');
      try { if (c === 'en') localStorage.removeItem('so.lang'); else localStorage.setItem('so.lang', c); } catch (er) {} location.reload(); };
    document.addEventListener('click', function (e) { if (!pop.hidden && !e.target.closest('.lang-pop')) { pop.hidden = true; b.setAttribute('aria-expanded', 'false'); } });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !pop.hidden) { pop.hidden = true; b.setAttribute('aria-expanded', 'false'); b.focus(); } });
  }
  picker();
  if (L === 'en') { done(); return; }
  root.lang = L; if (RTL[L]) root.dir = 'rtl';
  fetch(BASE + L + '.json?v=' + V).then(function (r) { if (!r.ok) throw 0; return r.json(); }).then(function (d) {
    D = d; var esc = function (x) { return x.replace(/[.*+?^$()|[\]\\]/g, '\\$&'); };
    Object.keys(d).forEach(function (k) {
      if (k.charAt(0) === '~') TK.push([new RegExp('(^|[^A-Za-z])' + esc(k.slice(1)) + '(?![A-Za-z])', 'g'), '$1' + d[k], k.length]);
      else if (/\{[nx]\}/.test(k)) P.push([new RegExp('^' + esc(k).split('{n}').join('(\\d+)').split('{x}').join('(.+?)') + '$'), d[k]]); });
    TK.sort(function (a, b) { return b[2] - a[2]; });
    run(document.body); title(); observe(); done();
  }).catch(done);
})();
