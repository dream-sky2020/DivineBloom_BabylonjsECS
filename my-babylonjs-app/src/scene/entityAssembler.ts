import { Scene } from "@babylonjs/core/scene";
import { SpawnedEntity } from "../states/types";
import { GameDataAccessor } from "../systems/dataAccessor";
import { applyOverrides } from "../world/worldLoader";
import { AssetDef, WorldConfig, PrefabDef } from "../world/types";
import { createEntityMesh } from "./entityFactory";

type AssembleWorldEntitiesArgs = {
    scene: Scene;
    world: WorldConfig;
    assets: Map<string, AssetDef>;
    prefabs: Map<string, PrefabDef>;
    data: GameDataAccessor;
};

export const assembleWorldEntities = ({
    scene,
    world,
    assets,
    prefabs,
    data,
}: AssembleWorldEntitiesArgs): SpawnedEntity[] => {
    const spawnedEntities: SpawnedEntity[] = [];

    for (const entity of world.entities) {
        const prefab = prefabs.get(entity.prefabId);
        if (!prefab) {
            throw new Error(`未找到 prefab: ${entity.prefabId}`);
        }
        const instance = applyOverrides(prefab, entity.overrides);
        const mesh = createEntityMesh({ scene, entityId: entity.id, assets, instance });

        spawnedEntities.push({
            entityId: entity.id,
            prefabId: entity.prefabId,
            mesh,
            tags: Array.from(new Set([...prefab.tags, ...entity.tags])),
            behaviorSeed: instance.behaviors,
        });

        const positionPropertyId = `${entity.id}.Transform.position`;
        if (data.has(positionPropertyId)) {
            data.set(positionPropertyId, "vector3", mesh.position, "SceneAssembler");
        }
    }

    return spawnedEntities;
};
