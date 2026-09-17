#!/usr/bin/env python3
"""Initialize a scheme-design HTML project from skill assets.

Usage (from skill root or any cwd):
  python3 scripts/init_scheme_project.py /path/to/project --title "系统名称"
  python3 scripts/init_scheme_project.py . --title "Foo" --force
"""
from __future__ import annotations

import argparse
import shutil
import sys
from pathlib import Path

SKILL_ROOT = Path(__file__).resolve().parents[1]
ASSETS = SKILL_ROOT / "assets"
SCRIPTS = ASSETS / "scripts"
HTML = ASSETS / "html"
SCAFFOLD = ASSETS / "scaffold"


def _rel_prefix(depth: int) -> str:
    return "" if depth <= 0 else "../" * depth


def build_summary_html(title: str, doc_path: str = "summary.html", depth: int = 0) -> str:
    css = (HTML / "doc.css").read_text(encoding="utf-8")
    chrome = (HTML / "chrome.partial.html").read_text(encoding="utf-8")
    scripts_prefix = _rel_prefix(depth) + "scripts"
    return f"""<!DOCTYPE html>
<html lang="zh-CN" data-doc-path="{doc_path}">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>{title}</title>
  <style>
{css}
  </style>
</head>
<body>
{chrome}
  <!-- DOC_BODY:BEGIN -->
  <main class="wrap" id="doc-body">
    <h1>{title}</h1>
    <p class="lead">总体框架构成、边界与一二级模块。正式结论写于此；对照与待决见配对 <code>{Path(doc_path).with_suffix('.note.md').name}</code>。</p>

    <nav class="toc" aria-label="目录">
      <strong>目录</strong>
      <ol>
        <li><a href="#sec-1">1. 总体框架</a></li>
        <li><a href="#sec-2">2. 子系统专章</a></li>
        <li><a href="#sec-3">3. 参考链接</a></li>
      </ol>
    </nav>

    <h2 id="sec-1">1. 总体框架</h2>
    <p>待设计：分层、闭环与模块边界。</p>

    <h2 id="sec-2">2. 子系统专章</h2>
    <ul>
      <li>待设计：成熟模块拆专章后在此交叉引用。</li>
    </ul>

    <h2 id="sec-3">3. 参考链接</h2>
    <ol>
      <li>待设计：外部结构参照链接（对照表放过程笔记）。</li>
    </ol>
  </main>
  <!-- DOC_BODY:END -->

  <script src="{scripts_prefix}/doc_chrome.js"></script>
  <script src="{scripts_prefix}/doc_diagram.js"></script>
</body>
</html>
"""


def build_chapter_html(title: str, doc_path: str, depth: int = 1) -> str:
    """Subsystem chapter under a subdirectory (depth=1 → ../scripts)."""
    css = (HTML / "doc.css").read_text(encoding="utf-8")
    chrome = (HTML / "chrome.partial.html").read_text(encoding="utf-8")
    scripts_prefix = _rel_prefix(depth) + "scripts"
    note = Path(doc_path).name.replace(".html", ".note.md")
    return f"""<!DOCTYPE html>
<html lang="zh-CN" data-doc-path="{doc_path}">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>{title}</title>
  <style>
{css}
  </style>
</head>
<body>
{chrome}
  <!-- DOC_BODY:BEGIN -->
  <main class="wrap" id="doc-body">
    <h1>{title}</h1>
    <p class="lead">子系统专章。正式结论写于此；对照与待决见 <code>{note}</code>。总体见 <a href="{_rel_prefix(depth)}summary.html">总体设计</a>。</p>

    <h2 id="sec-1">1. 范围与在总体中的位置</h2>
    <p>待设计。</p>

    <h2 id="sec-2">2. 内部结构</h2>
    <p>待设计（框图用 drawio-skill 产出后插入 diagram-panel）。</p>

    <h2 id="sec-3">3. 能力模块</h2>
    <div class="module-card">
      <h4>示例模块 <span class="tag todo">待设计</span></h4>
      <p><strong>职责：</strong>…</p>
      <p><strong>输入：</strong>…</p>
      <p><strong>输出：</strong>…</p>
    </div>
  </main>
  <!-- DOC_BODY:END -->

  <script src="{scripts_prefix}/doc_chrome.js"></script>
  <script src="{scripts_prefix}/doc_diagram.js"></script>
</body>
</html>
"""


