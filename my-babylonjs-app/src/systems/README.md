# Systems 模块说明

`src/systems` 负责游戏运行时逻辑：定义 system、声明其数据依赖、注册并在每帧执行。

## 一句话理解三类上下文

- `context.data`：全局共享值数据（number/boolean/string/vector3），带类型和读写权限校验。
- `context.states`：场景对象引用和实体集合（player/enemies/orbs/mesh/粒子对象等）。
- `context.services`：工具函数和副作用能力（clamp、随机、HUD 更新、消息、粒子爆发、重载等）。

> 判断规则：可配置且跨 system 共享的“值”放 `data`；运行时对象引用放 `states`；函数能力放 `services`。

## `requires` 的意义

每个 system 都通过 `requires` 声明自己依赖的数据字段（字段 id、类型、读/写权限）。

- 在 `registry.ts` 注册阶段，会对每个 `requires` 调用 `context.data.ensure(...)`。
- 这会在 system 启动前做预检：字段是否存在、类型是否匹配、是否允许写入。
- 好处是“早失败”（fail fast）：配置错了在启动阶段就报错，而不是跑到中途才崩。

注意：`requires` 检查的是 `data schema`，不是 `states`。

## 动态字段如何处理

像按 `entityId` 的动态数据（如行为实例 Map）无法完全靠静态 `requires` 穷举时，应在 `create(context)` 内结合 `states/behaviors` 做运行时校验。

这种“静态声明 + 动态补充校验”的组合是推荐做法。

## 目录与文件职责

- `definitions/`：每个 system 一个文件（如 `EnemyChaseSystem.ts`）。
- `registry.ts`：收集并注册全部 system，执行 `requires` 预检并创建运行实例。
- `types.ts`：`RegisteredSystem`、`GameSystemContext`、`RuntimeSystem` 等公共类型。
- `dataAccessor.ts`：`get/set/ensure` 的核心实现，负责字段类型与可写性约束。
- `services.ts`：组装系统共用服务，封装 UI 与场景副作用。

## 单个 system 文件规范

- 文件名与 `System` 名保持一致，例如 `OrbCollectSystem.ts`。
- 导出一个 `RegisteredSystem` 常量，至少包含：
  - `name`：必须与 world XML 中 `<System name="...">` 完全一致。
  - `requires`：声明依赖字段及读写权限。
  - `create(context)`：返回 `(deltaTime) => void` 的运行函数。
- system 内尽量单一职责，不要耦合过多阶段逻辑。

## 新增 system 步骤

1. 在 `definitions/` 新建 `XxxSystem.ts`，导出 `RegisteredSystem`。
2. 写清 `requires`（静态字段）；动态字段在 `create` 内补 `ensure`。
3. 在 `registry.ts` 的 `SYSTEM_DEFINITIONS` 中注册该 system。
4. 在 world XML 的 `<Systems>` 节点中声明 `<System name="XxxSystem" enabled="true" />`。

若 world 引用了未注册 system，运行时会抛错并阻止加载。
