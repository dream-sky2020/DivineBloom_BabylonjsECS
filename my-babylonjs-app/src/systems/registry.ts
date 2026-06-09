import { BattleUiInputSystem } from "./definitions/BattleUiInputSystem";
import { InvincibilitySystem } from "./definitions/InvincibilitySystem";
import { RestartSystem } from "./definitions/RestartSystem";
import { SceneSwitchSystem } from "./definitions/SceneSwitchSystem";
import { StoryUiInputSystem } from "./definitions/StoryUiInputSystem";
import { TimeSystem } from "./definitions/TimeSystem";
import { TestEnemyChaseSystem } from "./definitions/test/TestEnemyChaseSystem";
import { TestOrbCollectSystem } from "./definitions/test/TestOrbCollectSystem";
import { TestPlayerMovementSystem } from "./definitions/test/TestPlayerMovementSystem";
import { TestUiInputSystem } from "./definitions/test/TestUiInputSystem";
import { createScopedGameDataAccessor } from "./dataAccessor";
import { GameSystemContext, RegisteredSystem, RuntimeSystem } from "./types";

const SYSTEM_DEFINITIONS: RegisteredSystem[] = [
    TimeSystem,
    StoryUiInputSystem,
    BattleUiInputSystem,
    TestUiInputSystem,
    SceneSwitchSystem,
    RestartSystem,
    TestPlayerMovementSystem,
    InvincibilitySystem,
    TestEnemyChaseSystem,
    TestOrbCollectSystem,
];

export const createSystemRegistry = (context: GameSystemContext) => {
    return createSystemRegistryForNames(context, SYSTEM_DEFINITIONS.map((definition) => definition.name));
};

export const createSystemRegistryForNames = (
    context: GameSystemContext,
    enabledSystemNames: readonly string[],
) => {
    const enabledNameSet = new Set(enabledSystemNames);
    const definitionsByName = new Map<string, RegisteredSystem>();
    for (const definition of SYSTEM_DEFINITIONS) {
        if (definitionsByName.has(definition.name)) {
            throw new Error(`System 重复注册: ${definition.name}`);
        }
        definitionsByName.set(definition.name, definition);
    }

    const systemRegistry = new Map<string, RuntimeSystem>();
    for (const name of enabledNameSet) {
        const definition = definitionsByName.get(name);
        if (!definition) {
            continue;
        }
        const scopedContext: GameSystemContext = {
            ...context,
            data: createScopedGameDataAccessor(context.data, definition.requires, definition.name),
        };
        systemRegistry.set(definition.name, definition.create(scopedContext));
    }
    return systemRegistry;
};
