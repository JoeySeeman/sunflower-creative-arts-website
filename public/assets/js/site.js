/* Sunflower Creative Arts — site behaviour. No dependencies. */
(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const root = document.documentElement;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const wait = ms => new Promise(r => setTimeout(r, ms));

  /* ---------- headlines: split into lines for the rise-in ---------- */
  function splitLines(el) {
    const words = el.textContent.trim().split(/\s+/);
    el.innerHTML = words.map(w => `<span class="w">${w}</span>`).join(' ');
    const spans = $$('.w', el);
    const lines = [];
    let top = null;
    spans.forEach(s => {
      if (top === null || Math.abs(s.offsetTop - top) > 4) { lines.push([]); top = s.offsetTop; }
      lines[lines.length - 1].push(s.textContent);
    });
    el.setAttribute('aria-label', words.join(' '));
    el.innerHTML = lines.map((l, i) => `<span class="line" aria-hidden="true"><span style="--l:${i}">${l.join(' ')}</span></span>`).join('');
  }
  const fontsReady = Promise.race([document.fonts ? document.fonts.ready : Promise.resolve(), wait(700)]);
  const heroReady = () => { const h = $('[data-hero]'); if (h) h.classList.add('is-ready'); };

  // Page entrance: titles rise line by line, then lead, buttons and facts follow.
  fontsReady.then(() => {
    if (!reduce) $$('[data-split], [data-lines]').forEach(splitLines);
    $$('[data-hero-in]').forEach((el, i) => el.style.setProperty('--d', i));
    $$('.hero-facts > div').forEach((el, i) => el.style.setProperty('--i', i));
    requestAnimationFrame(() => requestAnimationFrame(() => {
      document.body.classList.add('is-loaded');
      if (!root.classList.contains('intro-on')) heroReady();
    }));
  });
  runIntro(); // starts at once; doesn't wait for fonts

  /* ---------- intro: the sunflower rises, blooms, and becomes the logo ---------- */
  async function runIntro() {
    const ov = $('.intro-overlay');
    if (!ov || !root.classList.contains('intro-on')) return;
    let leaving = false;
    const skip = document.createElement('button');
    skip.className = 'intro-skip'; skip.type = 'button'; skip.textContent = 'Skip intro';
    ov.appendChild(skip);
    const mark = $('.intro-mark', ov);
    const logo = $('.site-header .brand__mark');

    const leave = async (fast) => {
      if (leaving) return; leaving = true;
      try { sessionStorage.setItem('sca-intro', '1'); } catch (e) {}
      if (fast) { ov.classList.add('is-fast', 'is-run'); await wait(380); }
      // fly the flower into the header logo's place
      if (logo && mark) {
        const a = mark.getBoundingClientRect(), b = logo.getBoundingClientRect();
        const s = b.width / a.width;
        mark.style.transformOrigin = '0 0';
        mark.getBoundingClientRect();
        ov.classList.add('is-leave');
        mark.style.transform = `translate(${b.left - a.left}px, ${b.top - a.top}px) scale(${s})`;
      } else {
        ov.classList.add('is-leave');
      }
      setTimeout(heroReady, 250);
      await wait(1000);
      if (logo) logo.classList.add('no-bloom');
      root.classList.remove('intro-on');
      ov.parentNode && ov.parentNode.removeChild(ov);
    };
    skip.addEventListener('click', e => { e.stopPropagation(); leave(true); });
    ov.addEventListener('click', () => leave(true));
    addEventListener('keydown', e => { if (e.key === 'Escape' || e.key === 'Enter' || e.key === ' ') leave(true); }, { once: true });
    setTimeout(() => leave(false), 7000); // fail-safe
    requestAnimationFrame(() => requestAnimationFrame(() => ov.classList.add('is-run')));
    await wait(3150);
    leave(false);
  }

  /* ---------- sunflowers that bloom as you scroll ---------- */
  const blooms = $$('[data-bloom="scroll"]');
  if (blooms.length && !reduce) {
    let raf = 0;
    const tick = () => {
      raf = 0;
      const vh = innerHeight;
      blooms.forEach(el => {
        const r = el.getBoundingClientRect();
        if (r.bottom < -100 || r.top > vh + 100) return;
        // 0 as the flower starts to come into view, 1 once it has risen a little past the middle of the screen
        const p = Math.min(1, Math.max(0, (vh * .95 - r.top) / (vh * .5 + r.height * .3)));
        el.style.setProperty('--p', p.toFixed(3));
      });
    };
    addEventListener('scroll', () => { if (!raf) raf = requestAnimationFrame(tick); }, { passive: true });
    addEventListener('resize', tick);
    tick();
  } else blooms.forEach(el => el.style.setProperty('--p', 1));

  /* ---------- reading progress on blog posts ---------- */
  const article = $('.rich--article');
  if (article) {
    const bar = document.createElement('div');
    bar.className = 'progress'; bar.setAttribute('aria-hidden', 'true');
    document.body.appendChild(bar);
    const upd = () => {
      const r = article.getBoundingClientRect();
      const p = Math.min(1, Math.max(0, (innerHeight * .35 - r.top) / (r.height - innerHeight * .4)));
      bar.style.setProperty('--read', p.toFixed(4));
    };
    addEventListener('scroll', upd, { passive: true }); upd();
  }

  /* ---------- header: shrink on scroll ---------- */
  const header = $('[data-header]');
  const onScroll = () => header && header.classList.toggle('is-scrolled', scrollY > 24);
  addEventListener('scroll', onScroll, { passive: true }); onScroll();

  /* ---------- mega menus ---------- */
  const toggles = $$('.nav__toggle');
  let closeTimer;
  function openMega(btn, open) {
    const panel = document.getElementById(btn.getAttribute('aria-controls'));
    if (!panel) return;
    if (open) {
      toggles.forEach(t => t !== btn && openMega(t, false));
      panel.hidden = false;
      requestAnimationFrame(() => panel.classList.add('is-open'));
      btn.setAttribute('aria-expanded', 'true');
    } else {
      panel.classList.remove('is-open');
      btn.setAttribute('aria-expanded', 'false');
      setTimeout(() => { if (btn.getAttribute('aria-expanded') === 'false') panel.hidden = true; }, 250);
    }
  }
  toggles.forEach(btn => {
    const item = btn.closest('.nav__item');
    btn.addEventListener('click', () => openMega(btn, btn.getAttribute('aria-expanded') !== 'true'));
    if (matchMedia('(hover: hover)').matches) {
      item.addEventListener('mouseenter', () => { clearTimeout(closeTimer); openMega(btn, true); });
      item.addEventListener('mouseleave', () => { closeTimer = setTimeout(() => openMega(btn, false), 180); });
    }
    item.addEventListener('focusout', e => { if (!item.contains(e.relatedTarget)) openMega(btn, false); });
  });
  addEventListener('keydown', e => {
    if (e.key !== 'Escape') return;
    const open = toggles.find(t => t.getAttribute('aria-expanded') === 'true');
    if (open) { openMega(open, false); open.focus(); }
  });
  document.addEventListener('click', e => { if (!e.target.closest('.nav')) toggles.forEach(t => t.getAttribute('aria-expanded') === 'true' && openMega(t, false)); });

  /* ---------- mobile drawer ---------- */
  const menuBtn = $('.menu-btn'), drawer = $('#drawer');
  function setDrawer(open) {
    if (!drawer) return;
    menuBtn.setAttribute('aria-expanded', String(open));
    if (open) { drawer.hidden = false; requestAnimationFrame(() => drawer.classList.add('is-open')); document.body.style.overflow = 'hidden'; }
    else { drawer.classList.remove('is-open'); document.body.style.overflow = ''; setTimeout(() => { if (menuBtn.getAttribute('aria-expanded') === 'false') drawer.hidden = true; }, 450); }
  }
  if (menuBtn) {
    menuBtn.addEventListener('click', () => setDrawer(menuBtn.getAttribute('aria-expanded') !== 'true'));
    drawer.addEventListener('click', e => { if (e.target === drawer) setDrawer(false); });
    addEventListener('keydown', e => { if (e.key === 'Escape' && menuBtn.getAttribute('aria-expanded') === 'true') { setDrawer(false); menuBtn.focus(); } });
    addEventListener('resize', () => { if (innerWidth > 1020 && menuBtn.getAttribute('aria-expanded') === 'true') setDrawer(false); });
  }

  /* ---------- scroll reveals ---------- */
  if ('IntersectionObserver' in window && !reduce) {
    const io = new IntersectionObserver(entries => entries.forEach(en => {
      if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); }
    }), { rootMargin: '0px 0px -8% 0px', threshold: .08 });
    // gentle staggered entrances for groups of cards, people, posts and section headings
    $$('.cards, .people, .post-grid, .features, .feat__grid, .steps, .facts, .logos, .themes__grid, .videos, .linklist').forEach(g => {
      [...g.children].forEach((c, i) => { if (!c.classList.contains('reveal')) { c.classList.add('reveal'); c.style.setProperty('--i', i % 4); } });
    });
    $$('.sec-head, .split__text, .acc, .form-card, .pay-card, .cta, .quote').forEach(el => el.classList.add('reveal'));
    $$('.reveal, .reveal-img, [data-mission], [data-bloom="in"]').forEach(el => io.observe(el));
    // stagger siblings
    $$('.news__grid, .timeline').forEach(g => [...g.children].forEach((c, i) => c.style.setProperty('--i', i)));
  } else {
    $$('.reveal, .reveal-img, [data-mission], [data-bloom="in"]').forEach(el => el.classList.add('is-in'));
  }

  /* ---------- parallax ---------- */
  const px = $$('[data-parallax]');
  if (px.length && !reduce) {
    let ticking = false;
    const update = () => {
      const vh = innerHeight;
      px.forEach(el => {
        const r = el.getBoundingClientRect();
        if (r.bottom < -200 || r.top > vh + 200) return;
        const speed = parseFloat(el.dataset.parallax) || .1;
        const off = (r.top + r.height / 2 - vh / 2) * -speed;
        el.style.translate = `0 ${off.toFixed(1)}px`;
      });
      ticking = false;
    };
    addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
    addEventListener('resize', update);
    update();
  }

  /* ---------- pillars: sticky photo follows the active pillar ---------- */
  const pillars = $('[data-pillars]');
  if (pillars && 'IntersectionObserver' in window) {
    const items = $$('[data-pillar]', pillars);
    const set = i => {
      items.forEach((el, j) => el.classList.toggle('is-on', j === i));
      $$('[data-pillar-img]', pillars).forEach((el, j) => el.classList.toggle('is-on', j === i));
      $$('[data-pillar-dot]', pillars).forEach((el, j) => el.classList.toggle('is-on', j <= i));
    };
    const io = new IntersectionObserver(entries => entries.forEach(en => { if (en.isIntersecting) set(+en.target.dataset.pillar); }), { rootMargin: '-45% 0px -45% 0px' });
    items.forEach(el => io.observe(el));
    set(0);
  }

  /* ---------- YouTube: load the player only when asked ---------- */
  $$('.yt__btn').forEach(btn => btn.addEventListener('click', () => {
    const fig = btn.closest('[data-yt]');
    const f = document.createElement('iframe');
    f.src = `https://www.youtube-nocookie.com/embed/${fig.dataset.yt}?autoplay=1&rel=0`;
    f.title = btn.getAttribute('aria-label').replace('Play video: ', '');
    f.allow = 'accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture; fullscreen';
    f.allowFullscreen = true;
    btn.replaceWith(f);
  }));

  /* ---------- lightbox ---------- */
  const lb = $('.lightbox');
  if (lb) {
    const lbImg = $('img', lb), lbCap = $('figcaption', lb);
    let group = [], idx = 0, lastFocus;
    const show = i => {
      idx = (i + group.length) % group.length;
      const a = group[idx];
      lbImg.style.opacity = 0;
      lbImg.onload = () => { lbImg.style.opacity = 1; };
      lbImg.src = a.href;
      lbImg.alt = (a.querySelector('img') || {}).alt || '';
      lbCap.textContent = a.dataset.caption || '';
      $$('.lightbox__nav', lb).forEach(b => b.hidden = group.length < 2);
    };
    const open = (a) => {
      const scope = a.closest('[data-lightbox]');
      group = $$('a.gallery__link', scope).filter(x => x.getAttribute('aria-hidden') !== 'true');
      lastFocus = document.activeElement;
      show(Math.max(0, group.indexOf(a)));
      lb.hidden = false; requestAnimationFrame(() => lb.classList.add('is-open'));
      document.body.style.overflow = 'hidden';
      $('.lightbox__close', lb).focus();
    };
    const close = () => { lb.classList.remove('is-open'); document.body.style.overflow = ''; setTimeout(() => { lb.hidden = true; lbImg.src = ''; }, 300); if (lastFocus) lastFocus.focus(); };
    document.addEventListener('click', e => {
      const a = e.target.closest('[data-lightbox] a.gallery__link');
      if (!a) return;
      e.preventDefault(); open(a);
    });
    $('.lightbox__close', lb).addEventListener('click', close);
    $('.lightbox__prev', lb).addEventListener('click', () => show(idx - 1));
    $('.lightbox__next', lb).addEventListener('click', () => show(idx + 1));
    lb.addEventListener('click', e => { if (e.target === lb) close(); });
    addEventListener('keydown', e => {
      if (lb.hidden) return;
      if (e.key === 'Escape') close();
      if (e.key === 'ArrowLeft') show(idx - 1);
      if (e.key === 'ArrowRight') show(idx + 1);
    });
    let sx = null;
    lb.addEventListener('touchstart', e => { sx = e.touches[0].clientX; }, { passive: true });
    lb.addEventListener('touchend', e => { if (sx === null) return; const dx = e.changedTouches[0].clientX - sx; if (Math.abs(dx) > 50) show(idx + (dx < 0 ? 1 : -1)); sx = null; });
  }

  /* ---------- blog: search, topics, load more ---------- */
  const grid = $('[data-blog-grid]');
  if (grid) {
    const cards = $$('.post-card', grid), more = $('[data-blog-more]'), search = $('[data-blog-search]'), empty = $('.blog-empty');
    const chips = $$('.chip[data-cat]');
    const PAGE = 12;
    let shown = PAGE, cat = '', q = '';
    const params = new URLSearchParams(location.search);
    if (params.get('topic')) cat = params.get('topic');
    const apply = () => {
      const matches = cards.filter(c => (!cat || c.dataset.cats.split('|').includes(cat)) && (!q || c.dataset.text.includes(q)));
      cards.forEach(c => c.hidden = true);
      matches.slice(0, shown).forEach(c => c.hidden = false);
      more.closest('.blog-more').hidden = matches.length <= shown;
      empty.hidden = matches.length > 0;
      chips.forEach(ch => ch.classList.toggle('is-on', ch.dataset.cat === cat));
    };
    const moreBtn = $('[data-more-topics]');
    const chipBox = $('.chips');
    if (moreBtn) {
      moreBtn.addEventListener('click', () => {
        const open = chipBox.classList.toggle('show-all');
        moreBtn.setAttribute('aria-expanded', String(open));
        moreBtn.textContent = open ? 'Fewer topics' : 'More topics';
      });
      if (cat && chips.some(c => c.dataset.cat === cat && c.classList.contains('chip--more'))) moreBtn.click();
    }
    chips.forEach(ch => ch.addEventListener('click', () => {
      cat = ch.dataset.cat; shown = PAGE; apply();
      const u = new URL(location); cat ? u.searchParams.set('topic', cat) : u.searchParams.delete('topic'); history.replaceState(null, '', u);
    }));
    search.addEventListener('input', () => { q = search.value.trim().toLowerCase(); shown = PAGE; apply(); });
    more.addEventListener('click', () => { shown += PAGE; apply(); });
    apply();
  }

  /* ---------- forms ---------- */
  const cfg = window.SCA || {};
  $$('form.form').forEach(form => {
    const status = $('.form__status', form);
    form.addEventListener('submit', async e => {
      e.preventDefault();
      let ok = true;
      $$('[required]', form).forEach(el => {
        const valid = el.type === 'radio' ? !!form.querySelector(`input[name="${CSS.escape(el.name)}"]:checked`) : el.checkValidity();
        const field = el.closest('.field');
        if (field) field.classList.toggle('is-invalid', !valid);
        if (!valid) ok = false;
      });
      if (!ok) {
        status.className = 'form__status is-err';
        status.textContent = 'Please fill in the highlighted fields.';
        const first = $('.is-invalid input, .is-invalid textarea, .is-invalid select', form);
        if (first) first.focus();
        return;
      }
      const data = new FormData(form);
      const title = form.dataset.form || 'Website form';
      data.append('_subject', `${title} — sunflowercreativearts.org`);
      if (cfg.formEndpoint) {
        status.className = 'form__status'; status.textContent = 'Sending…';
        try {
          const r = await fetch(cfg.formEndpoint, { method: 'POST', body: data, headers: { Accept: 'application/json' } });
          if (!r.ok) throw new Error(r.status);
          form.reset();
          status.className = 'form__status is-ok';
          status.textContent = 'Thank you! Your form was sent. We’ll be in touch soon.';
        } catch (err) {
          status.className = 'form__status is-err';
          status.textContent = `Your form didn’t send. Please try again, or email ${cfg.email}.`;
        }
        return;
      }
      // No form service configured yet: open a pre-filled email instead.
      const lines = [];
      for (const [k, v] of data.entries()) if (!k.startsWith('_') && typeof v === 'string' && v) lines.push(`${k.replace(/\[\]$/, '')}: ${v}`);
      location.href = `mailto:${cfg.email}?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(lines.join('\n'))}`;
      status.className = 'form__status is-ok';
      status.textContent = `Your email app should open with your answers filled in. If it doesn’t, email ${cfg.email}.`;
    });
    form.addEventListener('input', e => { const f = e.target.closest('.field'); if (f) f.classList.remove('is-invalid'); });
  });
})();
