#!/usr/bin/env python3
"""本仓库本地设计文档服务（不要从其他项目或 skill 目录直接引用本文件）。

ROOT 固定为本文件所在 scripts/ 的上一级（当前项目根）。
所有写回（HTML / .drawio / agent-requests）只落在该 ROOT 下。

Usage:
  cd <本项目根>
  python3 scripts/serve_docs.py
  # then open http://127.0.0.1:8765/summary.html
  # or http://127.0.0.1:8765/<subsystem>/<name>.html
"""
from __future__ import annotations

import argparse
import json
import re
import subprocess
import sys
import webbrowser
from datetime import datetime, timezone
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlparse

# 仅服务「本脚本所在仓库」；禁止依赖外部目录的 scripts。
_SCRIPT = Path(__file__).resolve()
ROOT = _SCRIPT.parents[1]
DIAGRAMS = (ROOT / "medias" / "diagrams").resolve()
AGENT_REQ = (ROOT / "agent-requests").resolve()
SYNC = ROOT / "scripts" / "sync_drawio_html_embed.py"
HTML = ROOT / "summary.html"  # default drawio sync target / open URL
MAX_XML = 8 * 1024 * 1024
MAX_HTML = 8 * 1024 * 1024
MAX_BODY = 24 * 1024 * 1024
MAX_AGENT_REQ = 256 * 1024
DOC_BEGIN = "<!-- DOC_BODY:BEGIN -->"
DOC_END = "<!-- DOC_BODY:END -->"


def _write_png_sidecar(drawio: Path, png_data: str) -> bool:
    """Write data-URL or base64 PNG next to the .drawio (*.drawio.png)."""
    if not isinstance(png_data, str) or not png_data:
        return False
    raw = png_data.strip()
    if raw.startswith("data:"):
        comma = raw.find(",")
        if comma < 0:
            return False
        meta, b64 = raw[:comma], raw[comma + 1 :]
        if "base64" not in meta.lower():
            return False
    else:
        b64 = raw
    try:
        import base64

        blob = base64.b64decode(b64, validate=False)
    except Exception:
        return False
    if len(blob) < 24 or blob[:8] != b"\x89PNG\r\n\x1a\n":
        return False
    out = drawio.with_suffix(drawio.suffix + ".png")
    out.write_bytes(blob)
    return True


def resolve_drawio(rel: str) -> Path:
    """Resolve drawio path; accept repo-relative or HTML-relative (../medias/diagrams/…)."""
    rel = (rel or "").replace("\\", "/").strip()
    if not rel or not rel.endswith(".drawio"):
        raise ValueError("只能覆盖 .drawio")
    marker = "medias/diagrams/"
    if marker in rel:
        tail = rel.split(marker, 1)[1]
        if not tail or ".." in Path(tail).parts:
            raise ValueError("非法路径")
        path = (DIAGRAMS / tail).resolve()
    else:
        name = Path(rel).name
        if not name or name != Path(rel).name:
            raise ValueError("非法路径")
        path = (DIAGRAMS / name).resolve()
    if path.parent != DIAGRAMS:
        raise ValueError("只能覆盖 medias/diagrams/ 下的文件")
    if not path.is_file():
        raise ValueError("源文件不存在，拒绝新建")
    return path


def resolve_html(rel: str) -> Path:
    """Allow overwrite of any existing *.html under ROOT that has DOC_BODY markers."""
    rel = (rel or "summary.html").replace("\\", "/").lstrip("/")
    parts = Path(rel).parts
    if not rel or ".." in parts:
        raise ValueError("非法路径")
    if not rel.endswith(".html"):
        raise ValueError("只能覆盖 .html")
    path = (ROOT / rel).resolve()
    try:
        path.relative_to(ROOT)
    except ValueError as e:
        raise ValueError("路径越界") from e
    if not path.is_file():
        raise ValueError("文件不存在，拒绝新建")
    return path


def save_doc_body(fragment: str, rel: str = "summary.html") -> Path:
    if not isinstance(fragment, str) or "<main" not in fragment:
        raise ValueError("缺少正文 main 片段")
    if len(fragment.encode("utf-8")) > MAX_HTML:
        raise ValueError("正文过大")
    if "DOC_BODY:" in fragment:
        raise ValueError("正文片段非法")
    target = resolve_html(rel)
    text = target.read_text(encoding="utf-8")
    if DOC_BEGIN not in text or DOC_END not in text:
        raise ValueError(f"{target.relative_to(ROOT).as_posix()} 缺少 DOC_BODY 标记")
    pattern = re.compile(
        re.escape(DOC_BEGIN) + r".*?" + re.escape(DOC_END),
        re.DOTALL,
    )
    replacement = DOC_BEGIN + "\n" + fragment.strip() + "\n  " + DOC_END
    updated, n = pattern.subn(replacement, text, count=1)
    if n != 1:
        raise ValueError("无法定位正文区域")
    target.write_text(updated, encoding="utf-8")
    return target


