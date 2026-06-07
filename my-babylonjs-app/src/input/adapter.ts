import { GameDataAccessor } from "../systems/dataAccessor";
import { WorldInputBinding, WorldInputBindingMode } from "../world/types";
import { InputAdapter, RuntimeInputState } from "./types";

type InputBindingRuntimeEntry = {
    id: string;
    target: string;
    mode: WorldInputBindingMode;
    scale: number;
};

const buildInputBindingMap = (bindings: WorldInputBinding[]) => {
    const keyToBindings = new Map<string, InputBindingRuntimeEntry[]>();
    const bindingById = new Map<string, InputBindingRuntimeEntry>();
    for (let i = 0; i < bindings.length; i += 1) {
        const binding = bindings[i];
        const entry: InputBindingRuntimeEntry = {
            id: `${binding.target}#${i}`,
            target: binding.target,
            mode: binding.mode,
            scale: binding.scale,
        };
        bindingById.set(entry.id, entry);
        for (const key of binding.keys) {
            const entries = keyToBindings.get(key) ?? [];
            entries.push(entry);
            keyToBindings.set(key, entries);
        }
    }
    return { keyToBindings, bindingById };
};

const readRuntimeInput = (data: GameDataAccessor): RuntimeInputState => ({
    upPressed: data.get("runtime.input.upPressed", "boolean", "InputAdapter"),
    downPressed: data.get("runtime.input.downPressed", "boolean", "InputAdapter"),
    leftPressed: data.get("runtime.input.leftPressed", "boolean", "InputAdapter"),
    rightPressed: data.get("runtime.input.rightPressed", "boolean", "InputAdapter"),
    restartPressed: data.get("runtime.input.restartPressed", "boolean", "InputAdapter"),
    prevWorldPressed: data.get("runtime.input.prevWorldPressed", "boolean", "InputAdapter"),
    nextWorldPressed: data.get("runtime.input.nextWorldPressed", "boolean", "InputAdapter"),
    speedBoost: data.get("runtime.input.speedBoost", "boolean", "InputAdapter"),
    moveX: data.get("runtime.input.moveX", "number", "InputAdapter"),
    moveZ: data.get("runtime.input.moveZ", "number", "InputAdapter"),
});

const writeRuntimeInput = (data: GameDataAccessor, input: RuntimeInputState) => {
    data.set("runtime.input.upPressed", "boolean", input.upPressed, "InputAdapter");
    data.set("runtime.input.downPressed", "boolean", input.downPressed, "InputAdapter");
    data.set("runtime.input.leftPressed", "boolean", input.leftPressed, "InputAdapter");
    data.set("runtime.input.rightPressed", "boolean", input.rightPressed, "InputAdapter");
    data.set("runtime.input.restartPressed", "boolean", input.restartPressed, "InputAdapter");
    data.set("runtime.input.prevWorldPressed", "boolean", input.prevWorldPressed, "InputAdapter");
    data.set("runtime.input.nextWorldPressed", "boolean", input.nextWorldPressed, "InputAdapter");
    data.set("runtime.input.speedBoost", "boolean", input.speedBoost, "InputAdapter");
    data.set("runtime.input.moveX", "number", input.moveX, "InputAdapter");
    data.set("runtime.input.moveZ", "number", input.moveZ, "InputAdapter");
};

