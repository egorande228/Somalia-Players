"""
Парсер stake.com — извлекает топ-3 спорта и топ-3 игры казино
с главной страницы (секции Trending Games и Trending Sports).

Установка:
    pip install DrissionPage

Запуск:
    python parse_stake.py
    python parse_stake.py --xvfb   # для серверов без дисплея (GitHub Actions)
"""

import json
import re
import sys
import time
import argparse
from DrissionPage import ChromiumPage, ChromiumOptions


CF_MARKERS = ("момент", "moment", "just a moment", "checking")
WAIT_CF_MAX = 60
WAIT_CF_POLL = 2


def make_options(headless: bool = False) -> ChromiumOptions:
    co = ChromiumOptions()
    co.set_argument("--no-sandbox")
    co.set_argument("--window-size=1920,1080")
    co.set_argument("--disable-blink-features=AutomationControlled")
    if headless:
        co.set_argument("--headless=new")
    return co


def wait_for_cf(page: ChromiumPage, timeout: int = WAIT_CF_MAX) -> bool:
    """Ждёт прохождения Cloudflare challenge. Возвращает True если прошёл."""
    deadline = time.time() + timeout
    while time.time() < deadline:
        title = (page.title or "").lower()
        if not any(m in title for m in CF_MARKERS):
            return True
        time.sleep(WAIT_CF_POLL)
    return False


def parse_home(page: ChromiumPage, top_n: int = 3) -> dict:
    """Парсит главную страницу stake.com — секции Trending Games и Trending Sports."""
    page.get("https://stake.com/")
    if not wait_for_cf(page):
        raise RuntimeError("Не удалось пройти Cloudflare")

    time.sleep(3)
    # Скроллим чтобы подгрузить секции
    page.scroll.down(800)
    time.sleep(2)

    # --- Trending Games (casino) ---
    casino_links = page.eles("css:a[href*='/casino/games/']")
    seen_casino: set[str] = set()
    games: list[dict] = []

    skip_names = {"Play Now", "Play Now!", "Only on Stake", "Read More", ""}
    for el in casino_links:
        href = el.attr("href") or ""
        slug = href.split("/casino/games/")[-1] if "/casino/games/" in href else ""
        if not slug or slug in seen_casino:
            continue

        lines = [l.strip() for l in el.text.strip().split("\n") if l.strip()]
        name = ""
        for line in lines:
            if line not in skip_names:
                name = line
                break
        if not name:
            continue

        # Извлекаем URL картинки
        img_url = ""
        imgs = el.eles("css:img")
        for img in imgs:
            src = img.attr("src") or ""
            if src and "imgix.net" in src:
                img_url = src
                break

        seen_casino.add(slug)
        games.append({"name": name, "slug": slug, "image": img_url})
        if len(games) >= top_n:
            break

    # --- Trending Sports ---
    sport_links = page.eles("css:a[href*='/sports/']")
    skip_slugs = {
        "home", "live", "upcoming", "my-bets", "favourites", "esports",
    }
    seen_sports: set[str] = set()
    sports: list[dict] = []

    for el in sport_links:
        href = el.attr("href") or ""
        match = re.search(r"/sports/([a-z0-9-]+)$", href)
        if not match:
            continue
        slug = match.group(1)
        if slug in skip_slugs or slug in seen_sports:
            continue

        text = el.text.strip()
        if not text or len(text) > 40:
            continue

        img_url = ""
        imgs = el.eles("css:img")
        for img in imgs:
            src = img.attr("src") or ""
            if src and "imgix.net" in src:
                img_url = src
                break

        seen_sports.add(slug)
        sports.append({"name": text, "slug": slug, "image": img_url})
        if len(sports) >= top_n:
            break

    return {"sports": sports, "casino": games}


def main() -> None:
    parser = argparse.ArgumentParser(description="Parse stake.com sports & casino")
    parser.add_argument(
        "--headless", action="store_true",
        help="Запустить в headless режиме (может не пройти Cloudflare)",
    )
    parser.add_argument(
        "--xvfb", action="store_true",
        help="Запустить headful через Xvfb (для серверов без дисплея)",
    )
    parser.add_argument(
        "--top", type=int, default=3,
        help="Количество элементов в каждой категории (по умолчанию 3)",
    )
    parser.add_argument(
        "-o", "--output", default="result.json",
        help="Путь для сохранения JSON (по умолчанию result.json)",
    )
    args = parser.parse_args()

    if args.xvfb:
        try:
            from xvfbwrapper import Xvfb
            vdisplay = Xvfb(width=1920, height=1080)
            vdisplay.start()
        except ImportError:
            print(
                "Для --xvfb установите: pip install xvfbwrapper",
                file=sys.stderr,
            )
            sys.exit(1)

    co = make_options(headless=args.headless)
    page = ChromiumPage(co)

    try:
        result = parse_home(page, top_n=args.top)
        output = json.dumps(result, ensure_ascii=False, indent=2)
        print(output)

        out_path = args.output
        with open(out_path, "w", encoding="utf-8") as f:
            f.write(output + "\n")
        print(f"Saved to {out_path}", file=sys.stderr)
    finally:
        page.quit()
        if args.xvfb:
            vdisplay.stop()


if __name__ == "__main__":
    main()
