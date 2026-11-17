// Builds the static site into dist/.  Usage: npm run build
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { esc, icons, makeLinker, makeImager, sunflowerMark } from './lib.mjs';
import { createRenderer } from './render.mjs';
import { renderHome } from './home.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const C = p => path.join(ROOT, 'content', p);
const DIST = path.join(ROOT, 'dist');
const readJSON = async p => JSON.parse(await fs.readFile(p, 'utf8'));

async function copyDir(src, dst) {
  await fs.mkdir(dst, { recursive: true });
  for (const e of await fs.readdir(src, { withFileTypes: true })) {
    const s = path.join(src, e.name), d = path.join(dst, e.name);
    if (e.isDirectory()) await copyDir(s, d);
    else await fs.copyFile(s, d);
  }
}

async function write(urlPath, html) {
  const file = path.join(DIST, urlPath, urlPath.endsWith('.html') || urlPath.endsWith('.xml') || urlPath.endsWith('.txt') ? '' : 'index.html');
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(file, html);
}

// WordPress shortcodes left inside old blog posts.
function shortcodes(html) {
  return html
    .replace(/\[soundcloud[^\]]*url=[”"“]([^”"“]+)[”"“][^\]]*\]/gi, (_, u) => `<iframe class="audio" src="https://w.soundcloud.com/player/?url=${encodeURIComponent(u)}&visual=true" title="SoundCloud audio"></iframe>`)
    .replace(/\[caption[^\]]*\]([\s\S]*?)\[\/caption\]/gi, (_, inner) => {
      const m = inner.match(/^(\s*(?:<a[^>]*>)?\s*<img[^>]*>\s*(?:<\/a>)?)([\s\S]*)$/);
      return m ? `<figure>${m[1]}<figcaption>${m[2].trim()}</figcaption></figure>` : inner;
    })
    .replace(/\[\/?(gallery|embed|video|audio)[^\]]*\]/gi, '');
}

