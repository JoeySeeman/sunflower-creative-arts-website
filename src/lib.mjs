// Shared helpers for the build: escaping, links, images, icons.
export const esc = (s = '') => String(s ?? '')
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const OWN = /^https?:\/\/(www\.)?sunflowercreativearts\.org/i;

// Old URL shapes from earlier versions of the site, mapped to today's pages.
const LEGACY = [
  [/^\/(\d{4})\/(\d{2})\/(\d{2})\/([^/]+)\/?$/, (m, k) => `/${m[4]}/`],
  [/^\/seeds\.html$/, () => '/seedlings/'],
  [/^\/sprouts\.html$/, () => '/programs/sprouts/'],
  [/^\/song\.html$/, () => '/programs/circle-of-song/'],
  [/^\/rootsshoots\.html$/, () => '/programs/roots-shoots/'],
  [/^\/(parentprograms|programs|classes)\.html$/, () => '/programs/'],
  [/^\/(index|home)\.html?$/, () => '/'],
  [/^\/(about|aboutus|about-us)\.html$/, () => '/about/'],
  [/^\/(contact|contactus)\.html$/, () => '/contact/'],
  [/^\/(donate|support)\.html$/, () => '/donate/'],
  [/^\/category\/.*$/, () => '/blog/'],
  [/^\/tag\/.*$/, () => '/blog/'],
  [/^\/author\/.*$/, () => '/blog/'],
  [/^\/donate-to-sunflower\/(.*)$/, m => `/donate/${m[1]}`],
  [/^\/about-sunflower[^/]*\/values\/?$/, () => '/about/pna/'],
  [/^\/about-sunflower[^/]*\/?$/, () => '/about/'],
  [/^\/programs\/young-children[^/]*\/?$/, () => '/programs/'],
  [/^\/(Programs\/.*|sunflower-programs\/?)$/, () => '/programs/'],
  [/^\/circle\/?$/, () => '/programs/circle-of-song/'],
  [/^\/seedlings\/visiting-day\/?$/, () => '/seedlings/visiting-seedlings/'],
  [/^\/events\.html$/, () => '/happenings/'],
  [/^\/(About_Us|develop|community)\.html$/, () => '/about/'],
  [/^\/afterschool\.html$/, () => '/programs/roots-shoots/'],
  [/^\/naturearts\.html?$/, () => '/about/pna/'],
  [/^\/project_category\/annual-report\/?$/, () => '/annual-reports/'],
  [/^\/project_category\/.*$/, () => '/project/'],
  [/^\/project\/page\/\d+\/?$/, () => '/project/'],
  [/^\/about-sunflower[^/]*\/.*$/, () => '/about/'],
  [/^\/finding-your-mom-friends-2\/?$/, () => '/finding-your-mom-friends/'],
  [/^\/process-oriented-art-in-preschool\/?$/, () => '/process-oriented-art-with-children-how-to/'],
  [/^\/nonprofits\/sunflower-creative-arts\/?$/, () => '/donate/'],
  [/^\/(\d{4})\/(\d{2})\/(\d{2})\/.*$/, () => '/blog/'],
];
// Relative links that belonged to Eventbrite pages copied into the old site.
const EVENTBRITE = /^\/(d|signin|ttd)(\/|$)/;

export function makeLinker(site, media, knownPaths) {
  const redirects = site.redirects || {};
  const cats = site.blogCategories || {};
  function legacy(p) {
    if (knownPaths && knownPaths.has(p)) return p;
    if (/^\/category\//.test(p)) return cats[p] ? `/blog/?topic=${encodeURIComponent(cats[p])}` : '/blog/';
    for (const [re, fn] of LEGACY) {
      const m = p.match(re);
      if (m) { const out = fn(m); if (!knownPaths || knownPaths.has(out) || out === '/blog/' || out === '/') return out; }
    }
    // WordPress attachment pages: /post-slug/attachment-name/ -> /post-slug/
    const parts = p.split('/').filter(Boolean);
    if (knownPaths && parts.length === 2 && knownPaths.has(`/${parts[0]}/`) && !knownPaths.has(p)) return `/${parts[0]}/`;
    return p;
  }
  // Normalize one href: own-domain absolute -> root relative, follow redirects, uploads -> local copies.
  function href(h) {
    if (!h) return h;
    h = h.trim().replace(/&amp;/g, '&');
    if (/^(mailto:|tel:|#|javascript:)/i.test(h)) {
      if (/^tel:/i.test(h)) {
        const digits = h.replace(/[^0-9]/g, '');
        if (digits.length === 10) return `tel:+1${digits}`;
        if (digits.length === 11) return `tel:+${digits}`;
      }
      return h;
    }
    if (/wp-content\/uploads\//.test(h)) {
      const key = h.split('?')[0].replace(/^http:/, 'https:');
      const m = media[key] || media[h.split('?')[0]];
      if (m && m.ok) return m.file || `${m.base}-${m.widths[m.widths.length - 1]}.webp`;
      return h;
    }
    if (OWN.test(h)) {
      let p = h.replace(OWN, '') || '/';
      let hash = '';
      const hi = p.indexOf('#');
      if (hi >= 0) { hash = p.slice(hi); p = p.slice(0, hi); }
      let q = '';
      const qi = p.indexOf('?');
      if (qi >= 0) { q = p.slice(qi); p = p.slice(0, qi); }
      if (!p.startsWith('/')) p = '/' + p;
      if (!/\.[a-z0-9]{2,4}$/i.test(p) && !p.endsWith('/')) p += '/';
      if (redirects[p]) return redirects[p] + (redirects[p].startsWith('/') ? hash : '');
      p = legacy(p);
      return p + q + hash;
    }
    if (EVENTBRITE.test(h)) return 'https://www.eventbrite.com' + h;
    if (h.startsWith('/') && !h.startsWith('//')) {
      let [p, hash = ''] = h.split('#');
      if (!/\.[a-z0-9]{2,4}$/i.test(p) && !p.includes('?') && !p.endsWith('/')) p += '/';
      if (redirects[p]) return redirects[p] + (hash ? '#' + hash : '');
      p = p.includes('?') ? p : legacy(p);
      return p + (hash ? '#' + hash : '');
    }
    return h;
  }
  function isExternal(h) {
    return /^https?:\/\//i.test(h || '');
  }
  // Rewrite every href/src inside an HTML string.
  function html(s = '') {
    return String(s)
      .replace(/href="([^"]*)"/g, (_, h) => {
        const n = href(h);
        const ext = isExternal(n) ? ' target="_blank" rel="noopener"' : '';
        return `href="${esc(n).replace(/&amp;amp;/g, '&amp;')}"${ext}`;
      });
  }
  return { href, html, isExternal };
}

