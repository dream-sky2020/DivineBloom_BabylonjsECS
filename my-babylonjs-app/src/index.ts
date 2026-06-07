import { Engine } from "@babylonjs/core/Engines/engine";
import { clamp, randomInRange } from "./utils/math";
import { createInputAdapter } from "./input/adapter";
import { createSceneRuntime } from "./scene/sceneRuntime";
import { createDomGameUi } from "./ui/domGameUi";
import { createWorldFlowController } from "./world/worldFlowController";

const fallbackProjectPath = "/project/project.xml";
const fallbackWorldPaths = ["/scenes/level_001.world.xml"];
const isDeveloperMode =
    new URLSearchParams(window.location.search).get("dev") === "1"
    || window.location.hostname === "localhost"
    || window.location.hostname === "127.0.0.1";
const ui = createDomGameUi({ document, isDeveloperMode });
const engine = new Engine(ui.canvas, true);

const inputAdapter = createInputAdapter();

const sceneRuntime = createSceneRuntime({
    engine,
    ui,
    isDeveloperMode,
    inputAdapter,
    clamp,
    randomInRange,
});

const worldFlowController = createWorldFlowController({
    fallbackProjectPath,
    fallbackWorldPaths,
    initializeProject: sceneRuntime.initializeProject,
    switchWorld: sceneRuntime.switchWorld,
});
sceneRuntime.setWorldNavigationHandlers({
    switchToPreviousWorld: worldFlowController.switchToPreviousWorld,
    switchToNextWorld: worldFlowController.switchToNextWorld,
});

window.addEventListener("keydown", (event) => {
    inputAdapter.handleKeyChange(event.code, true, event.repeat);
});
window.addEventListener("keyup", (event) => {
    inputAdapter.handleKeyChange(event.code, false, false);
});

const bootstrap = async () => {
    await worldFlowController.initialize();
    await worldFlowController.switchCurrentWorld();
};

bootstrap().catch((error) => {
    console.error(error);
    ui.showMessage(`场景加载失败：${error instanceof Error ? error.message : String(error)}`);
});

window.addEventListener("resize", () => {
    engine.resize();
});
