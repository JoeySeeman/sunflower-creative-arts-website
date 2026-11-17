// Page chrome (head, header, footer) and section renderers.
import { esc, icons, sunflowerMark } from './lib.mjs';

export function createRenderer(ctx) {
  const { site, forms, link, imager, posts } = ctx;
  const { img } = imager;
  const H = s => link.html(s || '');
  const year = new Date().getFullYear();

  // ---------- small parts ----------
  const a = (href, inner, cls = '') => {
    const h = link.href(href);
    const ext = link.isExternal(h);
    return `<a href="${esc(h)}"${cls ? ` class="${cls}"` : ''}${ext ? ' target="_blank" rel="noopener"' : ''}>${inner}</a>`;
  };
  const button = (act) => {
    if (!act || !act.label) return '';
    const style = act.style || 'primary';
    const h = link.href(act.href || '#');
    const ext = link.isExternal(h);
    const icon = /^tel:/.test(h) ? icons.phone : /^mailto:/.test(h) ? icons.mail : ext ? icons.external : icons.arrow;
    return a(act.href || '#', `<span>${esc(act.label)}</span>${icon}`, `btn btn--${style}`);
  };
  const actions = (list, cls = '') => list && list.length ? `<div class="actions ${cls}">${list.map(button).join('')}</div>` : '';
  const heading = (s, lvl = 2, cls = 'h-section') => s ? `<h${lvl} class="${cls}">${esc(s)}</h${lvl}>` : '';
  const intro = s => s ? `<div class="intro rich">${H(s)}</div>` : '';
  const head = (sec, cls = '') => (sec.heading || sec.intro) ? `<header class="sec-head ${cls}">${heading(sec.heading)}${intro(sec.intro)}</header>` : '';

  // ---------- form rendering ----------
  function formField(f, i, fid) {
    const label = (f.label || '').replace(/\s*\*\s*$/, '').trim();
    const req = f.required || /\*\s*$/.test(f.label || '');
    const id = `${fid}-${i}`;
    const name = esc(label || f.name || `field-${i}`);
    const reqA = req ? ' required' : '';
    const star = req ? '<span class="req" aria-hidden="true">*</span>' : '';
    const help = f.help ? `<small class="help" id="${id}-h">${esc(f.help)}</small>` : '';
    const desc = f.help ? ` aria-describedby="${id}-h"` : '';
    if (/captcha/i.test(f.name || '') || /captcha/i.test(f.label || '')) return '';
    switch (f.type) {
      case 'heading': return `<h3 class="form-heading">${esc(f.text)}</h3>`;
      case 'textarea': return `<div class="field field--wide"><label for="${id}">${esc(label)}${star}</label><textarea id="${id}" name="${name}" rows="4"${reqA}${desc}></textarea>${help}</div>`;
      case 'select': return `<div class="field"><label for="${id}">${esc(label)}${star}</label><div class="select"><select id="${id}" name="${name}"${reqA}${desc}>${(f.options || []).map(o => `<option>${esc(o)}</option>`).join('')}</select>${icons.chevron}</div>${help}</div>`;
      case 'radio':
      case 'checkbox': {
        const opts = (f.options || []).filter(Boolean);
        if (!opts.length) return '';
        return `<fieldset class="field field--wide choice"><legend>${esc(label)}${star}</legend><div class="choice__opts">${opts.map((o, j) => `<label class="choice__opt"><input type="${f.type}" name="${name}${f.type === 'checkbox' && opts.length > 1 ? '[]' : ''}" value="${esc(o)}"${f.type === 'radio' && req && j === 0 ? ' required' : ''}><span>${esc(o)}</span></label>`).join('')}</div>${help}</fieldset>`;
      }
      case 'file': return `<div class="field field--wide"><label for="${id}">${esc(label)}${star}</label><input id="${id}" type="file" name="${name}"${reqA}${desc}>${help}</div>`;
      default: {
        let type = ['email', 'tel', 'date', 'number', 'url'].includes(f.type) ? f.type : 'text';
        if (/e-?mail/i.test(label) && type === 'text') type = 'email';
        if (/phone/i.test(label) && type === 'text') type = 'tel';
        const ac = type === 'email' ? ' autocomplete="email"' : type === 'tel' ? ' autocomplete="tel"' : /first name/i.test(label) ? ' autocomplete="given-name"' : /last name/i.test(label) ? ' autocomplete="family-name"' : '';
        return `<div class="field"><label for="${id}">${esc(label)}${star}</label><input id="${id}" type="${type}" name="${name}"${ac}${reqA}${desc}>${help}</div>`;
      }
    }
  }
  function renderForm(ref, { title, compact = false } = {}) {
    const [slug, idx] = String(ref).split('#');
    const def = forms[slug] && forms[slug][Number(idx || 0)];
    if (!def) return '';
    if (def.kind === 'paypal') return paypal({ hidden: def.hidden, label: 'Pay with PayPal' });
    const fid = `f-${slug.replace(/[^a-z0-9]/gi, '')}-${idx || 0}`;
    const fields = (def.fields || []).filter(f => !(f.type === 'heading' && /^success!?$/i.test(f.text)));
    const formTitle = title || def.title || 'Form';
    return `<form class="form${compact ? ' form--compact' : ''}" data-form="${esc(formTitle)}" novalidate>
      <div class="form__grid">${fields.map((f, i) => formField(f, i, fid)).join('')}</div>
      <div class="form__foot"><button class="btn btn--primary" type="submit"><span>${esc(/^submit$/i.test(def.submit || '') ? 'Send' : (def.submit || 'Send'))}</span>${icons.arrow}</button>
      <p class="form__status" role="status" aria-live="polite"></p></div>
    </form>`;
  }
  function paypal(sec) {
    const hidden = Object.entries(sec.hidden || {}).filter(([k]) => k).map(([k, v]) => `<input type="hidden" name="${esc(k)}" value="${esc(v)}">`).join('');
    return `<form class="paypal" action="https://www.paypal.com/cgi-bin/webscr" method="post" target="_top">${hidden}
      <button class="btn btn--primary" type="submit"><span>${esc(sec.label || 'Pay with PayPal')}</span>${icons.external}</button>
      <small>Secure payment through PayPal.</small></form>`;
  }

  // ---------- media ----------
  function ytFrame(v) {
    const id = esc(v.youtube);
    return `<figure class="yt" data-yt="${id}">
      <button class="yt__btn" type="button" aria-label="Play video: ${esc(v.title || 'video')}">
        <img src="https://i.ytimg.com/vi/${id}/hqdefault.jpg" alt="" loading="lazy" decoding="async">
        <span class="yt__play">${icons.play}</span>
      </button>
      ${v.title ? `<figcaption>${esc(v.title)}</figcaption>` : ''}
    </figure>`;
  }
  function gallery(images, { cls = '' } = {}) {
    const ok = images.filter(im => imager.info(im.src));
    if (!ok.length) return '';
    const n = ok.length;
    return `<div class="gallery gallery--${Math.min(n, 6)} ${cls}" data-lightbox>${ok.map((im, i) => {
      const full = imager.url(im, 2400);
      const src = im.href ? `<a class="gallery__src" href="${esc(link.href(im.href))}" target="_blank" rel="noopener" aria-label="${/flickr/.test(im.href) ? 'View this photo on Flickr' : 'Open photo link'}">${icons.external}</a>` : '';
      return `<figure class="gallery__item" style="--i:${i}"><a href="${full}" class="gallery__link" data-caption="${esc(im.caption || im.alt || '')}">${img(im, { sizes: n === 1 ? '(min-width: 1100px) 1100px, 100vw' : '(min-width: 900px) 40vw, 90vw', cls: 'reveal-img' })}</a>${src}${im.caption ? `<figcaption>${esc(im.caption)}</figcaption>` : ''}</figure>`;
    }).join('')}</div>`;
  }

  // ---------- sections ----------
  const S = {};
  S.prose = sec => `<section class="sec sec--prose"${sec.id ? ` id="${esc(sec.id)}"` : ''}><div class="wrap wrap--text">${heading(sec.heading)}<div class="rich">${H(sec.html)}</div></div></section>`;
  S.split = (sec, i) => {
    let pic = img(sec.image, { sizes: '(min-width: 960px) 46vw, 92vw', cls: imager.isGraphic(sec.image) ? '' : 'reveal-img' });
    if (pic && sec.image.href) pic = `<a href="${esc(link.href(sec.image.href))}" target="_blank" rel="noopener" class="frame__link">${pic}</a>`;
    return `<section class="sec sec--split${sec.reverse ? ' is-rev' : ''}"${sec.id ? ` id="${esc(sec.id)}"` : ''}><div class="wrap split">
      <div class="split__text">${heading(sec.heading)}<div class="rich">${H(sec.html)}</div>${actions(sec.actions)}</div>
      ${pic ? `<div class="split__media"><div class="frame frame--${imager.isGraphic(sec.image) ? 'graphic' : (i % 3 === 0) ? 'arch' : 'soft'}" data-parallax="0.06">${pic}</div></div>` : ''}
    </div></section>`;
  };
  S.gallery = sec => `<section class="sec sec--gallery"${sec.id ? ` id="${esc(sec.id)}"` : ''}><div class="wrap">${head(sec)}${gallery(sec.images || [])}</div></section>`;
  S.figure = sec => {
    const pic = img(sec.image, { sizes: '(min-width: 1200px) 1100px, 94vw', cls: 'reveal-img' });
    return pic ? `<section class="sec sec--figure"><div class="wrap wrap--mid"><figure class="figure" data-lightbox><a class="gallery__link" href="${imager.url(sec.image, 2400)}" data-caption="${esc(sec.image.caption || sec.image.alt || '')}">${pic}</a>${sec.image.caption ? `<figcaption>${esc(sec.image.caption)}</figcaption>` : ''}</figure></div></section>` : '';
  };
  S.video = sec => {
    const vids = sec.videos || [];
    return `<section class="sec sec--video"${sec.id ? ` id="${esc(sec.id)}"` : ''}><div class="wrap">${head(sec)}<div class="videos videos--${Math.min(vids.length, 3)}">${vids.map(ytFrame).join('')}</div></div></section>`;
  };
  S.html5video = sec => `<section class="sec"><div class="wrap wrap--mid"><video class="video5" controls preload="metadata"${sec.poster ? ` poster="${esc(sec.poster)}"` : ''}>${(sec.src || []).map(s => `<source src="${esc(link.href(s))}">`).join('')}</video></div></section>`;
  S.embed = sec => {
    let src = sec.src || '';
    src = src.replace(/&#038;/g, '&');
    const ratio = sec.ratio || '16/9';
    const cls = (ratio === 'soundcloud' || /soundcloud\.com/.test(src)) ? 'embed--audio' : ratio === 'tall' ? 'embed--tall' : '';
    const style = /^\d+\/\d+$/.test(ratio) && !/soundcloud\.com/.test(src) ? ` style="aspect-ratio:${ratio}"` : '';
    return `<section class="sec sec--embed"${sec.id ? ` id="${esc(sec.id)}"` : ''}><div class="wrap wrap--mid">${head(sec)}<div class="embed ${cls}"${style}><iframe src="${esc(src)}" title="${esc(sec.title || sec.heading || 'Embedded content')}" loading="lazy" allowfullscreen></iframe></div></div></section>`;
  };
  S.cards = sec => {
    const items = sec.items || [];
    return `<section class="sec sec--cards"${sec.id ? ` id="${esc(sec.id)}"` : ''}><div class="wrap">${head(sec)}<div class="cards cards--${Math.min(items.length, 4)}">${items.map((c, i) => {
      const pic = img(c.image, { sizes: '(min-width: 1100px) 30vw, (min-width: 700px) 45vw, 92vw' });
      const inner = `${pic ? `<div class="card__media">${pic}</div>` : ''}<div class="card__body">${c.meta ? `<p class="card__meta">${esc(c.meta)}</p>` : ''}<h3 class="card__title">${esc(c.title)}</h3>${c.html ? `<div class="card__text rich">${c.href ? c.html.replace(/<\/?a\b[^>]*>/g, '') : H(c.html)}</div>` : ''}${c.href ? `<span class="card__more">${link.isExternal(link.href(c.href)) ? 'Visit site' : 'Learn more'} ${icons.arrow}</span>` : ''}</div>`;
      return c.href ? a(c.href, inner, `card${pic ? '' : ' card--plain'}`) : `<div class="card${pic ? '' : ' card--plain'}">${inner}</div>`;
    }).join('')}</div></div></section>`;
  };
  S.features = sec => `<section class="sec sec--features"${sec.id ? ` id="${esc(sec.id)}"` : ''}><div class="wrap">${head(sec)}<div class="features features--${Math.min((sec.items || []).length, 4)}">${(sec.items || []).map(f => `<div class="feature"><span class="feature__mark" aria-hidden="true"></span><h3>${esc(f.title)}</h3><div class="rich">${H(f.html)}</div></div>`).join('')}</div></div></section>`;
  S.steps = sec => `<section class="sec sec--steps"${sec.id ? ` id="${esc(sec.id)}"` : ''}><div class="wrap">${head(sec)}<ol class="steps">${(sec.items || []).map((s, i) => `<li class="step"><span class="step__n">${i + 1}</span><div><h3>${esc(s.title)}</h3><div class="rich">${H(s.html)}</div></div></li>`).join('')}</ol></div></section>`;
  S.facts = sec => `<section class="sec sec--facts"${sec.id ? ` id="${esc(sec.id)}"` : ''}><div class="wrap">${heading(sec.heading)}<dl class="facts">${(sec.items || []).map(f => `<div class="fact"><dt>${esc(f.label)}</dt><dd>${H(f.value)}</dd></div>`).join('')}</dl></div></section>`;
  S.table = sec => {
    const rows = sec.rows || [];
    if (!rows.length) return '';
    const [hd, ...body] = rows;
    return `<section class="sec sec--table"${sec.id ? ` id="${esc(sec.id)}"` : ''}><div class="wrap wrap--mid">${head(sec)}<div class="table-wrap"><table><thead><tr>${hd.map(c => `<th scope="col">${H(c)}</th>`).join('')}</tr></thead><tbody>${body.map(r => `<tr>${r.map(c => `<td>${H(c)}</td>`).join('')}</tr>`).join('')}</tbody></table></div></div></section>`;
  };
  S.accordion = sec => `<section class="sec sec--accordion"${sec.id ? ` id="${esc(sec.id)}"` : ''}><div class="wrap wrap--mid">${head(sec)}<div class="accordion">${(sec.items || []).map(it => `<details class="acc"${it.id ? ` id="${esc(it.id)}"` : ''}><summary><span>${esc(it.title)}</span><span class="acc__icon">${icons.plus}</span></summary><div class="acc__body rich">${H(it.html)}</div></details>`).join('')}</div></div></section>`;
  S.quote = sec => `<section class="sec sec--quote"><div class="wrap wrap--text"><figure class="quote">${sunflowerMark({ cls: 'quote__mark', id: 'q' + Math.random().toString(36).slice(2, 7) })}<blockquote class="rich">${H(sec.html)}</blockquote>${sec.cite ? `<figcaption>${esc(sec.cite)}</figcaption>` : ''}</figure></div></section>`;
  S.people = sec => `<section class="sec sec--people"${sec.id ? ` id="${esc(sec.id)}"` : ''}><div class="wrap">${head(sec)}<div class="people">${(sec.items || []).map(p => {
    const pic = img(p.image, { sizes: '(min-width: 1100px) 22vw, (min-width: 700px) 30vw, 46vw' });
    const bio = p.html ? `<details class="person__bio"><summary>Read bio ${icons.chevron}</summary><div class="rich">${H(p.html)}</div></details>` : '';
    return `<article class="person">${pic ? `<div class="person__photo">${pic}</div>` : `<div class="person__photo person__photo--empty">${sunflowerMark({ id: 'p' + Math.random().toString(36).slice(2, 7) })}</div>`}<h3 class="person__name">${esc(p.name)}</h3>${p.role ? `<p class="person__role">${esc(p.role)}</p>` : ''}${bio}</article>`;
  }).join('')}</div></div></section>`;
  S.logos = sec => `<section class="sec sec--logos"${sec.id ? ` id="${esc(sec.id)}"` : ''}><div class="wrap">${head(sec, 'sec-head--center')}<ul class="logos">${(sec.items || []).map(l => {
    const pic = img(l, { sizes: '220px', alt: l.alt });
    const body = pic || `<span class="logos__name">${esc(l.alt || l.name || '')}</span>`;
    return `<li>${l.href ? a(l.href, body) : body}</li>`;
  }).join('')}</ul></div></section>`;
  S.cta = sec => {
    const pic = img(sec.image, { sizes: '(min-width: 960px) 40vw, 92vw' });
    return `<section class="sec sec--cta"${sec.id ? ` id="${esc(sec.id)}"` : ''}><div class="wrap"><div class="cta${pic ? ' cta--img' : ''}">
      <div class="cta__text">${heading(sec.heading, 2, 'h-cta')}<div class="rich">${H(sec.html)}</div>${actions(sec.actions)}</div>
      ${pic ? `<div class="cta__media${imager.isGraphic(sec.image) ? ' frame--graphic' : ''}">${pic}</div>` : `<div class="cta__deco">${sunflowerMark({ id: 'c' + Math.random().toString(36).slice(2, 7) })}</div>`}
    </div></div></section>`;
  };
  S.buttons = sec => `<section class="sec sec--buttons"><div class="wrap wrap--text">${actions(sec.actions)}</div></section>`;
  S.form = sec => `<section class="sec sec--form"${sec.id ? ` id="${esc(sec.id)}"` : ''}><div class="wrap wrap--mid"><div class="form-card">${head(sec)}${renderForm(sec.ref, { title: sec.heading })}</div></div></section>`;
  S.paypal = sec => `<section class="sec sec--paypal"${sec.id ? ` id="${esc(sec.id)}"` : ''}><div class="wrap wrap--text"><div class="pay-card">${heading(sec.heading, 2, 'h-small')}${intro(sec.intro)}${paypal(sec)}</div></div></section>`;
  S.links = sec => `<section class="sec sec--links"${sec.id ? ` id="${esc(sec.id)}"` : ''}><div class="wrap wrap--mid">${head(sec)}<ul class="linklist">${(sec.items || []).map(l => `<li>${a(l.href, `<span class="linklist__label">${esc(l.label)}</span>${l.meta ? `<span class="linklist__meta">${esc(l.meta)}</span>` : ''}${link.isExternal(link.href(l.href)) ? icons.external : icons.arrow}`)}</li>`).join('')}</ul></div></section>`;
  S.posts = sec => {
    let list = posts.slice();
    if (sec.category) list = list.filter(p => p.categories.includes(sec.category));
    list = list.slice(0, sec.limit || 3);
    return `<section class="sec sec--posts"><div class="wrap">${head(sec)}<div class="post-grid">${list.map(postCard).join('')}</div></div></section>`;
  };

  function postCard(p) {
    const pic = img(p.image, { sizes: '(min-width: 1100px) 30vw, (min-width: 700px) 45vw, 92vw' });
    const d = p.date ? new Date(p.date + 'T12:00:00') : null;
    return `<a class="post-card" href="${p.path}" data-cats="${esc(p.categories.join('|'))}" data-text="${esc((p.title + ' ' + p.excerpt).toLowerCase())}">
      <div class="post-card__media">${pic || `<div class="post-card__ph">${sunflowerMark({ id: 'pc' + p.slug.slice(0, 6).replace(/[^a-z]/g, '') })}</div>`}</div>
      <div class="post-card__body"><p class="post-card__meta">${p.categories[0] ? `<span>${esc(p.categories[0])}</span>` : ''}${d ? `<time datetime="${p.date}">${d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</time>` : ''}</p>
      <h3 class="post-card__title">${esc(p.title)}</h3><p class="post-card__excerpt">${esc(p.excerpt)}</p></div></a>`;
  }

  function sections(list) {
    let splitCount = 0;
    return (list || []).map(sec => {
      const fn = S[sec.type];
      if (!fn) { console.warn('  unknown section type', sec.type); return S.prose({ html: sec.html || '' }); }
      return fn(sec, sec.type === 'split' ? splitCount++ : 0);
    }).join('\n');
  }

  // ---------- page hero ----------
  function hero(page) {
    const h = page.hero || { variant: 'simple', title: page.title };
    const crumbs = breadcrumb(page);
    const facts = h.facts && h.facts.length ? `<dl class="hero-facts">${h.facts.map(f => `<div><dt>${esc(f.label)}</dt><dd>${H(f.value)}</dd></div>`).join('')}</dl>` : '';
    const lead = h.lead ? `<p class="page-hero__lead">${H(h.lead)}</p>` : '';
    const title = `<h1 class="page-hero__title" data-split>${esc(h.title || page.title)}</h1>`;
    const pic = h.image ? img(h.image, { sizes: h.variant === 'image' ? '100vw' : '(min-width: 960px) 50vw, 100vw', eager: true, cls: 'page-hero__img' }) : '';
    if (h.variant === 'image' && pic) {
      return `<section class="page-hero page-hero--image"><div class="page-hero__bg" data-parallax="0.18">${pic}</div><div class="page-hero__shade"></div>
        <div class="wrap page-hero__inner">${crumbs}${title}${lead}${actions(h.actions)}</div></section>${facts ? `<div class="wrap hero-facts-wrap">${facts}</div>` : ''}`;
    }
    if (h.variant === 'split' && pic) {
      return `<section class="page-hero page-hero--split"><div class="wrap page-hero__grid"><div class="page-hero__text">${crumbs}${title}${lead}${actions(h.actions)}</div>
        <div class="page-hero__media"><div class="frame frame--${imager.isGraphic(h.image) ? 'graphic' : 'arch'}">${pic}</div>${imager.isGraphic(h.image) ? '' : sunflowerMark({ cls: 'page-hero__mark', id: 'hm' })}</div></div>${facts ? `<div class="wrap">${facts}</div>` : ''}</section>`;
    }
    return `<section class="page-hero page-hero--simple"><div class="wrap page-hero__inner">${crumbs}${title}${lead}${actions(h.actions)}</div>${facts ? `<div class="wrap">${facts}</div>` : ''}${sunflowerMark({ cls: 'page-hero__mark', id: 'hm' })}</section>`;
  }

  function breadcrumb(page) {
    if (!page.path || page.path === '/') return '';
    const nav = site.nav.find(n => n.key === page.nav);
    const items = [`<li><a href="/">Home</a></li>`];
    if (nav && nav.href !== page.path) items.push(`<li>${a(nav.href, esc(nav.label))}</li>`);
    if (page.parent) items.push(`<li>${a(page.parent.href, esc(page.parent.label))}</li>`);
    return `<nav class="crumbs" aria-label="Breadcrumb"><ol>${items.join('')}</ol></nav>`;
  }

  // ---------- header / footer ----------
  function header(page) {
    const navItems = site.nav.map(n => {
      const current = page.nav === n.key ? ' aria-current="true"' : '';
      if (!n.children && !n.groups) return `<li class="nav__item"><a class="nav__link" href="${n.href}"${page.path === n.href ? ' aria-current="page"' : current}>${esc(n.label)}</a></li>`;
      const groups = n.groups || [{ children: n.children }];
      const panel = `<div class="mega" id="mega-${n.key}" hidden><div class="wrap mega__inner">
        <div class="mega__intro"><p class="mega__title">${esc(n.label)}</p><p>${esc(n.blurb || '')}</p>${a(n.href, `<span>${n.key === 'support' ? 'Ways to give' : 'Overview'}</span>${icons.arrow}`, 'btn btn--link')}</div>
        ${groups.map(g => `<div class="mega__col">${g.label ? `<p class="mega__group">${g.href ? a(g.href, esc(g.label)) : esc(g.label)}</p>` : ''}<ul>${g.children.map(c => `<li>${a(c.href, `<span>${esc(c.label)}</span>${c.meta ? `<small>${esc(c.meta)}</small>` : ''}`)}</li>`).join('')}</ul></div>`).join('')}
      </div></div>`;
      return `<li class="nav__item has-mega"><button class="nav__link nav__toggle" type="button" aria-expanded="false" aria-controls="mega-${n.key}"${current}>${esc(n.label)}${icons.chevron}</button>${panel}</li>`;
    }).join('');

    const drawer = site.nav.map(n => {
      if (!n.children && !n.groups) return `<li><a class="drawer__top" href="${n.href}">${esc(n.label)}</a></li>`;
      const groups = n.groups || [{ children: n.children }];
      return `<li><details><summary class="drawer__top">${esc(n.label)}${icons.chevron}</summary><div class="drawer__sub">${groups.map(g => `${g.label ? `<p class="drawer__group">${esc(g.label)}</p>` : ''}<ul>${g.children.map(c => `<li>${a(c.href, esc(c.label))}</li>`).join('')}</ul>`).join('')}</div></details></li>`;
    }).join('');

    return `<a class="skip" href="#main">Skip to content</a>
<div class="utility"><div class="wrap utility__inner">
  <p class="utility__contact"><a href="${site.contact.phoneHref}">${icons.phone}<span>${esc(site.contact.phone)}</span></a><a href="mailto:${site.contact.email}">${icons.mail}<span>${esc(site.contact.email)}</span></a></p>
  <ul class="utility__links">${site.utility.map(u => `<li>${a(u.href, esc(u.label))}</li>`).join('')}</ul>
  <ul class="social social--sm">${site.social.map(s => `<li>${a(s.href, `${icons[s.name] || ''}<span class="vh">${esc(s.name)}</span>`)}</li>`).join('')}</ul>
</div></div>
<header class="site-header" data-header>
  <div class="wrap site-header__inner">
    <a class="brand" href="/" aria-label="Sunflower Creative Arts — home">${sunflowerMark({ cls: 'brand__mark', id: 'bm' })}<span class="brand__name"><span>Sunflower</span> <span>Creative Arts</span></span></a>
    <nav class="nav" aria-label="Main"><ul class="nav__list">${navItems}</ul></nav>
    <div class="site-header__cta">${a('/seedlings/pre-application/', '<span>Apply</span>', 'btn btn--ghost btn--sm hide-sm')}${a(site.donate.href, `<span>${esc(site.donate.label)}</span>`, 'btn btn--primary btn--sm')}
      <button class="menu-btn" type="button" aria-expanded="false" aria-controls="drawer"><span class="menu-btn__bars" aria-hidden="true"><i></i><i></i></span><span class="vh">Menu</span></button>
    </div>
  </div>
</header>
<div class="drawer" id="drawer" hidden>
  <div class="drawer__panel">
    <ul class="drawer__nav">${drawer}</ul>
    <div class="drawer__foot">
      <div class="actions">${a('/seedlings/pre-application/', '<span>Apply</span>', 'btn btn--secondary')}${a(site.donate.href, `<span>${esc(site.donate.label)}</span>`, 'btn btn--primary')}</div>
      <ul class="drawer__utility">${site.utility.map(u => `<li>${a(u.href, esc(u.label))}</li>`).join('')}</ul>
      <p><a href="${site.contact.phoneHref}">${esc(site.contact.phone)}</a><br><a href="mailto:${site.contact.email}">${esc(site.contact.email)}</a></p>
      <ul class="social">${site.social.map(s => `<li>${a(s.href, `${icons[s.name] || ''}<span class="vh">${esc(s.name)}</span>`)}</li>`).join('')}</ul>
    </div>
  </div>
</div>`;
  }

  function footer() {
    const c = site.contact;
    const cols = site.nav.filter(n => n.children || n.groups).map(n => {
      const kids = n.groups ? n.groups.flatMap(g => g.children) : n.children;
      return `<div class="footer__col"><p class="footer__h">${esc(n.label)}</p><ul>${kids.map(k => `<li>${a(k.href, esc(k.label))}</li>`).join('')}</ul></div>`;
    }).join('');
    const badges = site.footerBadges.map(b => {
      const pic = img(b, { sizes: '160px' });
      return pic ? `<li>${b.href ? a(b.href, pic) : pic}</li>` : '';
    }).join('');
    return `<footer class="footer">
  <div class="footer__visit">
    <div class="wrap footer__visit-inner">
      <div class="footer__photo">${img(site.footerImage, { sizes: '(min-width: 960px) 46vw, 92vw' })}</div>
      <div class="footer__card">
        <p class="footer__eyebrow">Visit Sunflower</p>
        <p class="footer__big">${esc(site.name)}</p>
        <ul class="footer__contact">
          <li>${icons.pin}${a(c.mapUrl, esc(c.address))}</li>
          <li>${icons.phone}<a href="${c.phoneHref}">Phone: ${esc(c.phone)}</a></li>
          <li>${icons.mail}<a href="mailto:${c.email}">${esc(c.email)}</a></li>
        </ul>
        <p class="footer__license">${esc(c.license)}</p>
        <div class="actions">${a('/seedlings/visiting-seedlings/', '<span>Schedule a visit</span>' + icons.arrow, 'btn btn--primary')}${a(site.donate.href, '<span>Donate</span>' + icons.external, 'btn btn--secondary')}</div>
      </div>
    </div>
  </div>
  <div class="wrap footer__main">
    <div class="footer__brand">
      <a class="brand brand--footer" href="/">${sunflowerMark({ cls: 'brand__mark', id: 'fm' })}<span class="brand__name"><span>Sunflower</span> <span>Creative Arts</span></span></a>
      <p class="footer__tag">${esc(site.tagline)}</p>
      <p class="footer__follow">Follow us</p>
      <ul class="social">${site.social.map(s => `<li>${a(s.href, `${icons[s.name] || ''}<span class="vh">${esc(s.name)}</span>`)}</li>`).join('')}</ul>
    </div>
    <div class="footer__cols">${cols}</div>
  </div>
  <div class="wrap footer__badges"><ul>${badges}</ul></div>
  <div class="wrap footer__legal">
    <p>© Copyright ${site.copyrightStart}–${year}, ${esc(site.legal)}</p>
    <ul>${site.utility.map(u => `<li>${a(u.href, esc(u.label))}</li>`).join('')}<li><a href="/privacypolicy/">Privacy policy</a></li><li><a href="/contact/">Contact</a></li></ul>
  </div>
</footer>`;
  }

  function document({ page, body, intro = false }) {
    const title = page.seo?.title || `${page.title} | ${site.name}`;
    const desc = page.seo?.description || page.hero?.lead?.replace(/<[^>]+>/g, '') || site.description;
    const og = page.ogImage || (page.hero && page.hero.image) || (page.hero && page.hero.images && page.hero.images[0]) || site.footerImage;
    const ogUrl = imager.url(og, 1600);
    const canonical = site.url + (page.path || '/');
    return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
<link rel="canonical" href="${canonical}">
<meta property="og:type" content="${page.isPost ? 'article' : 'website'}">
<meta property="og:site_name" content="${esc(site.name)}">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:url" content="${canonical}">
${ogUrl ? `<meta property="og:image" content="${site.url}${ogUrl}">` : ''}
<meta name="twitter:card" content="summary_large_image">
<meta name="theme-color" content="#F8B44E">
<link rel="icon" href="/assets/img/favicon.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="/assets/img/apple-touch-icon.png">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Figtree:ital,wght@0,400;0,500;0,600;0,700;1,400&family=Young+Serif&display=swap">
<link rel="stylesheet" href="/assets/css/site.css?v=${ctx.version}">
${intro ? `<script>try{if(!sessionStorage.getItem('sca-intro')&&!matchMedia('(prefers-reduced-motion: reduce)').matches){document.documentElement.classList.add('intro')}}catch(e){}</script>` : ''}
<script>document.documentElement.classList.add('js')</script>
<script type="application/ld+json">${JSON.stringify(page.path === '/' ? {
      '@context': 'https://schema.org', '@type': ['Preschool', 'NGO'], name: site.name, url: site.url, email: site.contact.email,
      telephone: '+1-561-501-6615', description: site.mission,
      address: { '@type': 'PostalAddress', streetAddress: '227 N Dixie Blvd', addressLocality: 'Delray Beach', addressRegion: 'FL', postalCode: '33444', addressCountry: 'US' },
      sameAs: site.social.map(s => s.href)
    } : { '@context': 'https://schema.org', '@type': page.isPost ? 'BlogPosting' : 'WebPage', name: page.title, headline: page.title, url: canonical, ...(page.isPost && page.date ? { datePublished: page.date, author: { '@type': 'Organization', name: page.author } } : {}) })}</script>
</head>
<body class="${page.bodyClass || ''}">
${intro ? introOverlay() : ''}
${header(page)}
<main id="main">
${body}
</main>
${footer()}
<div class="lightbox" hidden><button class="lightbox__close" type="button" aria-label="Close">${icons.close}</button><button class="lightbox__nav lightbox__prev" type="button" aria-label="Previous photo">${icons.chevron}</button><figure><img alt=""><figcaption></figcaption></figure><button class="lightbox__nav lightbox__next" type="button" aria-label="Next photo">${icons.chevron}</button></div>
<script>window.SCA=${JSON.stringify({ formEndpoint: site.forms?.endpoint || '', email: site.contact.email })}</script>
<script src="/assets/js/site.js?v=${ctx.version}" defer></script>
</body>
</html>`;
  }

  function introOverlay() {
    return `<div class="intro-overlay" aria-hidden="true">
  <div class="intro-overlay__stage">
    ${sunflowerMark({ cls: 'intro-mark', id: 'im' })}
    <p class="intro-word"><span>Sunflower</span> <span>Creative</span> <span>Arts</span></p>
    <p class="intro-tag">Remember Play? We do.</p>
  </div>
</div>`;
  }

  return { document, hero, sections, button, actions, heading, img, gallery, ytFrame, renderForm, postCard, a, H, breadcrumb, sunflowerMark };
}
