# 框图规范

## 绘制原则

- 简洁、规整；连线清晰，避免重叠与穿字。
- **先对齐模块再连线**；同轴优先直线（`edgeStyle=none`）。
- **禁止短拐与倾斜**；多对多优先拆列竖直贯通，慎用全宽条中途扇入/扇出。
- **禁止笔记性标注**：对照写入配对 `*.note.md`。
- 图题在图下方居中；表题在表上方居中。
- 子系统内部图只画本子系统；对外用输出条/边注概括。

## 尺寸与留白（摘要）

- 同级同尺寸；网格优先 4/10 倍数。
- 泳道 `startSize=28` 时子模块 `y ≥ 36`，禁止压住标题。
- 单行模块高约 44–56px；组内边距 12–20px；层距 20–28px。

## 视觉风格

白底、无阴影、圆角模块；**禁止**深色底、渐变、发光。`reference/` 参考图仅结构参照，不沿用其配色。

### 推荐层级色板

| 角色 | 填充 | 描边 |
|------|------|------|
| 系统服务 / 横切 | `#d5e8d4` | `#82b366` |
| 核心算法 / 主栈 | `#dae8fc` | `#6c8ebf` |
| 硬件抽象 | `#fff2cc` | `#d6b656` |
| 可选 / 旁路 | `#e1d5e7` | `#9673a6`（虚线） |

项目可在本文件扩展专题色；同文档内保持一致。

### Draw.io style 片段

```text
swimlane;startSize=28;rounded=1;whiteSpace=wrap;html=1;fillColor=#dae8fc;strokeColor=#6c8ebf;fontStyle=1;fontSize=13;pointerEvents=0;
rounded=1;whiteSpace=wrap;html=1;fillColor=#dae8fc;strokeColor=#6c8ebf;fontStyle=1;fontSize=13;
rounded=1;whiteSpace=wrap;html=1;fillColor=#e1d5e7;strokeColor=#9673a6;fontStyle=1;fontSize=12;dashed=1;dashPattern=8 4;
```

## 产出流程

1. 用 **drawio-skill** 生成/修改 `.drawio`，放入 `medias/diagrams/`
2. 在 HTML 插入 diagram-panel（slot 与文件对应）
3. `python3 scripts/sync_drawio_html_embed.py --html <页.html> --drawio medias/diagrams/<name>.drawio --slot <slot>`
4. `python3 scripts/serve_docs.py` 预览；页内保存可写回 `.drawio` 与 PNG
