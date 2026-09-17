---
name: scheme-design
description: >-
  Write Chinese technical design schemes (总体/子系统/架构/接口/方案设计).
  Use when drafting or revising 设计方案, architecture docs, subsystem chapters,
  formal design HTML with paired process notes, scaffolding HTML toolkit
  (serve_docs/drawio embed/doc chrome), mapping requirements from Feishu/refs
  into module boundaries, or setting up a scheme project
  (正文 + *.note.md + specs + scripts + diagrams).
---

# 设计方案编写（scheme-design）

从「正式设计正文 + 配对过程笔记」实践提炼的可复用流程：用**参考材料定结构对照**，用**需求/协议定能力事实**，用**正文只写可交付结论**，过程对照与待决一律进笔记。

> 与「工业技术方案 / 实施方案 / 技术协议」类供货文稿不同；后者用 `writing-tech-schemes`。本 skill 面向**系统设计 / 架构 / 子系统设计方案**。

## 核心原则

1. **正文 ≠ 笔记**：正式正文只保留可交付结论（结构、职责、输入/输出、接口、待设计项）。对照表、源码路径、修订动机、推导过程写入配对 `*.note.md`。
2. **参考只对照结构**：`reference/` 与外部架构（开源栈、他案）只学分层与边界；**禁止**照搬其模块名话术或视觉风格进正文。
3. **事实来源分层**：能力与接口以用户方案、协议、飞书/纪要、既有专章为准；不确定处标「待设计 / 待确认」，禁止臆造验收硬指标。
4. **需求映射进边界**：业务/方案能力按技术边界落入模块；正文用技术术语（任务管理、接口、健康监控），避免「运营」等业务话术。
5. **范围先于文采**：先冻结本期分层、作业/数据闭环与「不在本期」边界，再展开模块卡与框图。

## 何时启用

- 新建或改写：总体设计方案、子系统专章、架构说明、接口设计、模块设计
- 整理：需求→模块映射、开源/他案对照、待决清单、框图与正文同步
- 初始化设计方案项目目录，或用户提到「写设计方案」「正文与笔记分开」「对标某某架构」

**不要用于**：纯代码实现、营销文案、把参考样例内容当本项目设计、签约用实施方案/技术协议（改用 `writing-tech-schemes`）。

## 工作流（复制勾选）

```
- [ ] 0. 无工程则 init_scheme_project（复制 scripts/HTML/specs）
- [ ] 1. 盘点材料角色与目录
- [ ] 2. 冻结分层、闭环与本期边界
- [ ] 3. 需求/他案 → 模块映射（写入笔记）
- [ ] 4. 起草正文（模块卡：职责 / 输入 / 输出）
- [ ] 5. 框图与正文一致（drawio-skill → sync embed）
- [ ] 6. 待决进笔记；正文仅「待设计」标签
- [ ] 7. 专章化与交叉引用；更新 readme / 修订记录
```

### 1. 盘点材料角色与目录

若项目尚无结构：

1. 优先用脚手架（见 [references/html-toolkit.md](references/html-toolkit.md)）：
   ```bash
   python3 scripts/init_scheme_project.py <项目目录> --title "系统名称"
   ```
2. 或按 [references/directory-layout.md](references/directory-layout.md) 手建目录，并从本 skill 的 `assets/scripts/` 复制工具脚本。
3. 写/更新根目录 `readme.md`（每个文件的**用途角色**一行说清）。

| 角色 | 典型路径 | 用法 |
|------|----------|------|
| 正式正文 | `summary.html` 等 | 可交付设计结论（`DOC_BODY` 内） |
| 过程笔记 | 配对 `*.note.md` | 对照、待决、修订；**不进正文** |
| 短规约 | `specs/` | 文档 / 框图写法 |
| 结构参照 | `reference/` | 只对照结构；不进正文、不沿用其视觉 |
| 内容事实 | 用户方案、协议、飞书、纪要、既有专章 | 唯一内容来源 |
| 框图 | `medias/diagrams/` | `.drawio` + 预览图；与正文一致 |
| 工具脚本 | `scripts/` | `serve_docs.py` / sync / chrome / diagram JS |

