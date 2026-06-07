# States 模块说明

`src/states` 负责把场景里已经生成好的实体（`spawnedEntities`）整理成 **系统可直接使用的运行时索引**。

它不负责创建 mesh，也不负责业务逻辑计算。  
可以把它理解成：给 `systems` 提供“按不同维度查实体”的统一入口。

## 1. 这个模块在整条链路里的位置

大致流程：

1. `scene/entityAssembler.ts` 创建实体并得到 `spawnedEntities`
2. `states/registry.ts` 调用 `GenericEntitiesProvider`
3. 得到 `GameStateApi.entities` 索引结构
4. `systems` 在每帧里通过 `context.states.entities` 查询实体并执行逻辑

## 2. 目录职责

- `types.ts`
  - 定义 `SpawnedEntity`、`StateBuildContext`、`GameStateApi`、`RegisteredStateProvider`
- `registry.ts`
  - 统一注册并构建所有 states
  - 防止重复注册
- `definitions/GenericEntitiesProvider.ts`
  - 统一构建实体索引（`all` / `byPrefabId` / `byTag` / `byId`）

## 3. GenericEntitiesState 能做什么

`context.states.entities` 结构包含：

- `all: EntityRef[]`：全部实体
- `byPrefabId: Map<string, EntityRef[]>`：按 prefab 分组
- `byTag: Map<string, EntityRef[]>`：按标签分组（来自 XML 的 `tags` / `groups`）
- `byId: Map<string, EntityRef>`：按 entityId 快速定位

## 4. 系统如何使用

示例：

- 玩家：`context.states.entities.byPrefabId.get("player.main")?.[0]`
- 敌人数组：`context.states.entities.byPrefabId.get("enemy.chaser") ?? []`
- 标签分组：`context.states.entities.byTag.get("enemy") ?? []`
- 按 ID：`context.states.entities.byId.get("enemy_01")`

`EntityRef` 内还包含：

- `mesh`
- `prefabId`
- `entityId`
- `tags`
- `trail?`（玩家实体会挂载拖尾粒子对象）

## 5. 什么时候需要改 states

通常只有两种情况：

1. 你需要新的索引维度（例如 `byBehaviorType`）
2. 你需要在 `EntityRef` 上挂新的运行时引用字段

如果只是新增 prefab 或新增实例，通常不需要改 `states` 代码。
