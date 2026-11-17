// Home page — the one page laid out by hand.
import { esc, icons, sunflowerMark } from './lib.mjs';

export function renderHome({ home, site, R, imager, link, posts }) {
  const { img } = imager;
  const H = s => link.html(s || '');
  const h = home.hero;

  // Photos for the drifting ribbon: every strong photo already used on the site's main pages.
  const ribbonSrcs = [
    'https://sunflowercreativearts.org/wp-content/uploads/2025/01/51745436584_420819be42_o.jpg',
    'https://c7.staticflickr.com/8/7503/27293434222_d91e986f66_b.jpg',
    'https://sunflowercreativearts.org/wp-content/uploads/2013/10/VS-child-in-the-rain.jpg',
    'https://c3.staticflickr.com/9/8712/28631022810_f99196edf7_b.jpg',
    'https://sunflowercreativearts.org/wp-content/uploads/2018/01/Seedling-on-Hill-16x9.jpg',
    'https://c3.staticflickr.com/8/7123/27293434362_65c0ee94d7_b.jpg',
    'https://farm8.staticflickr.com/7058/26870064461_ff1d02aabf_b.jpg',
    'https://sunflowercreativearts.org/wp-content/uploads/2022/12/52442571124_a6faf2720c_o-1-scaled.jpg'
  ];
  const ribbon = (home.ribbon || ribbonSrcs).map(src => ({ src, alt: 'A moment at Sunflower Creative Arts' })).filter(i => imager.info(i.src));

  const facts = h.facts.map(f => `<li>${esc(f)}</li>`).join('');

  // --- hero
  const hero = `<section class="home-hero" data-hero>
  <div class="wrap home-hero__grid">
    <div class="home-hero__text">
      <p class="home-hero__kicker" data-hero-in>${sunflowerMark({ cls: 'home-hero__kmark', id: 'hk' })}<span>Seedlings Nature Preschool in Delray Beach, Florida</span></p>
      <h1 class="home-hero__title" data-lines>${esc(h.title)}</h1>
      <p class="home-hero__lead" data-hero-in>${H(h.lead)}</p>
      <ul class="home-hero__facts" data-hero-in>${facts}</ul>
      <div data-hero-in>${R.actions(h.actions)}</div>
    </div>
    <div class="home-hero__media">
      <div class="home-hero__arch" data-hero-photo>${img(h.images[0], { sizes: '(min-width: 1000px) 46vw, 92vw', eager: true })}</div>
      <div class="home-hero__float home-hero__float--a" data-hero-photo data-parallax="-0.12">${img(h.images[1], { sizes: '(min-width: 1000px) 18vw, 40vw', eager: true })}</div>
      <div class="home-hero__float home-hero__float--b" data-hero-photo data-parallax="0.1">${img(h.images[2], { sizes: '(min-width: 1000px) 20vw, 44vw', eager: true })}</div>
      <div class="home-hero__sun" aria-hidden="true" data-parallax="0.2"></div>
    </div>
  </div>
  <a class="home-hero__scroll" href="#news"><span>Scroll</span><i></i></a>
</section>`;

  // --- news strip
  const news = `<section class="news" id="news" aria-label="News from Sunflower">
  <div class="wrap news__grid">${home.news.map(n => `
    <article class="news__item reveal">
      <a class="news__media${n.contain ? ' news__media--contain' : ''}" href="${esc(link.href(n.href))}"${link.isExternal(link.href(n.href)) ? ' target="_blank" rel="noopener"' : ''} tabindex="-1" aria-hidden="true">${img(n.image, { sizes: '(min-width: 1000px) 12vw, 30vw' })}</a>
      <div class="news__body">
        <h2 class="news__title">${esc(n.title)}</h2>
        <p>${H(n.html)}</p>
        ${n.logo ? `<a class="news__logo" href="${esc(n.logo.href)}" target="_blank" rel="noopener">${img(n.logo, { sizes: '140px' })}</a>` : ''}
        ${R.a(n.href, `<span>${esc(n.cta)}</span>${icons.arrow}`, 'btn btn--link')}
      </div>
    </article>`).join('')}
  </div>
</section>`;

  // --- mission
  const m = home.mission;
  const mission = `<section class="mission" data-mission>
  <div class="wrap mission__inner">
    <p class="mission__label">Our mission</p>
    <p class="mission__statement">${esc(m.before)} <em class="mission__em">${esc(m.empower)}</em> ${esc(m.middle)} ${m.words.map((w, i) => `<span class="mission__word" style="--d:${i}">${esc(w)}</span>`).reduce((acc, w, i, arr) => acc + (i === 0 ? '' : i === arr.length - 1 ? ' and ' : ', ') + w, '')} ${esc(m.after)}</p>
    <div class="mission__body">
      <div class="rich rich--light">${H('<p>' + m.html + '</p>')}</div>
      ${R.a('/about/', `<span>About Sunflower</span>${icons.arrow}`, 'btn btn--onDark')}
    </div>
  </div>
  <div class="mission__house">${img(m.image, { sizes: '100vw' })}</div>
</section>`;

  // --- memorial
  const mem = home.memorial;
  const memorial = `<section class="memorial">
  <div class="wrap memorial__grid">
    <div class="memorial__photo reveal">${img(mem.image, { sizes: '(min-width: 900px) 34vw, 80vw' })}</div>
    <div class="memorial__text">
      ${sunflowerMark({ cls: 'memorial__mark', id: 'mm' })}
      <h2 class="memorial__title">${esc(mem.title)}</h2>
      <p class="memorial__dates">${esc(mem.dates)}</p>
      <p class="memorial__line">${esc(mem.html)}</p>
      ${R.actions(mem.actions)}
    </div>
  </div>
</section>`;

  // --- pillars (sticky photo, scrolling text)
  const p = home.pillars;
  const pillars = `<section class="pillars" data-pillars>
  <div class="wrap">
    <header class="sec-head sec-head--center"><h2 class="h-section">${esc(p.heading)}</h2></header>
    <div class="pillars__grid">
      <div class="pillars__stage" aria-hidden="true">
        <div class="pillars__frame">${p.items.map((it, i) => `<div class="pillars__img${i === 0 ? ' is-on' : ''}" data-pillar-img="${i}">${img(it.image, { sizes: '(min-width: 960px) 44vw, 92vw' })}</div>`).join('')}</div>
        <ol class="pillars__dots">${p.items.map((it, i) => `<li class="${i === 0 ? 'is-on' : ''}" data-pillar-dot="${i}"><span>${esc(it.title)}</span></li>`).join('')}</ol>
      </div>
      <div class="pillars__list">${p.items.map((it, i) => `
        <article class="pillar" data-pillar="${i}">
          <div class="pillar__photo-sm">${img(it.image, { sizes: '92vw' })}</div>
          <p class="pillar__n">Pillar ${i + 1} of ${p.items.length}</p>
          <h3 class="pillar__title">${esc(it.title)}</h3>
          <ul class="pillar__points">${it.points.map(pt => `<li>${esc(pt)}</li>`).join('')}</ul>
          ${R.a(it.href, `<span>More about ${esc(it.title.toLowerCase())}</span>${icons.arrow}`, 'btn btn--link')}
        </article>`).join('')}
      </div>
    </div>
  </div>
</section>`;

  // --- seedlings feature + videos
  const s = home.seedlings;
  const seedlings = `<section class="seed">
  <div class="wrap">
    <div class="seed__grid">
      <div class="seed__media"><div class="frame frame--arch" data-parallax="0.05">${img(s.image, { sizes: '(min-width: 960px) 44vw, 92vw', cls: 'reveal-img' })}</div>
        <ul class="seed__facts">${s.facts.map(f => `<li>${esc(f)}</li>`).join('')}</ul>
      </div>
      <div class="seed__text">
        <h2 class="h-display">${esc(s.heading)}</h2>
        <div class="rich">${H(s.html)}</div>
        ${R.actions(s.actions)}
      </div>
    </div>
    <div class="seed__videos">
      <h3 class="seed__vh">See a day at Seedlings</h3>
      <div class="videos videos--3">${s.videos.map(R.ytFrame).join('')}</div>
    </div>
  </div>
</section>`;

  // --- featured programs/events
  const featured = `<section class="sec feat">
  <div class="wrap">
    <header class="sec-head sec-head--split"><h2 class="h-section">Explore Sunflower</h2>${R.a('/programs/', `<span>All programs</span>${icons.arrow}`, 'btn btn--link')}</header>
    <div class="feat__grid">${home.featured.map((f, i) => R.a(f.href, `
      <div class="feat__media${f.contain ? ' feat__media--contain' : ''}">${img(f.image, { sizes: '(min-width: 1100px) 24vw, (min-width: 700px) 46vw, 92vw' })}</div>
      <div class="feat__body"><div><p class="feat__meta">${esc(f.meta)}</p><h3 class="feat__title">${esc(f.title)}</h3></div><span class="feat__go">${link.isExternal(link.href(f.href)) ? icons.external : icons.arrow}</span></div>`, 'feat__card')).join('')}
    </div>
  </div>
</section>`;

  // --- play
  const pl = home.play;
  const play = `<section class="play">
  <div class="wrap play__grid">
    <div class="play__text">
      <h2 class="play__title"><span>${esc(pl.title)}</span><span class="play__sub">${esc(pl.subtitle)}</span></h2>
      <div class="rich">${H(pl.html)}</div>
      ${R.actions(pl.actions)}
    </div>
    <div class="play__media">
      <div class="frame frame--soft" data-parallax="0.07">${img(pl.image, { sizes: '(min-width: 960px) 44vw, 92vw', cls: 'reveal-img' })}</div>
      <a class="play__logo" href="${esc(pl.logo.href)}" target="_blank" rel="noopener">${img(pl.logo, { sizes: '220px' })}</a>
    </div>
  </div>
</section>`;

  // --- ribbon
  const ribbonHTML = ribbon.length ? `<section class="ribbon" aria-label="Photos from Sunflower" data-lightbox>
  <div class="ribbon__track">${[...ribbon, ...ribbon].map((im, i) => `<a class="ribbon__item gallery__link" href="${imager.url(im, 2400)}" data-caption=""${i >= ribbon.length ? ' aria-hidden="true" tabindex="-1"' : ''}>${img(im, { sizes: '(min-width: 900px) 26vw, 60vw' })}</a>`).join('')}</div>
</section>` : '';

  // --- awards timeline
  const aw = home.awards;
  const awards = `<section class="awards">
  <div class="wrap awards__grid">
    <header class="awards__head"><h2 class="h-section">${esc(aw.heading)}</h2><p>${esc(aw.intro)}</p></header>
    <ol class="timeline">${aw.items.map(it => `<li class="timeline__item reveal">
      <span class="timeline__year">${esc(it.year)}</span>
      <div class="timeline__body"><h3>${esc(it.title)}</h3><p>${esc(it.org)}</p></div>
      <div class="timeline__logo">${img(it.image, { sizes: '96px', alt: it.image.alt })}</div>
    </li>`).join('')}</ol>
  </div>
</section>`;

  // --- stories
  const latest = posts.slice(0, 3);
  const stories = `<section class="sec sec--posts">
  <div class="wrap">
    <header class="sec-head sec-head--split"><h2 class="h-section">From the Sunflower blog</h2>${R.a('/blog/', `<span>All stories</span>${icons.arrow}`, 'btn btn--link')}</header>
    <div class="post-grid">${latest.map(R.postCard).join('')}</div>
  </div>
</section>`;

  // --- support band
  const gg = home.givingGrove, sp = home.sponsors, en = home.enews;
  const support = `<section class="support">
  <div class="wrap support__grid">
    <div class="support__give">
      ${sunflowerMark({ cls: 'support__mark', id: 'sg' })}
      <h2 class="h-display">${esc(gg.heading)}</h2>
      <div class="rich">${H(gg.html)}</div>
      ${R.actions(gg.actions)}
    </div>
    <div class="support__side">
      <div class="support__sponsors">
        <h2 class="h-small">${esc(sp.heading)}</h2>
        <p>${H(sp.html)}</p>
        ${R.actions(sp.actions)}
      </div>
      <div class="support__enews">
        <h2 class="h-small">${esc(en.heading)}</h2>
        <p>${esc(en.html)}</p>
        ${R.renderForm(en.ref, { title: en.heading, compact: true })}
      </div>
    </div>
  </div>
</section>`;

  return hero + news + memorial + mission + pillars + seedlings + featured + ribbonHTML + play + awards + stories + support;
}
