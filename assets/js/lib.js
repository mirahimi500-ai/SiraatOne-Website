// SiraatOne shared helpers. Personal data (last read, bookmarks, favorites, notes) stays in this browser only.
var SO = (function () {
  function get(k, d) { try { var v = localStorage.getItem(k); return v === null ? d : JSON.parse(v); } catch (e) { return d; } }
  function set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  var cache = {};
  function j(u) { if (!cache[u]) cache[u] = fetch(u).then(function (r) { if (!r.ok) throw 0; return r.json(); }); return cache[u]; }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]; }); }
  function find(starts, s, a) { var k = s * 1000 + a, lo = 0, hi = starts.length - 1, r = 0;
    while (lo <= hi) { var m = (lo + hi) >> 1; if (starts[m][0] * 1000 + starts[m][1] <= k) { r = m; lo = m + 1; } else hi = m - 1; } return r + 1; }
  function pos(idx, s, a) { return { page: find(idx.page, s, a), juz: find(idx.juz, s, a), hizb: find(idx.hizb, s, a) }; }
  function toggle(k, key) { var l = get(k, []), i = l.indexOf(key); if (i > -1) l.splice(i, 1); else l.unshift(key); set(k, l); return i === -1; }
  function has(k, key) { return get(k, []).indexOf(key) > -1; }
  return { get: get, set: set, j: j, esc: esc, pos: pos, toggle: toggle, has: has };
})();
