"""Public page sample; python crawl.py > crawl.json (requests, beautifulsoup4)."""
import concurrent.futures as futures
import json
import re
import xml.etree.ElementTree as ET
from urllib.parse import urljoin, urlsplit

import requests
from bs4 import BeautifulSoup

SITES = (
    "https://zipasports.com/", "https://www.jugglesports.com/",
    "https://www.shazbro.com/", "https://ahmyzimpex.com/",
    "https://deltacraft.biz/", "https://teamcoresportswear.org/",
)
KEY_PAGES = {
    "zipasports.com": ["/custom-sportswear/", "/private-label/", "/custom-sportswear-usa/", "/for-clubs/", "/sports-teamwear/football/football-match-jerseys/"],
    "jugglesports.com": ["/catalogue/", "/teamwear/ice-hockey/", "/teamwear/floorball/", "/request-a-quote/?item=1605", "/fi/"],
    "shazbro.com": ["/product-category/basketball-uniforms/", "/product-category/baseball-uniform/"],
    "ahmyzimpex.com": ["/robots.txt"],
    "teamcoresportswear.org": ["/custom-uniforms", "/private-label", "/categories/soccer", "/categories/basketball", "/categories/ice-hockey"],
}
UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/131.0.0.0 Safari/537.36"


def fetch(url):
    try:
        return requests.get(url, headers={"User-Agent": UA}, timeout=12)
    except requests.RequestException:
        return None


def host(url):
    return (urlsplit(url).hostname or "").removeprefix("www.")


def clean(s):
    return " ".join(s.split())[:250]


def desc(el):
    return clean(el.get_text(" ", strip=True)) if el else ""


def crawl_page(url):
    res = fetch(url)
    if res is None:
        return {"requested": url, "error": "request failed"}, []
    soup = BeautifulSoup(res.content, "html.parser")
    anchors = [(desc(a) or (a.get("title") or a.get("aria-label") or ""), urljoin(res.url, a["href"])) for a in soup.select("a[href]")]
    raw_links = [(label, link.split("#")[0]) for label, link in anchors]
    inner = list(dict.fromkeys((label, link) for label, link in raw_links if host(link) == host(res.url) and urlsplit(link).scheme in {"https", "http"}))
    outer = list(dict.fromkeys((label, link) for label, link in raw_links if host(link) != host(res.url) and (urlsplit(link).scheme in {"https", "http", "tel", "mailto", "whatsapp"})))
    meta = {}
    for m in soup.select("meta[name][content]"):
        if m["name"].lower() in {"description", "keywords", "robots", "viewport"}:
            meta[m["name"].lower()] = clean(m["content"])
    schema = set()
    def visit(value):
        if isinstance(value, dict):
            t = value.get("@type")
            if t:
                schema.update(t if isinstance(t, list) else [t])
            for v in value.values():
                visit(v)
        elif isinstance(value, list):
            for v in value:
                visit(v)
    invalid_jsonld = 0
    for s in soup.select('script[type="application/ld+json"]'):
        try:
            visit(json.loads(s.get_text()))
        except (ValueError, TypeError):
            invalid_jsonld += 1
    for s in soup.select("[itemtype]"):
        schema.update(v.rsplit("/", 1)[-1] for v in s["itemtype"].split())
    for s in soup.select("[typeof]"):
        schema.update(s["typeof"].split())
    imgs = soup.select("img")
    canonical = soup.select_one('link[rel="canonical"]')
    forms = [{"action": urljoin(res.url, f.get("action", "")), "method": f.get("method", "get"),
              "labels": [desc(label) for label in f.select("label") if desc(label)][:12],
              "fields": [i.get("name") for i in f.select("input[name],select[name],textarea[name]") if i.get("type") != "hidden"][:16],
              "file_upload": bool(f.select_one('input[type="file"]'))} for f in soup.select("form")][:8]
    return {
        "requested": url, "url": res.url, "status": res.status_code, "type": res.headers.get("content-type"),
        "bytes_decoded": len(res.content), "x_robots_tag": res.headers.get("X-Robots-Tag"), "title": desc(soup.title),
        "meta": meta, "canonical": canonical.get("href") if canonical else None, "h1": [desc(i) for i in soup.select("h1")],
        "h2": [desc(i) for i in soup.select("h2")][:12], "structured_data_types": sorted(schema), "invalid_jsonld": invalid_jsonld,
        "hreflang": [{"locale": t["hreflang"], "url": t.get("href")} for t in soup.select('link[rel="alternate"][hreflang]')],
        "images": {"count": len(imgs), "missing_alt_attribute": sum(not i.has_attr("alt") for i in imgs),
                   "empty_or_missing_alt": sum(not i.get("alt","").strip() for i in imgs), "loading_lazy": sum(i.get("loading")=="lazy" for i in imgs)},
        "forms": forms, "outbound": outer[:45], "internal_unique_urls": len({url for _, url in inner}),
        "action_labels": list(dict.fromkeys([l for l, _ in anchors if re.search(r"quote|sample|contact|inquir|order|checkout|cart|shop|catalog|whatsapp|design|customiz", l, re.I)] + [desc(b) for b in soup.select("button")]))[:35],
    }, inner


