import { GenericEntitiesProvider } from "./definitions/GenericEntitiesProvider";
import { GenericBehaviorsProvider } from "./definitions/GenericBehaviorsProvider";
import { GameStateApi, RegisteredStateProvider, StateBuildContext } from "./types";

const STATE_PROVIDERS: RegisteredStateProvider[] = [
    GenericEntitiesProvider,
    GenericBehaviorsProvider,
];

export const createStateRegistry = (context: StateBuildContext): GameStateApi => {
    const states = {} as GameStateApi;
    for (const provider of STATE_PROVIDERS) {
        if (provider.name in states) {
            throw new Error(`StateProvider 重复注册: ${provider.name}`);
        }
        states[provider.name] = provider.create(context) as never;
    }
    return states;
};
