export const REGISTERED_BEHAVIOR_NAMES = [
    "EnemyAi",
    "Movement",
    "Collectible",
    "Player",
    "TurnBasedUnit",
] as const;

export type RegisteredBehaviorName = (typeof REGISTERED_BEHAVIOR_NAMES)[number];

const REGISTERED_BEHAVIOR_NAME_SET = new Set<string>(REGISTERED_BEHAVIOR_NAMES);

export const isRegisteredBehaviorName = (name: string): name is RegisteredBehaviorName => (
    REGISTERED_BEHAVIOR_NAME_SET.has(name)
);
