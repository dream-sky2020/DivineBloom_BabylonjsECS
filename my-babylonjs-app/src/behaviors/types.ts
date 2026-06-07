import { Vector3 } from "@babylonjs/core/Maths/math.vector";

export type EnemyAiBehavior = {
    direction: Vector3;
};

export type MovementBehavior = {
    speed: number;
};

export type CollectibleBehavior = {
    value: number;
    collected: boolean;
};

export type PlayerBehavior = {
    isPlayer: boolean;
};

export type EntityBehaviorSeed = {
    EnemyAi?: {
        direction?: string;
    };
    Movement?: {
        speed?: string;
    };
    Collectible?: {
        value?: string;
        collected?: string;
    };
    Player?: {
        isPlayer?: string;
    };
};

export type GameBehaviors = {
    enemyAiByEntityId: Map<string, EnemyAiBehavior>;
    movementByEntityId: Map<string, MovementBehavior>;
    collectibleByEntityId: Map<string, CollectibleBehavior>;
    playerByEntityId: Map<string, PlayerBehavior>;
};
