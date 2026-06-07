# 扩展工作流说明（Project / System / Prefab / World / Behavior）

本文档用于说明在 `my-babylonjs-app` 中新增功能时，应该如何新增并使用：

- Project
- System
- Prefab
- World
- Behavior

目标：小步可回滚、数据驱动、低风险接入。

## 1. 运行时架构速览

当前 system 运行依赖四类上下文：

- `context.states.entities`：实体索引（`all / byPrefabId / byTag / byId`）
- `context.behaviors`：实体行为数据（按 `entityId` 的 Map）
- `context.data`：全局值数据（配置、输入、运行时状态）
- `context.services`：副作用与工具能力（HUD、消息、粒子、clamp 等）

主链路：

1. 解析 XML（project + world + prefab + manifest）
2. `entityAssembler` 生成实体，并挂 `behaviorSeed`
3. `createStateRegistry` 构建 `states.entities` 与 `states.behaviors`
4. `createSystemRegistry` 创建并注册全部 system
5. 每帧执行 `world.systems` 中启用的 system

数据合并规则：

- `project.*`：跨场景全局数据（切场景保留）
- `runtime.*`：world 局部运行时数据（切场景重置）
- world 不允许定义或覆盖 `project.*` 字段

UI 引用作用域：

- `project.xml` 的 `<UiRef>` 只能指向 `/ui/global/`
- `*.world.xml` 的 `<UiRef>` 只能指向 `/ui/world/`

> 违反作用域规则会在 loader 阶段直接抛错，阻止进入半残状态。

## 2. 新增 Project（全局 UI + 跨场景数据）

### 2.1 改动清单

1. 在 `public/project/project.xml` 声明 `<DataModel><GlobalData>`。
2. 全局字段统一使用 `project.*` 命名空间。
3. 在 `<References>` 中通过 `<UiRef src="/ui/global/xxx.ui.xml" />` 引用全局 UI。
4. 在 `public/scenes/index.json` 配置 `project` 启动路径。
5. 场景启动时先加载 project，再加载 world；切 world 仅重建 world 层数据。

### 2.2 最小模板

```xml
<Project version="1" id="main_project">
  <DataModel>
    <GlobalData>
      <State key="project.ui.mainMenuVisible" value="true" valueType="boolean" />
    </GlobalData>
  </DataModel>
  <References>
    <UiRef src="/ui/global/main_menu.ui.xml" />
  </References>
</Project>
```

### 2.3 Project 层落地步骤（5 分钟清单）

- [ ] 在 `public/project/project.xml` 新增或确认 `<Project>` 根节点，包含 `id` 与 `version`。
- [ ] 在 `<DataModel><GlobalData>` 中只放 `project.*` 字段（例如 `project.ui.mainMenuVisible`）。
- [ ] 在 `<References>` 中只引用 `/ui/global/` 前缀 UI（例如 `/ui/global/main_menu.ui.xml`）。
- [ ] 在 `public/scenes/index.json` 设置 `"project": "/project/project.xml"`。
- [ ] 在每个 `*.world.xml` 中确认 `<UiRef>` 使用 `/ui/world/` 前缀，且不声明 `project.*` 字段。
- [ ] 运行 `npm run build`，再手动切换 1~2 次场景，确认全局 UI 常驻、`project.*` 数据不丢失。

快速验收（建议 30 秒）：

1. 进 `level_001`，通过全局 UI 改一个 `project.*` 布尔值。
2. 切到 `level_002`，确认该值仍保持修改后的状态。
3. 控制台无 “UiRef 作用域越权” 或 “World 覆盖 project.*” 报错。

## 3. 新增 Behavior（固定注册）

> 规则：Behavior 是“数据定义”，逻辑放在 System。

### 2.1 改动清单

1. 在 `src/behaviors/types.ts` 增加类型和 `GameBehaviors` 索引。
2. 在 `src/behaviors/registry.ts` 注册 Behavior 名（固定字符串）。
3. 在 `src/behaviors/createBehaviors.ts` 增加 seed -> runtime 行为实例转换。
4. 在 `src/world/types.ts` 的 `PrefabBehaviorDefaults` 增加该 Behavior 字段。
5. 在 `src/world/loader.ts` 同步支持：
   - `parsePrefabBehaviors` 解析 `<Behaviors><YourBehavior ... /></Behaviors>`
   - `applyOverrides` 解析 `Behaviors.YourBehavior.xxx` 路径
   - 字段类型校验与兜底逻辑

### 2.2 XML 写法

Prefab 默认值：

```xml
<Behaviors>
  <Dash cooldown="1.2" />
</Behaviors>
```

实例覆盖：

```xml
<Override path="Behaviors.Dash.cooldown" value="0.8" valueType="number" />
```

### 2.3 使用方式