### 2. 冻结分层、闭环与本期边界

动笔前用短条目确认（缺则先问用户）：

- 总体分层（例：系统服务 / 核心算法 / 硬件抽象；或用户给定分层）
- **本期数据/作业闭环**（一句话，全文统一）
- 明确**不在本期**的能力（二期、选配、他方、外部对等端）
- 对外接口边界（谁经 API 接入；哪些是外部系统）

禁止前半写「全栈闭环」、后半又把关键能力标成选配且无说明。

### 3. 需求 / 他案 → 模块映射

1. 从飞书方案、需求表、会议纪要抽出能力清单（飞书读写见下节「配套 skill」）
2. 映射到正文模块（表放在 `*.note.md`，**不**贴进正文）
3. 开源/他案对照同样只进笔记；正文命名以可交付技术名为准，不绑定单一栈

映射表示例列：`方案能力 | 正文落点 | 备注（本期/二期/外部）`。

### 4. 起草正文

- 优先按项目已有定稿格式（HTML / Markdown）；**不要**正文与另一份 md 双源维护同一结论。
- 模块展开统一写清：**职责**、**输入**、**输出**；未确认标「待设计」。
- 接口关系用表格（表题在表上方）；主数据关系优先体现在框图连线边注，与模块职责一致。
- 章节设稳定锚点，便于目录与专章交叉引用。
- 用语偏技术；过程笔记中的开源术语映射到正文时改用项目技术名。

章节骨架见 [references/templates.md](references/templates.md)。

### 5. 框图与正文一致

- **绘制**：使用配套 skill **`drawio-skill`** 产出可编辑 `.drawio`（见下节）；勿用手绘 SVG 或其他异源图顶替。
- 插入 HTML：用本 skill `assets/html/diagram-panel.partial.html`，再 `scripts/sync_drawio_html_embed.py` 同步内嵌。
- 图内只表达结构结论与必要边注；**禁止**笔记性副标题（「对齐某某架构」、源码路径等）。
- 改分层或模块名时：**正文 + 框图 + 配对笔记**同步。
- 视觉与连线细则遵循项目 `specs/diagram.md`（脚手架已带默认版）。
- 子系统内部图只画本子系统能力与数据流；对外用输出条/边注概括。

### 工程工具（HTML 方案）

| 命令 / 文件 | 作用 |
|-------------|------|
| `scripts/init_scheme_project.py` | 初始化项目（scripts + HTML 壳 + specs） |
| `python3 scripts/serve_docs.py` | 本地预览；页内保存正文 / `.drawio` / Agent 要求 |
| `scripts/sync_drawio_html_embed.py` | `.drawio` → HTML embed + `.edit.html` |
| `scripts/doc_chrome.js` | 编辑正文 + 向 Agent 提要求 |
| `scripts/doc_diagram.js` | 框图预览 / 在线编辑 / 全屏 |

细则：[references/html-toolkit.md](references/html-toolkit.md)。

### 6. 待决与修订

| 放正文 | 放配对笔记 |
|--------|------------|
| 「待设计」标签（无推导） | 待决展开、选项对比、依据链接 |
| 稳定结构结论 | 外部框架对照、映射表 |
| 与总体一致的专章结论 | 修订记录与动机 |

修改设计时：对照或待决有变 → 记入笔记「修订记录」。

### 7. 专章化与落盘

- 模块细则成熟后拆子系统专章（正文 + 配对笔记）；总体正文保留交叉引用，去掉重复展开。
- 专章结论不得与总体分层/边注矛盾。
- 更新 `readme.md` 索引。

## 配套 skill（必须按任务加载）

本 skill **不**内嵌框图绘制或飞书 API 细节；需要时**先加载对应 skill 再执行**。

### 框图：`drawio-skill`

| 项 | 说明 |
|----|------|
| 用途 | 架构 / 分层 / 数据流等可编辑 `.drawio`，导出 PNG/SVG |
| 仓库 | https://github.com/Agents365-ai/drawio-skill |
| 安装 | `npx skills add Agents365-ai/365-skills -g` 或 clone 到 `~/.agents/skills/drawio-skill` |
| 约定 | 产出放入项目框图目录（如 `medias/diagrams/`）；风格遵循项目 `specs/diagram.md`（若有）；图内禁止笔记性标注 |

