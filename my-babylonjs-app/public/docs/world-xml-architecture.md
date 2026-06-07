# Babylon.js 多场景与 Prefab XML 方案设计

本文档定义 `my-babylonjs-app` 从“单脚本场景”升级为“多场景 + XML 配置 + Prefab 复用导出”的完整方案。  
目标是先稳定数据标准，再进行代码改造。

---

## 1. 目标与边界

### 1.1 目标

- 支持多个独立场景（关卡）按需加载与切换。
- 使用 XML 保存场景数据，便于策划可读、可版本管理、可工具导出。
- 支持将游戏对象导出为 Prefab，并在不同场景中复用。
- 支持实例级覆盖（位置、材质参数、Behavior 数据等）。
- 为后续可视化编辑器和自动导出预留稳定格式。

### 1.2 非目标（当前阶段不做）

- 不在 XML 中直接写可执行脚本。
- 不在第一阶段实现复杂可视化编辑器。
- 不追求一次性覆盖全部 Babylon 能力，先覆盖项目常用能力。

---

## 2. 目录结构约定

建议采用以下目录布局：

```text
public/
  docs/
    world-xml-architecture.md
  scenes/
    level_001.world.xml
    level_002.world.xml
  prefabs/
    player.prefab.xml
    enemy_chaser.prefab.xml
    coin.prefab.xml
  manifests/
    assets.manifest.xml
```

说明：

- `scenes/` 只放场景级组织数据（实例摆放、场景配置、引用哪些 prefab）。
- `prefabs/` 放可复用模板定义。
- `manifests/` 放资源清单，统一维护模型/纹理等资源路径。

---

## 3. 核心数据模型

采用四层模型：

1. **Project 层**：跨场景数据与全局 UI 引用。  
2. **Asset Manifest 层**：资源 ID 到具体路径的映射。  
3. **Prefab 层**：可复用对象模板，提供默认组件和可覆盖字段。  
4. **World 层**：具体场景实例化与覆盖数据。  

运行时流程：

`project.xml + world.xml + prefab.xml + manifest.xml -> 解析与校验 -> 数据合并 -> Babylon 构建器 -> Scene 实例`

---

## 4. XML 文件规范

### 4.1 资产清单（assets.manifest.xml）

用于解耦“业务数据”与“真实资源路径”。

```xml
<AssetManifest version="1">
  <Assets>
    <Asset id="tex.coin" type="texture" src="/assets/coin.svg" />
    <Asset id="tex.particle.white" type="texture" src="/assets/particle_white.svg" />
    <Asset id="mesh.enemy.basic" type="primitive" primitive="sphere" />
  </Assets>
</AssetManifest>
```

字段建议：

- `id`：全局唯一资源 ID。
- `type`：`texture | model | material | primitive | audio`。
- `src`：静态资源路径（`primitive` 可不填）。
- `primitive`：内建网格类型（`box | sphere | plane | ground` 等）。

---

### 4.2 Prefab 定义（*.prefab.xml）

Prefab 文件定义“一个可复用模板”。

```xml
<Prefab version="1" id="enemy.chaser">
  <Root>
    <Transform position="0,0.75,0" rotation="0,0,0" scaling="1,1,1" />

    <Renderable kind="primitive" assetId="mesh.enemy.basic">
      <Material type="standard" diffuseColor="#f23a3a" specularColor="#000000" />
    </Renderable>

    <Collider kind="sphere" radius="0.75" />

  </Root>

  <Behaviors>
    <EnemyAi direction="1,0,0" />
    <Movement speed="5.5" />
  </Behaviors>

  <Exportables>
    <Field path="Transform.position" />
    <Field path="Renderable.Material.diffuseColor" />
  </Exportables>
</Prefab>
```

约束：

- `id` 必须全局唯一。
- `Exportables` 用于声明实例允许覆盖哪些字段。
- `<Behaviors>` 中的节点名必须是已注册的固定 Behavior（如 `EnemyAi`、`Movement`）。
- 旧 `<Root><Behavior>...</Behavior></Root>` 已废弃。
- 旧 `Exportables` 的 `Behavior.*` 已废弃。

---

### 4.3 场景定义（*.world.xml）

World 文件定义“场景中有哪些实例”。

```xml
<World version="1" id="level_001">
  <SceneConfig clearColor="#0d1420" gravity="0,-9.81,0" />

  <References>
    <AssetManifest src="/manifests/assets.manifest.xml" />
    <PrefabRef id="player.main" src="/prefabs/player.prefab.xml" />
    <PrefabRef id="enemy.chaser" src="/prefabs/enemy_chaser.prefab.xml" />
    <PrefabRef id="pickup.coin" src="/prefabs/coin.prefab.xml" />
  </References>

  <Entities>
    <Instance id="player_1" prefab="player.main">
      <Override path="Transform.position" value="0,0.8,0" />
    </Instance>

    <Instance id="enemy_01" prefab="enemy.chaser">
      <Override path="Transform.position" value="8,0.75,6" />
      <Override path="Behaviors.Movement.speed" value="6.2" valueType="number" />
      <Override path="Renderable.Material.diffuseColor" value="#ff4d4d" />
    </Instance>

    <Instance id="coin_01" prefab="pickup.coin">
      <Override path="Transform.position" value="-6,1.2,4" />
    </Instance>
  </Entities>
</World>
```

约束：

- `Instance.prefab` 必须能在 `References` 中解析到。
- `Override.path` 必须在目标 prefab 的 `Exportables` 白名单中。
- `valueType` 可选：`number | boolean | string | vector3 | color3`。
- `<UiRef>` 只能使用 `/ui/world/` 前缀。
- world 不允许定义 `project.*` 命名空间字段。

