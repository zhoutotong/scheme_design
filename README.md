# scheme-design

Cursor Agent Skill：编写各类**设计方案**（总体 / 子系统 / 架构 / 接口设计）。

强调：**正式正文只写可交付结论**；对照、待决、修订写入配对 `*.note.md`。

内置 **HTML 工具包**：页内编辑、框图内嵌、本地预览、Agent 提要求侧栏，以及一键脚手架。

## 安装

```bash
npx -y skills add git@github.com:zhoutotong/scheme_design.git --skill -y
# 或
npx -y skills add https://github.com/zhoutotong/scheme_design --skill -y
```

也可将本目录放到 `~/.agents/skills/scheme-design/` 或项目 `.agents/skills/scheme-design/`。

## 初始化设计方案工程

```bash
python3 scripts/init_scheme_project.py /path/to/project --title "系统名称"
python3 /path/to/project/scripts/serve_docs.py
```

详见 [references/html-toolkit.md](references/html-toolkit.md)。

## 何时用

- 设计方案、架构说明、子系统专章
- 「正文与笔记分开」「对标某某架构」「需求映射进模块」
- 需要 HTML 正文 + Draw.io 框图 + 页内编辑工作流

签约用**实施方案 / 技术协议 / 规格书**请用工业技术方案类 skill（如 `writing-tech-schemes`），不要与本 skill 混用。

## 配套 skill

| 能力 | Skill | 安装 |
|------|-------|------|
| 框图 `.drawio` | [`drawio-skill`](https://github.com/Agents365-ai/drawio-skill) | `npx skills add Agents365-ai/365-skills -g` |
| 飞书云文档 | `lark-doc`（+ `lark-shared` / `lark-wiki`…） | 见[飞书 CLI 安装指南](https://open.feishu.cn/document/no_class/mcp-archive/feishu-cli-installation-guide.md) |

## 结构

```
SKILL.md
README.md
scripts/init_scheme_project.py
assets/
  scripts/          # serve_docs / sync / doc_chrome / doc_diagram
  html/             # CSS + chrome + diagram-panel 模板
  scaffold/         # specs + agent-requests 种子
references/
  directory-layout.md
  templates.md
  html-toolkit.md
```

## 许可

按仓库所有者约定使用。
