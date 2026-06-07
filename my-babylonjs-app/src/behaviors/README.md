# Behaviors 模块说明

`src/behaviors` 负责把 XML 中声明的 Behavior 数据，转换成系统可直接使用的运行时行为仓库。

## 1. XML 映射规则

Prefab 可选声明：

- `<Behaviors>`：行为默认值（prefab default）
- `<World><Entities><Instance><Override ... />`：实例级覆盖（instance override）

当前已注册的固定 Behavior：

- `<EnemyAi direction="x,y,z" />`
- `<Movement speed="number" />`
- `<Collectible value="number" collected="true|false" />`
- `<Player isPlayer="true|false" />`

实例覆盖路径格式：

- `Behaviors.EnemyAi.direction`
- `Behaviors.Movement.speed`
- `Behaviors.Collectible.value`
- `Behaviors.Collectible.collected`
- `Behaviors.Player.isPlayer`

> 旧 `<Root><Behavior>` 与 `Behavior.*` 已废弃，不再允许使用。

## 2. 优先级

Behavior 字段最终值优先级固定为：

`instance override > prefab default > fallback`

其中：

- `instance override`：`World.Instance.Override`
- `prefab default`：`Prefab.Behaviors`
- `fallback`：`createBehaviors.ts` 内的兜底值

## 3. 场景装配链路

1. `world/loader.ts`
   - 解析 `Prefab.Behaviors`
   - 在 `applyOverrides` 支持 `Behaviors.*` 覆盖
2. `scene/entityAssembler.ts`
   - 每个 `SpawnedEntity` 挂上 `behaviorSeed`
3. `behaviors/createBehaviors.ts`
   - 将 `behaviorSeed` 转为运行时行为实例
4. `scene/createGameScene.ts`
   - 将行为仓库挂入 `systemContext.behaviors`
5. `systems/*`
   - 通过 `context.behaviors` 访问行为数据

## 4. 新增 Behavior 最小模板

### XML（prefab）

```xml
<Behaviors>
  <Dash cooldown="1.2" />
</Behaviors>
```

### XML（world instance override）

```xml
<Override path="Behaviors.Dash.cooldown" value="0.8" valueType="number" />
```

### TS（types）

```ts
export type DashBehavior = {
    cooldown: number;
};

export type GameBehaviors = {
    // ...
    dashByEntityId: Map<string, DashBehavior>;
};
```

### TS（createBehaviors）

```ts
if (entity.behaviorSeed.Dash || entity.tags.includes("player")) {
    dashByEntityId.set(entity.entityId, {
        cooldown: parseNumberOrFallback(entity.behaviorSeed.Dash?.cooldown, 1.2),
    });
}
```
