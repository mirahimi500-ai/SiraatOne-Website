// Tasbih = the SiraatOne Quran app's Tasbih (full audit Nov 2026):
//  Dhikr counter (tasbih_dhikr_panel.dart + tasbih_dhikr_controller.dart): 8 sourced phrases, per-phrase count/total/target, targets Off/33/34/100,
//  reset keeps totals; Previous saved counters (tasbih_screen.dart + tasbih_controller.dart): max 12, targets none/33/34/100, history max 20 (5 shown),
//  lifetime, targets, sessions; settings (tasbih_settings_controller.dart): haptics, beep at goal, confirm reset, show statistics - all on by default.
//  Goal beep = the app's own tasbih_target_beep.wav. Saved in this browser only.
(function () {
  var $ = function (id) { return document.getElementById(id); }, esc = SO.esc;
  var CAT = [
    ['subhan_allah', 'سُبْحَانَ اللَّهِ', 'Sahih Muslim 596b–c (post-prayer remembrance)', 'https://sunnah.com/muslim:596b', 33],
    ['alhamdulillah', 'الْحَمْدُ لِلَّهِ', 'Sahih Muslim 596b–c (post-prayer remembrance)', 'https://sunnah.com/muslim:596b', 33],
    ['allahu_akbar', 'اللَّهُ أَكْبَرُ', 'Sahih Muslim 596b–c (post-prayer remembrance)', 'https://sunnah.com/muslim:596b', 34],
    ['la_ilaha_illallah', 'لَا إِلَٰهَ إِلَّا اللَّهُ', 'Sahih Muslim 2691 (part of the reported Tahlil)', 'https://sunnah.com/muslim:2691', 0],
    ['subhan_allah_wa_bihamdihi', 'سُبْحَانَ اللَّهِ وَبِحَمْدِهِ', 'Sahih al-Bukhari 6405 (100 times daily)', 'https://sunnah.com/bukhari:6405', 100],
    ['subhan_allah_al_azim', 'سُبْحَانَ اللَّهِ الْعَظِيمِ', 'Sahih al-Bukhari 6406', 'https://sunnah.com/bukhari:6406', 0],
    ['la_hawla', 'لَا حَوْلَ وَلَا قُوَّةَ إِلَّا بِاللَّهِ', 'Sahih al-Bukhari 6384', 'https://sunnah.com/bukhari:6384', 0],
    ['complete_tahlil', 'لَا إِلَٰهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ، وَهُوَ عَلَى كُلِّ شَيْءٍ قَدِيرٌ', 'Sahih Muslim 2691 (100 times daily)', 'https://sunnah.com/muslim:2691', 100]
  ];
  var DT = [0, 33, 34, 100], MAXP = 12, MAXH = 20, SETDEF = { hap: true, beep: true, conf: true, stats: true };
  var D = SO.get('so.tb3', null);
  if (!D) { // migrate earlier website versions (so.tb2 / so.tb)
    var o2 = SO.get('so.tb2', null), o1 = SO.get('so.tb', null);
    D = { mode: 'dhikr', dh: { active: CAT[0][0], rows: {} }, sv: { profiles: [], active: null, life: 0, cmp: 0, hist: [] }, set: Object.assign({}, SETDEF) };
    if (o2) {
      CAT.forEach(function (c) { var r = o2.c && o2.c[c[0]]; if (r) D.dh.rows[c[0]] = { count: r.n || 0, total: r.n || 0, target: DT.indexOf(r.t) > -1 ? r.t : c[4] }; });
      (o2.own || []).forEach(function (p) { var r = (o2.c || {})[p.id] || {}; D.sv.profiles.push({ id: p.id, name: p.name, count: r.n || 0, target: r.t || null }); });
      D.sv.life = o2.total || 0; D.sv.cmp = o2.tg || 0; D.sv.hist = (o2.hist || []).map(function (h) { return { name: h.name, count: h.n, target: null, at: h.d }; });
      D.set = { hap: o2.vib !== false, beep: o2.snd !== false, conf: o2.conf !== false, stats: o2.stats !== false };
    } else if (o1 && o1.list) o1.list.forEach(function (p, i) { D.sv.profiles.push({ id: 'p' + i, name: p.name, count: p.n || 0, target: p.target || null }); });
  }
  if (!D.sv.profiles.length) D.sv.profiles.push({ id: 'p' + Date.now(), name: 'Counter 1', count: 0, target: 33 });
  if (!D.sv.profiles.some(function (p) { return p.id === D.sv.active; })) D.sv.active = D.sv.profiles[0].id;
  function save() { SO.set('so.tb3', D); }
  var saveT; function saveSoon() { clearTimeout(saveT); saveT = setTimeout(save, 200); }
  window.addEventListener('pagehide', save);
  // ---- feedback (as the app: light tick on tap, stronger at goal + beep) ----
  var beepA = null; function beep() { try { beepA = beepA || new Audio('../assets/audio/tasbih-target-beep.wav'); beepA.currentTime = 0; beepA.play().catch(function () {}); } catch (e) {} }
  function tick(goal) { if (D.set.hap && navigator.vibrate) navigator.vibrate(goal ? 60 : 8); if (goal && D.set.beep) beep(); }
  function bump(el, goal) { el.classList.remove('pulse', 'hit'); void el.offsetWidth; el.classList.add(goal ? 'hit' : 'pulse'); }
  function chips(box, list, cur, label) { $(box).innerHTML = (label ? '<span>' + label + '</span>' : '') + list.map(function (v) { var t = v === 0 || v === null; return '<button type="button" class="ts-chip" data-t="' + (t ? 0 : v) + '" aria-pressed="' + ((t && !cur) || v === cur) + '">' + (t ? (label ? 'Off' : 'No target') : v) + '</button>'; }).join(''); }

  // ================= Dhikr counter =================
  function phrase() { return CAT.filter(function (c) { return c[0] === D.dh.active; })[0] || CAT[0]; }
  function row() { var p = phrase(); return D.dh.rows[p[0]] || (D.dh.rows[p[0]] = { count: 0, total: 0, target: p[4] }); }
  $('dh-pick').innerHTML = CAT.map(function (c) { return '<option value="' + c[0] + '">' + esc(c[1]) + '</option>'; }).join('');
  function dhDraw() {
    var p = phrase(), r = row(), g = r.target, n = r.count, all = 0;
    Object.keys(D.dh.rows).forEach(function (k) { all += D.dh.rows[k].total; });
    $('dh-pick').value = p[0]; $('dh-ar').textContent = p[1];
    $('dh-sel').textContent = r.total; $('dh-all').textContent = all; $('dh-n').textContent = n;
    chips('dh-tg', DT, g, ' '); $('dh-tg').firstChild.remove();
    $('dh-barw').hidden = !(g > 0); $('dh-bar').style.width = (g > 0 ? (n > 0 && n % g === 0 ? 1 : (n % g) / g) * 100 : 0) + '%';
    $('dh-dec').disabled = $('dh-reset').disabled = n === 0;
  }
  function dhInc() { var r = row(); r.count++; r.total++; var g = r.target > 0 && r.count % r.target === 0; tick(g); bump($('dh-tap'), g); dhDraw(); saveSoon(); }
  function down(el, fn) { el.addEventListener('pointerdown', function (e) { if (e.button > 0) return; e.preventDefault(); fn(); }); el.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fn(); } }); }
  down($('dh-tap'), dhInc); down($('dh-inc'), dhInc);
  $('dh-dec').onclick = function () { var r = row(); if (!r.count) return; r.count--; r.total = Math.max(0, r.total - 1); tick(false); dhDraw(); save(); };
  $('dh-reset').onclick = function () { var r = row(); if (!r.count) return; if (D.set.conf && !confirm('Reset current count?\n\nThe selected Dhikr count returns to zero. Lifetime totals are kept.')) return; r.count = 0; dhDraw(); save(); };
  $('dh-pick').onchange = function () { D.dh.active = this.value; dhDraw(); save(); };
  $('dh-tg').onclick = function (e) { var b = e.target.closest('[data-t]'); if (!b) return; row().target = +b.dataset.t; dhDraw(); save(); };

  // ================= Previous saved counters =================
  function prof() { return D.sv.profiles.filter(function (p) { return p.id === D.sv.active; })[0]; }
  function svDraw() {
    var p = prof();
    $('sv-pick').innerHTML = D.sv.profiles.map(function (x) { return '<option value="' + x.id + '"' + (x.id === p.id ? ' selected' : '') + '>' + esc(x.name) + '</option>'; }).join('');
    chips('sv-tg', [null, 33, 34, 100], p.target);
    $('sv-n').textContent = p.count; $('sv-goal').textContent = p.target ? 'Target ' + p.target : 'No target';
    $('sv-dec').disabled = $('sv-reset').disabled = p.count === 0; $('sv-add').disabled = D.sv.profiles.length >= MAXP;
    $('sv-del').hidden = D.sv.profiles.length <= 1;
    $('sv-stats').hidden = !D.set.stats; $('sv-life').textContent = D.sv.life; $('sv-cmp').textContent = D.sv.cmp; $('sv-ses').textContent = D.sv.hist.length;
    $('sv-clear').hidden = !D.sv.hist.length;
    $('sv-hist').innerHTML = D.sv.hist.length ? D.sv.hist.slice(0, 5).map(function (h) { return '<li><b>' + esc(h.name) + '</b><span>' + (h.target ? h.count + ' / ' + h.target : h.count) + '</span><small>' + esc(h.at) + '</small></li>'; }).join('') : '<li class="hint">No completed sessions yet.</li>';
  }
  function svInc() { var p = prof(); p.count++; D.sv.life++; var g = p.target && p.count % p.target === 0; if (g) D.sv.cmp++; tick(g); bump($('sv-tap'), g); svDraw(); saveSoon(); }
  down($('sv-tap'), svInc); down($('sv-inc'), svInc);
  $('sv-dec').onclick = function () { var p = prof(); if (!p.count) return; p.count--; D.sv.life = Math.max(0, D.sv.life - 1); tick(false); svDraw(); save(); };
  $('sv-reset').onclick = function () { var p = prof(); if (!p.count) return; if (D.set.conf && !confirm('Reset counter?\n\n' + p.name)) return;
    D.sv.hist.unshift({ name: p.name, count: p.count, target: p.target, at: new Date().toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }) }); D.sv.hist = D.sv.hist.slice(0, MAXH); p.count = 0; svDraw(); save(); };
  $('sv-pick').onchange = function () { D.sv.active = this.value; svDraw(); save(); };
  $('sv-tg').onclick = function (e) { var b = e.target.closest('[data-t]'); if (!b) return; prof().target = +b.dataset.t || null; svDraw(); save(); };
  $('sv-add').onclick = function () { if (D.sv.profiles.length >= MAXP) return; var nm = prompt('Add saved counter — Counter name:', 'Counter ' + (D.sv.profiles.length + 1)); if (!nm || !nm.trim()) return; var p = { id: 'p' + Date.now(), name: nm.trim().slice(0, 40), count: 0, target: 33 }; D.sv.profiles.push(p); D.sv.active = p.id; svDraw(); save(); };
  $('sv-ren').onclick = function () { var p = prof(), nm = prompt('Rename counter:', p.name); $('sv-menu').classList.remove('open'); if (!nm || !nm.trim()) return; p.name = nm.trim().slice(0, 40); svDraw(); save(); };
  $('sv-del').onclick = function () { var p = prof(); $('sv-menu').classList.remove('open'); if (D.sv.profiles.length <= 1 || !confirm('Delete counter?\n\n' + p.name)) return; D.sv.profiles = D.sv.profiles.filter(function (x) { return x !== p; }); D.sv.active = D.sv.profiles[0].id; svDraw(); save(); };
  $('sv-clear').onclick = function () { if (confirm('Clear recent sessions?\n\nThis does not reset your saved counters.')) { D.sv.hist = []; svDraw(); save(); } };

  // ================= mode, settings, menus =================
  function drawAll() {
    $('ts-dhikr').hidden = D.mode !== 'dhikr'; $('ts-saved').hidden = D.mode !== 'saved';
    document.querySelectorAll('#ts-modes [data-mode]').forEach(function (b) { b.setAttribute('aria-pressed', b.dataset.mode === D.mode); });
    ['hap', 'beep', 'conf', 'stats'].forEach(function (k) { $('st-' + k).checked = !!D.set[k]; });
    if (D.mode === 'dhikr') dhDraw(); else svDraw();
  }
  ['hap', 'beep', 'conf', 'stats'].forEach(function (k) { $('st-' + k).onchange = function () { D.set[k] = this.checked; save(); drawAll(); }; });
  $('st-reset').onclick = function () { D.set = Object.assign({}, SETDEF); save(); drawAll(); };
  $('ts-modes').onclick = function (e) { var b = e.target.closest('[data-mode]'); if (!b) return; D.mode = b.dataset.mode; this.classList.remove('open'); save(); drawAll(); };
  function pop(btn, box) { btn.onclick = function (e) { e.stopPropagation(); document.querySelectorAll('.tb-pop.open').forEach(function (x) { if (x !== box) x.classList.remove('open'); }); btn.setAttribute('aria-expanded', box.classList.toggle('open')); }; }
  pop($('tb-menu'), $('tb-pop')); pop($('ts-modebtn'), $('ts-modes')); pop($('sv-man'), $('sv-menu'));
  document.addEventListener('click', function (e) { if (!e.target.closest('.tb-pop')) document.querySelectorAll('.tb-pop.open').forEach(function (x) { x.classList.remove('open'); }); });
  document.addEventListener('keydown', function (e) { if (e.code === 'Space' && e.target === document.body) { e.preventDefault(); (D.mode === 'dhikr' ? dhInc : svInc)(); } });
  $('tb-back').onclick = function (e) { if (history.length > 1 && document.referrer.indexOf(location.host) > -1) { e.preventDefault(); history.back(); } };
  drawAll(); save();
})();