export function makeImager(media) {
  // Responsive <img>. Returns '' when the image is missing (already broken on the old site).
  function info(src) {
    if (!src) return null;
    const key = src.split('?')[0];
    const m = media[key] || media[key.replace(/^http:/, 'https:')] || media[key.replace(/^https:/, 'http:')];
    if (m && m.ok) return m;
    if (/widgets\.guidestar\.org/.test(src)) return { remote: src };
    return null;
  }
  function img(image, { sizes = '100vw', cls = '', eager = false, alt, attrs = '' } = {}) {
    if (!image || !image.src) return '';
    const m = info(image.src);
    if (!m) return '';
    const a = esc(alt ?? image.alt ?? '');
    const loading = eager ? 'fetchpriority="high"' : 'loading="lazy"';
    if (m.remote) return `<img class="${cls}" src="${esc(m.remote)}" alt="${a}" ${loading} decoding="async" ${attrs}>`;
    if (m.file) {
      const wh = m.w && m.h ? ` width="${m.w}" height="${m.h}"` : '';
      return `<img class="${cls}" src="${m.file}" alt="${a}"${wh} ${loading} decoding="async" ${attrs}>`;
    }
    const srcset = m.widths.map(w => `${m.base}-${w}.webp ${w}w`).join(', ');
    const def = m.widths.find(w => w >= 960) || m.widths[m.widths.length - 1];
    const h = Math.round(m.h * (def / m.w));
    const bg = m.alpha ? '' : ` style="--ph:${m.color}"`;
    return `<img class="${cls}" src="${m.base}-${def}.webp" srcset="${srcset}" sizes="${sizes}" width="${def}" height="${h}" alt="${a}" ${loading} decoding="async"${bg} ${attrs}>`;
  }
  function url(image, w = 1600) {
    const m = image && info(image.src);
    if (!m) return '';
    if (m.file) return m.file;
    if (m.remote) return m.remote;
    return `${m.base}-${m.widths.find(x => x >= w) || m.widths[m.widths.length - 1]}.webp`;
  }
  // Posters, flyers and logos (PNG/GIF/SVG) must be shown whole rather than cropped into a shape.
  function isGraphic(image) {
    if (!image || !image.src) return false;
    if (image.graphic !== undefined) return !!image.graphic;
    return /\.(png|gif|svg)(\?|$)/i.test(image.src);
  }
  return { img, url, info, isGraphic };
}

