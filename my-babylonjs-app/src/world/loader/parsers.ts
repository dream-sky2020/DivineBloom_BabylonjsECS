import { isRegisteredBehaviorName } from "../../behaviors/registry";
import {
    AssetDef,
    PrefabBehaviorDefaults,
    PrefabDef,
    ProjectConfig,
    ValueType,
    WorldCameraConfig,
    WorldConfig,
    WorldInputBinding,
    WorldOverrideDef,
} from "../types";
import {
    parseBoolean,
    parseGlobalDataStates,
    parseInputBindingMode,
    parseNumber,
    parseSystems,
    parseTags,
    parseTypedValue,
    parseValueType,
    parseVector3,
    PROJECT_NAMESPACE_PREFIX,
    PROJECT_UI_PREFIX,
    requiredAttr,
    validateUiRefScope,
    WORLD_UI_PREFIX,
} from "./shared";

export const parseAssetManifest = (doc: Document) => {
    const assets = new Map<string, AssetDef>();
    const assetNodes = Array.from(doc.querySelectorAll("AssetManifest > Assets > Asset"));
    for (const assetNode of assetNodes) {
        const asset: AssetDef = {
            id: requiredAttr(assetNode, "id"),
            type: requiredAttr(assetNode, "type"),
            src: assetNode.getAttribute("src") ?? undefined,
            primitive: assetNode.getAttribute("primitive") ?? undefined,
        };
        assets.set(asset.id, asset);
    }
    return assets;
};

const parsePrefabBehaviors = (prefabRoot: Element): PrefabBehaviorDefaults => {
    const behaviorsNode = prefabRoot.querySelector("Behaviors");
    if (!behaviorsNode) {
        return {};
    }

    const behaviorNodes = Array.from(behaviorsNode.children);
    for (const behaviorNode of behaviorNodes) {
        if (!isRegisteredBehaviorName(behaviorNode.tagName)) {
            throw new Error(`未注册的 Behavior: ${behaviorNode.tagName}`);
        }
    }

    const enemyAiNode = behaviorsNode.querySelector(":scope > EnemyAi");
    const movementNode = behaviorsNode.querySelector(":scope > Movement");
    const collectibleNode = behaviorsNode.querySelector(":scope > Collectible");
    const playerNode = behaviorsNode.querySelector(":scope > Player");

    return {
        EnemyAi: enemyAiNode
            ? {
                direction: enemyAiNode.getAttribute("direction") ?? undefined,
            }
            : undefined,
        Movement: movementNode
            ? {
                speed: movementNode.getAttribute("speed") ?? undefined,
            }
            : undefined,
        Collectible: collectibleNode
            ? {
                value: collectibleNode.getAttribute("value") ?? undefined,
                collected: collectibleNode.getAttribute("collected") ?? undefined,
            }
            : undefined,
        Player: playerNode
            ? {
                isPlayer: playerNode.getAttribute("isPlayer") ?? undefined,
            }
            : undefined,
    };
};

const inferValueTypeByPath = (path: string): ValueType => {
    if (path === "Transform.position") {
        return "vector3";
    }
    if (path === "Renderable.Material.diffuseColor") {
        return "color3";
    }
    if (path === "Renderable.size") {
        return "number";
    }
    return "string";
};