def write_text(path: Path, text: str, force: bool) -> None:
    if path.exists() and not force:
        print(f"skip existing {path}")
        return
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(text, encoding="utf-8")
    print(f"write {path}")


def copy_tree(src: Path, dst: Path, force: bool) -> None:
    if not src.exists():
        raise SystemExit(f"missing asset: {src}")
    if dst.exists() and not force:
        print(f"skip existing {dst}")
        return
    if dst.exists() and force:
        shutil.rmtree(dst)
    shutil.copytree(src, dst)
    print(f"copy {src.name} -> {dst}")


def ensure_scripts(target: Path, force: bool = False) -> None:
    """Copy toolkit scripts into <target>/scripts/ (the project being worked on).

    Always installs into the given project directory — never leave scripts only
    inside the skill tree or another sample repo.
    """
    target = target.resolve()
    target.mkdir(parents=True, exist_ok=True)
    dest = target / "scripts"
    required = [
        "serve_docs.py",
        "sync_drawio_html_embed.py",
        "doc_chrome.js",
        "doc_diagram.js",
    ]
    missing = [n for n in required if not (dest / n).is_file()]
    if dest.is_dir() and not missing and not force:
        print(f"scripts already present: {dest}")
        print(f"start server from THIS project: cd {target} && python3 scripts/serve_docs.py")
        return

    dest.mkdir(parents=True, exist_ok=True)
    for f in SCRIPTS.iterdir():
        if not f.is_file() or f.name.startswith(".") or f.suffix == ".pyc":
            continue
        if f.name == "__pycache__":
            continue
        out = dest / f.name
        if out.exists() and not force and f.name not in missing:
            print(f"skip existing {out}")
            continue
        shutil.copy2(f, out)
        print(f"copy {f.name} -> {out}")

    still = [n for n in required if not (dest / n).is_file()]
    if still:
        raise SystemExit(f"failed to install scripts: missing {still} (assets={SCRIPTS})")
    print(f"ensure_scripts done: {dest}")
    print(f"start server from THIS project: cd {target} && python3 scripts/serve_docs.py")


