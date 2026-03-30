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
import base64
import socket
import select
import socketserver
import requests
from DrissionPage import ChromiumPage, ChromiumOptions
from urllib.parse import urlparse


BASE_URL = "https://melbet-583603.pro"
WAIT_PAGE_MAX = 30
WAIT_POLL = 1
IP_CHECK_DELAY = 4
PAGE_LOAD_DELAY = 10
FIRST_PAGE_LOAD_DELAY = 15
SCROLL_DELAY = 2
SCROLL_STEPS = 10

# API для получения бесплатных прокси по стране
# Сомали + соседние страны (Джибути, Эфиопия, Кения, Йемен, Эритрея, Судан, Уганда, Танзания)
PROXY_COUNTRIES = ["so", "dj", "et", "ye", "er", "sd", "ug", "tz"]
PROXY_API_TPL = "https://api.proxyscrape.com/v4/free-proxy-list/get?request=display_proxies&country={country}&protocol=http&proxy_format=protocolipport&format=text&timeout=5000"
PROXY_API = "https://api.proxyscrape.com/v4/free-proxy-list/get?request=display_proxies&country=so&protocol=http&proxy_format=protocolipport&format=text&timeout=5000"


class ThreadingTCPServer(socketserver.ThreadingMixIn, socketserver.TCPServer):
    allow_reuse_address = True
    daemon_threads = True


class UpstreamProxyHandler(socketserver.StreamRequestHandler):
    """Локальный прокси-мост: браузер -> localhost -> Smartproxy."""

    def handle(self) -> None:
        first_line = self.rfile.readline().decode("utf-8", errors="ignore").strip()
        if not first_line:
            return

        parts = first_line.split()
        if len(parts) < 3:
            self.wfile.write(b"HTTP/1.1 400 Bad Request\r\n\r\n")
            return

        method, target, _ = parts
        headers = {}
        while True:
            line = self.rfile.readline().decode("utf-8", errors="ignore")
            if line in ("\r\n", "\n", ""):
                break
            if ":" in line:
                key, value = line.split(":", 1)
                headers[key.strip().lower()] = value.strip()

        if method.upper() == "CONNECT":
            self._handle_connect(target)
            return

        self._handle_http(method, target, headers)

    def _connect_upstream(self) -> socket.socket:
        upstream = socket.create_connection(
            (self.server.proxy_host, self.server.proxy_port), timeout=20
        )
        return upstream

    def _auth_header(self) -> str:
        raw = f"{self.server.proxy_username}:{self.server.proxy_password}".encode("utf-8")
        return base64.b64encode(raw).decode("ascii")

    def _handle_connect(self, target: str) -> None:
        upstream = self._connect_upstream()
        try:
            request = (
                f"CONNECT {target} HTTP/1.1\r\n"
                f"Host: {target}\r\n"
                f"Proxy-Authorization: Basic {self._auth_header()}\r\n"
                f"Proxy-Connection: Keep-Alive\r\n\r\n"
            ).encode("utf-8")
            upstream.sendall(request)
            response = self._recv_until_headers_end(upstream)
            if b" 200 " not in response.split(b"\r\n", 1)[0]:
                self.wfile.write(response)
                return

            self.wfile.write(b"HTTP/1.1 200 Connection established\r\n\r\n")
            self._tunnel(self.connection, upstream)
        finally:
            upstream.close()
    def parse_gh_quantites(self):
        pass

    def _handle_http(self, method: str, target: str, headers: dict) -> None:
        upstream = self._connect_upstream()
        try:
            body = b""
            content_length = int(headers.get("content-length", "0") or "0")
            if content_length:
                body = self.rfile.read(content_length)

            filtered_headers = []
            for key, value in headers.items():
                if key in {"proxy-authorization", "proxy-connection"}:
                    continue
                filtered_headers.append(f"{key}: {value}\r\n")

            request = (
                f"{method} {target} HTTP/1.1\r\n"
                + "".join(filtered_headers)
                + f"Proxy-Authorization: Basic {self._auth_header()}\r\n"
                + "Connection: close\r\n\r\n"
            ).encode("utf-8") + body

            upstream.sendall(request)
            while True:
                chunk = upstream.recv(65536)
                if not chunk:
                    break
                self.wfile.write(chunk)
        finally:
            upstream.close()

    def _recv_until_headers_end(self, sock: socket.socket) -> bytes:
        data = b""
        while b"\r\n\r\n" not in data:
            chunk = sock.recv(4096)
            if not chunk:
                break
            data += chunk
        return data

    def _tunnel(self, client: socket.socket, upstream: socket.socket) -> None:
        sockets = [client, upstream]
        while True:
            readable, _, errored = select.select(sockets, [], sockets, 30)
            if errored:
                break
            if not readable:
                break
            for src in readable:
                try:
                    data = src.recv(65536)
                except OSError:
                    return
                if not data:
                    return
                dst = upstream if src is client else client
                dst.sendall(data)


def start_local_proxy_bridge(proxy_cfg: dict) -> ThreadingTCPServer:
    """Поднимает локальный HTTP-прокси без авторизации, который ходит в upstream с логином."""
    server = ThreadingTCPServer(("127.0.0.1", 0), UpstreamProxyHandler)
    server.proxy_host = proxy_cfg["host"]
    server.proxy_port = int(proxy_cfg["port"])
    server.proxy_username = proxy_cfg["username"]
    server.proxy_password = proxy_cfg["password"]
    server.timeout = 1
    import threading
    thread = threading.Thread(target=server.serve_forever, daemon=True)
    thread.start()
    server.worker_thread = thread
    return server


