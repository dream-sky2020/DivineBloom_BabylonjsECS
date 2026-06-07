import { EnemyChaseSystem } from "./definitions/EnemyChaseSystem";
import { InvincibilitySystem } from "./definitions/InvincibilitySystem";
import { OrbCollectSystem } from "./definitions/OrbCollectSystem";
import { PlayerMovementSystem } from "./definitions/PlayerMovementSystem";
import { RestartSystem } from "./definitions/RestartSystem";
import { SceneSwitchSystem } from "./definitions/SceneSwitchSystem";
import { TimeSystem } from "./definitions/TimeSystem";
import { UiInputSystem } from "./definitions/UiInputSystem";
import { createScopedGameDataAccessor } from "./dataAccessor";
import { GameSystemContext, RegisteredSystem, RuntimeSystem } from "./types";

const SYSTEM_DEFINITIONS: RegisteredSystem[] = [
    TimeSystem,
    UiInputSystem,
    SceneSwitchSystem,
    RestartSystem,
    PlayerMovementSystem,
    InvincibilitySystem,
    EnemyChaseSystem,
    OrbCollectSystem,
];

export const createSystemRegistry = (context: GameSystemContext) => {
    const systemRegistry = new Map<string, RuntimeSystem>();
    for (const definition of SYSTEM_DEFINITIONS) {
        if (systemRegistry.has(definition.name)) {
            throw new Error(`System 重复注册: ${definition.name}`);
        }
        const scopedContext: GameSystemContext = {
            ...context,
            data: createScopedGameDataAccessor(context.data, definition.requires, definition.name),
        };
        systemRegistry.set(definition.name, definition.create(scopedContext));
    }
    return systemRegistry;
};
