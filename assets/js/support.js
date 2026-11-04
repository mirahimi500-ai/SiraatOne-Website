// SPF2 Support page forms: technical support, general message, tester application. Each sends through Web3Forms (web3forms.com)
// to the SiraatOne support mailbox with its own subject and layout. Nothing is stored on this site.
(function () {
  var KEY = '3842ace9-398b-421c-bfcf-9f52f6c8b26d'; // Web3Forms access key (public by design: it only allows sending to our own mailbox)
  var K = {
    support: { btn: 'Submit request', send: function (v, ref) { return { subject: '[Support ' + ref + '] ' + v.subject + ' (' + v.app + ')', name: v.first + ' ' + v.last }; },
      done: function (v, ref) { return ['Request received', 'Thank you, ' + v.first + '. We will reply to ' + v.email + ' as soon as we can.', 'Your reference: ' + ref]; } },
    message: { btn: 'Send message', send: function (v) { return { subject: '[Message] ' + v.topic + ': ' + v.subject, name: v.name }; },
      done: function (v) { return ['Message sent', 'Thank you, ' + v.name.split(' ')[0] + '. We read every message and will reply to ' + v.email + ' if needed.']; } },
    tester: { btn: 'Apply to join', send: function (v) { return { subject: '[Tester application] ' + v.name + ' (' + v.apps + ')', name: v.name }; },
      done: function (v) { return ['Application received', 'Thank you, ' + v.name.split(' ')[0] + '. We will add ' + v.email + ' to the testers list and email you when it is ready.']; } }
  };
  var cur = null;
  function open(kind) { var d = document.getElementById('spd-' + kind); if (!d) return; cur = d;
    var f = d.querySelector('form'), dn = d.querySelector('.sp-done'); f.hidden = false; dn.hidden = true; say(d, '');
    if (d.showModal) d.showModal(); else d.setAttribute('open', '');
    setTimeout(function () { var i = f.querySelector('input:not([type=radio]):not([type=checkbox]),select'); if (i && matchMedia('(hover:hover)').matches) i.focus(); }, 80); }
  function close(d) { if (d.close) d.close(); else d.removeAttribute('open'); }
  function say(d, t, err) { var m = d.querySelector('.sp-msg'); m.textContent = t; m.className = 'sp-msg' + (err ? ' err' : ''); }
  document.addEventListener('click', function (e) { var b = e.target.closest('[data-sp-open]'); if (b) { e.preventDefault(); open(b.getAttribute('data-sp-open')); } });
  [].forEach.call(document.querySelectorAll('.sp-dlg'), function (d) {
    d.addEventListener('click', function (e) { if (e.target === d || e.target.closest('[data-sp-close]')) close(d); });
    [].forEach.call(d.querySelectorAll('textarea[maxlength]'), function (t) { var c = t.parentNode.querySelector('.sp-cnt'); t.addEventListener('input', function () { if (c) c.textContent = t.value.length + ' / ' + t.maxLength; }); });
    var f = d.querySelector('form'), kind = f.getAttribute('data-kind'), btn = f.querySelector('[type=submit]');
    f.addEventListener('submit', function (e) {
      e.preventDefault();
      var apps = f.querySelectorAll('input[name=apps]');
      if (apps.length) { var any = [].some.call(apps, function (x) { return x.checked; }); apps[0].setCustomValidity(any ? '' : 'Choose at least one app.'); }
      if (!f.reportValidity()) return;
      if (f.botcheck.checked) return;
      var fd = new FormData(f), v = {}; fd.forEach(function (val, k) { val = String(val).trim(); v[k] = v[k] ? v[k] + ', ' + val : val; });
      var ref = 'SO-' + Date.now().toString(36).slice(-6).toUpperCase(), m = K[kind].send(v, ref);
      var data = { access_key: KEY, subject: m.subject, from_name: 'SiraatOne website', replyto: v.email, form: { support: 'Technical support', message: 'General message', tester: 'Tester application' }[kind] };
      if (kind === 'support') data.reference = ref;
      Object.keys(v).forEach(function (k) { if (k !== 'agree' && k !== 'botcheck' && k !== 'first' && k !== 'last') data[k] = v[k] || '-'; });
      data.name = m.name; data.subject = m.subject; data.botcheck = '';
      btn.disabled = true; btn.textContent = 'Sending…'; say(d, '');
      fetch('https://api.web3forms.com/submit', { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify(data) })
        .then(function (r) { return r.json().catch(function () { return {}; }).then(function (j) { if (!r.ok || !j.success) throw new Error(j.message || 'failed'); }); })
        .then(function () { var t = K[kind].done(v, ref), dn = d.querySelector('.sp-done'), rf = dn.querySelector('.sp-ref');
          dn.querySelector('b').textContent = t[0]; dn.querySelector('p').textContent = t[1]; rf.hidden = !t[2]; rf.textContent = t[2] || '';
          f.reset(); [].forEach.call(f.querySelectorAll('.sp-cnt'), function (c) { c.textContent = c.textContent.replace(/^\d+/, '0'); }); f.hidden = true; dn.hidden = false; })
        .catch(function () { say(d, 'Could not send. Check your connection and try again.', true); })
        .then(function () { btn.disabled = false; btn.textContent = K[kind].btn; });
    });
    [].forEach.call(f.querySelectorAll('input[name=apps]'), function (x) { x.addEventListener('change', function () { f.querySelector('input[name=apps]').setCustomValidity(''); }); });
  });
  var h = location.hash.slice(1); if (h === 'contact') open('message'); else if (h === 'help') open('support');
})();
