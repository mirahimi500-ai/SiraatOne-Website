// Hadith from HadeethEnc API (same endpoints as the app's hadeethenc_api_client.dart). Text is shown as received
// (escaped, never as HTML). Saved hadiths and options stay in this browser.
(function () {
  var API = 'https://hadeethenc.com/api/v1', $ = function (id) { return document.getElementById(id); }, esc = SO.esc;
  var O = Object.assign({ ar: true, tr: true, meta: true, size: 1 }, SO.get('so.hopt', {})), saved = SO.get('so.hsaved', []), cats = null;
  function api(path, q) { var u = API + path + '?' + new URLSearchParams(q).toString(); return SO.j(u); }
  function fail(msg) { $('h-body').innerHTML = '<p class="empty">' + (msg || 'HadeethEnc could not be reached. Please try again later.') + '</p>'; }
  function crumbs(list) { $('h-crumbs').innerHTML = list.map(function (c, i) { return i < list.length - 1 ? '<a href="' + c[1] + '">' + esc(c[0]) + '</a> ›' : '<span>' + esc(c[0]) + '</span>'; }).join(' '); }
  function loadCats() { return cats ? Promise.resolve(cats) : api('/categories/list/', { language: 'en' }).then(function (d) { if (!Array.isArray(d)) throw 0; cats = d; return d; }); }
  function path(id) { var out = [], c = cats.filter(function (x) { return String(x.id) === String(id); })[0]; while (c) { out.unshift(['' + c.title, '#c=' + c.id]); var p = c.parent_id; c = p ? cats.filter(function (x) { return String(x.id) === String(p); })[0] : null; } return out; }
  function catList(parent) {
    loadCats().then(function (d) {
      var kids = d.filter(function (c) { return String(c.parent_id || '') === String(parent || ''); });
      crumbs([['Collections', '#']].concat(parent ? path(parent) : []));
      var list = kids.length ? '<ol class="list two">' + kids.map(function (c, i) { return '<li><a class="row" href="#c=' + c.id + '"><span class="num"><span>' + (i + 1) + '</span></span><span class="en"><b>' + esc(c.title) + '</b><span>' + (c.hadeeths_count || 0) + ' hadiths</span></span></a></li>'; }).join('') + '</ol>' : '';
      $('h-body').innerHTML = list; if (parent) hadList(parent, 1, !kids.length);
    }).catch(function () { fail(); });
  }
  function hadList(cat, page, only) {
    api('/hadeeths/list/', { language: 'en', category_id: cat, page: page, per_page: 20 }).then(function (d) {
      var rows = (d.data || []).map(function (h) { return '<li><a class="row" href="#h=' + h.id + '"><span class="en"><b>' + esc(h.title) + '</b></span></a></li>'; }).join('');
      var m = d.meta || {}, pager = (+m.last_page > 1) ? '<div class="pager2">' + (page > 1 ? '<button type="button" data-pg="' + (page - 1) + '">‹ Previous</button>' : '') + '<span>Page ' + page + ' of ' + m.last_page + '</span>' + (page < +m.last_page ? '<button type="button" data-pg="' + (page + 1) + '">Next ›</button>' : '') + '</div>' : '';
      var box = document.createElement('div'); box.innerHTML = '<h3 class="sub-h">Hadiths</h3><ol class="list">' + rows + '</ol>' + pager;
      box.querySelectorAll('[data-pg]').forEach(function (b) { b.onclick = function () { $('h-body').innerHTML = ''; hadList(cat, +b.dataset.pg, true); scrollTo(0, 0); }; });
      if (only) $('h-body').innerHTML = ''; $('h-body').appendChild(box);
    }).catch(function () { fail(); });
  }
  function one(id) {
    Promise.all([api('/hadeeths/one/', { language: 'en', id: id }), api('/hadeeths/one/', { language: 'ar', id: id }).catch(function () { return null; }), loadCats().catch(function () { return []; })]).then(function (r) {
      var en = r[0], ar = r[1], isS = saved.some(function (s) { return String(s.id) === String(id); });
      var c0 = en.categories && en.categories[0]; crumbs([['Collections', '#']].concat(c0 ? path(c0) : []).concat([[en.title || 'Hadith', '']]));
      var hints = Array.isArray(en.hints) && en.hints.length ? '<h4>Benefits</h4><ul>' + en.hints.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul>' : '';
      $('h-body').innerHTML = '<article class="hd card"><div class="d-top"><b>' + esc(en.title || '') + '</b><button type="button" class="act d-fav" id="h-save" aria-pressed="' + isS + '" aria-label="Save"><svg viewBox="0 0 24 24"><path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z"/></svg></button></div>' +
        (O.ar && ar && ar.hadeeth ? '<p class="h-ar" lang="ar" dir="rtl">' + esc(ar.hadeeth) + '</p>' : '') +
        (O.tr && en.hadeeth ? '<p class="h-en">' + esc(en.hadeeth) + '</p>' : '') +
        (O.meta ? '<p class="d-meta">' + (en.grade ? '<b>Grade:</b> ' + esc(en.grade) + ' · ' : '') + (en.attribution ? '<b>Reported by:</b> ' + esc(en.attribution) : '') + '</p>' +
          (en.explanation ? '<h4>Explanation</h4><p>' + esc(en.explanation) + '</p>' : '') + hints : '') +
        '<p class="d-meta">Source: <a href="https://hadeethenc.com/en/browse/hadith/' + encodeURIComponent(id) + '" rel="noopener">HadeethEnc.com #' + esc(id) + '</a></p></article>';
      $('h-save').onclick = function () { var i = saved.findIndex(function (s) { return String(s.id) === String(id); }); if (i > -1) saved.splice(i, 1); else saved.unshift({ id: id, title: en.title }); SO.set('so.hsaved', saved); this.setAttribute('aria-pressed', i < 0); };
    }).catch(function () { fail(); });
  }
  function savedList() {
    crumbs([['Saved', '']]);
    $('h-body').innerHTML = saved.length ? '<ol class="list">' + saved.map(function (s) { return '<li><a class="row" href="#h=' + encodeURIComponent(s.id) + '"><span class="en"><b>' + esc(s.title || ('Hadith #' + s.id)) + '</b></span></a></li>'; }).join('') + '</ol>' : '<p class="empty">Nothing saved yet. Open a hadith and tap ♡.</p>';
  }
  function route() {
    var h = location.hash.slice(1), m = /^(c|h|s)=?(.*)$/.exec(h) || [];
    document.querySelectorAll('#h-tabs button').forEach(function (b) { b.setAttribute('aria-selected', (b.dataset.m === 'saved') === (m[1] === 's')); });
    document.documentElement.style.setProperty('--h-size', O.size);
    $('h-body').innerHTML = '<p class="empty">Loading…</p>';
    if (m[1] === 'h') one(decodeURIComponent(m[2])); else if (m[1] === 'c') catList(m[2]); else if (m[1] === 's') savedList(); else catList('');
  }
  $('h-tabs').onclick = function (e) { var b = e.target.closest('button'); if (b) location.hash = b.dataset.m === 'saved' ? 's' : ''; };
  [['h-ar', 'ar'], ['h-tr', 'tr'], ['h-meta', 'meta']].forEach(function (p) { $(p[0]).checked = O[p[1]]; $(p[0]).onchange = function () { O[p[1]] = this.checked; SO.set('so.hopt', O); route(); }; });
  $('h-size').value = String(O.size); $('h-size').onchange = function () { O.size = +this.value; SO.set('so.hopt', O); route(); };
  addEventListener('hashchange', route); route();
  $('h-menu').onclick = function (e) { e.stopPropagation(); var o = $('h-tools').classList.toggle('open'); this.setAttribute('aria-expanded', o); };
  document.addEventListener('click', function (e) { if ($('h-tools').classList.contains('open') && !e.target.closest('#h-tools')) $('h-tools').classList.remove('open'); });
})();
