"""Дебаг-скрипт: открывает /en/slots и дампит структуру страницы."""

import time
import sys
from DrissionPage import ChromiumPage, ChromiumOptions

co = ChromiumOptions()
co.set_argument("--no-sandbox")
co.set_argument("--window-size=1920,1080")
co.set_argument("--disable-blink-features=AutomationControlled")

page = ChromiumPage(co)
try:
    page.get("https://melbet-583603.pro/en/slots")
    time.sleep(5)

    for i in range(8):
        page.scroll.down(600)
        time.sleep(1)
        print(f"Scroll {i+1}/8", file=sys.stderr)

    time.sleep(3)

    print("\n=== SEARCH: elements with 'somalia' or 'best in' ===")
    for tag in ("h1", "h2", "h3", "h4", "h5", "div", "span", "p", "a"):
        els = page.eles(f"css:{tag}")
        for el in els:
            txt = (el.text or "").strip()
            if txt and ("somalia" in txt.lower() or "best in" in txt.lower()):
                print(f"  <{tag}> text={txt[:120]!r}  class={el.attr('class')!r}")

    print("\n=== ALL HEADINGS (h1-h4) ===")
    for tag in ("h1", "h2", "h3", "h4"):
        for el in page.eles(f"css:{tag}"):
            txt = (el.text or "").strip()
            if txt:
                print(f"  <{tag}> {txt[:100]!r}")

    print("\n=== FIRST 10 slot links ===")
    links = page.eles("css:a[href*='/slots/']")
    for el in links[:10]:
        href = el.attr("href") or ""
        txt = (el.text or "").strip()[:80]
        cls = el.attr("class") or ""
        print(f"  href={href!r}  text={txt!r}  class={cls[:60]!r}")

    print("\n=== DIVs/SPANs with short text (potential section titles) ===")
    seen = set()
    for el in page.eles("css:div, span"):
        txt = (el.text or "").strip()
        if 3 < len(txt) < 50 and txt not in seen and not txt.isdigit():
            children_text_len = sum(len((c.text or "").strip()) for c in el.eles("css:*"))
            if children_text_len < len(txt) + 10:
                cls = el.attr("class") or ""
                seen.add(txt)
                if len(seen) > 60:
                    break
                print(f"  text={txt!r}  tag={el.tag}  class={cls[:60]!r}")

finally:
    page.quit()
