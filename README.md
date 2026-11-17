# Sunflower Creative Arts website

Static rebuild of sunflowercreativearts.org: every page, photo, video, link and blog post from the old WordPress site, redesigned.

## Use it
```
npm install
npm run build     # writes dist/
npm run serve     # preview at http://localhost:4321
npm run media     # after adding new image URLs to content/ (downloads + optimizes into public/media)
```
Deploy the `dist/` folder to any static host (GitHub Pages, Netlify, Cloudflare Pages).

## Edit content
- `content/home.json` – home page
- `content/pages/*.json` – every other page (format in `docs/CONTENT.md`)
- `content/posts/*.json` – 161 blog posts
- `content/site.json` – menus, contact info, footer, redirects

## Forms
Forms open a pre-filled email to Hello@SunflowerCreativeArts.org until a form service is connected.
To connect one (Formspree, Netlify Forms, etc.), add `"forms": { "endpoint": "https://..." }` to `content/site.json`.
