import { createBehaviors } from "../../behaviors/createBehaviors";
import { RegisteredStateProvider } from "../types";

export const GenericBehaviorsProvider: RegisteredStateProvider<"behaviors"> = {
    name: "behaviors",
    create: (context) => createBehaviors({
        spawnedEntities: context.spawnedEntities,
        randomInRange: context.randomInRange,
    }),
};
