# HTML 工具包与脚手架

本 skill 内置设计方案 HTML 工程资产。使用时必须把工具**复制进当前设计方案项目**，再在该项目内启动服务。

## 关键：项目本地 scripts，禁止跨目录启动

| 正确 | 错误 |
|------|------|
| 在项目 A 工作 → `A/scripts/serve_docs.py`，写回 A | 在项目 A 工作却去 B（或 skill 目录）跑 `serve_docs.py` |
| 缺脚本 → `init … A --scripts-only` 生成 `A/scripts/` | 假设「别处已经有服务」可共用 |

`serve_docs.py` 的 ROOT = **该脚本文件**的上一级。在错误目录启动，保存会写到错误仓库。

## 资产布局（skill 内，仅作模板源）

```
assets/
  scripts/           # 复制到「用户项目」scripts/
  html/
  scaffold/
scripts/
  init_scheme_project.py
```

## 安装到当前项目

先定位 skill 根（含 `assets/` 与 `scripts/init_scheme_project.py`），常见：

- `<workspace>/.agents/skills/scheme-design`
- `~/.agents/skills/scheme-design`

```bash
SKILL=<scheme-design 的 SKILL.md 所在目录>
TARGET=<当前设计方案项目根>   # 通常即 cwd / workspace

# 已有正文，只补本项目脚本（推荐）
python3 "$SKILL/scripts/init_scheme_project.py" "$TARGET" --scripts-only

# 全新工程
python3 "$SKILL/scripts/init_scheme_project.py" "$TARGET" --title "系统名称"

# 强制覆盖项目内 scripts
python3 "$SKILL/scripts/init_scheme_project.py" "$TARGET" --scripts-only --force
```

然后：

```bash
cd "$TARGET"
python3 scripts/serve_docs.py
```

启动日志中的 `serving only:` 必须等于 `$TARGET`。

## 日常命令（均在 TARGET 内）

```bash
cd "$TARGET"
python3 scripts/serve_docs.py

python3 scripts/sync_drawio_html_embed.py \
  --html summary.html \
  --drawio medias/diagrams/overall_system_block.drawio \
  --slot overall
```

## 插入框图

1. 用 **drawio-skill** 产出 `$TARGET/medias/diagrams/<name>.drawio`
2. 从 skill `assets/html/diagram-panel.partial.html` 插入正文并替换占位符
3. 在 **TARGET** 运行 `sync_drawio_html_embed.py`
4. 页内保存依赖 **TARGET** 的 `serve_docs.py`

## Agent 行为（强制）

1. 开始 HTML 方案工作前：检查 `$TARGET/scripts/serve_docs.py`；没有则 `--scripts-only`（或完整 init）装入 `$TARGET`。
2. 需要预览/页内保存：只 `cd $TARGET && python3 scripts/serve_docs.py`。
3. **禁止**引导用户到其他仓库启动服务。
4. 画框图 → **drawio-skill**，再在 TARGET sync；读飞书 → **lark-doc**。
