"""
Обновляет первые 3 элемента массивов games и sports в js/site-data.js
на основе result.json из parse_melbet.py.
Статический хвост карточек остаётся нетронутым.
"""

import json
import re
import subprocess
import sys
from datetime import date
from pathlib import Path

SITE_DIR = Path(__file__).parent
SITE_DATA_PATH = SITE_DIR / "js" / "site-data.js"
IMAGES_DIR = SITE_DIR / "images"
RESULT_PATH = Path(__file__).parent / "result.json"

# Английский → Сомалийский для спортов
SPORT_SO: dict[str, str] = {
    "Football": "Kubadda cagta",
    "Soccer": "Kubadda cagta",
    "Tennis": "Tennis",
    "Basketball": "Kubadda koleyga",
    "Volleyball": "Kubadda laliska",
    "Cricket": "Kriket",
    "Baseball": "Baseball",
    "Ice Hockey": "Hockey barafka",
    "Dota 2": "Dota 2",
    "Counter Strike": "Counter Strike",
    "CS2": "CS2",
    "League of Legends": "League of Legends",
    "MMA": "MMA",
    "Boxing": "Feeranka",
    "Rugby": "Rugby",
    "Golf": "Golf",
    "Formula 1": "Formula 1",
    "Table Tennis": "Tenis miiska",
    "Handball": "Kubadda gacanta",
    "American Football": "Kubadda Maraykanka",
    "Aussie Rules": "Xeerka Aussie",
    "Darts": "Darts",
    "Snooker": "Snooker",
    "Futsal": "Futsal",
    "Cycling": "Baaskiilka",
    "Badminton": "Badminton",
    "Squash": "Squash",
    "Waterpolo": "Polo biyaha",
    "Valorant": "Valorant",
    "Racing": "Tartanka",
}

MELBET_BASE_URL = "https://melbet-583603.pro"

SPORT_IMAGE_FALLBACK: dict[str, str] = {
    "football":    "./images/sport-football-melbet.png",
    "soccer":      "./images/sport-football-melbet.png",
    "tennis":      "./images/sport-tennis-melbet.png",
    "basketball":  "./images/sport-basketball-melbet.png",
    "volleyball":  "./images/sport-volleyball-melbet.png",
    "cricket":     "./images/sport-cricket-melbet.png",
    "hockey":      "./images/sport-hockey-melbet.png",
    "table-tennis": "./images/sport-table-tennis-melbet.png",
    "e-sport":     "./images/sport-esport-melbet.png",
}


def sport_to_somali(name: str) -> str:
    return SPORT_SO.get(name, name)


def download_image(url: str, filename: str) -> str:
    """Скачивает картинку в IMAGES_DIR через curl, возвращает относительный путь."""
    if not url:
        return ""
    IMAGES_DIR.mkdir(exist_ok=True)

    # Запрашиваем картинку в большем разрешении
    url = re.sub(r"[?&]w=\d+", lambda m: m.group(0)[0] + "w=600", url)
    url = re.sub(r"[?&]h=\d+", lambda m: m.group(0)[0] + "h=800", url)

    if ".png" in url:
        ext = ".png"
    elif ".webp" in url:
        ext = ".webp"
    else:
        ext = ".jpg"
    filepath = IMAGES_DIR / f"{filename}{ext}"
    rel_path = f"./images/{filename}{ext}"

    try:
        subprocess.run(
            ["curl", "-sL", "-o", str(filepath), url],
            timeout=30, check=True,
        )
        if filepath.stat().st_size > 0:
            print(f"  Downloaded {rel_path}", file=sys.stderr)
        else:
            filepath.unlink(missing_ok=True)
            return ""
    except Exception as e:
        print(f"  WARNING: failed to download {url}: {e}", file=sys.stderr)
        return ""

    return rel_path


