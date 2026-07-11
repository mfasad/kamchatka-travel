from html.parser import HTMLParser
from pathlib import Path
import re
from urllib.parse import urlsplit


class LinkParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.links = []
        self.title = False
        self.has_title = False

    def handle_starttag(self, tag, attrs):
        values = dict(attrs)
        if tag == "a" and values.get("href"):
            self.links.append(values["href"])
        if tag == "title":
            self.title = True

    def handle_data(self, data):
        if self.title and data.strip():
            self.has_title = True

    def handle_endtag(self, tag):
        if tag == "title":
            self.title = False


root = Path(__file__).resolve().parents[1] / "dist"
html_files = [
    html_file
    for html_file in root.rglob("*.html")
    if not html_file.name.startswith("yandex_")
]
missing = []
untitled = []
image_errors = []

for html_file in html_files:
    parser = LinkParser()
    source = html_file.read_text(encoding="utf-8")
    parser.feed(source)
    if not parser.has_title:
        untitled.append(str(html_file.relative_to(root)))
    for href in parser.links:
        parsed = urlsplit(href)
        if parsed.scheme or not parsed.path.startswith("/"):
            continue
        path = parsed.path.lstrip("/")
        candidates = [root / path, root / path / "index.html"]
        if not any(candidate.is_file() for candidate in candidates):
            missing.append((str(html_file.relative_to(root)), parsed.path))

    if html_file.name == "index.html" and html_file != root / "index.html":
        hero = re.search(r"--page-hero-image:\s*url\('([^']+)'\)", source)
        cards = re.findall(r'class="card-image"\s+src="([^"]+)"', source)
        if not hero:
            image_errors.append((str(html_file.relative_to(root)), "missing hero image"))
        else:
            hero_path = hero.group(1)
            if not (root / hero_path.lstrip("/")).is_file():
                image_errors.append((str(html_file.relative_to(root)), f"missing file {hero_path}"))
            if hero_path in cards:
                image_errors.append((str(html_file.relative_to(root)), "hero repeated in related cards"))
        if len(cards) != len(set(cards)):
            image_errors.append((str(html_file.relative_to(root)), "duplicate related-card images"))
        for card_path in cards:
            if not (root / card_path.lstrip("/")).is_file():
                image_errors.append((str(html_file.relative_to(root)), f"missing file {card_path}"))

print(f"HTML pages: {len(html_files)}")
print(f"Missing internal links: {len(missing)}")
print(f"Pages without title: {len(untitled)}")
print(f"Image errors: {len(image_errors)}")
if missing:
    print(missing[:20])
if untitled:
    print(untitled)
if image_errors:
    print(image_errors)
raise SystemExit(1 if missing or untitled or image_errors else 0)
