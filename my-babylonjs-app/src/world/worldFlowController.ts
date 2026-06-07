import { loadSceneCatalog } from "./navigation/sceneCatalog";
import { createWorldSequence } from "./navigation/worldSequence";

type CreateWorldFlowControllerArgs = {
    fallbackProjectPath: string;
    fallbackWorldPaths: string[];
    initializeProject: (projectPath: string) => Promise<void>;
    switchWorld: (worldPath: string) => Promise<void>;
};

export type WorldFlowController = {
    initialize: () => Promise<void>;
    switchCurrentWorld: () => Promise<void>;
    switchToPreviousWorld: () => Promise<void>;
    switchToNextWorld: () => Promise<void>;
};

export const createWorldFlowController = ({
    fallbackProjectPath,
    fallbackWorldPaths,
    initializeProject,
    switchWorld,
}: CreateWorldFlowControllerArgs): WorldFlowController => {
    const sequence = createWorldSequence(fallbackWorldPaths);

    const switchCurrentWorld = async () => {
        await switchWorld(sequence.current());
    };

    const switchToNextWorld = async () => {
        sequence.next();
        await switchCurrentWorld();
    };

    const switchToPreviousWorld = async () => {
        sequence.previous();
        await switchCurrentWorld();
    };

    const initialize = async () => {
        const catalog = await loadSceneCatalog({
            fallbackProjectPath,
            fallbackWorldPaths,
        });
        await initializeProject(catalog.projectPath);
        sequence.reset(catalog.worldPaths);
    };

    return {
        initialize,
        switchCurrentWorld,
        switchToPreviousWorld,
        switchToNextWorld,
    };
};