def init_project(target: Path, title: str, force: bool) -> None:
    target = target.resolve()
    target.mkdir(parents=True, exist_ok=True)

    ensure_scripts(target, force=force)

    # specs from scaffold (prefer scaffold copies)
    specs_src = SCAFFOLD / "specs"
    if specs_src.is_dir():
        for f in specs_src.iterdir():
            if f.is_file():
                dest = target / "specs" / f.name
                if dest.exists() and not force:
                    print(f"skip existing {dest}")
                else:
                    dest.parent.mkdir(parents=True, exist_ok=True)
                    shutil.copy2(f, dest)
                    print(f"copy specs/{f.name}")

    ar_readme = SCAFFOLD / "agent-requests" / "README.md"
    if ar_readme.is_file():
        write_text(target / "agent-requests" / "README.md", ar_readme.read_text(encoding="utf-8"), force)
    (target / "agent-requests" / "archive").mkdir(parents=True, exist_ok=True)
    keep = target / "agent-requests" / "archive" / ".gitkeep"
    if not keep.exists():
        keep.write_text("", encoding="utf-8")

    (target / "medias" / "diagrams").mkdir(parents=True, exist_ok=True)
    (target / "reference").mkdir(parents=True, exist_ok=True)
    dg = target / "medias" / "diagrams" / ".gitkeep"
    if not dg.exists():
        dg.write_text("", encoding="utf-8")

    write_text(target / "summary.html", build_summary_html(title), force)
    write_text(
        target / "summary.note.md",
        f"# summary.html 过程笔记\n\n"
        f"配对正文：[summary.html](summary.html)\n\n"
        f"本文件记录参考依据、对照说明、待决事项与修订备忘，**不进入正式正文**。\n\n"
        f"## 结构对照\n\n（待填）\n\n"
        f"## 需求 → 模块映射\n\n| 方案能力 | 正文落点 | 备注 |\n|----------|----------|------|\n\n"
        f"## 待决事项\n\n| 模块 | 待决 |\n|------|------|\n\n"
        f"## 修订记录\n\n- 初始化：由 scheme-design scaffold 创建。\n",
        force,
    )
    write_text(
        target / "summary.md",
        f"# {title}\n\n正式设计正文见 [summary.html](summary.html)。\n",
        force,
    )

    readme = f"""# {title}

| 文件 | 角色 |
|------|------|
| [summary.html](summary.html) | 正式设计正文 |
| [summary.note.md](summary.note.md) | 配对过程笔记（对照、待决、修订；不进正文） |
| [summary.md](summary.md) | 仅跳转到正文 |
| [specs/doc.md](specs/doc.md) | 文档规范 |
| [specs/diagram.md](specs/diagram.md) | 框图规范 |
| [agent-requests/](agent-requests/) | 页内「向 Agent 提要求」清单 |
| [scripts/](scripts/) | 本地预览与框图内嵌同步 |

## 浏览与编辑

```bash
python3 scripts/serve_docs.py
```

打开 `http://127.0.0.1:8765/summary.html`。

- 页内「编辑正文 / 保存正文」写回 `DOC_BODY` 区域
- 框图用 [drawio-skill](https://github.com/Agents365-ai/drawio-skill) 产出 `.drawio` 后放入 `medias/diagrams/`，再：
  ```bash
  python3 scripts/sync_drawio_html_embed.py --html summary.html --drawio medias/diagrams/<name>.drawio --slot <slot>
  ```
- 编写约定见 `specs/`；流程见 scheme-design skill
"""
    write_text(target / "readme.md", readme, force)
    print(f"done: {target}")


def add_chapter(target: Path, name: str, title: str, force: bool) -> None:
    """Add <name>/<name>.html + note under project root."""
    target = target.resolve()
    slug = name.strip("/").replace(" ", "_")
    if not slug or ".." in slug or "/" in slug:
        raise SystemExit("chapter name must be a single path segment")
    doc_path = f"{slug}/{slug}.html"
    write_text(target / doc_path, build_chapter_html(title, doc_path, depth=1), force)
    write_text(
        target / slug / f"{slug}.note.md",
        f"# {slug}.html 过程笔记\n\n"
        f"配对正文：[{slug}.html]({slug}.html)\n\n"
        f"对照、待决与修订写于此，**不进入正式正文**。\n\n"
        f"## 待决事项\n\n| 模块 | 待决 |\n|------|------|\n\n"
        f"## 修订记录\n\n- 初始化专章。\n",
        force,
    )
    print(f"chapter ready: {doc_path} （请在 summary.html 子系统索引中交叉引用）")


def main() -> None:
    p = argparse.ArgumentParser(
        description=(
            "Scaffold a scheme-design HTML project INTO the target directory. "
            "Scripts are always generated under <target>/scripts/ — "
            "do not run serve_docs from the skill repo or another sample project."
        )
    )
    p.add_argument(
        "target",
        type=Path,
        help="project directory that will own scripts/ and docs (usually cwd)",
    )
    p.add_argument("--title", default="系统设计", help="document title")
    p.add_argument("--force", action="store_true", help="overwrite existing files")
    p.add_argument(
        "--scripts-only",
        action="store_true",
        help="only install/refresh <target>/scripts from skill assets (no HTML overwrite)",
    )
    p.add_argument("--chapter", metavar="NAME", help="also add subsystem chapter NAME/")
    p.add_argument("--chapter-title", default="", help="chapter title (default: NAME)")
    args = p.parse_args()
    if not ASSETS.is_dir():
        raise SystemExit(f"assets not found under {SKILL_ROOT}")
    if args.scripts_only:
        ensure_scripts(args.target, force=args.force)
        return
    init_project(args.target, args.title, args.force)
    if args.chapter:
        add_chapter(
            args.target,
            args.chapter,
            args.chapter_title or args.chapter,
            args.force,
        )


if __name__ == "__main__":
    main()
