/* FINNPUTER Card */
(() => {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const CFG = window.FINNPUTER_CARD || {};
  const API = (CFG.api || '').replace(/\/$/, '');
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

  /* ---------- nav ---------- */
  const nav = $('#nav'), navMenu = $('#navMenu');
  const navLinks = $$('#navLinks a').map(a => ({ a, sec: $(a.getAttribute('href')) })).filter(l => l.sec);
  let navY = scrollY;
  const setMenu = open => {
    nav.classList.toggle('is-open', open);
    if (navMenu) navMenu.setAttribute('aria-expanded', open ? 'true' : 'false');
  };
  const onNav = () => {
    const y = scrollY, d = y - navY;
    nav.classList.toggle('is-solid', y > 40);
    if (nav.classList.contains('is-open')) { if (Math.abs(d) > 30) setMenu(false); }
    else if (y < 240 || d < -6) nav.classList.remove('is-away');
    else if (d > 6) nav.classList.add('is-away');
    if (Math.abs(d) > 6) navY = y;
    const mid = innerHeight * 0.4;
    navLinks.forEach(l => {
      const r = l.sec.getBoundingClientRect();
      if (r.top <= mid && r.bottom > mid) l.a.setAttribute('aria-current', 'true'); else l.a.removeAttribute('aria-current');
    });
  };
  addEventListener('scroll', onNav, { passive: true }); onNav();
  if (navMenu) {
    navMenu.addEventListener('click', e => { e.stopPropagation(); setMenu(!nav.classList.contains('is-open')); });
    $$('#navLinks a, .nav__cta, .nav__brand').forEach(a => a.addEventListener('click', () => setMenu(false)));
    document.addEventListener('click', e => { if (!nav.contains(e.target)) setMenu(false); });
    addEventListener('keydown', e => { if (e.key === 'Escape') setMenu(false); });
  }

  /* ---------- reveals, staggered ---------- */
  $$('[data-stagger]').forEach(g => $$('[data-reveal]', g).forEach((el, i) => el.style.setProperty('--i', i)));
  const io = new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); }
  }), { threshold: 0.18, rootMargin: '0px 0px -6% 0px' });
  $$('[data-reveal]').forEach(el => io.observe(el));

  /* ---------- count up ---------- */
  const cio = new IntersectionObserver(es => es.forEach(e => {
    if (!e.isIntersecting) return;
    cio.unobserve(e.target);
    const el = e.target, end = +el.dataset.count, dec = +(el.dataset.decimals || 0), pre = el.dataset.prefix || '';
    const fmt = new Intl.NumberFormat('en-US', { minimumFractionDigits: dec, maximumFractionDigits: dec });
    if (reduce) { el.textContent = pre + fmt.format(end); return; }
    const t0 = performance.now(), dur = 1600;
    const tick = t => {
      const u = clamp((t - t0) / dur, 0, 1), eased = 1 - Math.pow(1 - u, 4);
      el.textContent = pre + fmt.format(end * eased);
      if (u < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }), { threshold: 0.6 });
  $$('[data-count]').forEach(el => cio.observe(el));

  /* ---------- spotlight cards ---------- */
  $$('.spot').forEach(el => el.addEventListener('pointermove', e => {
    const r = el.getBoundingClientRect();
    el.style.setProperty('--mx', (e.clientX - r.left) + 'px');
    el.style.setProperty('--my', (e.clientY - r.top) + 'px');
  }));

  /* ---------- hero parallax ---------- */
  const hv = $('#heroVisual');
  if (hv && !reduce) {
    let mx = 0, my = 0;
    const apply = () => {
      const s = Math.min(scrollY, innerHeight);
      hv.style.setProperty('--px', (mx * 14).toFixed(1));
      hv.style.setProperty('--py', (my * 10 - s * 0.07).toFixed(1));
    };
    addEventListener('pointermove', e => {
      if (e.pointerType === 'touch') return;
      mx = e.clientX / innerWidth - 0.5; my = e.clientY / innerHeight - 0.5; apply();
    }, { passive: true });
    addEventListener('scroll', apply, { passive: true });
  }

  /* ---------- click spark ---------- */
  const cv = $('#spark');
  if (cv && !reduce) {
    const ctx = cv.getContext('2d');
    let sparks = [], running = false, dpr = 1;
    const size = () => { dpr = Math.min(devicePixelRatio || 1, 2); cv.width = innerWidth * dpr; cv.height = innerHeight * dpr; };
    size(); addEventListener('resize', size);
    const draw = now => {
      ctx.clearRect(0, 0, cv.width, cv.height);
      sparks = sparks.filter(s => now - s.t < 420);
      ctx.lineWidth = 2 * dpr; ctx.lineCap = 'round';
      for (const s of sparks) {
        const u = (now - s.t) / 420, e = 1 - Math.pow(1 - u, 3);
        const d0 = (8 + 26 * e) * dpr, d1 = d0 + 9 * (1 - u) * dpr;
        ctx.strokeStyle = `rgba(${s.c},${1 - u})`;
        for (let i = 0; i < 8; i++) {
          const a = i * Math.PI / 4 + s.r;
          ctx.beginPath();
          ctx.moveTo(s.x + Math.cos(a) * d0, s.y + Math.sin(a) * d0);
          ctx.lineTo(s.x + Math.cos(a) * d1, s.y + Math.sin(a) * d1);
          ctx.stroke();
        }
      }
      if (sparks.length) requestAnimationFrame(draw); else running = false;
    };
    addEventListener('pointerdown', e => {
      const gold = e.target.closest && e.target.closest('.metal, .btn--gold');
      sparks.push({ x: e.clientX * dpr, y: e.clientY * dpr, t: performance.now(), r: Math.random(), c: gold ? '246,213,149' : '61,242,160' });
      if (!running) { running = true; requestAnimationFrame(draw); }
    }, { passive: true });
  }

  /* ---------- scroll film: the card changes as you scroll ---------- */
  const sc = $('#cards'), film = $('#film');
  if (sc && film) {
    const skins = ['virtual', 'physical', 'metal'];
    const tabs = $$('.tab', sc), panes = $$('.pane', sc);
    const imgA = $('.film__img--a', film), imgB = $('.film__img--b', film), imgP = $('.film__img--p', film), flash = $('.film__flash', film), cvs = $('#filmCanvas');
    const smooth = (x, a, b) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
    let cur = -1, pp = 0, manual = 0, visible = false, tx = 0, ty = 0, ptx = 0, pty = 0;

    // optional frame sequence (a video cut into stills). Off until config.js names one.
    const seq = CFG.film && CFG.film.count > 1 ? CFG.film : null;
    const frames = []; let seqReady = false, lastDrawn = -1, ctx = null;
    const loadSeq = () => {
      if (!seq || frames.length) return;
      const mobile = innerWidth < 760 && seq.pathSmall;
      for (let i = 1; i <= seq.count; i++) {
        const im = new Image();
        im.decoding = 'async';
        im.src = (mobile ? seq.pathSmall : seq.path) + String(i).padStart(3, '0') + '.' + (seq.ext || 'webp');
        frames.push(im);
      }
      frames[0].onload = () => {
        cvs.width = frames[0].naturalWidth; cvs.height = frames[0].naturalHeight;
        ctx = cvs.getContext('2d'); cvs.hidden = false; imgA.style.opacity = 0; imgB.style.opacity = 0; seqReady = true; lastDrawn = -1;
      };
    };
    const drawSeq = p => {
      let i = Math.round(p * (seq.count - 1));
      while (i > 0 && !(frames[i].complete && frames[i].naturalWidth)) i--; // nearest loaded frame
      if (i === lastDrawn || !frames[i].naturalWidth) return;
      ctx.drawImage(frames[i], 0, 0, cvs.width, cvs.height); lastDrawn = i;
    };

    const progress = () => {
      const r = sc.getBoundingClientRect(), total = r.height - innerHeight;
      return total > 0 ? clamp(-r.top / total, 0, 1) : 0;
    };
    const setSkin = i => {
      if (i === cur) return; cur = i;
      sc.dataset.skin = skins[i];
      tabs.forEach((t, n) => { t.classList.toggle('is-on', n === i); t.setAttribute('aria-selected', n === i); });
      panes.forEach((p, n) => p.classList.toggle('is-on', n === i));
    };
    // scroll position -> place in the clip. Lets the morph happen exactly where the copy changes.
    const remap = p => {
      const m = seq.map; if (!m) return p;
      for (let i = 1; i < m.length; i++) {
        if (p <= m[i][0]) { const [x0, y0] = m[i - 1], [x1, y1] = m[i]; return y0 + (y1 - y0) * ((p - x0) / (x1 - x0 || 1)); }
      }
      return 1;
    };
    const paint = p => {
      if (seqReady) {
        const cut = seq.cut || [0.34, 0.66];
        setSkin(p < cut[0] ? 0 : p < cut[1] ? 1 : 2);
        drawSeq(clamp(remap(p), 0, 1));
        // physical card: same card, glow switched off
        const q = seq.quiet ? smooth(p, seq.quiet[0], seq.quiet[0] + 0.07) * (1 - smooth(p, seq.quiet[1] - 0.05, seq.quiet[1] + 0.02)) : 0;
        const f = q > 0.01 ? `saturate(${(1 - 0.9 * q).toFixed(2)})` : '';
        if (cvs.style.filter !== f) cvs.style.filter = f;
        // physical card: the real printed version fades in over the clip, same pose as the first frame
        if (imgP && seq.still) {
          const st = seq.still, a = smooth(p, st.in[0], st.in[1]) * (1 - smooth(p, st.out[0], st.out[1]));
          imgP.style.opacity = a.toFixed(3);
          imgP.style.transform = `scale(${(1 + 0.035 * smooth(p, st.in[0], st.out[1])).toFixed(4)})`;
        }
        return;
      }
      setSkin(p < 0.34 ? 0 : p < 0.66 ? 1 : 2);
      const mix = smooth(p, 0.6, 0.72), quiet = smooth(p, 0.27, 0.4);
      imgA.style.opacity = (1 - mix).toFixed(3);
      imgB.style.opacity = mix.toFixed(3);
      if (imgP) { imgP.style.opacity = (quiet * (1 - mix)).toFixed(3); imgP.style.transform = `scale(${(1 + p * 0.16).toFixed(4)}) rotate(${(-1.4 + p * 3.4).toFixed(2)}deg)`; }
      else imgA.style.filter = quiet > 0.01 ? `saturate(${(1 - 0.88 * quiet).toFixed(2)})` : '';
      imgA.style.transform = `scale(${(1 + p * 0.16).toFixed(4)}) rotate(${(-1.4 + p * 3.4).toFixed(2)}deg)`;
      const e = smooth(p, 0.6, 1);
      imgB.style.transform = `scale(${(1.16 - e * 0.16).toFixed(4)}) rotate(${(1.8 - e * 1.8).toFixed(2)}deg)`;
      flash.style.opacity = (smooth(p, 0.54, 0.66) * (1 - smooth(p, 0.66, 0.8))).toFixed(3);
      flash.style.transform = `translateX(${((p - 0.66) * 240).toFixed(1)}%)`;
    };
    const frame = () => {
      if (!visible) return;
      pp += (progress() - pp) * 0.14;
      paint(pp);
      tx += (ptx - tx) * 0.08; ty += (pty - ty) * 0.08;
      film.style.setProperty('--tx', tx.toFixed(2)); film.style.setProperty('--ty', ty.toFixed(2));
      requestAnimationFrame(frame);
    };
    if (reduce) { paint(0); }
    else {
      new IntersectionObserver(es => es.forEach(e => {
        const was = visible; visible = e.isIntersecting;
        if (visible) loadSeq();
        if (visible && !was) { pp = progress(); requestAnimationFrame(frame); }
      }), { rootMargin: '60% 0px' }).observe(sc);
      addEventListener('pointermove', e => {
        if (e.pointerType === 'touch' || !visible) return;
        ptx = (e.clientX / innerWidth - 0.5) * 9; pty = (e.clientY / innerHeight - 0.5) * -6;
      }, { passive: true });
    }
    const stops = (seq && seq.stops) || [0.1, 0.5, 0.95];
    tabs.forEach((t, i) => t.addEventListener('click', () => {
      if (reduce) { manual = i; paint([0.1, 0.5, 0.95][i]); return; }
      const top = sc.getBoundingClientRect().top + scrollY;
      scrollTo({ top: top + stops[i] * (sc.offsetHeight - innerHeight), behavior: 'smooth' });
    }));
  }

  /* ---------- pricing switch (comes from the server, off by default) ---------- */
  const money = n => '$' + new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(n);
  function applyPricing(c) {
    if (!c || !c.pricingPublic || !Array.isArray(c.tiers) || !c.tiers.length) return;
    const list = $('#tiers'); if (!list) return;
    const max = Math.max(...c.tiers.map(t => t.fee));
    list.innerHTML = c.tiers.map((t, i) => {
      const last = i === c.tiers.length - 1;
      const need = t.minUsd > 0 ? money(t.minUsd) + '+ held' : 'No token needed';
      return `<li class="tier is-in${last ? ' tier--gold' : ''}" style="--w:${Math.round((t.fee / max) * 100)}%;--i:${i}"><b>${t.name}</b><span>${need}, ${+t.fee.toFixed(2)}% ${c.feeType === 'topup' ? 'top-up fee' : 'fee'}</span><i></i></li>`;
    }).join('');
    const note = $('#tierNote');
    if (note) note.textContent = 'Illustrative rates, subject to the final card programme. A lower fee is a discount on the product. It is not a return on the token.';
    const calc = $('#calc'), range = $('#spend'), out = $('#spendOut'), rows = $('#calcRows');
    if (!calc) return;
    calc.hidden = false;
    const base = c.tiers[0].fee;
    const render = () => {
      const v = +range.value; out.textContent = money(v);
      rows.innerHTML = c.tiers.map(t => {
        const fee = v * t.fee / 100, save = v * (base - t.fee) / 100 * 12;
        return `<div class="calc__row"><b>${t.name}</b><span>${money(fee)} per month</span><span class="save">${save > 0 ? 'saves ' + money(save) + ' a year' : ''}</span></div>`;
      }).join('');
    };
    range.addEventListener('input', render); render();
    if (c.prices) {
      [['0', c.prices.virtual], ['1', c.prices.physical], ['2', c.prices.metal]].forEach(([i, p]) => {
        const tag = $(`.pane[data-pane="${i}"] .tag`);
        if (tag && p != null) tag.textContent += ', ' + money(p) + ' one time';
      });
    }
  }

  /* ---------- live numbers from the server: only real ones, hidden when there are none ---------- */
  const num = n => new Intl.NumberFormat('en-US').format(n);
  let boost = 10;
  function applyHype(c) {
    if (!c) return;
    if (c.boost > 0) { boost = c.boost; $$('[data-boost]').forEach(el => { el.textContent = boost; }); }
    if (c.count > 0) {
      const hc = $('#heroCount'), live = $('#liveCount'), ln = $('#liveNum');
      if (hc) { hc.textContent = num(c.count) + ' in line'; hc.hidden = false; }
      if (live && ln) { ln.dataset.count = c.count; ln.textContent = num(c.count); live.hidden = false; cio.observe(ln); }
    }
  }

  /* ---------- server calls ---------- */
  const post = (path, body) => fetch(API + path, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body), keepalive: true
  });
  const qs = new URLSearchParams(location.search);
  const store = {
    get(k) { try { return JSON.parse(localStorage.getItem(k)); } catch (e) { return null; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} },
    del(k) { try { localStorage.removeItem(k); } catch (e) {} }
  };
  const CODE = /^[a-z0-9]{8}$/;
  let invite = (qs.get('invite') || '').toLowerCase();
  if (CODE.test(invite)) store.set('fc_inv', invite); else { invite = store.get('fc_inv'); if (!CODE.test(invite || '')) invite = ''; }
  const source = (qs.get('utm_source') || qs.get('ref') || (qs.get('invite') ? 'invite' : '')).slice(0, 60);
  let refHost = '';
  try { if (document.referrer) refHost = new URL(document.referrer).hostname; } catch (e) {}

  if (API) {
    fetch(API + '/api/config').then(r => r.ok ? r.json() : null).then(c => { applyPricing(c); applyHype(c); }).catch(() => {});
    let seen = false;
    try { seen = sessionStorage.getItem('fc_hit') === '1'; sessionStorage.setItem('fc_hit', '1'); } catch (e) {}
    if (!seen) post('/api/hit', { source, referrer: refHost }).catch(() => {});
  }

  /* ---------- countries ---------- */
  const sel = $('#country');
  if (sel) {
    const codes = 'AD AE AF AG AI AL AM AO AR AS AT AU AW AX AZ BA BB BD BE BF BG BH BI BJ BL BM BN BO BQ BR BS BT BW BY BZ CA CC CD CF CG CH CI CK CL CM CN CO CR CU CV CW CX CY CZ DE DJ DK DM DO DZ EC EE EG EH ER ES ET FI FJ FK FM FO FR GA GB GD GE GF GG GH GI GL GM GN GP GQ GR GT GU GW GY HK HN HR HT HU ID IE IL IM IN IQ IR IS IT JE JM JO JP KE KG KH KI KM KN KP KR KW KY KZ LA LB LC LI LK LR LS LT LU LV LY MA MC MD ME MF MG MH MK ML MM MN MO MP MQ MR MS MT MU MV MW MX MY MZ NA NC NE NF NG NI NL NO NP NR NU NZ OM PA PE PF PG PH PK PL PM PN PR PS PT PW PY QA RE RO RS RU RW SA SB SC SD SE SG SH SI SJ SK SL SM SN SO SR SS ST SV SX SY SZ TC TD TG TH TJ TK TL TM TN TO TR TT TV TW TZ UA UG US UY UZ VA VC VE VG VI VN VU WF WS XK YE YT ZA ZM ZW'.split(' ');
    let names;
    try { names = new Intl.DisplayNames(['en'], { type: 'region' }); } catch (e) {}
    const list = codes.map(c => { let n = c; try { n = (names && names.of(c)) || c; } catch (e) {} return [c, n]; })
      .sort((a, b) => a[1].localeCompare(b[1]));
    const frag = document.createDocumentFragment();
    list.forEach(([c, n]) => { const o = document.createElement('option'); o.value = c; o.textContent = n; frag.appendChild(o); });
    sel.appendChild(frag);
  }

  /* ---------- waitlist ---------- */
  const join = $('#joinForm'), more = $('#moreForm'), done = $('#done');
  let token = '';
  const say = (el, text, ok) => { el.textContent = text; el.classList.toggle('is-ok', !!ok); };
  const failText = async r => {
    if (r.status === 429) return 'Too many attempts. Wait a minute and try again.';
    let d = {}; try { d = await r.json(); } catch (e) {}
    return d.message || 'That did not save. Try again in a minute.';
  };

  // place in line + invite link, shown after joining and again when the visitor comes back
  const countTo = (el, end) => {
    if (reduce || end < 2) { el.textContent = num(end); return; }
    const t0 = performance.now(), dur = 1100;
    const tick = t => {
      const u = clamp((t - t0) / dur, 0, 1), e = 1 - Math.pow(1 - u, 4);
      el.textContent = num(Math.max(1, Math.round(end * e)));
      if (u < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };
  function showPlace(d, note) {
    const place = $('#place'), inv = $('#invite'), sub = $('#doneSub');
    if (d.boost > 0) { boost = d.boost; $$('[data-boost]').forEach(el => { el.textContent = boost; }); }
    if (d.position > 0 && place) {
      place.hidden = false; countTo($('#placeNum'), d.position);
      sub.textContent = note || 'Lower numbers get the card first, as each country opens. We email you the moment you can order.';
    } else if (note) sub.textContent = note;
    if (d.ref && inv) {
      const link = location.origin + location.pathname.replace(/index\.html$/, '') + '?invite=' + d.ref;
      $('#inviteLink').value = link;
      const text = (d.position > 0 ? `Got my number for the FINNPUTER Card: #${num(d.position)}.` : `I'm on the list for the FINNPUTER Card.`) + ' One card, fiat or crypto. Get yours:';
      $('#inviteX').href = 'https://x.com/intent/post?text=' + encodeURIComponent(text) + '&url=' + encodeURIComponent(link);
      const stat = $('#inviteStat');
      if (d.invites > 0) { stat.textContent = `${num(d.invites)} ${d.invites === 1 ? 'friend has' : 'friends have'} joined with your link.`; stat.hidden = false; }
      else stat.hidden = true;
      inv.hidden = false;
    }
  }
  const copyBtn = $('#inviteCopy');
  if (copyBtn) copyBtn.addEventListener('click', async () => {
    const inp = $('#inviteLink');
    try { await navigator.clipboard.writeText(inp.value); }
    catch (e) { inp.select(); try { document.execCommand('copy'); } catch (e2) {} }
    copyBtn.textContent = 'Copied'; setTimeout(() => { copyBtn.textContent = 'Copy'; }, 1600);
  });
  const linkInp = $('#inviteLink');
  if (linkInp) linkInp.addEventListener('focus', () => linkInp.select());
  const notMe = $('#notMe');
  if (notMe) notMe.addEventListener('click', () => {
    store.del('fc_me'); token = '';
    done.hidden = true; join.hidden = false; join.reset();
    ['#place', '#invite'].forEach(q => { const el = $(q); if (el) el.hidden = true; });
    more.hidden = false; join.email.focus();
  });

  // returning visitor: show their place instead of an empty form
  const me = store.get('fc_me');
  if (API && join && me && CODE.test(me.ref || '')) {
    fetch(API + '/api/waitlist/status?ref=' + me.ref).then(async r => {
      if (r.status === 404) { store.del('fc_me'); return; }
      if (!r.ok) return;
      const d = await r.json();
      token = me.token || '';
      join.hidden = true; done.hidden = false;
      if (!token || me.answered) more.hidden = true;
      showPlace({ ...d, ref: me.ref });
    }).catch(() => {});
  }

  if (join) join.addEventListener('submit', async e => {
    e.preventDefault();
    const msg = $('#joinMsg'), btn = $('#joinBtn');
    const email = join.email.value.trim(), country = join.country.value, consent = join.consent.checked;
    const badEmail = !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);
    join.email.closest('.field').classList.toggle('is-bad', badEmail);
    join.country.closest('.field').classList.toggle('is-bad', !country);
    if (badEmail) { say(msg, 'Enter a valid email address.'); join.email.focus(); return; }
    if (!country) { say(msg, 'Choose your country of residence.'); join.country.focus(); return; }
    if (!consent) { say(msg, 'Tick the box so we are allowed to email you.'); join.consent.focus(); return; }
    if (!API) { say(msg, 'The waitlist is not connected yet.'); return; }
    say(msg, ''); btn.disabled = true; btn.textContent = 'Joining';
    try {
      const ct = $('#consentText');
      const r = await post('/api/waitlist', { email, country, consent: true, consent_text: ct ? ct.textContent.replace(/\s+/g, ' ').trim() : '', website: join.website.value, source, referrer: refHost, invite });
      if (!r.ok) { say(msg, await failText(r)); return; }
      const d = await r.json();
      token = d.token || '';
      join.hidden = true; done.hidden = false;
      let note = '';
      if (d.already) note = d.position > 0 ? 'This email is already on the list. This is your number.' : 'This email is already on the list. We will let you know when FINNPUTER Card is ready.';
      else if (d.confirm) note = 'One more step: open the email we just sent and confirm your address.';
      showPlace(d, note);
      if (d.ref) { store.set('fc_me', { ref: d.ref, token }); store.del('fc_inv'); }
      if (!token) more.hidden = true;
      done.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
    } catch (err) {
      say(msg, 'Could not reach the server. Check your connection and try again.');
    } finally {
      btn.disabled = false; btn.textContent = 'Join the waitlist';
    }
  });

  if (more) more.addEventListener('submit', async e => {
    e.preventDefault();
    const msg = $('#moreMsg'), btn = $('#moreBtn');
    const body = { token };
    ['card_interest', 'funding', 'monthly_spend', 'price_ok', 'finnputer_user', 'holder'].forEach(n => {
      const v = more.elements[n] && more.elements[n].value; if (v) body[n] = v;
    });
    if (Object.keys(body).length === 1) { say(msg, 'Pick at least one answer, or just close this page. You are on the list either way.'); return; }
    say(msg, ''); btn.disabled = true; btn.textContent = 'Saving';
    try {
      const r = await post('/api/waitlist/details', body);
      if (!r.ok) { say(msg, await failText(r)); btn.disabled = false; btn.textContent = 'Save answers'; return; }
      btn.textContent = 'Answers saved'; say(msg, 'Saved. Thank you.', true);
      const m = store.get('fc_me'); if (m) store.set('fc_me', { ...m, answered: true });
    } catch (err) {
      say(msg, 'Could not reach the server. Check your connection and try again.');
      btn.disabled = false; btn.textContent = 'Save answers';
    }
  });

  // "Reserve a metal card" preselects metal in the second step
  $$('a[href="#waitlist"].btn--gold').forEach(a => a.addEventListener('click', () => {
    const m = $('input[name="card_interest"][value="metal"]'); if (m) m.checked = true;
  }));
})();
