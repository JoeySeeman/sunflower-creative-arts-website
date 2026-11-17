"""One-time importer for secondary pages: crawled block dumps -> content/pages/<slug>.json

Usage: python tools/import-pages.py <crawl/pages dir> <content dir> slug [slug ...]
Pages converted here keep every block of the old page, grouped into the section types in docs/CONTENT.md.
Pages that were hand-structured are not passed in.
"""
import json, re, sys, pathlib, html as H
from urllib.parse import urlparse

SIZE = re.compile(r"-\d{2,4}x\d{2,4}(?=\.(jpe?g|png|gif|webp)$)", re.I)
CHROME = re.compile(r"^(Header|Main Header.*|#top-header.*|/\.container|Secondary Nav.*|\.et-extra-social.*|/#main-header|We use cookies.*|© Copyright.*|Share This|Follow|Sunflower Creative Arts)$")
GLOBAL_BG = {"https://sunflowercreativearts.org/wp-content/uploads/2025/01/51745436584_420819be42_o.jpg"}
CHROME_HREF = re.compile(r"(sharer\.php|twitter\.com/share|facebook\.com/SunflowerCreativeArts|instagram\.com/sunflowercreativearts|twitter\.com/sunflowerarts|youtube\.com/(channel/UC1DmHjBq86M91aB5ygyBC8Q|user/SunflowerArts)|civicrm/contribute/transact\?reset=1&id=1$|buildandplay\.org/?$|/programs/pay-invoice/$)", re.I)


def chrome_list(items):
    """True for header utility menus, social follow widgets and share buttons."""
    for i in items:
        links = re.findall(r'href="([^"]+)"', i)
        if not links or not all(CHROME_HREF.search(l) for l in links):
            return False
    return True
SECTION_NAV = {"donate": "support", "annual": "support", "project": "support", "seedlings": "programs",
               "programs": "programs", "summer": "programs", "happenings": "events", "events": "events",
               "blog": "blog", "jobs": "about", "about": "about", "sponsors": "support"}


def path_of(slug):
    return "/" + slug.replace("__", "/") + "/"


def yt_id(src):
    m = re.search(r"youtube\.com/embed/([A-Za-z0-9_-]+)", src or "")
    return m.group(1) if m else None


def text_of(h):
    return re.sub(r"\s+", " ", re.sub(r"<[^>]+>", " ", H.unescape(h or ""))).strip()


