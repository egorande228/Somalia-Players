"""
Парсер melbet-583603.pro — извлекает топ-N популярных слотов
и топ-N спортов (по количеству матчей) для Somalia.

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


BASE_URL = "https://melbet-583603.pro"
WAIT_PAGE_MAX = 30
WAIT_POLL = 1


def make_options(headless: bool = False, proxy: str = "") -> ChromiumOptions:
    co = ChromiumOptions()
    co.set_argument("--no-sandbox")
    co.set_argument("--window-size=1920,1080")
    co.set_argument("--disable-blink-features=AutomationControlled")
    if headless:
        co.set_argument("--headless=new")
    if proxy:
        co.set_argument(f"--proxy-server={proxy}")
    return co


def wait_for_element(page: ChromiumPage, css: str, timeout: int = WAIT_PAGE_MAX):
    """Ждёт появления элемента на странице."""
    deadline = time.time() + timeout
    while time.time() < deadline:
        el = page.ele(f"css:{css}", timeout=0)
        if el:
            return el
        time.sleep(WAIT_POLL)
    return None


def parse_sports(page: ChromiumPage, top_n: int = 3) -> list[dict]:
    """Парсит страницу /en/line — берёт топ-N спортов по количеству матчей."""
    page.get(f"{BASE_URL}/en/line")
    time.sleep(5)

    # Ищем ссылки вида /en/line/<sport>
    sport_links = page.eles("css:a[href*='/en/line/']")

    skip_slugs = {
        "line", "live", "results", "statistic", "esports",
        "multi", "champs", "top-events", "long-term-bets",
    }
    seen: set[str] = set()
    sports: list[dict] = []

    for el in sport_links:
        href = el.attr("href") or ""
        # Матчим только прямые ссылки на спорт: /en/line/<slug>
        match = re.search(r"/en/line/([a-z0-9_-]+)/?$", href, re.IGNORECASE)
        if not match:
            continue
        slug = match.group(1).lower()
        if slug in skip_slugs or slug in seen:
            continue

        text = el.text.strip()
        if not text:
            continue

        # Название спорта — первая строка без цифр (кол-во матчей)
        lines = [l.strip() for l in text.split("\n") if l.strip() and not l.strip().isdigit()]
        name = lines[0] if lines else text
        # Убираем trailing цифры из названия (например "Football 1159")
        name = re.sub(r"\s+\d+$", "", name)
        # Пропускаем если похоже на навигационный элемент
        if len(name) > 50:
            continue

        # Пробуем найти иконку/картинку
        img_url = ""
        imgs = el.eles("css:img")
        for img in imgs:
            src = img.attr("src") or ""
            if src and ("traincdn.com" in src or src.startswith("http")):
                img_url = src
                break
        # Также пробуем svg или background
        if not img_url:
            svgs = el.eles("css:svg")
            if svgs:
                img_url = ""  # SVG иконки — не скачиваем

        seen.add(slug)
        sports.append({"name": name, "slug": slug, "image": img_url})
        if len(sports) >= top_n:
            break

    return sports


def parse_casino(page: ChromiumPage, top_n: int = 3) -> list[dict]:
    """Парсит /en/slots — блок 'Best In Somalia', берёт первые N игр."""
    page.get(f"{BASE_URL}/en/slots")
    time.sleep(5)

    # Скроллим чтобы подгрузить все секции
    for _ in range(8):
        page.scroll.down(600)
        time.sleep(1)

    games: list[dict] = []
    seen: set[str] = set()

    # Находим секцию "Best In ..." / "Лучшее в ..." — div.casino-games-section
    # с заголовком, содержащим "best in" или "лучшее в"
    sections = page.eles("css:div.casino-games-section")
    section = None
    for sec in sections:
        header = sec.ele("css:h2.casino-games-section-header__title", timeout=0)
        if not header:
            continue
        title = (header.text or "").lower()
        if "best in" in title or "лучшее в" in title:
            section = sec
            print(f"  Found section: {header.text!r}", file=sys.stderr)
            break

    if not section:
        print("  WARNING: 'Best In ...' section not found", file=sys.stderr)
        return games

    # Карточки игр — img.ui-picture__img с alt (название) и src (картинка)
    imgs = section.eles("css:img.ui-picture__img")

    for img in imgs:
        alt = (img.attr("alt") or "").strip()
        src = (img.attr("src") or "").strip()
        if not alt:
            continue
        slug = re.sub(r"[^a-z0-9]+", "-", alt.lower()).strip("-")
        if slug in seen:
            continue

        seen.add(slug)
        games.append({"name": alt, "slug": slug, "image": src})
        if len(games) >= top_n:
            break

    return games


def main() -> None:
    parser = argparse.ArgumentParser(description="Parse melbet sports & casino")
    parser.add_argument(
        "--headless", action="store_true",
        help="Запустить в headless режиме",
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
    parser.add_argument(
        "--proxy", default="",
        help="Прокси-сервер (например socks5://ip:port или http://ip:port)",
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

    co = make_options(headless=args.headless, proxy=args.proxy)
    page = ChromiumPage(co)

    try:
        print("Parsing sports...", file=sys.stderr)
        sports = parse_sports(page, top_n=args.top)
        print(f"  Found {len(sports)} sports", file=sys.stderr)

        print("Parsing casino/slots...", file=sys.stderr)
        casino = parse_casino(page, top_n=args.top)
        print(f"  Found {len(casino)} games", file=sys.stderr)

        result = {"sports": sports, "casino": casino}
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