def save_agent_request(text: str, source: str = "summary.html") -> dict:
    if not isinstance(text, str):
        raise ValueError("缺少要求正文")
    body = text.strip()
    if not body:
        raise ValueError("要求不能为空")
    if len(body.encode("utf-8")) > MAX_AGENT_REQ:
        raise ValueError("要求过大")
    src = (source or "summary.html").replace("\\", "/").lstrip("/")
    if ".." in Path(src).parts:
        src = "summary.html"
    # summary.html -> summary.note.md；subdir/x.html -> subdir/x.note.md
    if src.endswith(".html"):
        note_hint = src[: -len(".html")] + ".note.md"
    elif src.endswith(".htm"):
        note_hint = src[: -len(".htm")] + ".note.md"
    else:
        note_hint = src + ".note.md"
    AGENT_REQ.mkdir(parents=True, exist_ok=True)
    archive = AGENT_REQ / "archive"
    archive.mkdir(parents=True, exist_ok=True)
    now = datetime.now(timezone.utc).astimezone()
    stamp = now.strftime("%Y%m%d-%H%M%S")
    iso = now.isoformat(timespec="seconds")
    md = (
        "# Agent 修改要求\n\n"
        f"- 时间：{iso}\n"
        f"- 来源：{src} 页内「向 Agent 提要求」\n\n"
        "## 要求清单\n\n"
        f"{body}\n\n"
        "## 处理说明（给 Agent）\n\n"
        "请阅读本文件「要求清单」并逐条修改本仓库设计文档：按需更新设计正文 HTML、"
        "`medias/diagrams/`、配对 `*.note.md`、`specs/`；遵守 `specs/doc.md` 与 "
        f"`specs/diagram.md`。对照与待决写入配对 `*.note.md`（当前页对应 `{note_hint}`），"
        f"正式结论写入正文（当前页 `{src}`）。\n"
    )
    pending = AGENT_REQ / "pending.md"
    pending.write_text(md, encoding="utf-8")
    archived = archive / f"{stamp}.md"
    archived.write_text(md, encoding="utf-8")
    return {
        "path": pending.relative_to(ROOT).as_posix(),
        "archive": archived.relative_to(ROOT).as_posix(),
        "bytes": len(md.encode("utf-8")),
        "source": src,
    }


