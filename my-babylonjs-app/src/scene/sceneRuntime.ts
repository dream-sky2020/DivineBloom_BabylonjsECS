import { Engine } from "@babylonjs/core/Engines/engine";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { Scene } from "@babylonjs/core/scene";
import { InputAdapter } from "../input/types";
import { DomGameUi } from "../ui/domGameUi";
import { loadProjectBundle, loadWorldBundle } from "../world/worldLoader";
import { ProjectBundle, WorldPropertyValue } from "../world/types";
import { createGameScene } from "./createGameScene";

const cloneWorldPropertyValue = (value: WorldPropertyValue): WorldPropertyValue => (
    value instanceof Vector3 ? value.clone() : value
);

type CreateSceneRuntimeArgs = {
    engine: Engine;
    ui: DomGameUi;
    isDeveloperMode: boolean;
    inputAdapter: InputAdapter;
    clamp: (value: number, min: number, max: number) => number;
    randomInRange: (min: number, max: number) => number;
};

export type SceneRuntime = {
    initializeProject: (projectPath: string) => Promise<void>;
    setWorldNavigationHandlers: (handlers: {
        switchToPreviousWorld: () => Promise<void>;
        switchToNextWorld: () => Promise<void>;
    }) => void;
    switchWorld: (worldPath: string) => Promise<void>;
};

export const createSceneRuntime = ({
    engine,
    ui,
    isDeveloperMode,
    inputAdapter,
    clamp,
    randomInRange,
}: CreateSceneRuntimeArgs): SceneRuntime => {
    let currentScene: Scene | null = null;
    let currentSceneSnapshot: (() => Map<string, WorldPropertyValue>) | null = null;
    let isSwitchingWorld = false;
    let renderLoopStarted = false;
    let projectBundle: ProjectBundle | null = null;
    let projectPath = "";
    let projectStateValues = new Map<string, WorldPropertyValue>();
    let worldNavigationHandlers: {
        switchToPreviousWorld: () => Promise<void>;
        switchToNextWorld: () => Promise<void>;
    } = {
        switchToPreviousWorld: async () => {},
        switchToNextWorld: async () => {},
    };

    const initializeProject = async (nextProjectPath: string) => {
        if (!projectBundle || projectPath !== nextProjectPath) {
            const loadedProjectBundle = await loadProjectBundle(nextProjectPath);
            projectBundle = loadedProjectBundle;
            projectPath = nextProjectPath;
            projectStateValues = new Map<string, WorldPropertyValue>();
            for (const [id, value] of loadedProjectBundle.project.globalStateInitialValues.entries()) {
                projectStateValues.set(id, cloneWorldPropertyValue(value));
            }
        }
    };

    const switchWorld = async (worldPath: string) => {
        if (isSwitchingWorld) {
            return;
        }

        isSwitchingWorld = true;
        ui.setDevStatus(`开发者模式: 加载 ${worldPath}`);

        try {
            if (!projectBundle) {
                throw new Error("Project 尚未初始化，请先调用 initializeProject()");
            }
            const activeProjectBundle = projectBundle;
            if (currentSceneSnapshot) {
                for (const [id, value] of currentSceneSnapshot().entries()) {
                    if (id.startsWith("project.")) {
                        projectStateValues.set(id, cloneWorldPropertyValue(value));
                    }
                }
            }
            const bundle = await loadWorldBundle(worldPath, activeProjectBundle, projectStateValues);
            const nextRuntime = createGameScene({
                bundle,
                engine,
                ui,
                inputAdapter,
                clamp,
                randomInRange,
                switchToPreviousWorld: worldNavigationHandlers.switchToPreviousWorld,
                switchToNextWorld: worldNavigationHandlers.switchToNextWorld,
            });
            const nextScene = nextRuntime.scene;
            const previousScene = currentScene;
            currentScene = nextScene;
            currentSceneSnapshot = nextRuntime.snapshotDataValues;

            if (!renderLoopStarted) {
                engine.runRenderLoop(() => {
                    currentScene?.render();
                });
                renderLoopStarted = true;
            }

            if (previousScene) {
                previousScene.dispose();
            }

            if (isDeveloperMode) {
                ui.setDevStatus(`开发者模式: 当前场景 ${bundle.world.id}`);
            }
        } catch (error) {
            console.error(error);
            ui.showMessage(`场景加载失败：${error instanceof Error ? error.message : String(error)}`);
            ui.setDevStatus("开发者模式: 场景切换失败，详情见控制台");
        } finally {
            isSwitchingWorld = false;
        }
    };

    return {
        initializeProject,
        setWorldNavigationHandlers: (handlers) => {
            worldNavigationHandlers = handlers;
        },
        switchWorld,
    };
};
