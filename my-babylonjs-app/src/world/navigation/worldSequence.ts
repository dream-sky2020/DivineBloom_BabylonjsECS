export type WorldSequence = {
    reset: (worldPaths: string[]) => void;
    current: () => string;
    next: () => string;
    previous: () => string;
    hasMultipleWorlds: () => boolean;
};

export const createWorldSequence = (initialWorldPaths: string[]): WorldSequence => {
    let worldPaths = [...initialWorldPaths];
    let currentWorldIndex = 0;

    const reset = (nextWorldPaths: string[]) => {
        if (nextWorldPaths.length === 0) {
            throw new Error("worldPaths 不能为空");
        }
        worldPaths = [...nextWorldPaths];
        currentWorldIndex = 0;
    };

    const current = () => worldPaths[currentWorldIndex];

    const next = () => {
        currentWorldIndex = (currentWorldIndex + 1) % worldPaths.length;
        return current();
    };

    const previous = () => {
        currentWorldIndex = (currentWorldIndex - 1 + worldPaths.length) % worldPaths.length;
        return current();
    };

    const hasMultipleWorlds = () => worldPaths.length > 1;

    return {
        reset,
        current,
        next,
        previous,
        hasMultipleWorlds,
    };
};