Agent：绘制或大改框图前 **Read 并遵循 `drawio-skill` 的 SKILL.md**；改完后与正文模块名/边注对齐。

### 飞书文档：`lark-cli` + `lark-*` skills

| 场景 | Skill | 说明 |
|------|-------|------|
| CLI 安装/登录/身份 | `lark-shared` | 所有 `lark-*` 的底座；缺 CLI 时先装 |
| 读/写云文档 Docx | `lark-doc` | URL/token 含 `/docx/`、`/wiki/` 文档内容时用 |
| 知识库节点/空间 | `lark-wiki` | 空间结构、节点移动/创建；正文编辑仍走 `lark-doc` |
| 云盘文件 | `lark-drive` | 上传下载、评论等非正文场景 |
| 文档内画板 | `lark-whiteboard` | 飞书云文档内嵌画板（≠ 本地 `.drawio`） |

安装飞书 CLI 与 skills（官方 Agent 指南）：

```shell
npm install -g @larksuite/cli
npx -y skills add https://open.feishu.cn --skill -y
lark-cli config init --new          # 浏览器完成应用凭证
lark-cli auth login --recommend     # 把授权链接发给用户
lark-cli auth status
```

指南：https://open.feishu.cn/document/no_class/mcp-archive/feishu-cli-installation-guide.md

Agent：

- 需要读飞书方案作事实来源 → 加载 **`lark-doc`**（及 **`lark-shared`**），用 `lark-cli` 拉取；**不要**用未鉴权的 WebFetch 硬爬云文档。
- `lark-cli` 未安装或未登录 → 先按上表安装/登录，再继续映射与起草。
- 本地设计框图用 **`drawio-skill`**；仅当用户要改**飞书文档里的画板**时才用 `lark-whiteboard`。

## 文风速查

- 用「本系统 / 本模块 / 外部系统 / 实施前提」，少用口语与营销夸张
- 边界句式：「…不在本期范围」「…由外部系统经 API 接入」「…列为后续建设，正文标待设计」
- 数字带条件：单位、测量点、是否已实测；设计估算不得写成验收硬指标
- 安全与模式类结论写清优先级（如人工接管 / 急停高于自动）

## 常见错误

| 错误 | 纠正 |
|------|------|
| 把参考架构的对照段落写进正文 | 迁入 `*.note.md` |
| 正文与另一 md 双源同一结论 | 定稿单一来源；另一文件只做跳转或笔记 |
| 需求能力未映射就堆功能列表 | 先映射表（笔记）再写模块卡 |
| 框图与正文模块名/边注不一致 | 同步改图与正文 |
| 把估算带宽/延时写成合同验收 | 标「待设计」或标明非验收口径 |
| 业务话术进模块名 | 改为技术边界命名 |
| 不用 drawio-skill 手搓异源图 | 改用 `drawio-skill` 产出 `.drawio` |
| 用 WebFetch 硬爬飞书云文档 | 改用 `lark-doc` + `lark-cli` |

## 红旗 — 停下重来

- 准备从 `reference/`「借鉴一段功能描述」进正文
- 准备编造硬指标且不标来源
- 同一文档出现两套互相矛盾的分层或闭环
- 把开源栈宣传图的深色/渐变风格搬进本方案框图
- 未加载 `drawio-skill` / `lark-doc` 却开始画框图或改飞书正文

## 附加资源

- [references/directory-layout.md](references/directory-layout.md) — 目录与 readme 约定
- [references/templates.md](references/templates.md) — 总体 / 子系统 / 笔记 / 映射表骨架
- [references/html-toolkit.md](references/html-toolkit.md) — HTML 框架、脚本与脚手架
- [drawio-skill](https://github.com/Agents365-ai/drawio-skill) — 框图绘制
- [飞书 CLI 安装指南](https://open.feishu.cn/document/no_class/mcp-archive/feishu-cli-installation-guide.md) — `lark-cli` 与 `lark-*` skills
