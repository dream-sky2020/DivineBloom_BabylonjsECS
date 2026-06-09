import { ArcRotateCamera } from "@babylonjs/core/Cameras/arcRotateCamera";
import { Color3 } from "@babylonjs/core/Maths/math.color";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { Engine } from "@babylonjs/core/Engines/engine";
import { HemisphericLight } from "@babylonjs/core/Lights/hemisphericLight";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { Scene } from "@babylonjs/core/scene";
import { InputAdapter } from "../input/types";
import { createStateRegistry } from "../states/registry";
import { createGameDataAccessor } from "../systems/dataAccessor";
import { createSystemRegistryForNames } from "../systems/registry";
import { createGameServices } from "../systems/services";
import { GameSystemContext } from "../systems/types";
import { DomGameUi } from "../ui/dom/domGameUi";
import { createUiRuntimes } from "../ui/panels/registry";
import { WorldBundle, WorldPropertyValue } from "../world/types";
import { parseColor } from "../utils/color";
import { assembleWorldEntities } from "./entityAssembler";
import { createBurstParticles, createTrailParticles } from "./fx";

type CreateGameSceneArgs = {
    bundle: WorldBundle;
    engine: Engine;
    ui: DomGameUi;
    inputAdapter: InputAdapter;
    clamp: (value: number, min: number, max: number) => number;
    randomInRange: (min: number, max: number) => number;
    switchToPreviousWorld: () => Promise<void>;
    switchToNextWorld: () => Promise<void>;
};

export const createGameScene = ({
    bundle,
    engine,
    ui,
    inputAdapter,
    clamp,
    randomInRange,
    switchToPreviousWorld,
    switchToNextWorld,
}: CreateGameSceneArgs) => {
    const { world, worldUiLayout, globalUiLayouts, assets, prefabs, propertySchema, initialValues } = bundle;
    const data = createGameDataAccessor(propertySchema.entries(), initialValues.entries());
    const scene = new Scene(engine);
    scene.clearColor = parseColor(world.clearColor, new Color3(0.05, 0.08, 0.12)).toColor4(1);

    const camera = new ArcRotateCamera(
        "camera",
        world.camera.alpha,
        world.camera.beta,
        world.camera.radius,
        world.camera.target.clone(),
        scene,
    );
    if (world.camera.attachControl) {
        camera.attachControl(ui.canvas, true);
    }
    camera.lowerRadiusLimit = world.camera.lowerRadiusLimit;
    camera.upperRadiusLimit = world.camera.upperRadiusLimit;

    const light = new HemisphericLight("light", new Vector3(0.4, 1, 0.2), scene);
    light.intensity = 0.95;

    const gameBound = data.get("gameBound", "number", "SceneAssembler");
    const groundSize = gameBound * 2.3;
    const ground = MeshBuilder.CreateGround("ground", { width: groundSize, height: groundSize }, scene);
    const groundMaterial = new StandardMaterial("groundMat", scene);
    groundMaterial.diffuseColor = new Color3(0.12, 0.22, 0.14);
    groundMaterial.specularColor = Color3.Black();
    ground.material = groundMaterial;

    const particleAsset = assets.get("tex.particle.white");
    if (!particleAsset?.src) {
        throw new Error("缺少粒子资源 tex.particle.white");
    }
    const particleTexturePath = particleAsset.src;

    const spawnedEntities = assembleWorldEntities({
        scene,
        world,
        assets,
        prefabs,
        data,
    });

    const states = createStateRegistry({
        spawnedEntities,
        createPlayerTrail: (mesh) => createTrailParticles(scene, particleTexturePath, mesh),
        randomInRange,
    });
    inputAdapter.configure(data, world.inputBindings);
    const services = createGameServices({
        data,
        ui,
        scene,
        particleTexturePath,
        clamp,
        randomInRange,
        createBurstParticles,
        reload: () => window.location.reload(),
        switchToPreviousWorld,
        switchToNextWorld,
    });

    const systemContext: GameSystemContext = {
        data,
        states,
        behaviors: states.behaviors,
        services,
    };

    const enabledSystems = world.systems.filter((system) => system.enabled);
    const systemRegistry = createSystemRegistryForNames(
        systemContext,
        enabledSystems.map((system) => system.name),
    );

    const activeSystems = enabledSystems
        .map((system) => {
            const runtimeSystem = systemRegistry.get(system.name);
            if (!runtimeSystem) {
                throw new Error(`World ${world.id} 引用了未注册的 System: ${system.name}`);
            }
            return runtimeSystem;
        });

    if (activeSystems.length === 0) {
        throw new Error(`World ${world.id} 没有启用任何 System`);
    }

    services.updateHud();
    ui.hideMessage();

    const allLayouts = [
        ...globalUiLayouts,
        ...(worldUiLayout ? [worldUiLayout] : []),
    ];
    const uiRuntimes = createUiRuntimes({
        scene,
        data,
        overlayRoot: ui.overlayRoot,
        layouts: allLayouts,
    });
    for (const uiRuntime of uiRuntimes) {
        uiRuntime.refresh();
    }

    scene.onBeforeRenderObservable.add(() => {
        const deltaTime = engine.getDeltaTime() / 1000;
        for (const system of activeSystems) {
            system(deltaTime);
        }
        for (const uiRuntime of uiRuntimes) {
            uiRuntime.refresh();
        }
    });
    scene.onDisposeObservable.add(() => {
        for (const uiRuntime of uiRuntimes) {
            uiRuntime.dispose();
        }
    });

    const snapshotDataValues = () => {
        const snapshot = new Map<string, WorldPropertyValue>();
        for (const [id, schema] of propertySchema.entries()) {
            if (schema.valueType === "number") {
                snapshot.set(id, data.get(id, "number", "SceneSnapshot"));
            } else if (schema.valueType === "boolean") {
                snapshot.set(id, data.get(id, "boolean", "SceneSnapshot"));
            } else if (schema.valueType === "vector3") {
                snapshot.set(id, data.get(id, "vector3", "SceneSnapshot").clone());
            } else if (schema.valueType === "color3") {
                snapshot.set(id, data.get(id, "color3", "SceneSnapshot"));
            } else {
                snapshot.set(id, data.get(id, "string", "SceneSnapshot"));
            }
        }
        return snapshot;
    };

    return {
        scene,
        snapshotDataValues,
    };
};
