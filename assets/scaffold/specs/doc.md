# 文档规范

## 正文格式

- **正式设计正文使用 HTML**，入口：根目录 `summary.html`。
- 不以 Markdown 作为定稿格式；`summary.md` 仅作跳转，避免双源维护。
- 过程备注与短规约可用 Markdown（本文件、`specs/diagram.md`、`*.note.md`）。
- 浏览与页内编辑：`python3 scripts/serve_docs.py`。

## 正文与笔记配对

| 文件 | 角色 |
|------|------|
| `*.html`（含 `data-doc-path`） | 正式设计正文 |
| 配对 `*.note.md` | 过程笔记（对照 / 待决 / 修订） |

- **笔记性内容不得写入正文**，包括但不限于：外部框架对照、源码路径备忘、链接索引推导、修订动机、映射表、实现提示。
- 正文只保留可交付设计结论：**结构、职责、输入/输出、接口、待设计项**（用「待设计」标签，不写推导过程）。
- 修改设计时同步更新正文与对应笔记。
- 子系统专章与总体正文交叉引用；专章结论不得与总体分层/边注矛盾。

## 目录角色

| 路径 | 角色 |
|------|------|
| `summary.html` | 总体正式设计正文 |
| `summary.note.md` | 总体配对过程笔记 |
| `summary.md` | 仅跳转到 `summary.html` |
| `<subsystem>/` | 子系统专章（`*.html` + `*.note.md`） |
| `readme.md` | 项目入口与编辑/浏览说明 |
| `specs/` | 短规约（文档 / 框图） |
| `medias/diagrams/` | 框图 `.drawio` 与预览图 |
| `reference/` | 外部结构参照；**不**进正文，**不**沿用其视觉风格 |
| `scripts/` | 本地预览服务与内嵌同步 |
| `agent-requests/` | 页内「向 Agent 提要求」清单 |

## HTML 编写要求

1. UTF-8，`lang="zh-CN"`；根元素设 `data-doc-path`（相对项目根的路径）。
2. 章节用 `h1`–`h3`，主要章节设稳定 `id`；正文包在 `<!-- DOC_BODY:BEGIN/END -->` 与 `<main id="doc-body">` 内。
3. 框图用 `.diagram-panel` + `DRAWIO_EMBED_DATA` 标记（见 skill `assets/html/diagram-panel.partial.html`）。
4. 接口关系用表格（表题在表上方居中）；主数据关系优先体现在框图连线边注。
5. 模块展开统一写清：**职责**、**输入**、**输出**；未确认处标「待设计」。
6. 资源用相对路径；页脚脚本路径按目录深度指向 `scripts/doc_chrome.js` / `doc_diagram.js`。
7. 正文不得出现使用指引或笔记性对照（编辑 chrome 在 `DOC_BODY` 之外）。
8. **用语偏技术**：避免偏业务话术；过程笔记中的开源对照可保留原文术语。

## Draw.io 页内编辑

1. 章节内保留 `.diagram-panel` 与 embed 标记。
2. 改 `.drawio` 后：`python3 scripts/sync_drawio_html_embed.py --html <页> --drawio medias/diagrams/<name>.drawio --slot <slot>`。
3. 优先用 **drawio-skill** 产出 `.drawio`；图内禁止笔记性副标题。
