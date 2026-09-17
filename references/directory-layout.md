# 设计方案项目目录约定

## 推荐结构（HTML 工具包）

```
<project>/
├── readme.md
├── summary.html              # 总体正式正文（DOC_BODY + data-doc-path）
├── summary.note.md
├── summary.md                # 仅跳转
├── <subsystem>/              # 可选专章
│   ├── <name>.html
│   └── <name>.note.md
├── specs/
│   ├── doc.md
│   └── diagram.md
├── reference/
├── medias/diagrams/          # .drawio / *.drawio.png / *.edit.html
├── agent-requests/
│   ├── pending.md
│   └── archive/
└── scripts/                  # 来自 skill assets/scripts
    ├── serve_docs.py
    ├── sync_drawio_html_embed.py
    ├── doc_chrome.js
    └── doc_diagram.js
```

用脚手架一键生成：`python3 <skill>/scripts/init_scheme_project.py <project> --title "..."`  
说明见 [html-toolkit.md](html-toolkit.md)。

定稿格式优先 HTML（便于框图内嵌与页内编辑）。**同一结论不得在正文与另一份「正文 md」双源维护**。

## readme.md 应写内容

1. **目录功能说明**
2. **详细说明**：每个关键文件一行角色
3. **编写要求摘要** + 启动 `serve_docs.py` 的说明

## 命名建议

| 类型 | 示例 |
|------|------|
| 总体正文 | `summary.html` |
| 总体笔记 | `summary.note.md` |
| 子系统专章 | `<域>/<name>.html` + `<name>.note.md` |
| 框图 | `medias/diagrams/<name>.drawio` |
| 文档规约 | `specs/doc.md` |
| 框图规约 | `specs/diagram.md` |