class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)

    def end_headers(self) -> None:
        if self.path.startswith("/api/"):
            self.send_header("Access-Control-Allow-Origin", "*")
            self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
            self.send_header("Access-Control-Allow-Headers", "Content-Type")
            self.send_header("Cache-Control", "no-store")
        super().end_headers()

    def do_OPTIONS(self) -> None:
        if self.path.startswith("/api/"):
            self.send_response(204)
            self.end_headers()
            return
        self.send_error(404)

    def do_GET(self) -> None:
        parsed = urlparse(self.path)
        if parsed.path in ("/api/save-drawio", "/api/save-html", "/api/agent-request"):
            self._json(200, {"ok": True, "mode": "overwrite"})
            return
        super().do_GET()

    def do_POST(self) -> None:
        parsed = urlparse(self.path)
        if parsed.path == "/api/save-html":
            self._save_html()
            return
        if parsed.path == "/api/agent-request":
            self._save_agent_request()
            return
        if parsed.path != "/api/save-drawio":
            self.send_error(404)
            return
        length = int(self.headers.get("Content-Length") or "0")
        if length <= 0 or length > MAX_BODY:
            self._json(400, {"ok": False, "error": "请求过大或为空"})
            return
        try:
            body = json.loads(self.rfile.read(length).decode("utf-8"))
        except (json.JSONDecodeError, UnicodeDecodeError):
            self._json(400, {"ok": False, "error": "JSON 无效"})
            return
        xml = body.get("xml") or ""
        if not isinstance(xml, str) or "<" not in xml:
            self._json(400, {"ok": False, "error": "缺少 XML"})
            return
        if len(xml.encode("utf-8")) > MAX_XML:
            self._json(400, {"ok": False, "error": "XML 过大"})
            return
        if "mxfile" not in xml and "mxGraphModel" not in xml:
            self._json(400, {"ok": False, "error": "不是 Draw.io XML"})
            return
        try:
            drawio = resolve_drawio(str(body.get("path") or ""))
        except ValueError as e:
            self._json(400, {"ok": False, "error": str(e)})
            return
        drawio.write_text(xml, encoding="utf-8")
        png_ok = _write_png_sidecar(drawio, body.get("png") or "")
        slot = str(body.get("slot") or "overall")
        html_rel = str(body.get("html") or "summary.html")
        try:
            html_target = resolve_html(html_rel)
        except ValueError:
            html_target = HTML
        synced = False
        try:
            subprocess.run(
                [
                    sys.executable,
                    str(SYNC),
                    "--html",
                    str(html_target),
                    "--drawio",
                    str(drawio),
                    "--slot",
                    slot,
                ],
                check=True,
                cwd=str(ROOT),
            )
            synced = True
        except subprocess.CalledProcessError:
            synced = False
        self._json(
            200,
            {
                "ok": True,
                "path": drawio.relative_to(ROOT).as_posix(),
                "bytes": len(xml.encode("utf-8")),
                "synced": synced,
                "png": png_ok,
            },
        )

    def _save_html(self) -> None:
        length = int(self.headers.get("Content-Length") or "0")
        if length <= 0 or length > MAX_BODY:
            self._json(400, {"ok": False, "error": "请求过大或为空"})
            return
        try:
            body = json.loads(self.rfile.read(length).decode("utf-8"))
        except (json.JSONDecodeError, UnicodeDecodeError):
            self._json(400, {"ok": False, "error": "JSON 无效"})
            return
        try:
            target = save_doc_body(
                str(body.get("html") or ""),
                str(body.get("path") or "summary.html"),
            )
        except ValueError as e:
            self._json(400, {"ok": False, "error": str(e)})
            return
        self._json(
            200,
            {
                "ok": True,
                "path": target.relative_to(ROOT).as_posix(),
                "bytes": target.stat().st_size,
            },
        )

    def _save_agent_request(self) -> None:
        length = int(self.headers.get("Content-Length") or "0")
        if length <= 0 or length > MAX_BODY:
            self._json(400, {"ok": False, "error": "请求过大或为空"})
            return
        try:
            body = json.loads(self.rfile.read(length).decode("utf-8"))
        except (json.JSONDecodeError, UnicodeDecodeError):
            self._json(400, {"ok": False, "error": "JSON 无效"})
            return
        try:
            info = save_agent_request(
                str(body.get("text") or ""),
                str(body.get("source") or "summary.html"),
            )
        except ValueError as e:
            self._json(400, {"ok": False, "error": str(e)})
            return
        self._json(200, {"ok": True, **info})

    def _json(self, code: int, payload: dict) -> None:
        raw = json.dumps(payload, ensure_ascii=False).encode("utf-8")
        self.send_response(code)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(raw)))
        self.end_headers()
        self.wfile.write(raw)

    def log_message(self, fmt: str, *args) -> None:
        sys.stderr.write("%s - %s\n" % (self.address_string(), fmt % args))


def main() -> None:
    p = argparse.ArgumentParser(description=f"Serve design docs under {ROOT}")
    p.add_argument("--host", default="127.0.0.1")
    p.add_argument("--port", type=int, default=8765)
    p.add_argument("--no-open", action="store_true")
    args = p.parse_args()
    if not (ROOT / "scripts" / "serve_docs.py").resolve().samefile(_SCRIPT):
        raise SystemExit(
            f"refuse: script is not this project's scripts/serve_docs.py\n"
            f"  script={_SCRIPT}\n  expected under={ROOT / 'scripts'}"
        )
    if not SYNC.is_file():
        raise SystemExit(f"missing local sync script: {SYNC}")
    httpd = ThreadingHTTPServer((args.host, args.port), Handler)
    url = f"http://{args.host}:{args.port}/summary.html"
    print(f"script: {_SCRIPT}")
    print(f"serving only: {ROOT}")
    print(f"open {url}")
    print("「保存正文」按页面 data-doc-path 覆盖对应 .html；「保存 .drawio」覆盖 medias/diagrams/*.drawio")
    print("「向 Agent 提要求」写入 agent-requests/pending.md")
    if not args.no_open:
        webbrowser.open(url)
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nstopped")


if __name__ == "__main__":
    main()