def parse_proxy_string(proxy: str) -> dict:
    """Нормализует прокси в общий формат."""
    proxy = proxy.strip()
    if not proxy:
        return {}

    # Поддержка формата host:port:user:pass
    parts = proxy.split(":")
    if len(parts) == 4 and "://" not in proxy:
        host, port, username, password = parts
        return {
            "scheme": "http",
            "host": host,
            "port": port,
            "username": username,
            "password": password,
        }

    # Поддержка стандартного URL, например http://user:pass@host:port
    parsed = urlparse(proxy if "://" in proxy else f"http://{proxy}")
    if not parsed.hostname or not parsed.port:
        raise ValueError(
            "Некорректный формат прокси. Используйте host:port:user:pass "
            "или http://user:pass@host:port"
        )

    return {
        "scheme": parsed.scheme or "http",
        "host": parsed.hostname,
        "port": str(parsed.port),
        "username": parsed.username or "",
        "password": parsed.password or "",
    }


def fetch_somali_proxy() -> str:
    """Получает свежий бесплатный сомалийский HTTP-прокси."""
    try:
        resp = requests.get(PROXY_API, timeout=10)
        resp.raise_for_status()
        proxies = [line.strip() for line in resp.text.strip().splitlines() if line.strip()]
        if proxies:
            print(f"  Found {len(proxies)} Somali proxies, using: {proxies[0]}", file=sys.stderr)
            return proxies[0]
    except Exception as e:
        print(f"  WARNING: failed to fetch proxy list: {e}", file=sys.stderr)
    return ""


def make_options(headless: bool = False, proxy: str = "") -> tuple[ChromiumOptions, object]:
    co = ChromiumOptions()
    proxy_bridge = None
    co.set_argument("--no-sandbox")
    co.set_argument("--window-size=1920,1080")
    co.set_argument("--disable-blink-features=AutomationControlled")
    if headless:
        co.set_argument("--headless=new")
    if proxy:
        proxy_cfg = parse_proxy_string(proxy)
        proxy_server = (
            f"{proxy_cfg['scheme']}://{proxy_cfg['host']}:{proxy_cfg['port']}"
        )

        if proxy_cfg.get("username") and proxy_cfg.get("password"):
            if proxy_cfg["scheme"] != "http":
                raise ValueError(
                    "Для прокси с логином сейчас поддерживается только HTTP upstream proxy."
                )
            proxy_bridge = start_local_proxy_bridge(proxy_cfg)
            local_host, local_port = proxy_bridge.server_address
            co.set_argument(f"--proxy-server=http://{local_host}:{local_port}")
            print(
                "Using authenticated proxy via local bridge "
                f"127.0.0.1:{local_port} -> {proxy_cfg['host']}:{proxy_cfg['port']}",
                file=sys.stderr,
            )
        else:
            co.set_argument(f"--proxy-server={proxy_server}")
            print(f"Using proxy {proxy_server}", file=sys.stderr)
    return co, proxy_bridge


def wait_for_element(page: ChromiumPage, css: str, timeout: int = WAIT_PAGE_MAX):
    """Ждёт появления элемента на странице."""
    deadline = time.time() + timeout
    while time.time() < deadline:
        el = page.ele(f"css:{css}", timeout=0)
        if el:
            return el
        time.sleep(WAIT_POLL)
    return None


def report_browser_ip(page: ChromiumPage) -> None:
    """Печатает внешний IP, который видит сайт из браузера."""
    try:
        page.get("https://api.ipify.org?format=json")
        time.sleep(IP_CHECK_DELAY)
        raw = page.html or ""
        match = re.search(r'"ip"\s*:\s*"([^"]+)"', raw)
        if match:
            print(f"Browser public IP: {match.group(1)}", file=sys.stderr)
        else:
            print("WARNING: could not determine browser public IP", file=sys.stderr)
    except Exception as e:
        print(f"WARNING: failed to check browser IP: {e}", file=sys.stderr)


def parse_sports(page: ChromiumPage, top_n: int = 3) -> list[dict]:
    """Парсит страницу /en/line — берёт топ-N спортов по количеству матчей."""
    page.get(f"{BASE_URL}/en/line")
    time.sleep(FIRST_PAGE_LOAD_DELAY)

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
    time.sleep(PAGE_LOAD_DELAY)

    # Скроллим чтобы подгрузить все секции
    for _ in range(SCROLL_STEPS):
        page.scroll.down(600)
        time.sleep(SCROLL_DELAY)

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
        help=(
            "Прокси-сервер: socks5://ip:port, http://ip:port, "
            "http://user:pass@host:port или host:port:user:pass"
        ),
    )
    parser.add_argument(
        "--auto-proxy", action="store_true",
        help="Автоматически найти бесплатный сомалийский прокси",
    )
    parser.add_argument(
        "--check-ip", action="store_true",
        help="Проверить внешний IP браузера перед парсингом",
    )
    args = parser.parse_args()

    proxy = args.proxy
    if args.auto_proxy and not proxy:
        print("Fetching Somali proxy...", file=sys.stderr)
        proxy = fetch_somali_proxy()
        if not proxy:
            print("ERROR: no Somali proxy found", file=sys.stderr)
            sys.exit(1)

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

    co, proxy_bridge = make_options(headless=args.headless, proxy=proxy)
    page = ChromiumPage(co)

    try:
        if args.check_ip:
            report_browser_ip(page)

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
        if proxy_bridge:
            proxy_bridge.shutdown()
            proxy_bridge.server_close()
        if args.xvfb:
            vdisplay.stop()


if __name__ == "__main__":
    main()
