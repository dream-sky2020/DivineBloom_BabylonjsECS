import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { SpawnedEntity } from "../states/types";
import { GameBehaviors } from "./types";

type CreateBehaviorsArgs = {
    spawnedEntities: SpawnedEntity[];
    randomInRange: (min: number, max: number) => number;
};

const createInitialDirection = (randomInRange: (min: number, max: number) => number): Vector3 => {
    const rawDirection = new Vector3(
        randomInRange(-1, 1),
        0,
        randomInRange(-1, 1),
    );
    return rawDirection.lengthSquared() > 0.0001
        ? rawDirection.normalize()
        : new Vector3(1, 0, 0);
};

const parseNumberOrFallback = (raw: string | undefined, fallback: number): number => {
    if (raw == null || raw.trim() === "") {
        return fallback;
    }
    const parsed = Number(raw);
    return Number.isNaN(parsed) ? fallback : parsed;
};

const parseBooleanOrFallback = (raw: string | undefined, fallback: boolean): boolean => {
    if (raw == null || raw.trim() === "") {
        return fallback;
    }
    if (raw === "true") {
        return true;
    }
    if (raw === "false") {
        return false;
    }
    return fallback;
};

const parseDirectionOrFallback = (
    raw: string | undefined,
    fallbackFactory: () => Vector3,
): Vector3 => {
    if (raw == null || raw.trim() === "") {
        return fallbackFactory();
    }
    const parts = raw.split(",").map((part) => Number(part.trim()));
    if (parts.length !== 3 || parts.some((part) => Number.isNaN(part))) {
        return fallbackFactory();
    }
    const direction = new Vector3(parts[0], parts[1], parts[2]);
    if (direction.lengthSquared() <= 0.0001) {
        return fallbackFactory();
    }
    return direction.normalize();
};

export const createBehaviors = ({ spawnedEntities, randomInRange }: CreateBehaviorsArgs): GameBehaviors => {
    const enemyAiByEntityId = new Map<string, { direction: Vector3 }>();
    const movementByEntityId = new Map<string, { speed: number }>();
    const collectibleByEntityId = new Map<string, { value: number; collected: boolean }>();
    const playerByEntityId = new Map<string, { isPlayer: boolean }>();

    for (const entity of spawnedEntities) {
        const hasEnemyTag = entity.tags.includes("enemy");
        const hasOrbTag = entity.tags.includes("orb");
        const hasPlayerTag = entity.tags.includes("player");

        if (entity.behaviorSeed.EnemyAi || hasEnemyTag) {
            enemyAiByEntityId.set(entity.entityId, {
                direction: parseDirectionOrFallback(
                    entity.behaviorSeed.EnemyAi?.direction,
                    () => createInitialDirection(randomInRange),
                ),
            });
        }

        if (entity.behaviorSeed.Movement || hasEnemyTag || hasPlayerTag) {
            movementByEntityId.set(entity.entityId, {
                speed: parseNumberOrFallback(entity.behaviorSeed.Movement?.speed, 0),
            });
        }

        if (entity.behaviorSeed.Collectible || hasOrbTag) {
            collectibleByEntityId.set(entity.entityId, {
                value: parseNumberOrFallback(entity.behaviorSeed.Collectible?.value, 1),
                collected: parseBooleanOrFallback(entity.behaviorSeed.Collectible?.collected, false),
            });
        }

        if (entity.behaviorSeed.Player || hasPlayerTag) {
            playerByEntityId.set(entity.entityId, {
                isPlayer: parseBooleanOrFallback(entity.behaviorSeed.Player?.isPlayer, true),
            });
        }
    }

    return {
        enemyAiByEntityId,
        movementByEntityId,
        collectibleByEntityId,
        playerByEntityId,
    };
};