export const parsePrefab = (doc: Document) => {
    const prefabRoot = doc.querySelector("Prefab");
    if (!prefabRoot) {
        throw new Error("Prefab 根节点不存在");
    }

    const id = requiredAttr(prefabRoot, "id");
    const transformNode = prefabRoot.querySelector("Root > Transform");
    const renderableNode = prefabRoot.querySelector("Root > Renderable");
    if (!transformNode || !renderableNode) {
        throw new Error(`Prefab ${id} 缺少 Transform 或 Renderable`);
    }

    const legacyBehaviorNode = prefabRoot.querySelector("Root > Behavior");
    if (legacyBehaviorNode) {
        throw new Error(`Prefab ${id} 使用了已废弃的 <Root><Behavior>，请改为 <Behaviors>`);
    }

    const exportables = new Map<string, ValueType>();
    const exportableNodes = Array.from(prefabRoot.querySelectorAll("Exportables > Field"));
    for (const exportableNode of exportableNodes) {
        const path = requiredAttr(exportableNode, "path");
        const explicitType = parseValueType(
            exportableNode.getAttribute("valueType"),
            inferValueTypeByPath(path),
            `Prefab ${id} Exportables.Field(${path})`,
        );
        if (path.startsWith("Behavior.")) {
            throw new Error(`Prefab ${id} 使用了已废弃的 Exportables.Behavior.*，请改为 Behaviors.*`);
        }
        exportables.set(path, explicitType);
    }

    return {
        id,
        tags: parseTags(prefabRoot),
        transformPosition: parseVector3(requiredAttr(transformNode, "position"), `Prefab ${id} Transform.position`),
        renderable: {
            kind: requiredAttr(renderableNode, "kind") as "primitive" | "billboard",
            assetId: requiredAttr(renderableNode, "assetId"),
            textureId: renderableNode.getAttribute("textureId") ?? undefined,
            size: parseNumber(renderableNode.getAttribute("size"), 1.6, `Prefab ${id} Renderable.size`),
            diameter: parseNumber(renderableNode.getAttribute("diameter"), 1.5, `Prefab ${id} Renderable.diameter`),
            materialDiffuseColor: renderableNode.querySelector("Material")?.getAttribute("diffuseColor") ?? undefined,
            materialSpecularColor: renderableNode.querySelector("Material")?.getAttribute("specularColor") ?? undefined,
        },
        exportables,
        behaviors: parsePrefabBehaviors(prefabRoot),
    } satisfies PrefabDef;
};

