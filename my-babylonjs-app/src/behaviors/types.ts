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

export type TurnBasedUnitBehavior = {
    hp: number;
    attack: number;
    defense: number;
    agility: number;
    actionPoints: number;
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
    TurnBasedUnit?: {
        hp?: string;
        attack?: string;
        defense?: string;
        agility?: string;
        actionPoints?: string;
    };
};

export type GameBehaviors = {
    enemyAiByEntityId: Map<string, EnemyAiBehavior>;
    movementByEntityId: Map<string, MovementBehavior>;
    collectibleByEntityId: Map<string, CollectibleBehavior>;
    playerByEntityId: Map<string, PlayerBehavior>;
    turnBasedUnitByEntityId: Map<string, TurnBasedUnitBehavior>;
};