def make_game_entry(item: dict) -> str:
    name = item["name"]
    slug = item["slug"]
    img_path = download_image(item.get("image", ""), f"game-{slug}")
    return (
        "      {\n"
        f'        key: "{slug}",\n'
        f'        title: {{ en: "{name}", so: "{name}" }},\n'
        f'        meta: {{ en: "Live top game on Melbet", so: "Ciyaarta sare ee tooska ah ee Melbet" }},\n'
        f'        players: "Trend",\n'
        f'        href: "{MELBET_BASE_URL}/en/casino",\n'
        f'        image: "{img_path}"\n'
        "      }"
    )


def make_sport_entry(item: dict) -> str:
    name = item["name"]
    slug = item["slug"]
    so_name = sport_to_somali(name)
    img_path = download_image(item.get("image", ""), f"sport-{slug}")
    if not img_path:
        img_path = SPORT_IMAGE_FALLBACK.get(slug, "")
    return (
        "      {\n"
        f'        key: "{slug}",\n'
        f'        title: {{ en: "{name}", so: "{so_name}" }},\n'
        f'        meta: {{ en: "Live top sport on Melbet", so: "Sport-ka sare ee tooska ah ee Melbet" }},\n'
        f'        players: "Trend",\n'
        f'        href: "{MELBET_BASE_URL}/en/live",\n'
        f'        image: "{img_path}"\n'
        "      }"
    )


def find_nth_object_end(body: str, n: int) -> int:
    """Находит позицию конца N-го объекта верхнего уровня (после закрывающей })."""
    count = 0
    depth = 0
    for i, ch in enumerate(body):
        if ch == "{":
            depth += 1
        elif ch == "}":
            depth -= 1
            if depth == 0:
                count += 1
                if count == n:
                    # Пропускаем только запятую после }, сохраняем \n и пробелы
                    j = i + 1
                    while j < len(body) and body[j] in " \t":
                        j += 1
                    if j < len(body) and body[j] == ",":
                        j += 1
                    # Пропускаем \n после запятой
                    if j < len(body) and body[j] == "\n":
                        j += 1
                    return j
    return len(body)


def replace_first_n(js: str, array_name: str, new_entries: list[str], n: int) -> str:
    """Заменяет первые N элементов массива, остальные оставляет как есть."""
    if n <= 0 or not new_entries:
        return js

    pattern = rf"({array_name}:\s*\[)\s*\n(.*?)\n(\s*\])"
    m = re.search(pattern, js, flags=re.DOTALL)
    if not m:
        print(f"WARNING: array '{array_name}' not found in site-data.js", file=sys.stderr)
        return js

    body = m.group(2)
    # Находим где кончаются первые N объектов
    cut = find_nth_object_end(body, n)
    tail = body[cut:]  # оставшиеся объекты — как есть

    new_head = ",\n".join(new_entries)
    if tail.strip():
        new_body = new_head + ",\n" + tail
    else:
        new_body = new_head

    return js[:m.start(2)] + new_body + js[m.end(2):]


def main() -> None:
    if not RESULT_PATH.exists():
        print(f"Error: {RESULT_PATH} not found. Run parse_melbet.py first.", file=sys.stderr)
        sys.exit(1)

    data = json.loads(RESULT_PATH.read_text(encoding="utf-8"))
    js = SITE_DATA_PATH.read_text(encoding="utf-8")

    game_items = data.get("casino", [])[:3]
    sport_items = data.get("sports", [])[:3]

    print("Downloading images...", file=sys.stderr)
    game_entries = [make_game_entry(item) for item in game_items]
    sport_entries = [make_sport_entry(item) for item in sport_items]

    js = replace_first_n(js, "games", game_entries, len(game_entries))
    js = replace_first_n(js, "sports", sport_entries, len(sport_entries))

    today = date.today().strftime("%Y%m%d")
    js = re.sub(r'assetVersion:\s*"[^"]*"', f'assetVersion: "{today}"', js)

    SITE_DATA_PATH.write_text(js, encoding="utf-8")
    print(f"Updated {SITE_DATA_PATH}", file=sys.stderr)


if __name__ == "__main__":
    main()
