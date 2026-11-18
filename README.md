# Sunflower Creative Arts website

The new website for [Sunflower Creative Arts](https://sunflowercreativearts.org), a nonprofit nature
preschool and family arts center in Delray Beach, Florida.

**This website is a gift.** It was designed and built by **Joey Seeman** and given to Sunflower Creative Arts
free of charge. Sunflower owns it outright, with no fees, no contracts and no strings attached.

Live preview: **https://joeyseeman.github.io/sunflower-creative-arts-website/**

---

## What's here

Every page, blog post, photo, video, form, link, email address and social account from the old WordPress
site, carried over and redesigned. Nothing was left behind:

- 120+ pages: programs, Seedlings, events, giving, policies and more
- 161 blog posts going back to 2011, searchable and filterable by topic
- Every photo that still loaded on the old site, optimized so it loads quickly on phones
- Every YouTube video, Google Calendar, SoundCloud and Canva embed, and PayPal button
- The same addresses as the old site, so existing links and bookmarks keep working

The site is plain HTML, CSS and a little JavaScript. There's no database, no plugins, and nothing to update or
patch, so it's fast, secure, and free to host.

## Run it on your computer

You need [Node.js](https://nodejs.org) 20 or newer.

```bash
npm install
npm run dev
```

Then open the address it prints (usually http://localhost:4321).

| Command | What it does |
|---|---|
| `npm run build` | Builds the whole site into `dist/` |
| `npm run serve` | Previews the built site |
| `npm run dev` | Build, then preview |
| `npm run media` | Downloads and optimizes any new images added to `content/` |

## Changing the content

All the words, links and photos live in plain JSON files in `content/`. You don't need to touch any code.

| File | What's in it |
|---|---|
| `content/site.json` | Name, address, phone, email, menus, footer, social links |
| `content/home.json` | The home page |
| `content/pages/*.json` | Every other page, one file each |
| `content/posts/*.json` | Blog posts, one file each |
| `content/blog.json` | Blog introduction and "Browse by theme" cards |

`docs/CONTENT.md` explains the page format and every section type: text, photos, galleries, videos, FAQs,
tables, staff and more.

**Adding a photo:** put the image's web address in the content file, run `npm run media` to download and resize
it, then `npm run build`.

## How the code is organized

```
content/          words, links and photo references (edit these)
public/assets/    the stylesheet, the script and icons
public/media/     optimized photos, made by `npm run media`
src/build.mjs     turns content/ into the finished site in dist/
src/render.mjs    page layout and every section type
src/home.mjs      the home page layout
src/lib.mjs       links, responsive images, icons and the sunflower logo
src/media.mjs     image downloader and optimizer
src/serve.mjs     local preview server
docs/CONTENT.md   content format reference
```

## Publishing

Every push to the `main` branch rebuilds the site and publishes it to GitHub Pages automatically (see
`.github/workflows/pages.yml`). The workflow tells the build where the site lives, so links work from the
`/sunflower-creative-arts-website/` folder on GitHub Pages and from a domain's root alike.

**To use sunflowercreativearts.org:** add the domain under the repository's *Settings → Pages → Custom domain*
and point the domain's DNS records at GitHub Pages ([GitHub's guide](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site)).
The next build picks up the new address on its own. This replaces the old WordPress site, so do it once the
new site has been reviewed.

The finished `dist/` folder also works on any other static host (Netlify, Cloudflare Pages and so on). For a
host that serves it from a sub-folder, build with `SITE_URL` set to the full address, for example
`SITE_URL=https://example.org/sunflower npm run build`.

## Forms

Until a form service is connected, forms open a pre-filled email to Hello@SunflowerCreativeArts.org, so
nothing gets lost. To send them to a service such as Formspree instead, add this to `content/site.json`:

```json
"forms": { "endpoint": "https://formspree.io/f/your-form-id" }
```

PayPal payment and donation buttons go straight to PayPal, as before.

## Credits

Designed and built by Joey Seeman as a gift to Sunflower Creative Arts.

All text, photographs, videos, logos and the Sunflower Creative Arts name belong to Sunflower Creative Arts.
They're published here for the school's own website, not for reuse elsewhere.