---

### 4.4 项目定义（project.xml）

Project 文件定义跨场景常驻的配置。

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

约束：

- `GlobalData` 字段必须使用 `project.*` 命名空间。
- `<UiRef>` 只能使用 `/ui/global/` 前缀。
- `globalSystems` 可选，作为后续全局系统扩展点。

---

## 5. 类型与字段约定

### 5.1 基础值编码

- `Vector3`：`x,y,z`（例：`1,0.5,-3`）。
- `Color3`：统一用 `#rrggbb`。
- `Boolean`：`true | false`。
- `Number`：十进制字符串（例：`6.2`）。

### 5.2 字段路径（path）命名

采用“组件路径”形式：

- `Transform.position`
- `Transform.rotation`
- `Renderable.Material.diffuseColor`
- `Behaviors.Movement.speed`

不得出现数组索引写法，保持解析器简单稳定。

### 5.3 数据命名空间规则

- `project.*`：跨场景数据，切换 world 时保留。
- `runtime.*`：场景局部运行时数据，切换 world 时按 world 初始值重建。
- 其余非 `project.*` 字段默认归 world 本地作用域。

---

## 6. 运行时模块设计（后续代码改造目标）

建议拆分为以下模块：

1. `world-loader.ts`
   - 负责读取并解析 world xml。
   - 拉取关联 prefab / manifest。
   - 产出 `WorldDTO`。

2. `prefab-registry.ts`
   - 缓存 prefab 定义。
   - 提供 `instantiate(prefabId, overrides)`。

3. `asset-resolver.ts`
   - 通过 `assetId` 解析路径和类型。
   - 统一处理贴图、模型、primitive 创建策略。

4. `scene-factory.ts`
   - 从 `WorldDTO` 构建 Babylon `Scene`。
   - 注入相机、灯光、实例实体和系统绑定。

5. `behavior-registry.ts`
   - 固定 Behavior 名称的注册与校验（如 `EnemyAi`、`Movement`）。

---

## 7. Prefab 导出规范

### 7.1 导出内容

一个 Prefab 导出应包含：

- `Prefab id` 与 `version`。
- 可重建对象所需的最小数据集合（Transform/Renderable/Collider/Behaviors）。
- `Exportables` 白名单。

### 7.2 不导出的内容

- 运行时临时状态（计时器当前进度、动态粒子瞬时数据）。
- 引擎内部引用（指针、缓存、运行时 UID）。

### 7.3 导出命名建议

- `enemy.chaser`、`pickup.coin`、`player.main`。
- 使用“域.类型”命名，避免碰撞。

---

## 8. 场景切换规范

建议使用统一入口：

- `loadWorld(worldPath)`：加载并构建新场景。
- `unloadCurrentWorld()`：清理旧场景资源。
- `switchWorld(worldPath)`：按顺序执行卸载和加载。

切换时应处理：

- 输入监听解绑。
- 粒子系统和观察者释放。
- 旧场景网格与材质释放。

---

## 9. 校验与错误处理

启动时对 XML 做两级校验：

1. **结构校验**：节点是否齐全、属性是否存在。  
2. **语义校验**：Prefab 是否存在、覆盖字段是否允许、类型是否匹配。  

失败策略：

- 开发环境：抛出详细错误（文件、节点、字段）。
- 运行环境：记录日志并中断该场景加载，避免半残状态。

关键校验规则：

- world 的 `<UiRef>` 必须匹配 `/ui/world/`。
- project 的 `<UiRef>` 必须匹配 `/ui/global/`。
- world 不允许覆盖 project 命名空间字段。

---

## 10. 版本与兼容策略

### 10.1 版本字段

所有顶层文件必须带 `version`：

- `<World version="1">`
- `<Prefab version="1">`
- `<AssetManifest version="1">`

### 10.2 兼容策略

- 小改动：增加可选字段，保持向后兼容。
- 大改动：版本号升级，并提供迁移器（`v1 -> v2`）。

---

## 11. 分阶段实施计划

### 阶段 A：规范落地（当前）

- 完成本文档。
- 确认目录结构与 XML 字段命名。

### 阶段 B：最小可运行加载链

- 实现 `assets.manifest.xml` + `enemy/coin/player` 三个 prefab。
- 实现 `level_001.world.xml`。
- 用新加载链跑通现有玩法（移动、追逐、收集、计分）。

### 阶段 C：完善导出与校验

- 增加 `Exportables` 白名单校验。
- 增加语义错误报告。
- 增加 Prefab 导出工具函数（对象 -> prefab xml）。

### 阶段 D：多场景切换

- 加入关卡切换器。
- 统一生命周期清理逻辑。

---

## 12. 当前项目的建议首个样例集

建议先落地四个 XML：

1. `/manifests/assets.manifest.xml`
2. `/prefabs/player.prefab.xml`
3. `/prefabs/enemy_chaser.prefab.xml`
4. `/scenes/level_001.world.xml`

这样可在不重写玩法规则的前提下，先完成“数据驱动装配”。

---

## 13. 结论

先以 **“World 负责编排，Prefab 负责复用，Manifest 负责资源映射”** 为核心原则。  
该方案与 ECS 文档中的 `World/Prefab/Instance` 思路一致，且更贴合 Babylon 项目的资产管理方式。  
在此基础上再改造 `src/index.ts`，可以显著降低后续多场景迭代成本。
