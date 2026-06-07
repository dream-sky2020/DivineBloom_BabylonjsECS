import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { UiLayoutConfig } from "../ui/types";

export type ValueType = "number" | "boolean" | "string" | "vector3" | "color3";
export type WorldPropertyValue = number | boolean | string | Vector3;

export type WorldPropertySchema = {
    id: string;
    valueType: ValueType;
    mutable: boolean;
};

export type AssetDef = {
    id: string;
    type: string;
    src?: string;
    primitive?: string;
};

export type RenderableDef = {
    kind: "primitive" | "billboard";
    assetId: string;
    textureId?: string;
    size?: number;
    diameter?: number;
    materialDiffuseColor?: string;
    materialSpecularColor?: string;
};

export type PrefabBehaviorDefaults = {
    EnemyAi?: {
        direction?: string;
    };
    Movement?: {
        speed?: string;
    };
    Collectible?: {
        value?: string;
        collected?: string;
    };
    Player?: {
        isPlayer?: string;
    };
};

export type PrefabDef = {
    id: string;
    tags: string[];
    transformPosition: Vector3;
    renderable: RenderableDef;
    exportables: Map<string, ValueType>;
    behaviors: PrefabBehaviorDefaults;
};

export type WorldOverrideDef = {
    path: string;
    value: string;
    valueType?: ValueType;
};

export type WorldEntityDef = {
    id: string;
    prefabId: string;
    tags: string[];
    overrides: WorldOverrideDef[];
};

export type WorldConfig = {
    id: string;
    clearColor: string;
    camera: WorldCameraConfig;
    inputBindings: WorldInputBinding[];
    systems: WorldSystemConfig[];
    manifestSrc: string;
    uiSrc?: string;
    prefabRefs: Map<string, string>;
    entities: WorldEntityDef[];
    globalStateSchema: Map<string, WorldPropertySchema>;
    globalStateInitialValues: Map<string, WorldPropertyValue>;
};

export type ProjectConfig = {
    id: string;
    version: string;
    globalStateSchema: Map<string, WorldPropertySchema>;
    globalStateInitialValues: Map<string, WorldPropertyValue>;
    globalInputBindings: WorldInputBinding[];
    globalUiRefs: string[];
    globalSystems: WorldSystemConfig[];
};

export type WorldSystemConfig = {
    name: string;
    enabled: boolean;
};

export type WorldInputBinding = {
    target: string;
    keys: string[];
    mode: WorldInputBindingMode;
    scale: number;
};

export type WorldInputBindingMode = "hold" | "toggle";

export type WorldCameraConfig = {
    type: "arcRotate";
    alpha: number;
    beta: number;
    radius: number;
    target: Vector3;
    lowerRadiusLimit: number;
    upperRadiusLimit: number;
    attachControl: boolean;
};

export type WorldBundle = {
    world: WorldConfig;
    worldUiLayout?: UiLayoutConfig;
    globalUiLayouts: UiLayoutConfig[];
    assets: Map<string, AssetDef>;
    prefabs: Map<string, PrefabDef>;
    propertySchema: Map<string, WorldPropertySchema>;
    initialValues: Map<string, WorldPropertyValue>;
};

export type ProjectBundle = {
    project: ProjectConfig;
};