export const icons = {
  arrow: '<svg class="i" viewBox="0 0 20 20" aria-hidden="true"><path d="M4 10h11M11 5l5 5-5 5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  external: '<svg class="i" viewBox="0 0 20 20" aria-hidden="true"><path d="M8 4H4v12h12v-4M11 3h6v6M17 3l-8 8" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  phone: '<svg class="i" viewBox="0 0 20 20" aria-hidden="true"><path d="M6.6 2.5 4.2 3.2c-.9.3-1.5 1.2-1.3 2.2.9 5 4.7 8.8 9.7 9.7 1 .2 1.9-.4 2.2-1.3l.7-2.4-3.4-1.6-1.5 1.6c-1.9-.8-3.4-2.3-4.2-4.2l1.6-1.5z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/></svg>',
  mail: '<svg class="i" viewBox="0 0 20 20" aria-hidden="true"><rect x="2.5" y="4.5" width="15" height="11" rx="2" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="m3.5 6 6.5 5 6.5-5" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>',
  pin: '<svg class="i" viewBox="0 0 20 20" aria-hidden="true"><path d="M10 18s6-5.3 6-10a6 6 0 1 0-12 0c0 4.7 6 10 6 10z" fill="none" stroke="currentColor" stroke-width="1.6"/><circle cx="10" cy="8" r="2.2" fill="none" stroke="currentColor" stroke-width="1.6"/></svg>',
  play: '<svg viewBox="0 0 64 64" aria-hidden="true"><circle cx="32" cy="32" r="31" fill="currentColor"/><path d="M26 21v22l18-11z" fill="#fff"/></svg>',
  plus: '<svg class="i" viewBox="0 0 20 20" aria-hidden="true"><path d="M10 4v12M4 10h12" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>',
  chevron: '<svg class="i" viewBox="0 0 20 20" aria-hidden="true"><path d="m5 8 5 5 5-5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  close: '<svg class="i" viewBox="0 0 20 20" aria-hidden="true"><path d="M5 5l10 10M15 5 5 15" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>',
  search: '<svg class="i" viewBox="0 0 20 20" aria-hidden="true"><circle cx="9" cy="9" r="5.5" fill="none" stroke="currentColor" stroke-width="1.7"/><path d="m13.5 13.5 3.5 3.5" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></svg>',
  Facebook: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M13.5 21v-7.5h2.6l.4-3h-3V8.6c0-.9.3-1.5 1.5-1.5h1.6V4.4c-.3 0-1.2-.1-2.3-.1-2.3 0-3.9 1.4-3.9 4v2.2H7.8v3h2.6V21z"/></svg>',
  Instagram: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3.5" y="3.5" width="17" height="17" rx="5" fill="none" stroke="currentColor" stroke-width="1.8"/><circle cx="12" cy="12" r="4" fill="none" stroke="currentColor" stroke-width="1.8"/><circle cx="17.2" cy="6.8" r="1.1" fill="currentColor"/></svg>',
  YouTube: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M21.6 7.2a2.6 2.6 0 0 0-1.8-1.8C18.2 5 12 5 12 5s-6.2 0-7.8.4a2.6 2.6 0 0 0-1.8 1.8C2 8.8 2 12 2 12s0 3.2.4 4.8a2.6 2.6 0 0 0 1.8 1.8C5.8 19 12 19 12 19s6.2 0 7.8-.4a2.6 2.6 0 0 0 1.8-1.8c.4-1.6.4-4.8.4-4.8s0-3.2-.4-4.8zM10 15V9l5.2 3z"/></svg>',
  'X (Twitter)': '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M17.5 3.5h3l-6.6 7.5 7.8 9.5h-6.1l-4.8-5.9-5.4 5.9h-3l7-7.9L2 3.5h6.2l4.3 5.4zm-1 15.2h1.7L7.6 5.2H5.8z"/></svg>'
};

// The Sunflower mark: a rising half-sunflower (rust seed disk, translucent overlapping petals),
// rebuilt as vector geometry from the original logo so it can animate.
export function sunflowerMark({ cls = '', id = 'sf', title = '' } = {}) {
  const cx = 300, cy = 300, petals = [];
  const n = 13;
  for (let i = 0; i < n; i++) {
    const a = Math.PI - (i * Math.PI) / (n - 1); // 180deg -> 0deg
    const L = 285, w = 46, r0 = 40;
    const ux = Math.cos(a), uy = -Math.sin(a);
    const px = -uy, py = ux;
    const sx = cx + ux * r0, sy = cy + uy * r0;
    const tx = cx + ux * L, ty = cy + uy * L;
    const mx = cx + ux * (L * 0.56), my = cy + uy * (L * 0.56);
    const d = `M${sx.toFixed(1)} ${sy.toFixed(1)}Q${(mx + px * w * 2).toFixed(1)} ${(my + py * w * 2).toFixed(1)} ${tx.toFixed(1)} ${ty.toFixed(1)}Q${(mx - px * w * 2).toFixed(1)} ${(my - py * w * 2).toFixed(1)} ${sx.toFixed(1)} ${sy.toFixed(1)}Z`;
    const order = Math.abs(i - (n - 1) / 2); // centre petals open first
    petals.push(`<path class="sf-petal" style="--i:${i};--o:${order};--a:${(90 - (a * 180) / Math.PI).toFixed(1)}deg" d="${d}"/>`);
  }
  return `<svg class="sf-mark ${cls}" viewBox="0 0 600 310" ${title ? `role="img" aria-label="${esc(title)}"` : 'aria-hidden="true"'}>
  <defs><clipPath id="${id}-h"><rect x="0" y="0" width="600" height="302"/></clipPath></defs>
  <g clip-path="url(#${id}-h)">
    <g class="sf-petals">${petals.join('')}</g>
    <circle class="sf-disk" cx="${cx}" cy="${cy}" r="98"/>
  </g>
</svg>`;
}
