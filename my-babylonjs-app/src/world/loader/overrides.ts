import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { PrefabBehaviorDefaults, PrefabDef, ValueType, WorldOverrideDef } from "../types";
import {
    clonePrefabBehaviorDefaults,
    parseBoolean,
    parseNumber,
    parseTypedValue,
    parseVector3,
} from "./shared";

export const applyOverrides = (prefab: PrefabDef, overrides: WorldOverrideDef[]) => {
    const instance: PrefabDef = {
        ...prefab,
        tags: [...prefab.tags],
        transformPosition: prefab.transformPosition.clone(),
        renderable: { ...prefab.renderable },
        exportables: prefab.exportables,
        behaviors: clonePrefabBehaviorDefaults(prefab.behaviors),
    };

    for (const override of overrides) {
        if (override.path.startsWith("Behaviors.")) {
            const behaviorPath = override.path.slice("Behaviors.".length);
            const [behaviorName, fieldName] = behaviorPath.split(".");
            if (!behaviorName || !fieldName) {
                throw new Error(`Prefab ${prefab.id} Behavior 覆盖路径非法: ${override.path}`);
            }
            const assertValueType = (expectedType: ValueType) => {
                if (override.valueType && override.valueType !== expectedType) {
                    throw new Error(
                        `Prefab ${prefab.id} Behavior 覆盖 ${override.path} 类型不匹配: 期望 ${expectedType}，传入 ${override.valueType}`,
                    );
                }
            };

            const setBehaviorStringValue = (behaviorKey: keyof PrefabBehaviorDefaults, fieldKey: string) => {
                if (!instance.behaviors[behaviorKey]) {
                    instance.behaviors[behaviorKey] = {};
                }
                (instance.behaviors[behaviorKey] as Record<string, string | undefined>)[fieldKey] = override.value;
            };

            if (behaviorName === "EnemyAi") {
                if (fieldName !== "direction") {
                    throw new Error(`Prefab ${prefab.id} EnemyAi 不支持字段: ${fieldName}`);
                }
                assertValueType("vector3");
                parseVector3(override.value, `Prefab ${prefab.id} Behavior 覆盖 ${override.path}`);
                setBehaviorStringValue("EnemyAi", fieldName);
                continue;
            }

            if (behaviorName === "Movement") {
                if (fieldName !== "speed") {
                    throw new Error(`Prefab ${prefab.id} Movement 不支持字段: ${fieldName}`);
                }
                assertValueType("number");
                parseNumber(override.value, 0, `Prefab ${prefab.id} Behavior 覆盖 ${override.path}`);
                setBehaviorStringValue("Movement", fieldName);
                continue;
            }

            if (behaviorName === "Collectible") {
                if (fieldName === "value") {
                    assertValueType("number");
                    parseNumber(override.value, 0, `Prefab ${prefab.id} Behavior 覆盖 ${override.path}`);
                    setBehaviorStringValue("Collectible", fieldName);
                    continue;
                }
                if (fieldName === "collected") {
                    assertValueType("boolean");
                    parseBoolean(override.value, false, `Prefab ${prefab.id} Behavior 覆盖 ${override.path}`);
                    setBehaviorStringValue("Collectible", fieldName);
                    continue;
                }
                throw new Error(`Prefab ${prefab.id} Collectible 不支持字段: ${fieldName}`);
            }

            if (behaviorName === "Player") {
                if (fieldName !== "isPlayer") {
                    throw new Error(`Prefab ${prefab.id} Player 不支持字段: ${fieldName}`);
                }
                assertValueType("boolean");
                parseBoolean(override.value, false, `Prefab ${prefab.id} Behavior 覆盖 ${override.path}`);
                setBehaviorStringValue("Player", fieldName);
                continue;
            }

            if (behaviorName === "TurnBasedUnit") {
                if (
                    fieldName !== "hp"
                    && fieldName !== "attack"
                    && fieldName !== "defense"
                    && fieldName !== "agility"
                    && fieldName !== "actionPoints"
                ) {
                    throw new Error(`Prefab ${prefab.id} TurnBasedUnit 不支持字段: ${fieldName}`);
                }
                assertValueType("number");
                parseNumber(override.value, 0, `Prefab ${prefab.id} Behavior 覆盖 ${override.path}`);
                setBehaviorStringValue("TurnBasedUnit", fieldName);
                continue;
            }

            throw new Error(`Prefab ${prefab.id} 不支持的 Behavior: ${behaviorName}`);
        }

        const expectedType = instance.exportables.get(override.path);
        if (!expectedType) {
            throw new Error(`Prefab ${prefab.id} 不允许覆盖字段: ${override.path}`);
        }
        if (override.valueType && override.valueType !== expectedType) {
            throw new Error(
                `Prefab ${prefab.id} 覆盖字段 ${override.path} 类型不匹配: 期望 ${expectedType}，传入 ${override.valueType}`,
            );
        }

        const typedValue = parseTypedValue(
            override.value,
            expectedType,
            `Prefab ${prefab.id} 覆盖字段 ${override.path}`,
        );

        if (override.path === "Transform.position") {
            instance.transformPosition = typedValue as Vector3;
            continue;
        }

        if (override.path === "Renderable.Material.diffuseColor") {
            instance.renderable.materialDiffuseColor = typedValue as string;
            continue;
        }

        if (override.path === "Renderable.size") {
            instance.renderable.size = typedValue as number;
            continue;
        }

        throw new Error(`Prefab ${prefab.id} 暂不支持的覆盖路径: ${override.path}`);
    }

    return instance;
};
