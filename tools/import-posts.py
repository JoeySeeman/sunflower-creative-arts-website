"""One-time importer: old WordPress blog posts -> content/posts/<slug>.json

Usage: python tools/import-posts.py <dir of saved post .html files> content/posts
Needs beautifulsoup4 + lxml.
"""
import json, re, sys, pathlib
from bs4 import BeautifulSoup, NavigableString, Tag

ALLOWED = {"p", "a", "strong", "em", "b", "i", "h2", "h3", "h4", "ul", "ol", "li", "blockquote", "img", "figure",
           "figcaption", "iframe", "br", "table", "thead", "tbody", "tr", "td", "th", "hr"}
SIZE = re.compile(r"-\d{2,4}x\d{2,4}(?=\.(jpe?g|png|gif|webp)$)", re.I)


def img_src(img):
    src = img.get("data-lazy-src") or img.get("data-src") or img.get("src") or ""
    if src.startswith("data:"):
        src = ""
    return SIZE.sub("", src)


def clean(node):
    for bad in node.find_all(["script", "style", "noscript", "form", "ins"]):
        bad.decompose()
    for yt in node.find_all(class_="rll-youtube-player"):
        f = BeautifulSoup(f'<iframe src="https://www.youtube.com/embed/{yt.get("data-id")}"></iframe>', "lxml").iframe
        yt.replace_with(f)
    for el in list(node.find_all(True)):
        if el.name not in ALLOWED:
            el.unwrap()
            continue
        keep = {}
        if el.name == "a" and el.get("href"):
            keep["href"] = el["href"]
        if el.name == "img":
            keep["src"] = img_src(el)
            keep["alt"] = el.get("alt", "")
            if not keep["src"]:
                el.decompose(); continue
        if el.name == "iframe":
            keep["src"] = el.get("data-lazy-src") or el.get("data-src") or el.get("src")
        el.attrs = keep
    html = str(node)
    html = re.sub(r"^<div[^>]*>|</div>$", "", html.strip())
    html = re.sub(r"<p>\s*(&nbsp;| )?\s*</p>", "", html)
    html = re.sub(r"\n{2,}", "\n", html)
    return html.strip()


def main(src, out):
    out = pathlib.Path(out); out.mkdir(parents=True, exist_ok=True)
    n = 0
    for p in sorted(pathlib.Path(src).glob("*.html")):
        s = BeautifulSoup(p.read_text(errors="ignore"), "lxml")
        t = s.select_one("h1.entry-title")
        body = s.select_one(".post-content.entry-content") or s.select_one(".entry-content")
        if not t or not body:
            print("skip", p.name); continue
        meta = lambda prop: (s.find("meta", attrs={"property": prop}) or {}).get("content") if s.find("meta", attrs={"property": prop}) else None
        cats = [a.get_text(strip=True) for a in s.select('.post-meta a[rel="tag"]')]
        tags = [a.get_text(strip=True) for a in s.select('.post-tags a, .et-tags a')]
        author = s.select_one(".post-meta a[rel=author]")
        thumb = s.select_one(".post-thumbnail img")
        image = img_src(thumb) if thumb else (meta("og:image") or "")
        desc = (s.find("meta", attrs={"name": "description"}) or {}).get("content", "") if s.find("meta", attrs={"name": "description"}) else ""
        html = clean(body)
        text = re.sub(r"\s+", " ", BeautifulSoup(html, "lxml").get_text(" ")).strip()
        slug = p.stem
        d = {
            "slug": slug,
            "path": f"/{slug}/",
            "title": t.get_text(strip=True),
            "date": (meta("article:published_time") or "")[:10],
            "author": author.get_text(strip=True) if author else "Sunflower Creative Arts",
            "categories": cats,
            "tags": tags,
            "image": {"src": image, "alt": t.get_text(strip=True)} if image else None,
            "excerpt": desc or (text[:220].rsplit(" ", 1)[0] + "…" if len(text) > 220 else text),
            "html": html,
        }
        (out / f"{slug}.json").write_text(json.dumps(d, indent=1, ensure_ascii=False))
        n += 1
    print("imported", n)


if __name__ == "__main__":
    main(sys.argv[1], sys.argv[2])
