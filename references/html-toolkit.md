# HTML 工具包与脚手架

本 skill 内置设计方案 HTML 工程资产，初始化新项目或给现有目录补齐工具时使用。

## 资产布局

```
assets/
  scripts/           # 复制到项目 scripts/
    serve_docs.py
    sync_drawio_html_embed.py
    doc_chrome.js
    doc_diagram.js
  html/
    doc.css                    # 正文样式（脚手架内联进 HTML）
    chrome.partial.html        # 顶栏 + Agent 侧栏
    diagram-panel.partial.html # 框图面板模板（{{SLOT}} / {{DRAWIO_REL}} / {{CAPTION}}）
  scaffold/
    specs/doc.md
    specs/diagram.md
    agent-requests/README.md
scripts/
  init_scheme_project.py       # 一键脚手架
```

## 初始化项目

在 skill 根目录（或任意 cwd，脚本按自身位置找 assets）：

```bash
python3 scripts/init_scheme_project.py /path/to/project --title "系统名称"
# 可选：同时建子系统专章
python3 scripts/init_scheme_project.py /path/to/project --title "系统名称" --chapter sensor --chapter-title "传感与传感器套件"
# 覆盖已有文件
python3 scripts/init_scheme_project.py /path/to/project --title "系统名称" --force
```

生成：`summary.html` + `summary.note.md` + `scripts/` + `specs/` + `agent-requests/` + `medias/diagrams/` + `readme.md`。

## 日常命令

```bash
# 本地预览 / 页内保存正文与框图
python3 scripts/serve_docs.py

# 将 .drawio 同步进 HTML 内嵌（改图或新建 slot 后）
python3 scripts/sync_drawio_html_embed.py \
  --html summary.html \
  --drawio medias/diagrams/overall_system_block.drawio \
  --slot overall
```

子系统页在子目录时：`--html sensor/sensor.html`，页内 `script src="../scripts/..."`，`data-doc-path="sensor/sensor.html"`。

## 插入框图

1. 用 **drawio-skill** 产出 `medias/diagrams/<name>.drawio`
2. 复制 `assets/html/diagram-panel.partial.html` 进正文，替换：
   - `{{SLOT}}` → 如 `overall`
   - `{{DRAWIO_REL}}` → 相对**该 HTML 文件**的路径，如 `medias/diagrams/foo.drawio` 或 `../medias/diagrams/foo.drawio`
   - `{{CAPTION}}` → 图题
3. 运行 `sync_drawio_html_embed.py` 填充 embed JSON
4. 页内「在线编辑 / 保存 .drawio」依赖 `serve_docs.py`

## HTML 约定速查

| 标记 | 作用 |
|------|------|
| `data-doc-path` | 相对项目根的 HTML 路径；保存 API 与笔记提示据此推导 |
| `<!-- DOC_BODY:BEGIN/END -->` | 页内「保存正文」只覆盖此区间 |
| `<main id="doc-body">` | 可编辑正文根 |
| `DRAWIO_EMBED_DATA:BEGIN:<slot>` | 框图内嵌数据槽 |

编辑 chrome 与 Agent 侧栏在 `DOC_BODY` **之外**，勿写入正文结论。

## Agent 行为

- 新建设计方案工程 → 先跑 `init_scheme_project.py`（或从本目录复制 `assets/scripts` + 模板）
- 画框图 → **drawio-skill**，再 sync
- 读飞书 → **lark-doc** / `lark-cli`
- 不要手写异源 SVG 顶替 `.drawio`