def convert(slug, d, forms):
    title = re.split(r"\s+[|\-–]\s+", d["title"])[0].strip() or slug
    sections, prose, imgs, actions = [], [], [], []
    seen_text, seen_img = set(), set()
    form_list = [f for f in forms.get(slug, []) if f["kind"] != "paypal"]
    paypal_list = [f for f in forms.get(slug, []) if f["kind"] == "paypal"]
    fi = pi = 0
    first_h1 = None
    pending_links = []

    def flush_prose():
        nonlocal prose
        if not prose:
            return
        heading = None
        if prose and prose[0].startswith("<h2>") and "<a " not in prose[0]:
            heading = text_of(prose.pop(0))
        if prose or heading:
            sections.append({"type": "prose", "heading": heading, "html": "\n".join(prose)})
        prose = []

    def flush_imgs():
        nonlocal imgs
        if not imgs:
            return
        if len(imgs) == 1:
            sections.append({"type": "figure", "image": imgs[0]})
        else:
            sections.append({"type": "gallery", "images": imgs})
        imgs = []

    def flush_actions():
        nonlocal actions
        if actions:
            sections.append({"type": "buttons", "actions": actions})
            actions = []

    def flush_all():
        flush_prose(); flush_imgs(); flush_actions()

    for b in d["blocks"]:
        t = b["t"]
        if t in ("p", "quote", "toggle") and CHROME.match(text_of(b["html"])):
            continue
        if t in ("h1", "h2", "h3", "h4", "h5", "h6", "p", "quote", "toggle", "ul", "ol", "table"):
            flush_imgs(); flush_actions()
            if t in ("ul", "ol"):
                key = "|".join(b["items"])
                if key in seen_text or not b["items"] or chrome_list(b["items"]):
                    continue
                seen_text.add(key)
                prose.append(f"<{t}>" + "".join(f"<li>{i}</li>" for i in b["items"]) + f"</{t}>")
                continue
            if t == "table":
                flush_prose()
                sections.append({"type": "table", "rows": b["rows"]})
                continue
            h = b["html"].strip()
            tx = text_of(h)
            if not tx:
                # a paragraph that only wraps an image link: give the link to the image that follows
                pending_links.extend(re.findall(r'href="([^"]+)"', h))
                continue
            if tx in seen_text:
                continue
            seen_text.add(tx)
            if t == "h1" and first_h1 is None:
                first_h1 = tx
                if tx.lower() == title.lower():
                    continue
            if t in ("h1", "h2"):
                flush_prose()
                prose.append(f"<h2>{h if '<a ' in h else H.escape(tx)}</h2>")
            elif t in ("h3", "toggle"):
                prose.append(f"<h3>{h}</h3>")
            elif t in ("h4", "h5", "h6"):
                prose.append(f"<h4>{h}</h4>")
            elif t == "quote":
                prose.append(f"<blockquote><p>{h}</p></blockquote>")
            else:
                prose.append(f"<p>{h}</p>")
        elif t == "img":
            src = SIZE.sub("", b.get("src") or "")
            if not src or src in seen_img or "paypal" in src or "dabuttonfactory" in src:
                continue
            seen_img.add(src)
            flush_prose(); flush_actions()
            im = {"src": src, "alt": b.get("alt") or ""}
            if pending_links:
                im["href"] = pending_links.pop(0)
            imgs.append(im)
        elif t == "iframe":
            src = b.get("src") or ""
            if not src or src == "about:blank" or "googletagmanager" in src:
                continue
            flush_all()
            y = yt_id(src)
            if y:
                if sections and sections[-1]["type"] == "video":
                    if y not in [v["youtube"] for v in sections[-1]["videos"]]:
                        sections[-1]["videos"].append({"youtube": y, "title": title})
                else:
                    sections.append({"type": "video", "videos": [{"youtube": y, "title": title}]})
            else:
                ratio = "4/3" if "calendar" in src else "16/9"
                if "soundcloud" in src: ratio = "soundcloud"
                if "jotform" in src or "eventbrite" in src: ratio = "tall"
                sections.append({"type": "embed", "src": src, "title": title, "ratio": ratio})
        elif t == "video":
            flush_all()
            sections.append({"type": "html5video", "src": [s for s in b["src"] if s], "poster": b.get("poster")})
        elif t == "button":
            flush_prose(); flush_imgs()
            href = b.get("href") or ""
            if b.get("text"):
                actions.append({"label": b["text"], "href": href, "style": "primary" if not actions else "secondary"})
        elif t == "form":
            labels = b.get("labels") or []
            if any("Search" in l for l in labels) or (not labels and "sunflowercreativearts.org/" == (b.get("action") or "")[-len("sunflowercreativearts.org/"):]):
                continue
            if "paypal" in (b.get("action") or ""):
                if pi < len(paypal_list):
                    flush_all()
                    pp = paypal_list[pi]; pi += 1
                    sections.append({"type": "paypal", "label": pp.get("button_alt") and "Pay with PayPal" or "Pay with PayPal", "hidden": pp["hidden"], "ref": f"{slug}#{forms[slug].index(pp)}"})
                continue
            if fi < len(form_list):
                flush_all()
                f = form_list[fi]; fi += 1
                sections.append({"type": "form", "heading": f.get("title") or None, "ref": f"{slug}#{forms[slug].index(f)}"})
    flush_all()
    # background photos that are not already shown: first one becomes the hero photo
    bgs = []
    for bg in d.get("bg", []):
        bg = SIZE.sub("", bg)
        if "wp-content/uploads" in bg and bg not in seen_img and bg not in GLOBAL_BG:
            seen_img.add(bg)
            bgs.append({"src": bg, "alt": title})
    sections = [x for x in sections if not (x["type"] == "prose" and not x.get("heading") and not x["html"].strip())]
    hero = {"variant": "simple", "title": title}
    if bgs:
        hero = {"variant": "image", "title": title, "image": bgs.pop(0)}
        for b in bgs:
            sections.append({"type": "figure", "image": b})
    elif sections and sections[0]["type"] == "figure":
        hero = {"variant": "split", "title": title, "image": sections.pop(0)["image"]}
    if d.get("desc"):
        hero["lead"] = d["desc"]
    nav = None
    for k, v in SECTION_NAV.items():
        if slug.startswith(k):
            nav = v; break
    return {"path": path_of(slug), "title": title, "nav": nav, "legacy": True,
            "seo": {"title": d["title"], "description": d.get("desc", "")},
            "hero": hero, "sections": sections}


if __name__ == "__main__":
    src = pathlib.Path(sys.argv[1]); out = pathlib.Path(sys.argv[2])
    forms = json.loads((out / "forms.json").read_text())
    for slug in sys.argv[3:]:
        d = json.loads((src / f"{slug}.json").read_text())
        if d.get("status") != 200:
            print("skip", slug, d.get("status")); continue
        page = convert(slug, d, forms)
        (out / "pages" / f"{slug}.json").write_text(json.dumps(page, indent=1, ensure_ascii=False))
        print(f"{slug:55} {len(page['sections']):3} sections")
