export type SceneCatalog = {
    projectPath: string;
    worldPaths: string[];
};

type LoadSceneCatalogArgs = {
    fallbackProjectPath: string;
    fallbackWorldPaths: string[];
};

export const loadSceneCatalog = async ({
    fallbackProjectPath,
    fallbackWorldPaths,
}: LoadSceneCatalogArgs): Promise<SceneCatalog> => {
    try {
        const response = await fetch("/scenes/index.json");
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        const payload = (await response.json()) as { project?: unknown; worlds?: unknown };
        const projectPath = typeof payload.project === "string" && payload.project.trim().length > 0
            ? payload.project
            : fallbackProjectPath;
        const worldPaths = Array.isArray(payload.worlds)
            ? payload.worlds.filter((item): item is string => typeof item === "string" && item.trim().length > 0)
            : [];
        if (worldPaths.length === 0) {
            throw new Error("worlds 为空");
        }
        return { projectPath, worldPaths };
    } catch (error) {
        console.warn("读取 /scenes/index.json 失败，回退默认场景。", error);
        return {
            projectPath: fallbackProjectPath,
            worldPaths: [...fallbackWorldPaths],
        };
    }
};