export const parseWorld = (doc: Document) => {
    const worldNode = doc.querySelector("World");
    if (!worldNode) {
        throw new Error("World 根节点不存在");
    }

    const sceneConfigNode = worldNode.querySelector("SceneConfig");
    const cameraConfigNode = worldNode.querySelector("CameraConfig > Camera");
    const dataModelNode = worldNode.querySelector("DataModel");
    const referenceNode = worldNode.querySelector("References");
    const entitiesNode = worldNode.querySelector("Entities");
    if (!sceneConfigNode || !cameraConfigNode || !dataModelNode || !referenceNode || !entitiesNode) {
        throw new Error("World 缺少 SceneConfig/CameraConfig/DataModel/References/Entities");
    }

    const cameraType = requiredAttr(cameraConfigNode, "type");
    if (cameraType !== "arcRotate") {
        throw new Error(`World.CameraConfig 仅支持 arcRotate，当前为: ${cameraType}`);
    }

    const camera: WorldCameraConfig = {
        type: "arcRotate",
        alpha: parseNumber(cameraConfigNode.getAttribute("alpha"), Math.PI / 4, "World.Camera.alpha"),
        beta: parseNumber(cameraConfigNode.getAttribute("beta"), 1.08, "World.Camera.beta"),
        radius: parseNumber(cameraConfigNode.getAttribute("radius"), 33, "World.Camera.radius"),
        target: parseVector3(
            cameraConfigNode.getAttribute("target") ?? "0,0,0",
            "World.Camera.target",
        ),
        lowerRadiusLimit: parseNumber(
            cameraConfigNode.getAttribute("lowerRadiusLimit"),
            20,
            "World.Camera.lowerRadiusLimit",
        ),
        upperRadiusLimit: parseNumber(
            cameraConfigNode.getAttribute("upperRadiusLimit"),
            40,
            "World.Camera.upperRadiusLimit",
        ),
        attachControl: parseBoolean(
            cameraConfigNode.getAttribute("attachControl"),
            true,
            "World.Camera.attachControl",
        ),
    };

    const globalDataNode = dataModelNode.querySelector("GlobalData");
    if (!globalDataNode) {
        throw new Error("World.DataModel 缺少 GlobalData");
    }
    const inputBindingsNode = dataModelNode.querySelector("InputBindings");
    if (!inputBindingsNode) {
        throw new Error("World.DataModel 缺少 InputBindings");
    }

    const {
        schema: globalStateSchema,
        initialValues: globalStateInitialValues,
    } = parseGlobalDataStates(globalDataNode, "World.GlobalData", (key) => key.startsWith("runtime."));
    for (const key of globalStateSchema.keys()) {
        if (key.startsWith(PROJECT_NAMESPACE_PREFIX)) {
            throw new Error(`World.GlobalData 不允许声明 ${PROJECT_NAMESPACE_PREFIX} 命名空间字段: ${key}`);
        }
    }

    const parseInputBindings = (
        sourceNode: Element,
        stateSchema: ReadonlyMap<string, { valueType: ValueType }>,
        contextPrefix: string,
    ): WorldInputBinding[] => {
        const inputBindings: WorldInputBinding[] = [];
        const bindingNodes = Array.from(sourceNode.querySelectorAll(":scope > Binding"));
        for (const bindingNode of bindingNodes) {
            const target = requiredAttr(bindingNode, "target");
            const keysAttr = requiredAttr(bindingNode, "keys");
            const mode = parseInputBindingMode(
                bindingNode.getAttribute("mode"),
                "hold",
                `${contextPrefix}.InputBindings(${target})`,
            );
            const scale = parseNumber(
                bindingNode.getAttribute("scale"),
                1,
                `${contextPrefix}.InputBindings(${target}).scale`,
            );
            if (scale === 0) {
                throw new Error(`${contextPrefix}.InputBindings(${target}).scale 不能为 0`);
            }
            const keys = keysAttr.split(",").map((key) => key.trim()).filter((key) => key.length > 0);
            if (keys.length === 0) {
                throw new Error(`${contextPrefix}.InputBindings(${target}) 至少需要一个 key`);
            }
            const targetState = stateSchema.get(target);
            if (!targetState) {
                throw new Error(`${contextPrefix}.InputBindings 引用了不存在的 GlobalData 字段: ${target}`);
            }
            if (targetState.valueType !== "boolean") {
                throw new Error(`${contextPrefix}.InputBindings 目标必须是 boolean 字段: ${target}`);
            }
            inputBindings.push({ target, keys, mode, scale });
        }
        return inputBindings;
    };

    const inputBindings = parseInputBindings(inputBindingsNode, globalStateSchema, "World");

    if (inputBindings.length === 0) {
        throw new Error("World.DataModel.InputBindings 至少需要一个 Binding");
    }

    const systems = parseSystems(worldNode, "World");
    if (systems.length === 0) {
        throw new Error("World 缺少 Systems 配置，至少需要一个 System");
    }

    const manifestNode = referenceNode.querySelector("AssetManifest");
    if (!manifestNode) {
        throw new Error("World 缺少 AssetManifest 引用");
    }

    const prefabRefs = new Map<string, string>();
    const prefabRefNodes = Array.from(referenceNode.querySelectorAll("PrefabRef"));
    for (const prefabRefNode of prefabRefNodes) {
        prefabRefs.set(requiredAttr(prefabRefNode, "id"), requiredAttr(prefabRefNode, "src"));
    }
    const uiRefNode = referenceNode.querySelector("UiRef");
    const uiSrc = uiRefNode?.getAttribute("src") ?? undefined;
    if (uiSrc) {
        validateUiRefScope(uiSrc, WORLD_UI_PREFIX, "World.References.UiRef");
    }

    const entities = [];
    const instanceNodes = Array.from(entitiesNode.querySelectorAll(":scope > Instance"));
    for (const instanceNode of instanceNodes) {
        const overrides: WorldOverrideDef[] = [];
        const overrideNodes = Array.from(instanceNode.querySelectorAll(":scope > Override"));
        for (const overrideNode of overrideNodes) {
            const rawValueType = overrideNode.getAttribute("valueType");
            overrides.push({
                path: requiredAttr(overrideNode, "path"),
                value: requiredAttr(overrideNode, "value"),
                valueType: rawValueType
                    ? parseValueType(rawValueType, "string", `World.Instance(${requiredAttr(instanceNode, "id")}).Override`)
                    : undefined,
            });
        }
        entities.push({
            id: requiredAttr(instanceNode, "id"),
            prefabId: requiredAttr(instanceNode, "prefab"),
            tags: parseTags(instanceNode),
            overrides,
        });
    }

    return {
        id: requiredAttr(worldNode, "id"),
        clearColor: sceneConfigNode.getAttribute("clearColor") ?? "#0d1420",
        camera,
        inputBindings,
        systems,
        manifestSrc: requiredAttr(manifestNode, "src"),
        uiSrc,
        prefabRefs,
        entities,
        globalStateSchema,
        globalStateInitialValues,
    } satisfies WorldConfig;
};