在 system 中通过 `context.behaviors` 读取：

```ts
const dash = context.behaviors.dashByEntityId.get(entity.entityId);
```

## 4. 新增 System

### 3.1 改动清单

1. 在 `src/systems/definitions/` 新建 `XxxSystem.ts`，导出 `RegisteredSystem`。
2. 在 `requires` 里声明 `data` 依赖（读/写权限和类型）。
3. 在 `create(context)` 中读取：
   - `context.states.entities`（找实体）
   - `context.behaviors`（读行为数据）
   - `context.data`（读写全局状态）
   - `context.services`（副作用）
4. 在 `src/systems/registry.ts` 的 `SYSTEM_DEFINITIONS` 注册 `XxxSystem`。
5. 在 world XML 的 `<Systems>` 中声明：

```xml
<System name="XxxSystem" enabled="true" />
```

### 3.2 最小模板

```ts
export const XxxSystem: RegisteredSystem = {
  name: "XxxSystem",
  requires: [{ id: "runtime.gameOver", kind: "boolean", access: "read" }],
  create: (context) => {
    const entities = context.states.entities.byTag.get("enemy") ?? [];
    return (deltaTime) => {
      const gameOver = context.data.get("runtime.gameOver", "boolean", "XxxSystem");
      if (gameOver) return;
      // 逻辑...
    };
  },
};
```

## 5. 新增 Prefab

### 4.1 改动清单

1. 在 `public/prefabs/` 新建 `xxx.prefab.xml`
2. 写 `Root`（Transform / Renderable）
3. 写 `Behaviors`（可选）
4. 写 `Exportables`（只保留需要导出到 data 的字段）

### 4.2 最小模板

```xml
<Prefab version="1" id="enemy.rusher" groups="enemy,rusher">
  <Root>
    <Transform position="0,0.75,0" rotation="0,0,0" scaling="1,1,1" />
    <Renderable kind="primitive" assetId="mesh.enemy.sphere" diameter="1.5" />
  </Root>
  <Behaviors>
    <Movement speed="7.0" />
  </Behaviors>
  <Exportables>
    <Field path="Transform.position" valueType="vector3" />
  </Exportables>
</Prefab>
```

## 6. 新增 World（关卡）

### 5.1 改动清单

1. 在 `public/scenes/` 新建 `level_xxx.world.xml`
2. 在 `<References>` 添加 `PrefabRef`
3. 在 `<References>` 的 `<UiRef>` 仅使用 `/ui/world/` 前缀
3. 在 `<Entities>` 添加 `Instance`
4. 在 `<Systems>` 开启需要的系统
5. 可选：实例上用 `<Override path="Behaviors.xxx.yyy" ... />` 做差异化

### 5.2 最小模板片段

```xml
<References>
  <AssetManifest src="/manifests/assets.manifest.xml" />
  <UiRef src="/ui/world/hud.ui.xml" />
  <PrefabRef id="enemy.rusher" src="/prefabs/enemy_rusher.prefab.xml" />
</References>

<Entities>
  <Instance id="enemy_01" prefab="enemy.rusher">
    <Override path="Transform.position" value="6,0.75,4" valueType="vector3" />
    <Override path="Behaviors.Movement.speed" value="8.2" valueType="number" />
  </Instance>
</Entities>
```

## 7. 最常见错误与排查

- **System 未注册**：world 写了 `<System name="...">`，但 `systems/registry.ts` 未加入。
- **Behavior 未注册**：XML 里用了新 Behavior 名，但 `behaviors/registry.ts` 没有。
- **Behavior 字段不支持**：`loader.ts` 的 `applyOverrides` 没加字段处理。
- **覆盖路径不合法**：`Override.path` 不符合 `Behaviors.Xxx.field` 或不在支持列表。
- **类型不匹配**：`valueType` 与字段预期类型不一致。
- **UI 引用越权**：world 引用了 `/ui/global/`，或 project 引用了 `/ui/world/`。
- **命名空间冲突**：world 声明了 `project.*`，会在合并阶段失败。

## 8. 建议的联调顺序（最稳）

1. 先加 Behavior 类型与注册
2. 再加 loader 解析与 override 支持
3. 再改 system 使用该 Behavior
4. 最后改 prefab/world XML
5. 执行验证：
   - `npm run build`
   - 手动进场景验证玩法

## 9. 当前协议约束（务必遵守）

- 旧 `<Root><Behavior>...</Behavior></Root>` 已废弃
- 旧 `Behavior.*` 覆盖路径已废弃
- 统一使用 `<Behaviors>` 与 `Behaviors.*`
- Project 字段统一使用 `project.*`
- World `<UiRef>` 统一使用 `/ui/world/`
- Project `<UiRef>` 统一使用 `/ui/global/`

