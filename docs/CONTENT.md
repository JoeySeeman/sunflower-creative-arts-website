# Content format

Every page on the site is a JSON file in `content/pages/`. The build script (`src/build.mjs`)
turns each one into `dist/<path>/index.html`. Edit the JSON, run `npm run build`, done.

## Page file

```json
{
  "path": "/programs/babies/",
  "title": "Sunflower Babies",
  "nav": "programs",
  "seo": { "title": "Sunflower Babies | Parent & Baby Class in Delray Beach", "description": "…" },
  "hero": { … },
  "sections": [ … ]
}
```

| key | meaning |
|---|---|
| `path` | URL path, always with leading and trailing slash. Keep the same path as the old site so existing links keep working. |
| `title` | Short page name used in breadcrumbs and cards. |
| `nav` | Which top-level menu this page belongs to: `about`, `programs`, `events`, `blog`, `support`, `contact`, or `null`. |
| `seo` | `<title>` and meta description. |
| `hero` | Top of page (see below). |
| `sections` | Ordered list of content sections. |

### Rich text

Any field named `html` holds a small HTML string. Allowed tags: `<p>`, `<a href>`, `<strong>`, `<em>`, `<br>`,
`<ul>`, `<ol>`, `<li>`. Nothing else (no inline styles, no classes, no `<div>`).
Use `<p>` for paragraphs inside `html`. Links to other pages on this site use root-relative paths
(`/seedlings/`), never `https://sunflowercreativearts.org/...`. External links stay absolute.
Emails as `mailto:`, phones as `tel:+15615016615`.

### Images

`{ "src": "<original URL>", "alt": "describe the photo", "caption": "optional" }`

Always use the **full-size original** URL from the old site — strip WordPress size suffixes like
`-300x200`, `-1024x683`, `-768x432` from the filename (keep `-scaled` and `-e1781285130327` style suffixes).
The build downloads and optimizes every image automatically. Write real alt text when the old site had none.

Posters, flyers and logos are shown whole instead of being cropped into a frame. PNG, GIF and SVG files are
treated this way automatically; for a JPG poster add `"graphic": true` to the image. Images can also carry an
`"href"` (for example the photo's Flickr page), which is shown as a small link on the photo.

### Actions (buttons)

`{ "label": "Apply to Seedlings", "href": "/seedlings/pre-application/", "style": "primary" | "secondary" | "link" }`

## Hero

```json
"hero": {
  "variant": "image" | "split" | "simple",
  "title": "Seedlings Nature Preschool",
  "lead": "One or two sentences that tell a parent what this page is.",
  "image": { "src": "…", "alt": "…" },
  "facts": [ { "label": "Ages", "value": "3–6 years" } ],
  "actions": [ … ]
}
```

- `image` — full-bleed photo with the title over it. Use for pages with a strong photo.
- `split` — title/lead on the left, photo on the right.
- `simple` — no photo (policies, privacy, forms).
- `facts` (optional) — 2–4 key facts shown as a strip (ages, schedule, location, cost). Only real facts from the page.

## Section types

Every section has `"type"` and may have an `"id"` (for anchor links, e.g. `"id": "section-respect"`).
`heading` is always optional plain text; `intro` is optional rich text shown under the heading.

| type | fields | use for |
|---|---|---|
| `prose` | `heading`, `html` | Paragraphs of text. |
| `split` | `heading`, `html`, `image`, `reverse` (bool), `actions` | Text beside a photo. Alternate `reverse` for rhythm. |
| `gallery` | `heading`, `intro`, `images[]` | 3+ photos. Rendered as a mosaic with lightbox. |
| `video` | `heading`, `intro`, `videos[]` → `{ "youtube": "VIDEO_ID", "title": "…" }` | YouTube videos (ID only). |
| `embed` | `heading`, `intro`, `src`, `title`, `ratio` (`"16/9"`, `"4/3"`, `"1/1"`, `"tall"`) | Google Calendar, Canva, Google Slides, SoundCloud, JotForm, Eventbrite iframes. |
| `cards` | `heading`, `intro`, `items[]` → `{ "title", "html", "image"?, "href"?, "meta"? }` | Programs, events, related pages. `meta` is a short line like "Ages 3–6". |
| `features` | `heading`, `intro`, `items[]` → `{ "title", "html" }` | 2–6 short points without photos (values, benefits). |
| `steps` | `heading`, `intro`, `items[]` → `{ "title", "html" }` | Only for a real sequence (how to apply, enrollment process). |
| `facts` | `heading`, `items[]` → `{ "label", "value" }` | Schedules, tuition, hours, ages. |
| `table` | `heading`, `intro`, `rows[][]` (first row is the header) | Tabular data (tuition tables, schedules). |
| `accordion` | `heading`, `intro`, `items[]` → `{ "title", "html" }` | FAQs, long policies, job descriptions. |
| `quote` | `html`, `cite` | Testimonials, quotations. |
| `people` | `heading`, `intro`, `items[]` → `{ "name", "role", "image"?, "html"? }` | Staff, teachers, board. |
| `logos` | `heading`, `intro`, `items[]` → `{ "src", "alt", "href"? }` | Sponsors, partners, award logos. |
| `cta` | `heading`, `html`, `actions`, `image`? | A call to action band (apply, donate, visit). |
| `form` | `heading`, `intro`, `ref` | An online form. `ref` is `"<old-page-slug>#<index>"` from `content/forms.json`. |
| `paypal` | `heading`, `intro`, `label`, `hidden` (object of the PayPal hidden inputs) | PayPal payment buttons, copied exactly. |
| `links` | `heading`, `intro`, `items[]` → `{ "label", "href", "meta"? }` | Lists of links (annual reports, resources, documents/PDFs). |
| `posts` | `heading`, `category`?, `limit` | Auto list of blog posts. |

## Rules for converting old pages

1. **Remove nothing.** Every sentence, link, email, phone number, address, image, video and embed on the old
   page must appear in the new page. If unsure where something goes, put it in a `prose` section.
2. Light copy polish only: fix typos, grammar, broken punctuation, inconsistent capitalization, and run-on
   sentences. Keep the voice and meaning. Don't invent facts, prices, dates or programs.
3. Drop only WordPress chrome: theme markup comments, cookie notice, search boxes, "Designed by Elegant Themes".
4. Headings are sentence case.
