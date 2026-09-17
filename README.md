# scheme-design

Cursor Agent Skill：编写各类**设计方案**（总体 / 子系统 / 架构 / 接口设计）。

强调：**正式正文只写可交付结论**；对照、待决、修订写入配对 `*.note.md`。

## 安装

```bash
npx -y skills add git@github.com:zhoutotong/scheme_design.git --skill -y
# 或
npx -y skills add https://github.com/zhoutotong/scheme_design --skill -y
```

也可将本目录放到 `~/.agents/skills/scheme-design/` 或项目 `.agents/skills/scheme-design/`。

## 何时用

- 设计方案、架构说明、子系统专章
- 「正文与笔记分开」「对标某某架构」「需求映射进模块」

签约用**实施方案 / 技术协议 / 规格书**请用工业技术方案类 skill（如 `writing-tech-schemes`），不要与本 skill 混用。

## 配套 skill

| 能力 | Skill | 安装 |
|------|-------|------|
| 框图 `.drawio` | [`drawio-skill`](https://github.com/Agents365-ai/drawio-skill) | `npx skills add Agents365-ai/365-skills -g` |
| 飞书云文档 | `lark-doc`（+ `lark-shared` / `lark-wiki`…） | 见[飞书 CLI 安装指南](https://open.feishu.cn/document/no_class/mcp-archive/feishu-cli-installation-guide.md) |

## 结构

```
SKILL.md
references/
  directory-layout.md
  templates.md
README.md
```

## 许可

按仓库所有者约定使用。
