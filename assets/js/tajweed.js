// Tajweed projection - a direct port of the SiraatOne Quran app (quran_tajweed_markup_parser.dart +
// quran_tajweed_projector.dart). Rules from Quran Foundation text_uthmani_tajweed are projected onto the
// SELECTED Mushaf text by matching the Arabic letter skeleton. Fail-closed: if a verse cannot be aligned,
// or the result is not byte-for-byte the canonical text, the verse is shown without Tajweed.
var TJ = (function () {
  var MAP = { ham_wasl: 'hamzatWasl', hamzat_wasl: 'hamzatWasl', laam_shamsiyah: 'lamShamsiyyah', lam_shamsiyyah: 'lamShamsiyyah',
    slnt: 'silent', silent: 'silent', madda_normal: 'maddNormal', madd_2: 'maddNormal', madda_permissible: 'maddPermissible', madd_246: 'maddPermissible',
    madda_necessary: 'maddNecessary', madd_6: 'maddNecessary', madda_obligatory: 'maddObligatory', madd_muttasil: 'maddObligatory',
    qlq: 'qalqalah', qalqalah: 'qalqalah', qalaqah: 'qalqalah', ikhf: 'ikhfa', ikhfa: 'ikhfa', ikhafa: 'ikhfa',
    ikhf_shfw: 'ikhfaShafawi', ikhfa_shafawi: 'ikhfaShafawi', ikhafa_shafawi: 'ikhfaShafawi', idghm_shfw: 'idghamShafawi', idgham_shafawi: 'idghamShafawi',
    iqlb: 'iqlab', iqlab: 'iqlab', idgh_ghn: 'idghamWithGhunnah', idghaam_ghunnah: 'idghamWithGhunnah', idgham_ghunnah: 'idghamWithGhunnah',
    idgh_w_ghn: 'idghamWithoutGhunnah', idghaam_no_ghunnah: 'idghamWithoutGhunnah', idgham_wo_ghunnah: 'idghamWithoutGhunnah',
    idgham_mutajanisayn: 'idghamMutajanisayn', idghaam_mutajanisayn: 'idghamMutajanisayn', idgham_mutaqaribayn: 'idghamMutaqaribayn',
    idghaam_mutaqaribayn: 'idghamMutaqaribayn', ghn: 'ghunnah', ghunnah: 'ghunnah', end: 'endMarker' };
  var TAG = /<\s*(\/?)\s*(tajweed|rule|span)\b([^>]*)>/gi, CLS = /class\s*=\s*(?:"([^"]+)"|'([^']+)'|([^\s>]+))/i;
  function parse(markup) { // -> [{text, rule}] or null (rejected)
    if (!markup) return null;
    var tags = markup.match(/<[^>]+>/g) || [];
    for (var i = 0; i < tags.length; i++) { TAG.lastIndex = 0; var m0 = TAG.exec(tags[i]); if (!m0 || m0.index !== 0 || m0[0].length !== tags[i].length) return null; }
    var segs = [], active = [], cur = 0, m; TAG.lastIndex = 0;
    function add(t) { if (!t) return; var r = active.length ? active[active.length - 1].rule : null;
      if (segs.length && segs[segs.length - 1].rule === r) segs[segs.length - 1].text += t; else segs.push({ text: t, rule: r }); }
    while ((m = TAG.exec(markup))) {
      add(markup.slice(cur, m.index));
      var tag = m[2].toLowerCase();
      if (m[1]) { if (!active.length || active[active.length - 1].tag !== tag) return null; active.pop(); }
      else { var c = CLS.exec(m[3] || ''), raw = c ? (c[1] || c[2] || c[3]).trim().toLowerCase() : null;
        if (tag === 'span') { if (raw !== 'end') return null; active.push({ tag: tag, rule: 'endMarker' }); }
        else { if (!raw) return null; active.push({ tag: tag, rule: MAP[raw] || 'unknown' }); } }
      cur = TAG.lastIndex;
    }
    add(markup.slice(cur));
    return active.length || !segs.length ? null : segs;
  }
  function isMark(c) { return (c >= 0x610 && c <= 0x61A) || (c >= 0x64B && c <= 0x65F) || c === 0x670 || (c >= 0x6D6 && c <= 0x6ED) || (c >= 0x8D3 && c <= 0x8FF); }
  function isLetter(c) { return !isMark(c) && ((c >= 0x621 && c <= 0x63A) || (c >= 0x641 && c <= 0x64A) || (c >= 0x66E && c <= 0x66F) || (c >= 0x671 && c <= 0x6D3)); }
  function key(c) {
    if ([0x622, 0x623, 0x625, 0x671, 0x672, 0x673, 0x675, 0x670].indexOf(c) > -1) return 'ا';
    if (c === 0x624 || c === 0x6E5) return 'و';
    if (c === 0x626 || c === 0x649 || c === 0x6E6 || c === 0x6E7) return 'ي';
    if (c === 0x6E8) return 'ن';
    return isLetter(c) ? String.fromCodePoint(c) : null;
  }
  function ws(ch) { return ch.trim() === ''; }
  function ignored(c) { return c === 0x640 || (c >= 0x30 && c <= 0x39) || (c >= 0x660 && c <= 0x669) || c === 0x6DD || c === 0x6DE || c === 0x6E9; }
  function usable(r) { return r && r !== 'endMarker' && r !== 'unknown' ? r : null; }
  function project(markup, canon) { // -> [{text, rule}] whose joined text === canon, or null
    var segs = parse(markup); if (!segs || !canon) return null;
    var src = [], back = false;
    segs.forEach(function (s) {
      if (s.rule === 'endMarker') return; var r = usable(s.rule);
      for (var ch of s.text) { var c = ch.codePointAt(0);
        if (ws(ch)) { back = false; continue; } if (ignored(c)) continue;
        var k = key(c);
        if (k !== null) { src.push({ k: k, r: r }); back = true; continue; }
        if (r && isMark(c) && back && src.length) src[src.length - 1].r = r; }
    });
    var cl = [], units = [], open = false, cs = 0, ce = 0, off = 0;
    for (var ch2 of canon) { var c2 = ch2.codePointAt(0), nx = off + ch2.length;
      if (!open || !isMark(c2)) { if (open) cl.push([cs, ce]); cs = off; ce = nx; open = true; } else ce = nx;
      var k2 = key(c2); if (k2 !== null) units.push({ k: k2, ci: cl.length }); off = nx; }
    if (open) cl.push([cs, ce]);
    if (!src.length || !units.length || src.length !== units.length) return null;
    for (var i = 0; i < src.length; i++) if (src[i].k !== units[i].k) return null;
    var rules = new Array(cl.length).fill(null);
    for (i = 0; i < src.length; i++) if (src[i].r) rules[units[i].ci] = src[i].r;
    var out = [];
    for (i = 0; i < cl.length; i++) { var t = canon.slice(cl[i][0], cl[i][1]);
      if (out.length && out[out.length - 1].rule === rules[i]) out[out.length - 1].text += t; else out.push({ text: t, rule: rules[i] }); }
    return out.map(function (o) { return o.text; }).join('') === canon ? out : null; // integrity gate
  }
  function html(markup, canon, esc) {
    var p = project(markup, canon);
    if (!p) return null;
    return p.map(function (o) { return o.rule ? '<span class="tj-' + o.rule + '">' + esc(o.text) + '</span>' : esc(o.text); }).join('');
  }
  return { parse: parse, project: project, html: html };
})();
