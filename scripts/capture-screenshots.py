"""
Capture README screenshots from the live GitHub Pages deployment.
Runs each game's first interactive screen (in demo mode) and writes
PNGs into docs/images/. Skip games that fail rather than aborting the run.
"""

from __future__ import annotations

import sys
import time
from pathlib import Path

from playwright.sync_api import sync_playwright, TimeoutError as PlaywrightTimeoutError

BASE = 'https://pashasan.github.io/learning-simulation-platform'
OUT_DIR = Path(__file__).resolve().parents[1] / 'docs' / 'images'
OUT_DIR.mkdir(parents=True, exist_ok=True)


def screenshot(page, url: str, out_path: Path, wait_for: str | None = None, settle_seconds: float = 2.0, click_after_load: str | None = None):
    """Load url, optionally wait for selector, optionally click, sleep, snap."""
    print(f'-> {out_path.name}: {url}')
    try:
        page.goto(url, wait_until='networkidle', timeout=30_000)
    except PlaywrightTimeoutError:
        print(f'   networkidle timeout, proceeding anyway')
    if wait_for:
        try:
            page.wait_for_selector(wait_for, timeout=10_000, state='visible')
        except PlaywrightTimeoutError:
            print(f'   selector {wait_for!r} not visible, continuing')
    if click_after_load:
        try:
            page.click(click_after_load, timeout=5_000)
            print(f'   clicked {click_after_load!r}')
        except PlaywrightTimeoutError:
            print(f'   could not click {click_after_load!r}')
    time.sleep(settle_seconds)
    page.screenshot(path=str(out_path), full_page=False)
    print(f'   saved {out_path}')


def main():
    with sync_playwright() as p:
        browser = p.chromium.launch(
            headless=True,
            args=[
                '--use-gl=swiftshader',
                '--enable-webgl',
                '--ignore-gpu-blocklist',
            ],
        )
        ctx = browser.new_context(
            viewport={'width': 1280, 'height': 800},
            device_scale_factor=2,
        )
        page = ctx.new_page()

        # 1. Hub (platform landing)
        screenshot(
            page,
            f'{BASE}/',
            OUT_DIR / 'hub.png',
            wait_for='.lab-list',
            settle_seconds=1.5,
        )

        # 2. Brew & Budget — index.html in demo mode redirects to game.html
        screenshot(
            page,
            f'{BASE}/simulation-games/resource-allocation/brew-and-budget/',
            OUT_DIR / 'brew-and-budget.png',
            wait_for='canvas',
            settle_seconds=5.0,
        )

        # 3. RoboVault — index.html redirects to game.html in demo mode
        screenshot(
            page,
            f'{BASE}/simulation-games/product-design/robo-vault/',
            OUT_DIR / 'robovault.png',
            wait_for='canvas',
            settle_seconds=5.0,
        )

        # 4. Analytics quiz — index.html shows volume selector in demo mode
        screenshot(
            page,
            f'{BASE}/choice-games/analytics/',
            OUT_DIR / 'analytics-quiz.png',
            wait_for='#volumes-screen',
            settle_seconds=2.0,
        )

        # 5. Code lab (PyTorch 1) — title screen with chapters
        screenshot(
            page,
            f'{BASE}/code-labs/pytorch-basics/',
            OUT_DIR / 'code-lab.png',
            wait_for='canvas',
            settle_seconds=5.0,
        )

        # 6. Survey lounge — module selector with 3D background
        screenshot(
            page,
            f'{BASE}/survey-games/course-feedback/',
            OUT_DIR / 'survey-lounge.png',
            wait_for='canvas, .module-card',
            settle_seconds=3.0,
        )

        ctx.close()
        browser.close()


if __name__ == '__main__':
    main()
