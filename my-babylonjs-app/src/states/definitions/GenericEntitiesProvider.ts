import { RegisteredStateProvider, EntityRef } from "../types";

const pushIndexed = <K>(index: Map<K, EntityRef[]>, key: K, entity: EntityRef) => {
    const list = index.get(key);
    if (list) {
        list.push(entity);
    } else {
        index.set(key, [entity]);
    }
};

export const GenericEntitiesProvider: RegisteredStateProvider<"entities"> = {
    name: "entities",
    create: (context) => {
        const all: EntityRef[] = context.spawnedEntities.map((entity) => ({
            entityId: entity.entityId,
            prefabId: entity.prefabId,
            mesh: entity.mesh,
            tags: entity.tags,
            trail: entity.prefabId === "player.main" ? context.createPlayerTrail(entity.mesh) : undefined,
        }));

        const byPrefabId = new Map<string, EntityRef[]>();
        const byTag = new Map<string, EntityRef[]>();
        const byId = new Map<string, EntityRef>();

        for (const entity of all) {
            byId.set(entity.entityId, entity);
            pushIndexed(byPrefabId, entity.prefabId, entity);
            for (const tag of entity.tags) {
                pushIndexed(byTag, tag, entity);
            }
        }

        return {
            all,
            byPrefabId,
            byTag,
            byId,
        };
    },
};