export const parseProject = (doc: Document): ProjectConfig => {
    const projectNode = doc.querySelector("Project");
    if (!projectNode) {
        throw new Error("Project 根节点不存在");
    }
    const dataModelNode = projectNode.querySelector("DataModel");
    const globalDataNode = dataModelNode?.querySelector("GlobalData");
    const inputBindingsNode = dataModelNode?.querySelector("InputBindings");
    if (!dataModelNode || !globalDataNode || !inputBindingsNode) {
        throw new Error("Project 缺少 DataModel/GlobalData/InputBindings");
    }

    const { schema: globalStateSchema, initialValues: globalStateInitialValues } = parseGlobalDataStates(
        globalDataNode,
        "Project.GlobalData",
        (key) => key.startsWith(PROJECT_NAMESPACE_PREFIX) || key.startsWith("runtime.input."),
    );
    for (const key of globalStateSchema.keys()) {
        if (!key.startsWith(PROJECT_NAMESPACE_PREFIX) && !key.startsWith("runtime.input.")) {
            throw new Error(`Project.GlobalData 仅允许 project.* 或 runtime.input.* 字段: ${key}`);
        }
    }

    const globalInputBindings: WorldInputBinding[] = [];
    const bindingNodes = Array.from(inputBindingsNode.querySelectorAll(":scope > Binding"));
    for (const bindingNode of bindingNodes) {
        const target = requiredAttr(bindingNode, "target");
        const keysAttr = requiredAttr(bindingNode, "keys");
        const mode = parseInputBindingMode(
            bindingNode.getAttribute("mode"),
            "hold",
            `Project.InputBindings(${target})`,
        );
        const scale = parseNumber(
            bindingNode.getAttribute("scale"),
            1,
            `Project.InputBindings(${target}).scale`,
        );
        if (scale === 0) {
            throw new Error(`Project.InputBindings(${target}).scale 不能为 0`);
        }
        const keys = keysAttr.split(",").map((key) => key.trim()).filter((key) => key.length > 0);
        if (keys.length === 0) {
            throw new Error(`Project.InputBindings(${target}) 至少需要一个 key`);
        }
        const targetState = globalStateSchema.get(target);
        if (!targetState) {
            throw new Error(`Project.InputBindings 引用了不存在的 GlobalData 字段: ${target}`);
        }
        if (targetState.valueType !== "boolean") {
            throw new Error(`Project.InputBindings 目标必须是 boolean 字段: ${target}`);
        }
        globalInputBindings.push({ target, keys, mode, scale });
    }

    const globalUiRefs = Array.from(projectNode.querySelectorAll("References > UiRef")).map((uiRefNode) => {
        const src = requiredAttr(uiRefNode, "src");
        validateUiRefScope(src, PROJECT_UI_PREFIX, "Project.References.UiRef");
        return src;
    });

    const globalSystems = parseSystems(projectNode, "Project");

    return {
        id: requiredAttr(projectNode, "id"),
        version: requiredAttr(projectNode, "version"),
        globalStateSchema,
        globalStateInitialValues,
        globalInputBindings,
        globalUiRefs,
        globalSystems,
    };
};
