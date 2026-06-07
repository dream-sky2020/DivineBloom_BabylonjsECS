# Prefab 配置说明

`public/prefabs` 存放可复用预制体定义（XML）。
运行时会由 `world` 中的 `<PrefabRef>` 引用，并在 `<Entities>` 里实例化成具体对象。

## 1. 基本结构

```xml
<Prefab version="1" id="your.prefab.id">
  <Root>
    <Transform position="0,0,0" rotation="0,0,0" scaling="1,1,1" />
    <Renderable kind="primitive" assetId="mesh.xxx" size="1.6">
      <Material type="standard" diffuseColor="#ffffff" specularColor="#000000" />
    </Renderable>
  </Root>
  <Behaviors>
    <Movement speed="6.0" />
  </Behaviors>
  <Exportables>
    <Field path="Transform.position" valueType="vector3" />
  </Exportables>
</Prefab>
```

## 2. Behavior 挂载规则

- 使用 `<Behaviors>` 挂载固定注册的 Behavior。
- 当前注册：`EnemyAi`、`Movement`、`Collectible`、`Player`。
- world 实例覆盖路径使用 `Behaviors.*`，例如：
  - `Behaviors.Movement.speed`
  - `Behaviors.Collectible.value`

## 3. 旧语法状态

- `<Root><Behavior>...</Behavior></Root>` 已废弃。
- `Exportables` 里的 `Behavior.*` 已废弃。
- `Override path="Behavior.*"` 已废弃。

上述旧写法会在 loader 阶段直接报错。

## 4. Exportables 作用

`<Exportables>` 只用于声明可导出到 DataModel 的字段（如 `Transform.position`）。
Behavior 数据不再通过 Exportables 导出，统一走 `context.behaviors`。
