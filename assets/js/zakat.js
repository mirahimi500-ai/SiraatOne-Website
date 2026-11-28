// Zakat calculator — same rules, words and price source as the SiraatOne Quran app (S1_ZAKAT_V1 … S1_ZAKAT_BREAKDOWN_V1).
// Everything stays in this browser (localStorage). Only the currency code goes out, to the public price file.
(function () {
  'use strict';
  var root = document.getElementById('zk'); if (!root) return;
  var KEY = 'so.zakat', PKEY = 'so.zakat.prices', OZ = 31.1034768, RATE = 0.025, GN = 85, SN = 595, KARATS = [24, 22, 21, 18], MAXAGE = 12 * 3600e3;
  var BASES = ['https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/', 'https://latest.currency-api.pages.dev/v1/currencies/'];
  var ITEMS = ['cash', 'bank', 'gold', 'silver', 'jewellery', 'invest', 'debts'];
  var ITEM_OF = { goldGrams: 'gold', goldValue: 'gold', silverGrams: 'silver', silverValue: 'silver', jewelleryGrams: 'jewellery', jewelleryValue: 'jewellery', shares: 'invest', business: 'invest', receivables: 'invest', other: 'invest', cash: 'cash', bank: 'bank', debts: 'debts' };
  var HM_EN = ['Muharram', 'Safar', "Rabi' al-Awwal", "Rabi' al-Akhir", 'Jumada al-Ula', 'Jumada al-Akhirah', 'Rajab', "Sha'ban", 'Ramadan', 'Shawwal', "Dhu al-Qa'dah", 'Dhu al-Hijjah'];
  var HM_AR = ['محرم', 'صفر', 'ربيع الأول', 'ربيع الآخر', 'جمادى الأولى', 'جمادى الآخرة', 'رجب', 'شعبان', 'رمضان', 'شوال', 'ذو القعدة', 'ذو الحجة'];
  var lang = (document.documentElement.lang || 'en').slice(0, 2), D = null, T = {}, st, live = null, fetching = false, failed = false;
  var $ = function (s, el) { return (el || root).querySelector(s); }, $$ = function (s, el) { return Array.prototype.slice.call((el || root).querySelectorAll(s)); };
  var esc = function (s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
  function t(k, a) { var s = T[k] != null ? T[k] : (D.strings.en[k] != null ? D.strings.en[k] : k); if (a) for (var n in a) s = s.split('{' + n + '}').join(a[n]); return s; }
  function get(k, d) { try { var v = localStorage.getItem(k); return v === null ? d : JSON.parse(v); } catch (e) { return d; } }
  function put(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }

  // ---- numbers (same as ZakatRules.parseAmount / formatMoney / editText)
  function parseAmount(text) {
    var s = '', i, c; text = String(text || '').trim();
    for (i = 0; i < text.length; i++) { c = text.charCodeAt(i);
      if (c >= 0x660 && c <= 0x669) s += String.fromCharCode(48 + c - 0x660); else if (c >= 0x6F0 && c <= 0x6F9) s += String.fromCharCode(48 + c - 0x6F0);
      else if (c === 0x66B) s += '.'; else if (c === 0x66C) s += ','; else if (c === 32 || c === 0xA0 || c === 0x202F || c === 39) continue; else s += text[i]; }
    if (!s) return 0;
    var dot = s.lastIndexOf('.'), comma = s.lastIndexOf(',');
    if (dot >= 0 && comma >= 0) { var dec = dot > comma ? '.' : ','; s = s.split(dec === '.' ? ',' : '.').join('').split(dec).join('.'); }
    else if (comma >= 0) { var p = s.split(','); s = (p.length > 2 || (p.length === 2 && p[1].length === 3)) ? s.split(',').join('') : s.split(',').join('.'); }
    else if ((s.match(/\./g) || []).length > 1) s = s.split('.').join('');
    var v = Number(s); if (!isFinite(v) || v < 0 || !/^\d*\.?\d+$|^\d+\.?$/.test(s)) return 0;
    return Math.min(v, 1e15);
  }
  function money(v) { var cents = Math.round(Math.abs(v) * 100), w = String(Math.floor(cents / 100)), f = String(cents % 100); if (f.length < 2) f = '0' + f;
    return (v < 0 && cents ? '−' : '') + w.replace(/\B(?=(\d{3})+(?!\d))/g, ',') + '.' + f; }
  function editText(v) { if (!(v > 0)) return ''; if (v === Math.round(v)) return String(v); return String(+v.toFixed(4)); }
  function cur() { return st.currency; }

  // ---- state
  function region() { var ls = navigator.languages || [navigator.language || 'en-US'], i, r;
    for (i = 0; i < ls.length; i++) { r = (ls[i].split('-')[1] || '').toUpperCase(); if (/^[A-Z]{2}$/.test(r)) return r; try { r = new Intl.Locale(ls[i]).maximize().region; if (r) return r; } catch (e) {} } return 'US'; }
  function defaults() { return { v: 1, currency: D.byRegion[region()] || 'USD', amounts: {}, goldKarat: 24, jewelleryKarat: 21, countJewellery: null, on: [], hawlMonth: 0, hawlDay: 0 }; }
  function load() { var s = get(KEY, null), d = defaults(); if (!s || typeof s !== 'object') return d;
    var o = Object.assign(d, s); if (!/^[A-Z]{3}$/.test(o.currency)) o.currency = d.currency; if (!Array.isArray(o.on)) o.on = [];
    if (KARATS.indexOf(o.goldKarat) < 0) o.goldKarat = 24; if (KARATS.indexOf(o.jewelleryKarat) < 0) o.jewelleryKarat = 21; o.amounts = o.amounts || {}; return o; }
  function save() { put(KEY, st); }
  function has(item) { return st.on.indexOf(item) > -1; }
  function A(k) { var it = ITEM_OF[k]; if (it && !has(it)) return 0; return +st.amounts[k] || 0; }
  function madhabHanafi() { var p = get('so.pt', {}) || {}; return p.a === 'Hanafi'; }
  function countJewellery() { return st.countJewellery == null ? madhabHanafi() : !!st.countJewellery; }
  function usable() { return live && live.currency === st.currency ? live : null; }

  // ---- rules (same as ZakatRules.calculate)
  function calc() {
    var u = usable(), tg = +st.amounts.goldPrice || 0, ts = +st.amounts.silverPrice || 0;
    var gp = tg > 0 ? tg : (u ? u.gold : 0), sp = ts > 0 ? ts : (u ? u.silver : 0), cj = countJewellery();
    var gBV = A('goldValue') > 0, sBV = A('silverValue') > 0, jBV = A('jewelleryValue') > 0;
    var gold = gBV ? A('goldValue') : A('goldGrams') * st.goldKarat / 24 * gp;
    var jew = !cj ? 0 : jBV ? A('jewelleryValue') : A('jewelleryGrams') * st.jewelleryKarat / 24 * gp;
    var silver = sBV ? A('silverValue') : A('silverGrams') * sp;
    var invest = A('shares') + A('business') + A('receivables') + A('other');
    var assets = A('cash') + A('bank') + gold + jew + silver + invest, debts = A('debts'), net = assets > debts ? assets - debts : 0;
    var ownsAnyGold = A('goldGrams') > 0 || A('goldValue') > 0 || (cj && (A('jewelleryGrams') > 0 || A('jewelleryValue') > 0));
    var ownsOther = ['cash', 'bank', 'silverGrams', 'silverValue', 'shares', 'business', 'receivables', 'other'].some(function (k) { return A(k) > 0; });
    var goldBasis = ownsAnyGold && !ownsOther, nisabPrice = goldBasis ? gp : sp, nisab = goldBasis ? GN * gp : SN * sp;
    var priceMissing = !(nisabPrice > 0), reached = !priceMissing && net > 0 && net >= nisab;
    var ownsGoldW = (!gBV && A('goldGrams') > 0) || (cj && !jBV && A('jewelleryGrams') > 0);
    var missing = priceMissing ? (goldBasis ? 'goldPrice' : 'silverPrice') : ownsGoldW && !(gp > 0) ? 'goldPrice' : (!sBV && A('silverGrams') > 0 && !(sp > 0)) ? 'silverPrice' : null;
    var L = [];
    if (A('cash') > 0) L.push({ item: 'cash', value: A('cash') });
    if (A('bank') > 0) L.push({ item: 'bank', value: A('bank') });
    if (gold > 0) L.push({ item: 'gold', value: gold, grams: A('goldGrams'), karat: st.goldKarat, byValue: gBV });
    if (silver > 0) L.push({ item: 'silver', value: silver, grams: A('silverGrams'), byValue: sBV });
    if (jew > 0) L.push({ item: 'jewellery', value: jew, grams: A('jewelleryGrams'), karat: st.jewelleryKarat, byValue: jBV });
    if (invest > 0) L.push({ item: 'invest', value: invest });
    if (debts > 0) L.push({ item: 'debts', value: -debts });
    var dueCents = reached ? Math.round(net * RATE * 100) : 0, cents = L.map(function (l) { return reached ? Math.round(l.value * RATE * 100) : 0; });
    if (reached && L.length) { var diff = dueCents - cents.reduce(function (s, c) { return s + c; }, 0); if (diff) { var big = 0; for (var i = 1; i < L.length; i++) if (L[i].value > L[big].value) big = i; cents[big] += diff; } }
    L.forEach(function (l, i) { l.zakat = cents[i] / 100; });
    return { lines: L, assets: assets, debts: debts, net: net, nisab: nisab, due: reached ? net * RATE : 0, priceMissing: priceMissing, reached: reached, goldBasis: goldBasis, missing: missing, gp: gp, sp: sp, gold: gold, silver: silver, jew: jew };
  }

  // ---- live prices (same source as zakat_prices.dart)
  function rate(base, metal, code) {
    return fetch(base + metal + '.json', { headers: { Accept: 'application/json' }, cache: 'no-store' }).then(function (r) { if (!r.ok) throw 0; return r.json(); })
      .then(function (d) { var v = d && d[metal] && d[metal][code]; if (typeof v !== 'number' || !(v > 0) || v > 1e12 || typeof d.date !== 'string') throw 0; return [v, d.date]; });
  }
  function fetchPrices() {
    var code = st.currency.toLowerCase(); if (!/^[a-z]{3}$/.test(code)) return;
    var c = get(PKEY, null);
    if (c && c.v === 1 && c.currency === st.currency && Date.now() - c.fetchedAt < MAXAGE && c.gold > 0 && c.silver > 0) { live = c; failed = false; render(); return; }
    if (c && c.v === 1 && c.currency === st.currency && c.gold > 0) live = c; // older price until today's arrives
    fetching = st.currency; failed = false; render();
    var want = st.currency, i = 0;
    (function next() {
      if (i >= BASES.length) { if (fetching === want) { fetching = false; failed = !usable(); render(); } return; }
      var b = BASES[i++];
      Promise.all([rate(b, 'xau', code), rate(b, 'xag', code)]).then(function (r) {
        if (want !== st.currency) return;
        live = { v: 1, currency: want, gold: r[0][0] / OZ, silver: r[1][0] / OZ, date: r[0][1], fetchedAt: Date.now() }; put(PKEY, live);
        fetching = false; failed = false; render();
      }).catch(next);
    })();
  }

  // ---- Hijri (same calendar settings as the Islamic Calendar page)
  var C = Object.assign({ cal: 'islamic-umalqura', adj: 0 }, get('so.cal2', {}) || {}), HF = null;
  try { HF = new Intl.DateTimeFormat('en-u-ca-' + C.cal + '-nu-latn', { timeZone: 'UTC', day: 'numeric', month: 'numeric', year: 'numeric' }); } catch (e) {}
  function H(d) { var o = {}; HF.formatToParts(new Date(d.getTime() + (+C.adj || 0) * 864e5)).forEach(function (p) { o[p.type] = p.value; }); return { y: parseInt(o.year, 10), m: +o.month, d: +o.day }; }
  function todayUTC() { var n = new Date(); return new Date(Date.UTC(n.getFullYear(), n.getMonth(), n.getDate())); }
  function nextDue() {
    if (!HF || !(st.hawlMonth >= 1 && st.hawlMonth <= 12 && st.hawlDay >= 1)) return null;
    var t0 = todayUTC();
    for (var i = 0; i < 400; i++) { var d = new Date(t0.getTime() + i * 864e5), x = H(d);
      if (x.m !== st.hawlMonth) continue;
      if (x.d === st.hawlDay) return { date: d, days: i };
      if (x.d < st.hawlDay && H(new Date(d.getTime() + 864e5)).m !== st.hawlMonth) return { date: d, days: i }; // day 30 in a 29-day month
    }
    return null;
  }
  function hmName(m) { return (/^(ar|ur|fa|ps)$/.test(lang) ? HM_AR : HM_EN)[m - 1]; }

  // ---- build the page once
  var U = function () { return '<em class="zk-u">' + esc(cur()) + '</em>'; };
  function field(k, label, unit, note) {
    return '<label class="zk-f" data-f="' + k + '"><span class="zk-l">' + esc(label) + '</span><span class="zk-box"><input data-k="' + k + '" inputmode="decimal" autocomplete="off" spellcheck="false"><em class="zk-u" data-u="' + unit + '"></em></span>' + (note ? '<small class="zk-note">' + esc(note) + '</small>' : '') + '</label>';
  }
  function pair(pre) {
    return '<div class="zk-pair"><span class="zk-l">' + esc(t('weightOrValue')) + '</span><div class="zk-two">' +
      '<label class="zk-box"><input data-k="' + pre + 'Grams" inputmode="decimal" autocomplete="off" aria-label="' + esc(t('weightShort')) + '"><em class="zk-u">g</em></label>' +
      '<label class="zk-box"><input data-k="' + pre + 'Value" inputmode="decimal" autocomplete="off" aria-label="' + esc(t('value')) + '"><em class="zk-u" data-u="cur"></em></label></div>' +
      '<small class="zk-note">' + esc(t('pairHint')) + '</small><small class="zk-counted" data-counted="' + pre + '" hidden></small></div>';
  }
  function karat(k) { return '<label class="zk-f zk-kar"><span class="zk-l">' + esc(t('karat')) + '</span><select data-karat="' + k + '">' + KARATS.map(function (x) { return '<option value="' + x + '">' + x + 'K</option>'; }).join('') + '</select></label>'; }
  function item(id, name, body) {
    return '<div class="zk-item" data-item="' + id + '"><label class="zk-row"><span class="zk-name"><b>' + esc(name) + '</b><small class="zk-sub" data-sub="' + id + '"></small></span>' +
      '<input type="checkbox" class="zk-sw" role="switch" data-on="' + id + '"></label><div class="zk-body" hidden>' + body + '</div></div>';
  }
  function build() {
    var years = '<option value="0">' + esc(t('notSet')) + '</option>', days = '<option value="0">' + esc(t('notSet')) + '</option>', i;
    for (i = 1; i <= 12; i++) years += '<option value="' + i + '">' + esc(hmName(i)) + '</option>';
    for (i = 1; i <= 30; i++) days += '<option value="' + i + '">' + i + '</option>';
    $('#zk-items').innerHTML =
      '<div class="zk-cur"><span class="zk-l">' + esc(t('currency')) + '</span><button type="button" class="btn btn-ghost sm" id="zk-cur-btn"></button></div>' +
      '<h3 class="zk-sec">' + esc(t('sectionCash')) + '</h3>' +
      item('cash', t('cashInHand'), field('cash', t('cashInHand'), 'cur')) +
      item('bank', t('bank'), field('bank', t('bank'), 'cur')) +
      '<h3 class="zk-sec">' + esc(t('sectionGold')) + '</h3>' +
      item('gold', t('gold'), karat('goldKarat') + pair('gold')) +
      item('silver', t('silver'), pair('silver')) +
      item('jewellery', t('jewelleryItem'), '<label class="zk-row zk-row-in"><span class="zk-name"><b>' + esc(t('jewellery')) + '</b></span><input type="checkbox" class="zk-sw" role="switch" id="zk-cj"></label><small class="zk-note">' + esc(t('jewelleryNote')) + '</small><div id="zk-jw">' + karat('jewelleryKarat') + pair('jewellery') + '</div>') +
      '<h3 class="zk-sec">' + esc(t('sectionInvest')) + '</h3>' +
      item('invest', t('sectionInvest'), field('shares', t('shares'), 'cur') + field('business', t('business'), 'cur') + field('receivables', t('receivables'), 'cur') + field('other', t('other'), 'cur')) +
      '<h3 class="zk-sec">' + esc(t('sectionDebts')) + '</h3>' +
      item('debts', t('debts'), field('debts', t('debts'), 'cur', t('debtsNote')));
    $('#zk-prices').innerHTML = '<h2>' + esc(t('sectionNisab')) + '</h2>' +
      '<div class="zk-nrow"><span id="zk-n-name"></span><b id="zk-n-amt"></b></div>' +
      '<label class="zk-f" id="zk-gp"><span class="zk-l" id="zk-gp-l"></span><span class="zk-box"><input data-price="gold" inputmode="decimal" autocomplete="off"><em class="zk-u" data-u="curg"></em></span><small class="zk-note" id="zk-gp-n"></small></label>' +
      '<div class="zk-nrow zk-jp" id="zk-jp" hidden><span id="zk-jp-l"></span><b id="zk-jp-v"></b></div>' +
      '<label class="zk-f"><span class="zk-l">' + esc(t('silverPrice')) + '</span><span class="zk-box"><input data-price="silver" inputmode="decimal" autocomplete="off"><em class="zk-u" data-u="curg"></em></span><small class="zk-note" id="zk-sp-n"></small></label>' +
      '<p class="zk-foot">' + esc(t('nisabAuto')) + '</p>';
    $('#zk-year').innerHTML = '<h2>' + esc(t('sectionYear')) + '</h2><div class="zk-date"><span class="zk-l">' + esc(t('zakatDate')) + '</span><div class="zk-two"><select id="zk-hd" aria-label="' + esc(t('day')) + '">' + days + '</select><select id="zk-hm" aria-label="' + esc(t('month')) + '">' + years + '</select></div>' +
      '<button type="button" class="btn btn-ghost sm" id="zk-today">' + esc(t('today')) + '</button></div><p class="zk-next" id="zk-next"></p>';
    $('#zk-rules').innerHTML = '<h2>' + esc(t('rulesTitle')) + '</h2><ol><li>' + esc(t('rule1')) + '</li><li>' + esc(t('rule2')) + '</li><li>' + esc(t('rule3')) + '</li></ol>';
    $('#zk-reset-wrap').innerHTML = '<button type="button" class="btn btn-ghost" id="zk-reset">' + esc(t('reset')) + '</button><span id="zk-confirm" hidden><b>' + esc(t('resetConfirm')) + '</b> <button type="button" class="btn btn-ghost sm" id="zk-no">' + esc(t('cancel')) + '</button> <button type="button" class="btn btn-primary sm" id="zk-yes">' + esc(t('reset')) + '</button></span>';
    document.title = t('title') + ' — SiraatOne';
    $$('[data-t]', document).forEach(function (e) { e.textContent = t(e.getAttribute('data-t')); });
    fill();
  }
  function fill() { // inputs from the state (only when not being typed in)
    $$('input[data-k]').forEach(function (i) { if (document.activeElement !== i) i.value = editText(+st.amounts[i.getAttribute('data-k')] || 0); });
    $$('input[data-on]').forEach(function (i) { i.checked = has(i.getAttribute('data-on')); });
    $$('select[data-karat]').forEach(function (s) { s.value = String(st[s.getAttribute('data-karat')]); });
    $('#zk-cj').checked = countJewellery(); $('#zk-hd').value = String(st.hawlDay || 0); $('#zk-hm').value = String(st.hawlMonth || 0);
    var gi = $('input[data-price=gold]'), si = $('input[data-price=silver]');
    if (document.activeElement !== gi) gi.value = editText((+st.amounts.goldPrice || 0) * st.goldKarat / 24);
    if (document.activeElement !== si) si.value = editText(+st.amounts.silverPrice || 0);
  }

  // ---- show the numbers
  function priceNote(typed) {
    if (typed) return t('priceYours'); var u = usable();
    if (u) return t('priceLive', { date: u.date }); if (fetching) return t('priceLoading'); return t('priceOffline');
  }
  function render() {
    if (!D) return; var r = calc(), c = cur(), u = usable();
    $('#zk-cur-btn').textContent = c + ' ▾';
    $$('[data-u]').forEach(function (e) { var k = e.getAttribute('data-u'); e.textContent = k === 'cur' ? c : k === 'curg' ? c + '/g' : 'g'; });
    ITEMS.forEach(function (id) { var on = has(id), it = $('.zk-item[data-item="' + id + '"]'); it.classList.toggle('on', on); $('.zk-body', it).hidden = !on; });
    $('#zk-jw').hidden = !countJewellery();
    // Nisab next to Gold and Silver
    $('[data-sub=gold]').textContent = t('nisab') + ': ' + GN + ' g' + (r.gp > 0 ? ' · ' + money(GN * r.gp) + ' ' + c : '');
    $('[data-sub=silver]').textContent = t('nisab') + ': ' + SN + ' g' + (r.sp > 0 ? ' · ' + money(SN * r.sp) + ' ' + c : '');
    // weight or value: worth and "Counted"
    [['gold', st.goldKarat, r.gp], ['silver', 24, r.sp], ['jewellery', st.jewelleryKarat, r.gp]].forEach(function (m) {
      var g = A(m[0] + 'Grams'), byV = A(m[0] + 'Value') > 0, worth = !byV && g > 0 && m[2] > 0 ? g * m[1] / 24 * m[2] : 0, vi = $('input[data-k="' + m[0] + 'Value"]'), cn = $('[data-counted=' + m[0] + ']');
      vi.placeholder = worth > 0 ? money(worth) : t('value'); $('input[data-k="' + m[0] + 'Grams"]').placeholder = t('weightShort');
      var val = byV ? A(m[0] + 'Value') : worth; cn.hidden = !(val > 0); cn.textContent = val > 0 ? t('counted', { amount: money(val) + ' ' + c }) : '';
    });
    // Nisab and prices
    $('#zk-n-name').textContent = t('nisab') + ': ' + (r.goldBasis ? t('nisabGold') : t('nisabSilver'));
    $('#zk-n-amt').textContent = r.nisab > 0 ? money(r.nisab) + ' ' + c : '—';
    var showGold = has('gold') || (has('jewellery') && countJewellery());
    $('#zk-gp').hidden = !showGold; $('#zk-gp-l').textContent = t('goldPrice', { k: st.goldKarat });
    var gi = $('input[data-price=gold]'), si = $('input[data-price=silver]');
    gi.placeholder = u ? money(u.gold * st.goldKarat / 24) : ''; si.placeholder = u ? money(u.silver) : '';
    $('#zk-gp-n').textContent = priceNote(+st.amounts.goldPrice > 0); $('#zk-sp-n').textContent = priceNote(+st.amounts.silverPrice > 0);
    var jp = $('#zk-jp'), jpOn = has('jewellery') && countJewellery() && st.jewelleryKarat !== st.goldKarat && r.gp > 0;
    jp.hidden = !jpOn; if (jpOn) { $('#zk-jp-l').textContent = t('jewelleryPrice', { k: st.jewelleryKarat }); $('#zk-jp-v').textContent = money(r.gp * st.jewelleryKarat / 24) + ' ' + c + '/g'; }
    // the green card
    var nm = { cash: t('cashInHand'), bank: t('bank'), gold: t('gold'), silver: t('silver'), jewellery: t('jewelleryItem'), invest: t('sectionInvest'), debts: t('sectionDebts') };
    var lines = r.lines.map(function (l) {
      var how = l.item === 'gold' || l.item === 'jewellery' ? (l.byValue ? t('value') : l.karat + 'K · ' + editText(l.grams) + ' g') : l.item === 'silver' ? (l.byValue ? t('value') : editText(l.grams) + ' g') : '';
      return '<li' + (l.value < 0 ? ' class="neg"' : '') + '><span>' + esc(nm[l.item]) + (how ? '<small>' + esc(how) + '</small>' : '') + '</span><span class="zk-v">' + money(l.value) + '</span><b>' + money(l.zakat) + '</b></li>';
    }).join('');
    var status = '';
    if (r.missing || r.priceMissing) status = fetching ? t('priceLoading') : t((r.missing || (r.goldBasis ? 'goldPrice' : 'silverPrice')) === 'goldPrice' ? 'needGoldPrice' : 'needSilverPrice');
    else if (r.reached) status = t('aboveNisab'); else if (r.assets > 0) status = t('belowNisabAmount', { amount: money(r.nisab) + ' ' + c });
    $('#zk-card').innerHTML = '<div class="zk-ct"><b>' + esc(t('dueTitle')) + '</b><span class="zk-rate">2.5%</span></div>' +
      (lines ? '<ul class="zk-lines">' + lines + '</ul><div class="zk-tot"><span>' + esc(t('total')) + '</span><b>' + money(r.net) + ' ' + esc(c) + '</b></div>' : '') +
      '<div class="zk-due" id="zk-due">' + money(r.due) + ' <small>' + esc(c) + '</small></div>' +
      (r.nisab > 0 ? '<p class="zk-nl">' + esc(t('nisab')) + ' · ' + esc(r.goldBasis ? t('nisabGold') : t('nisabSilver')) + ' = ' + money(r.nisab) + ' ' + esc(c) + '</p>' : '') +
      (status ? '<p class="zk-st' + (r.reached ? ' ok' : '') + '">' + esc(status) + '</p>' : '');
    var hd = document.getElementById('zk-hero-due'); if (hd) hd.textContent = money(r.due) + ' ' + c;
    var pill = document.getElementById('zk-pill'); if (pill) pill.querySelector('b').textContent = money(r.due) + ' ' + c;
    // Zakat year
    var n = nextDue(), nx = $('#zk-next');
    nx.textContent = !n ? '' : n.days === 0 ? t('dueToday') : t('nextDue', { date: n.date.toLocaleDateString(lang === 'en' ? undefined : lang + '-u-nu-latn', { timeZone: 'UTC', day: 'numeric', month: 'long', year: 'numeric' }), days: n.days });
  }

  // ---- events
  function wire() {
    root.addEventListener('input', function (e) {
      var i = e.target, k = i.getAttribute('data-k'), p = i.getAttribute('data-price');
      if (k) { var v = parseAmount(i.value); if (v > 0) st.amounts[k] = v; else delete st.amounts[k];
        if (/Grams$/.test(k) && v > 0) { delete st.amounts[k.replace('Grams', 'Value')]; var o = $('input[data-k="' + k.replace('Grams', 'Value') + '"]'); if (o) o.value = ''; } // fill one
        if (/Value$/.test(k) && v > 0) { delete st.amounts[k.replace('Value', 'Grams')]; var g = $('input[data-k="' + k.replace('Value', 'Grams') + '"]'); if (g) g.value = ''; } }
      if (p === 'gold') { var gv = parseAmount(i.value); if (gv > 0) st.amounts.goldPrice = gv * 24 / st.goldKarat; else delete st.amounts.goldPrice; } // saved as its 24K price
      if (p === 'silver') { var sv = parseAmount(i.value); if (sv > 0) st.amounts.silverPrice = sv; else delete st.amounts.silverPrice; }
      if (k || p) { save(); render(); }
    });
    root.addEventListener('change', function (e) {
      var i = e.target, on = i.getAttribute('data-on'), kr = i.getAttribute('data-karat');
      if (on) { var x = st.on.indexOf(on); if (i.checked && x < 0) st.on.push(on); if (!i.checked && x > -1) st.on.splice(x, 1); save(); render();
        if (i.checked) { var f = $('.zk-item[data-item="' + on + '"] .zk-body input:not([type=checkbox])'); if (f && on !== 'jewellery') try { f.focus({ preventScroll: true }); } catch (er) { f.focus(); } } }
      if (kr) { st[kr] = +i.value; save(); fill(); render(); }
      if (i.id === 'zk-cj') { st.countJewellery = i.checked; save(); render(); }
      if (i.id === 'zk-hd' || i.id === 'zk-hm') { st.hawlDay = +$('#zk-hd').value; st.hawlMonth = +$('#zk-hm').value; save(); render(); }
    });
    root.addEventListener('focusout', function (e) { if (e.target.matches('input[data-k],input[data-price]')) fill(); });
    root.addEventListener('click', function (e) {
      var b = e.target.closest('button'); if (!b) return;
      if (b.id === 'zk-cur-btn') openCur();
      if (b.id === 'zk-today' && HF) { var h = H(todayUTC()); st.hawlMonth = h.m; st.hawlDay = h.d; save(); fill(); render(); }
      if (b.id === 'zk-reset') { $('#zk-reset').hidden = true; $('#zk-confirm').hidden = false; }
      if (b.id === 'zk-no') { $('#zk-reset').hidden = false; $('#zk-confirm').hidden = true; }
      if (b.id === 'zk-yes') { var keep = { currency: st.currency, hawlMonth: st.hawlMonth, hawlDay: st.hawlDay }; st = Object.assign(defaults(), keep); save(); $('#zk-reset').hidden = false; $('#zk-confirm').hidden = true; fill(); render(); }
    });
    // phones: a "Zakat due" pill until the card is on screen; a tap scrolls to it
    var pill = document.getElementById('zk-pill'), card = $('#zk-card');
    if (pill && 'IntersectionObserver' in window) {
      new IntersectionObserver(function (es) { pill.classList.toggle('show', !es[0].isIntersecting); }).observe(card);
      pill.onclick = function () { card.scrollIntoView({ behavior: 'smooth', block: 'center' }); };
    }
  }
  // currency picker with search
  function curName(code) { try { return new Intl.DisplayNames([lang === 'en' ? 'en' : lang, 'en'], { type: 'currency' }).of(code); } catch (e) { return code; } }
  function openCur() {
    var m = document.getElementById('zk-curm'), list = m.querySelector('ul'), q = m.querySelector('input');
    function draw() { var s = q.value.trim().toLowerCase(), seen = {};
      list.innerHTML = D.currencies.filter(function (c) { if (seen[c]) return false; seen[c] = 1; return !s || c.toLowerCase().indexOf(s) > -1 || curName(c).toLowerCase().indexOf(s) > -1; })
        .map(function (c) { return '<li><button type="button" data-cur="' + c + '"' + (c === st.currency ? ' aria-current="true"' : '') + '><b>' + c + '</b><span>' + esc(curName(c)) + '</span></button></li>'; }).join(''); }
    m.querySelector('h2').textContent = t('chooseCurrency'); q.placeholder = t('search'); q.value = ''; draw(); m.hidden = false; setTimeout(function () { q.focus(); }, 50);
    q.oninput = draw;
    m.onclick = function (e) { var b = e.target.closest('[data-cur]');
      if (b) { if (b.getAttribute('data-cur') !== st.currency) { st.currency = b.getAttribute('data-cur'); delete st.amounts.goldPrice; delete st.amounts.silverPrice; live = null; save(); fill(); fetchPrices(); } m.hidden = true; render(); return; }
      if (e.target === m || e.target.closest('[data-close]')) m.hidden = true; };
    m.onkeydown = function (e) { if (e.key === 'Escape') m.hidden = true; };
  }

  fetch(root.getAttribute('data-src'), { cache: 'force-cache' }).then(function (r) { return r.json(); }).then(function (d) {
    D = d; T = d.strings[lang] || d.strings.en; st = load(); build(); wire(); render(); fetchPrices();
  }).catch(function () { root.innerHTML = '<p class="hint">The Zakat calculator could not load. Please refresh the page.</p>'; });
})();
