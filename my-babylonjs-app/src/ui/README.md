# UI Architecture

本目录采用“面板驱动 + 元素驱动”的混合架构。

## 目录约定

- `core/`
  - 元素驱动底座：`types`、`registry`、`xmlLayout`、`babylonXmlUi`
  - 负责 XML 语义解析与 Babylon GUI fallback 渲染
- `panels/`
  - 面板驱动层：每个业务面板单独目录
  - 通过 `panels/registry.ts` 按 `layout.id` 分发渲染器
- `dom/`
  - DOM 容器层（canvas、overlayRoot、消息与开发态 UI）

## 运行策略

1. `worldLoader` 从 `uiSrc/globalUiRefs` 读取 XML 并得到 `UiLayoutConfig[]`
2. `createGameScene` 调用 `createUiRuntimes(...)` 创建 UI 运行时
3. `panels/registry.ts`：
   - 命中面板渲染器：走 React/Bespoke 面板
   - 未命中：回退到 `core/babylonXmlUi`（fallback）

## 新增一个面板

以 `battle.main` 为例：

1. 新建目录 `panels/battle/`
2. 实现渲染器函数，签名遵循 `panels/types.ts` 的 `PanelRenderer`
3. 在 `panels/registry.ts` 注册：
   - key: `"battle.main"`
   - value: `createBattlePanelRenderer`
4. 在 world/project XML 中把面板 layout 的 `id` 设置为 `battle.main`

## 命名规范

- 面板目录名建议与 layout id 主体一致，如 `story.main -> panels/story`
- 渲染器入口建议命名：`<panelName>PanelRenderer.tsx`
- 面板内部可包含：
  - `<PanelName>Overlay.tsx`
  - `*Binding.ts`
  - `*.css`

## 兼容性

- 面板未迁移前，仍可继续使用 XML 元素驱动 fallback。
- 迁移可按面板逐个进行，不要求一次性完成。
