#!/usr/bin/env python3
"""Sync .drawio XML into summary.html for in-page diagrams.net editing.

Also refreshes medias/diagrams/*.edit.html (new-window editor URL).

Usage:
  python3 scripts/sync_drawio_html_embed.py
"""
from __future__ import annotations

import argparse
import base64
import json
import os
import re
import urllib.parse
import zlib
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
BEGIN = "<!-- DRAWIO_EMBED_DATA:BEGIN:{slot} -->"
END = "<!-- DRAWIO_EMBED_DATA:END:{slot} -->"


def _deflate_b64(xml: str) -> str:
    pre = urllib.parse.quote(xml, safe="!~*'()")
    c = zlib.compressobj(9, zlib.DEFLATED, -zlib.MAX_WBITS)
    compressed = c.compress(pre.encode("utf-8")) + c.flush()
    return base64.b64encode(compressed).decode("utf-8").replace("\n", "")


def edit_url(xml: str) -> str:
    """New-window editor URL (app.diagrams.net; may refuse iframe embedding)."""
    payload = json.dumps({"type": "xml", "compressed": True, "data": _deflate_b64(xml)})
    return (
        "https://app.diagrams.net/?splash=0&ui=atlas&libs=0"
        "#create=" + urllib.parse.quote(payload, safe="")
    )


def sync(html_path: Path, drawio_path: Path, slot: str) -> None:
    xml = drawio_path.read_text(encoding="utf-8")
    # HTML 可能在子目录（如 sensor/），框图在 medias/diagrams/，需允许 ../
    rel = Path(os.path.relpath(drawio_path, html_path.parent)).as_posix()
    url = edit_url(xml)

    edit_helper = drawio_path.with_suffix(".edit.html")
    edit_helper.write_text(
        "<!DOCTYPE html>\n"
        '<html lang="zh-CN"><head><meta charset="UTF-8">'
        f'<meta http-equiv="refresh" content="0;url={url}">'
        "<title>打开 Draw.io 编辑器</title></head><body>"
        f'<p>正在打开 diagrams.net…若未跳转请 <a href="{url}">点击这里</a>。</p>'
        "</body></html>\n",
        encoding="utf-8",
    )

    edit_helper_rel = Path(os.path.relpath(edit_helper, html_path.parent)).as_posix()
    payload = json.dumps(
        {
            "path": rel,
            "encoding": "base64",
            "xml_b64": base64.b64encode(xml.encode("utf-8")).decode("ascii"),
            "edit_url": url,
            "edit_helper": edit_helper_rel,
        },
        ensure_ascii=True,
        separators=(",", ":"),
    )
    block = (
        f"{BEGIN.format(slot=slot)}\n"
        f'<script type="application/json" id="drawio-data-{slot}">{payload}</script>\n'
        f"{END.format(slot=slot)}"
    )
    text = html_path.read_text(encoding="utf-8")
    pattern = re.compile(
        re.escape(BEGIN.format(slot=slot)) + r".*?" + re.escape(END.format(slot=slot)),
        re.DOTALL,
    )
    if not pattern.search(text):
        raise SystemExit(f"missing embed markers for slot={slot} in {html_path}")
    html_path.write_text(pattern.sub(lambda _m: block, text), encoding="utf-8")
    print(f"synced {drawio_path.name} -> {html_path.name} + {edit_helper.name} ({len(xml)} bytes)")


def main() -> None:
    p = argparse.ArgumentParser()
    p.add_argument("--html", type=Path, default=ROOT / "summary.html")
    p.add_argument("--drawio", type=Path, default=ROOT / "medias/diagrams/overall_system_block.drawio")
    p.add_argument("--slot", default="overall")
    args = p.parse_args()
    sync(args.html.resolve(), args.drawio.resolve(), args.slot)


if __name__ == "__main__":
    main()
