import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { EntityBehaviorSeed, GameBehaviors } from "../behaviors/types";

export type SpawnedEntity = {
    entityId: string;
    prefabId: string;
    mesh: Mesh;
    tags: string[];
    behaviorSeed: EntityBehaviorSeed;
};

export type EntityRef = {
    entityId: string;
    prefabId: string;
    mesh: Mesh;
    tags: string[];
    trail?: {
        emitRate: number;
    };
};

export type GenericEntitiesState = {
    all: EntityRef[];
    byPrefabId: Map<string, EntityRef[]>;
    byTag: Map<string, EntityRef[]>;
    byId: Map<string, EntityRef>;
};

export type GameStateApi = {
    entities: GenericEntitiesState;
    behaviors: GameBehaviors;
};

export type StateBuildContext = {
    spawnedEntities: SpawnedEntity[];
    createPlayerTrail: (mesh: Mesh) => {
        emitRate: number;
    };
    randomInRange: (min: number, max: number) => number;
};

export type RegisteredStateProvider<K extends keyof GameStateApi = keyof GameStateApi> = {
    name: K;
    create: (context: StateBuildContext) => GameStateApi[K];
};
