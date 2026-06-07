# Input 接入说明（如何添加新的输入）

当前项目的输入链路是：

1. `project.xml / *.world.xml` 里声明输入状态字段（`runtime.input.*`）  
2. 在对应 XML 的 `<InputBindings>` 里绑定按键  
3. `src/input/adapter.ts` 把按键状态写回 `runtime.input.*`  
4. `src/systems/definitions/*.ts` 的 System 读取 `runtime.input.*` 并执行业务  

---

## 一、先加数据字段（必做）

在 `project.xml`（全局）或 `world.xml`（场景局部）新增：

```xml
<State key="runtime.input.dashPressed" value="false" valueType="boolean" />
```

规则：

- 输入字段统一使用 `runtime.input.*`
- `InputBindings` 目标字段必须是 `boolean`

---

## 二、加按键绑定（必做）

在同一个 XML 的 `<InputBindings>` 中新增：

```xml
<Binding target="runtime.input.dashPressed" keys="Space" mode="hold" scale="1" />
```

说明：

- `keys` 可写多个，逗号分隔（如 `KeyQ,ShiftLeft`）
- `mode`：
  - `hold`：按下为 true，松开为 false
  - `toggle`：每次按下切换 true/false
- `scale` 不能为 `0`

---

## 三、更新 `src/input/types.ts`（通常要做）

在 `RuntimeInputState` 里新增字段：

```ts
dashPressed: boolean;
```

---

## 四、更新 `src/input/adapter.ts`（通常要做）

把新字段接入这三处：

1. `readRuntimeInput` 读取：

```ts
dashPressed: data.get("runtime.input.dashPressed", "boolean", "InputAdapter"),
```

2. `writeRuntimeInput` 写回：

```ts
data.set("runtime.input.dashPressed", "boolean", input.dashPressed, "InputAdapter");
```

3. `recalculateMoveInput` 里按 target 计算布尔值（若不是移动轴，仅像按钮一样处理）：

```ts
const dashWeight = targetScale.get("runtime.input.dashPressed") ?? 0;
input.dashPressed = dashWeight !== 0;
```

---

## 五、让 System 消费输入（必做）

在目标 system 里声明依赖并读取：

```ts
requires: [
  { id: "runtime.input.dashPressed", kind: "boolean", access: "read" },
]
```

```ts
const dashPressed = context.data.get("runtime.input.dashPressed", "boolean", "YourSystem");
```

> 当前项目约束：UI/输入只写 data，业务逻辑由 System 读取 data 驱动。

---

## 六、选择放在 Project 还是 World

- 放 `project.xml`：跨场景都可用（如 `prevWorldPressed/nextWorldPressed`）
- 放 `world.xml`：仅当前场景有效

---

## 七、快速自检清单

- [ ] `State` 已声明为 `boolean`
- [ ] `Binding.target` 与 `State.key` 完全一致
- [ ] `types.ts` 已加字段
- [ ] `adapter.ts` 已完成读/写/计算接入
- [ ] System 的 `requires` 已声明该输入
- [ ] `npm run build` 通过