const recalculateMoveInput = (
    input: RuntimeInputState,
    holdBindingIds: Set<string>,
    toggleBindingIds: Set<string>,
    bindingById: Map<string, InputBindingRuntimeEntry>,
) => {
    const targetScale = new Map<string, number>();
    const applyScale = (bindingId: string) => {
        const binding = bindingById.get(bindingId);
        if (!binding) {
            return;
        }
        targetScale.set(binding.target, (targetScale.get(binding.target) ?? 0) + binding.scale);
    };
    for (const bindingId of holdBindingIds) {
        applyScale(bindingId);
    }
    for (const bindingId of toggleBindingIds) {
        applyScale(bindingId);
    }

    const upWeight = targetScale.get("runtime.input.upPressed") ?? 0;
    const downWeight = targetScale.get("runtime.input.downPressed") ?? 0;
    const leftWeight = targetScale.get("runtime.input.leftPressed") ?? 0;
    const rightWeight = targetScale.get("runtime.input.rightPressed") ?? 0;
    const restartWeight = targetScale.get("runtime.input.restartPressed") ?? 0;
    const prevWorldWeight = targetScale.get("runtime.input.prevWorldPressed") ?? 0;
    const nextWorldWeight = targetScale.get("runtime.input.nextWorldPressed") ?? 0;
    const speedBoostWeight = targetScale.get("runtime.input.speedBoost") ?? 0;

    input.upPressed = upWeight !== 0;
    input.downPressed = downWeight !== 0;
    input.leftPressed = leftWeight !== 0;
    input.rightPressed = rightWeight !== 0;
    input.restartPressed = restartWeight !== 0;
    input.prevWorldPressed = prevWorldWeight !== 0;
    input.nextWorldPressed = nextWorldWeight !== 0;
    input.speedBoost = speedBoostWeight !== 0;

    const axisX = rightWeight - leftWeight;
    const axisZ = upWeight - downWeight;
    if (axisX === 0 && axisZ === 0) {
        input.moveX = 0;
        input.moveZ = 0;
        return;
    }
    const length = Math.hypot(axisX, axisZ);
    input.moveX = axisX / length;
    input.moveZ = axisZ / length;
};

export const createInputAdapter = (): InputAdapter => {
    let data: GameDataAccessor | null = null;
    let runtimeInput: RuntimeInputState | null = null;
    let keyToBindings = new Map<string, InputBindingRuntimeEntry[]>();
    let bindingById = new Map<string, InputBindingRuntimeEntry>();
    let holdBindingIds = new Set<string>();
    let toggleBindingIds = new Set<string>();

    return {
        configure: (nextData, bindings) => {
            data = nextData;
            runtimeInput = readRuntimeInput(nextData);
            const bindingRuntime = buildInputBindingMap(bindings);
            keyToBindings = bindingRuntime.keyToBindings;
            bindingById = bindingRuntime.bindingById;
            holdBindingIds = new Set<string>();
            toggleBindingIds = new Set<string>();

            for (const binding of bindings) {
                const isPressed = nextData.get(binding.target, "boolean", "InputAdapterInit");
                if (!isPressed) {
                    continue;
                }
                const entries = binding.keys.flatMap((key) => keyToBindings.get(key) ?? []);
                for (const entry of entries) {
                    if (entry.target !== binding.target || entry.mode !== binding.mode || entry.scale !== binding.scale) {
                        continue;
                    }
                    if (entry.mode === "toggle") {
                        toggleBindingIds.add(entry.id);
                    } else {
                        holdBindingIds.add(entry.id);
                    }
                }
            }

            recalculateMoveInput(runtimeInput, holdBindingIds, toggleBindingIds, bindingById);
            writeRuntimeInput(nextData, runtimeInput);
        },
        handleKeyChange: (code, pressed, isRepeat) => {
            if (!data || !runtimeInput) {
                return;
            }
            const bindings = keyToBindings.get(code);
            if (!bindings) {
                return;
            }
            for (const binding of bindings) {
                if (binding.mode === "hold") {
                    if (pressed) {
                        holdBindingIds.add(binding.id);
                    } else {
                        holdBindingIds.delete(binding.id);
                    }
                    continue;
                }
                if (!pressed || isRepeat) {
                    continue;
                }
                if (toggleBindingIds.has(binding.id)) {
                    toggleBindingIds.delete(binding.id);
                } else {
                    toggleBindingIds.add(binding.id);
                }
            }
            recalculateMoveInput(runtimeInput, holdBindingIds, toggleBindingIds, bindingById);
            writeRuntimeInput(data, runtimeInput);
        },
    };
};
