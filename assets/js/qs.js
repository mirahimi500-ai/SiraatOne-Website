// SiraatOne smart search core (QS): accent/case-free text, stop words, word stems, synonyms, typo-tolerant names.
// Used by the Home search, the Quran search page and the Duas search. Runs in the browser only.
var QS = (function () {
  function plain(s) { return String(s || '').replace(/[ؐ-ًؚ-ٰٟۖ-ۭـ]/g, '').replace(/[أإآٱ]/g, 'ا').replace(/ى/g, 'ي').replace(/ة/g, 'ه'); }
  function loose(s) { return String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase(); }
  function nkey(s) { return loose(s).replace(/[^a-z0-9]/g, '').replace(/ee/g, 'i').replace(/oo|ou/g, 'u').replace(/aa/g, 'a'); }
  var STOP = {}; ('a an the to of for in on at by from with into onto upon when while what which who whom how why is are am be was were been do does did ' +
    'my me i you your our we us it its this that these those and or about any some say said saying recite reciting read please').split(' ').forEach(function (w) { STOP[w] = 1; });
  var SYN = [['masjid', 'mosque'], ['salah', 'salat', 'prayer', 'pray', 'namaz'], ['wudu', 'wudhu', 'ablution'], ['toilet', 'bathroom', 'restroom', 'lavatory'],
    ['home', 'house'], ['travel', 'journey', 'trip'], ['sleep', 'bed'], ['food', 'eat', 'meal'], ['fast', 'sawm', 'roza'], ['sick', 'ill', 'disease'],
    ['death', 'die', 'funeral', 'janazah', 'grave'], ['marriage', 'nikah', 'wedding', 'spouse'], ['forgive', 'istighfar', 'repent'], ['protect', 'refuge', 'ruqyah'],
    ['quran', 'koran'], ['dhikr', 'zikr', 'remembrance'], ['adhan', 'azan', 'athan'], ['qibla', 'kaaba', 'kiblah'], ['child', 'children', 'kid'],
    ['parent', 'mother', 'father'], ['anxiety', 'worry', 'distress', 'grief', 'sad'], ['rizq', 'provision', 'sustenance', 'wealth'], ['knowledge', 'ilm', 'learn']];
  var SYNMAP = {}; SYN.forEach(function (g) { g.forEach(function (w) { SYNMAP[w] = g; }); });
  function stem(w) {
    var s = w;
    if (s.length > 5 && /ing$/.test(s)) s = s.slice(0, -3);
    else if (s.length > 4 && /ies$/.test(s)) s = s.slice(0, -3) + 'y';
    else if (s.length > 4 && /(ed|es)$/.test(s)) s = s.slice(0, -2);
    else if (s.length > 3 && /s$/.test(s) && !/ss$/.test(s)) s = s.slice(0, -1);
    if (s !== w && /([bdglmnprt])\1$/.test(s)) s = s.slice(0, -1);
    return s;
  }
  // Parse a query: { ar, phrase, toks: [[variants], ...] }. Each word must match one of its variants.
  function terms(q) {
    q = String(q || '').trim(); var ar = /[؀-ۿ]/.test(q);
    if (ar) { var pq = plain(q).replace(/\s+/g, ' '); return { ar: true, phrase: pq, words: pq.split(' '), toks: pq.split(' ').filter(Boolean).map(function (w) { return [w]; }) }; }
    var lq = loose(q).replace(/[^a-z0-9:' ]+/g, ' ').replace(/\s+/g, ' ').trim(), words = lq.split(' ').filter(Boolean);
    var keep = words.filter(function (w) { return !STOP[w] && w.length > 1; }); if (!keep.length) keep = words;
    return { ar: false, phrase: lq, words: words, toks: keep.map(function (w) { var s = stem(w), v = [s];
      (SYNMAP[w] || SYNMAP[s] || []).forEach(function (x) { var y = stem(x); if (v.indexOf(y) < 0) v.push(y); }); return v; }) };
  }
  // Position of x in text; short words (3 letters or less) must start a word ("eat" not in "great").
  function pos(text, x) { var i = text.indexOf(x); if (x.length > 3) return i;
    while (i > -1) { if (i === 0 || !/[a-z0-9]/.test(text.charAt(i - 1))) return i; i = text.indexOf(x, i + 1); } return -1; }
  // Text must already be loose() (or plain() for Arabic). True when every query word is found.
  function test(text, T) { for (var i = 0; i < T.toks.length; i++) { var ok = false; for (var j = 0; j < T.toks[i].length; j++) if (pos(text, T.toks[i][j]) > -1) { ok = true; break; } if (!ok) return false; } return T.toks.length > 0; }
  // Score weighted fields [[looseText, weight], ...]: { n: words matched, s: score }. Word-start hits score higher.
  function score(fields, T) {
    var n = 0, s = 0;
    T.toks.forEach(function (v) { var best = 0;
      fields.forEach(function (f) { v.forEach(function (x, k) { var i = pos(f[0], x); if (i < 0) return;
        var w = f[1] * (i === 0 || !/[a-z0-9؀-ۿ]/.test(f[0].charAt(i - 1)) ? 1 : 0.6) * (k ? 0.85 : 1); if (w > best) best = w; }); });
      if (best) { n++; s += best; } });
    if (T.phrase && T.toks.length > 1 && fields[0] && fields[0][0].indexOf(T.phrase) > -1) s += 3;
    return { n: n, s: s };
  }
  // Optimal string alignment distance (typos incl. swapped letters).
  function dist(a, b) {
    var d = [], i, j; for (i = 0; i <= a.length; i++) { d[i] = [i]; } for (j = 0; j <= b.length; j++) d[0][j] = j;
    for (i = 1; i <= a.length; i++) for (j = 1; j <= b.length; j++) {
      var c = a[i - 1] === b[j - 1] ? 0 : 1; d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + c);
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1); }
    return d[a.length][b.length];
  }
  // Sura name match score (0 = none): exact, starts with, contains, or close spelling ("yasin", "baqra", "kahaf").
  function nameScore(name, q) {
    var k = nkey(q); if (k.length < 2) return 0; var n = nkey(name), b = n.replace(/^(al|an|ar|as|at|az|ad|ash|adh)/, '');
    if (n === k || b === k) return 100; if (n.indexOf(k) === 0 || b.indexOf(k) === 0) return 90; if (n.indexOf(k) > -1) return 70;
    if (k.length >= 4) { var m = Math.min(dist(k, b.slice(0, k.length)), dist(k, b), dist(k, n)); if (m <= (k.length >= 7 ? 2 : 1)) return 60; }
    return 0;
  }
  // Wrap matched words in <mark> (escaped). Skips highlighting when accents change the length.
  function mark(text, T, esc) {
    var src = String(text || ''), l = T.ar ? plain(src) : loose(src); if (l.length !== src.length) return esc(src);
    var on = new Array(src.length); T.toks.forEach(function (v) { v.forEach(function (x) { if (!x) return; var i = pos(l, x); while (i > -1) { for (var k = i; k < l.length && (k < i + x.length || (!T.ar && /[a-z0-9]/.test(l.charAt(k)))); k++) on[k] = 1; i = l.indexOf(x, k); if (i > -1 && x.length <= 3 && /[a-z0-9]/.test(l.charAt(i - 1))) i = -1; } }); });
    var out = '', open = false; for (var i = 0; i < src.length; i++) { if (on[i] && !open) { out += '<mark>'; open = true; } if (!on[i] && open) { out += '</mark>'; open = false; } out += esc(src.charAt(i)); }
    return out + (open ? '</mark>' : '');
  }
  return { plain: plain, loose: loose, nkey: nkey, stem: stem, terms: terms, pos: pos, test: test, score: score, nameScore: nameScore, mark: mark };
})();