async function main() {
  const t0 = Date.now();
  const site = await readJSON(C('site.json'));
  const home = await readJSON(C('home.json'));
  const forms = await readJSON(C('forms.json'));
  const blog = await readJSON(C('blog.json'));
  site.blogCategories = blog.categories;
  let media = {};
  try { media = await readJSON(C('media.json')); } catch { console.warn('No content/media.json yet — run npm run media'); }

  const pages = [];
  for (const f of (await fs.readdir(C('pages'))).filter(f => f.endsWith('.json')).sort()) {
    const p = await readJSON(C('pages/' + f));
    p.slug = f.replace(/\.json$/, '');
    pages.push(p);
  }
  const posts = [];
  for (const f of (await fs.readdir(C('posts'))).filter(f => f.endsWith('.json'))) posts.push(await readJSON(C('posts/' + f)));
  posts.sort((a, b) => (b.date || '').localeCompare(a.date || ''));

  const knownPaths = new Set(['/', '/blog/', ...pages.map(p => p.path), ...posts.map(p => p.path), ...Object.keys(site.redirects || {})]);
  const link = makeLinker(site, media, knownPaths);
  const imager = makeImager(media);
  const version = Date.now().toString(36);
  const R = createRenderer({ site, forms, link, imager, posts, version });

  await fs.rm(DIST, { recursive: true, force: true });
  await copyDir(path.join(ROOT, 'public'), DIST);

  // Home
  await write('/', R.document({ page: { ...home, title: site.name, nav: null, bodyClass: 'is-home', ogImage: home.hero.images[0] }, body: renderHome({ home, site, R, imager, link, posts }), intro: true }));

  // Pages
  for (const p of pages) {
    const parentSlug = p.slug.includes('__') ? p.slug.split('__').slice(0, -1).join('__') : null;
    const parent = parentSlug && pages.find(x => x.slug === parentSlug);
    const nav = site.nav.find(n => n.key === p.nav);
    if (parent && (!nav || nav.href !== parent.path)) p.parent = { href: parent.path, label: parent.title };
    let body = R.hero(p) + `<div class="page-body${p.legacy ? ' page-body--doc' : ''}">${R.sections(p.sections)}</div>`;
    body += related(p);
    await write(p.path, R.document({ page: { ...p, bodyClass: `page-${p.slug.replace(/_/g, '-')}` }, body }));
  }

  function related(p) {
    // A light "next step" band at the end of every page.
    if (p.nav === 'blog') return '';
    return `<section class="next-steps"><div class="wrap next-steps__inner">
      <p class="next-steps__title">Come see Sunflower for yourself.</p>
      <div class="actions">${R.button({ label: 'Schedule a visit', href: '/seedlings/visiting-seedlings/', style: 'primary' })}${R.button({ label: 'Call 561 501-6615', href: 'tel:+15615016615', style: 'secondary' })}</div>
    </div></section>`;
  }

  // Blog index
  const cats = [...new Set(posts.flatMap(p => p.categories))].map(c => [c, posts.filter(p => p.categories.includes(c)).length]).sort((a, b) => b[1] - a[1]);
  const blogPage = pages.find(p => p.path === '/blog/') || {
    path: '/blog/', title: 'Blog', nav: 'blog',
    seo: { title: 'Sunflower Blog | Play, Nature, the Arts & Parenting', description: 'Stories and ideas from the Sunflower Creative Arts community about play, nature, the arts, parenting and early childhood.' },
    hero: { variant: 'simple', title: 'The Sunflower blog', lead: blog.intro }
  };
  const [feat, ...rest] = posts;
  const blogBody = R.hero(blogPage) + `<section class="sec blog">
    <div class="wrap">
      <a class="feature-post" href="${feat.path}">
        <div class="feature-post__media">${R.img(feat.image, { sizes: '(min-width: 960px) 55vw, 92vw' })}</div>
        <div class="feature-post__body"><p class="post-card__meta"><span>Latest story</span><time datetime="${feat.date}">${new Date(feat.date + 'T12:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</time></p>
        <h2 class="feature-post__title">${esc(feat.title)}</h2><p>${esc(feat.excerpt)}</p><span class="card__more">Read the story ${icons.arrow}</span></div>
      </a>
      <section class="themes" aria-labelledby="themes-h">
        <h2 class="h-small" id="themes-h">Browse by theme</h2>
        <div class="themes__grid">${blog.themes.map(t => R.a(t.href, `<span class="themes__img">${R.img(t.image, { sizes: '(min-width: 1000px) 22vw, 45vw' })}</span><span class="themes__title">${esc(t.title)}</span>`, 'themes__card')).join('')}</div>
      </section>
      <div class="blog-tools">
        <label class="blog-search"><span class="vh">Search the blog</span>${icons.search}<input type="search" placeholder="Search ${posts.length} stories" data-blog-search></label>
        <div class="chips" role="group" aria-label="Filter by topic"><button type="button" class="chip is-on" data-cat="">All topics</button>${cats.map(([c, n], i) => `<button type="button" class="chip${i >= 12 ? ' chip--more' : ''}" data-cat="${esc(c)}">${esc(c)} <small>${n}</small></button>`).join('')}<button type="button" class="chip chip--toggle" data-more-topics aria-expanded="false">More topics</button></div>
      </div>
      <div class="post-grid" data-blog-grid>${rest.map(R.postCard).join('')}</div>
      <p class="blog-empty" hidden>No stories match that search.</p>
      <div class="blog-more"><button class="btn btn--secondary" type="button" data-blog-more><span>Show more stories</span>${icons.chevron}</button></div>
    </div></section>`;
  await write('/blog/', R.document({ page: { ...blogPage, bodyClass: 'page-blog' }, body: blogBody }));

  // Posts
  for (let i = 0; i < posts.length; i++) {
    const p = posts[i];
    const newer = posts[i - 1], older = posts[i + 1];
    const d = p.date ? new Date(p.date + 'T12:00:00') : null;
    const rel = posts.filter(x => x !== p && x.categories.some(c => p.categories.includes(c))).slice(0, 3);
    const hero = `<section class="post-hero"><div class="wrap wrap--center">
      ${R.breadcrumb({ path: p.path, nav: 'blog' })}
      <p class="post-hero__meta">${p.categories.map(c => `<a href="/blog/?topic=${encodeURIComponent(c)}">${esc(c)}</a>`).join('')}</p>
      <h1 class="post-hero__title">${esc(p.title)}</h1>
      <p class="post-hero__by">${d ? `<time datetime="${p.date}">${d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</time>` : ''}<span>By ${esc(p.author)}</span></p>
    </div>${p.image && imager.info(p.image.src) ? `<div class="wrap wrap--center-wide"><figure class="post-hero__img">${R.img(p.image, { sizes: '(min-width: 1100px) 1000px, 94vw', eager: true })}</figure></div>` : ''}</section>`;
    let html = link.html(shortcodes(p.html));
    html = html.replace(/<img([^>]*?)src="([^"]+)"([^>]*)>/g, (m, pre, src, post) => {
      const alt = (m.match(/alt="([^"]*)"/) || [])[1] || '';
      const out = R.img({ src, alt }, { sizes: '(min-width: 800px) 720px, 94vw' });
      return out || '';
    }).replace(/<iframe([^>]*?)src="([^"]+)"([^>]*)><\/iframe>/g, (m, pre, src) => {
      const yt = src.match(/youtube\.com\/embed\/([A-Za-z0-9_-]+)/);
      if (yt) return R.ytFrame({ youtube: yt[1], title: p.title });
      return `<div class="embed${/soundcloud/.test(src) ? ' embed--audio' : ''}"><iframe src="${src}" title="Embedded content" loading="lazy" allowfullscreen></iframe></div>`;
    }).replace(/<p>\s*<\/p>/g, '');
    const body = hero + `<article class="sec post"><div class="wrap wrap--center rich rich--article">${html}</div>
      ${p.tags && p.tags.length ? `<div class="wrap wrap--center"><p class="post-tags">${p.tags.map(t => `<span>${esc(t)}</span>`).join('')}</p></div>` : ''}
      <nav class="wrap wrap--center post-nav" aria-label="More stories">${older ? `<a class="post-nav__link" href="${older.path}"><small>Previous story</small><span>${esc(older.title)}</span></a>` : '<span></span>'}${newer ? `<a class="post-nav__link post-nav__link--next" href="${newer.path}"><small>Next story</small><span>${esc(newer.title)}</span></a>` : ''}</nav>
    </article>${rel.length ? `<section class="sec sec--posts sec--tint"><div class="wrap"><header class="sec-head"><h2 class="h-section">More stories like this</h2></header><div class="post-grid">${rel.map(R.postCard).join('')}</div></div></section>` : ''}`;
    await write(p.path, R.document({ page: { ...p, nav: 'blog', isPost: true, bodyClass: 'page-post', ogImage: p.image, seo: { title: `${p.title} | Sunflower Creative Arts`, description: p.excerpt } }, body }));
  }

  // Redirect stubs for old URLs
  for (const [from, to] of Object.entries(site.redirects || {})) {
    if (knownPaths.has(from)) continue;
    await write(from, `<!doctype html><meta charset="utf-8"><title>Redirecting…</title><link rel="canonical" href="${to}"><meta http-equiv="refresh" content="0; url=${to}"><a href="${to}">Continue</a>`);
  }

  // 404
  await write('/404.html', R.document({
    page: { path: '/404/', title: 'Page not found', bodyClass: 'page-404', seo: { title: 'Page not found | Sunflower Creative Arts' } },
    body: `<section class="page-hero page-hero--simple page-hero--404"><div class="wrap page-hero__inner"><h1 class="page-hero__title">This page has wandered off to play.</h1><p class="page-hero__lead">The page you were looking for isn’t here. It may have moved when we redesigned the site.</p>${R.actions([{ label: 'Go to the home page', href: '/', style: 'primary' }, { label: 'Explore programs', href: '/programs/', style: 'secondary' }, { label: 'Contact us', href: '/contact/', style: 'link' }])}</div>${sunflowerMark({ cls: 'page-hero__mark', id: 'nf' })}</section>`
  }));

  // sitemap + robots
  const urls = ['/', '/blog/', ...pages.map(p => p.path), ...posts.map(p => p.path)];
  await write('/sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${[...new Set(urls)].map(u => `  <url><loc>${site.url}${u}</loc></url>`).join('\n')}\n</urlset>\n`);
  await write('/robots.txt', `User-agent: *\nAllow: /\n\nSitemap: ${site.url}/sitemap.xml\n`);
  // keep GitHub Pages from running Jekyll
  await fs.writeFile(path.join(DIST, '.nojekyll'), '');
  if (site.cname) await fs.writeFile(path.join(DIST, 'CNAME'), site.cname + '\n');

  console.log(`Built ${urls.length} pages in ${((Date.now() - t0) / 1000).toFixed(1)}s → dist/`);
}

main().catch(e => { console.error(e); process.exit(1); });