def sitemap(url):
    res = fetch(url)
    if res is None:
        return {"requested": url, "error": "request failed"}, []
    try:
        xml = ET.fromstring(res.content)
        kind = xml.tag.split("}")[-1]
        locs = [el.text for el in xml.findall("./*/{*}loc") if el.text]
    except ET.ParseError:
        kind, locs = None, []
    return {"requested": url, "final": res.url, "status": res.status_code, "kind": kind, "locations": len(locs), "sample": locs[:10]}, locs


def site(url):
    home, links = crawl_page(url)
    base = home.get("url", url)
    robots = fetch(urljoin(base, "/robots.txt"))
    directives = (robots.content.decode("utf-8", errors="replace")[:3500] if robots is not None and robots.ok and not robots.content.lstrip().startswith(b"<") else "")
    declared = re.findall(r"^sitemap:\s*(\S+)", directives, re.I | re.M)
    candidates = list(dict.fromkeys(declared + [urljoin(base, "/sitemap.xml"), urljoin(base, "/sitemap_index.xml")]))
    candidates = [candidate for candidate in candidates if host(candidate) == host(base)]
    with futures.ThreadPoolExecutor(max_workers=5) as pool:
        maps = list(pool.map(sitemap, candidates))
        children = list(dict.fromkeys(child for item, locs in maps if item.get("kind") == "sitemapindex" for child in locs if host(child) == host(base)))
        maps += list(pool.map(sitemap, children[:12]))
        sample = []
        for pattern in (r"private.label|manufactur|wholesale|custom.uniform|custom.teamwear|sublimat", r"soccer|basketball|football|baseball|rugby", r"contact|request.*quote|inquiry", r"/product/|/products/.+|/detail|\.php\?[^#]+"):
            choices = [u for label, u in links if u != base and u not in sample and re.search(pattern, urlsplit(u).path + " " + label, re.I)]
            if choices:
                sample.append(choices[0])
        sample += [urljoin(base, p) for p in KEY_PAGES.get(host(base), [])]
        pages = [page for page, _ in pool.map(crawl_page, dict.fromkeys(sample))]
    return {"seed": url, "robots_status": robots.status_code if robots is not None else None,
            "robots_directives": directives, "sitemaps": [item for item, _ in maps], "home": home,
            "home_internal_link_sample": links[:140], "pages": pages}


if __name__ == "__main__":
    with futures.ThreadPoolExecutor(max_workers=len(SITES)) as pool:
        print(json.dumps(list(pool.map(site, SITES)), ensure_ascii=True, indent=2))
