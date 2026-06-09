import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import {
    PrefabBehaviorDefaults,
    ValueType,
    WorldInputBindingMode,
    WorldPropertySchema,
    WorldPropertyValue,
    WorldSystemConfig,
} from "../types";

const VALID_VALUE_TYPES: ValueType[] = ["number", "boolean", "string", "vector3", "color3"];
const VALID_INPUT_BINDING_MODES: WorldInputBindingMode[] = ["hold", "toggle"];

export const WORLD_UI_PREFIX = "/ui/world/";
export const PROJECT_UI_PREFIX = "/ui/global/";
export const PROJECT_NAMESPACE_PREFIX = "project.";

export const parseValueType = (raw: string | null, fallback: ValueType, context: string): ValueType => {
    if (!raw || raw.trim() === "") {
        return fallback;
    }
    if (!VALID_VALUE_TYPES.includes(raw as ValueType)) {
        throw new Error(`${context} 的 valueType 不合法: ${raw}`);
    }
    return raw as ValueType;
};

export const parseInputBindingMode = (
    raw: string | null,
    fallback: WorldInputBindingMode,
    context: string,
): WorldInputBindingMode => {
    if (!raw || raw.trim() === "") {
        return fallback;
    }
    if (!VALID_INPUT_BINDING_MODES.includes(raw as WorldInputBindingMode)) {
        throw new Error(`${context} 的 mode 不合法: ${raw}`);
    }
    return raw as WorldInputBindingMode;
};

export const requiredAttr = (element: Element, attrName: string) => {
    const value = element.getAttribute(attrName);
    if (!value) {
        throw new Error(`缺少属性: <${element.tagName}>.${attrName}`);
    }
    return value;
};

export const parseTags = (element: Element) => {
    const rawTags = element.getAttribute("tags");
    const rawGroups = element.getAttribute("groups");
    const merged = [rawTags, rawGroups]
        .filter((value): value is string => typeof value === "string" && value.trim().length > 0)
        .flatMap((value) => value.split(","))
        .map((tag) => tag.trim())
        .filter((tag) => tag.length > 0);
    return Array.from(new Set(merged));
};

export const parseVector3 = (value: string, context: string) => {
    const parts = value.split(",").map((part) => Number(part.trim()));
    if (parts.length !== 3 || parts.some((part) => Number.isNaN(part))) {
        throw new Error(`${context} 不是有效的 Vector3: ${value}`);
    }
    return new Vector3(parts[0], parts[1], parts[2]);
};

export const parseNumber = (value: string | null | undefined, fallback: number, context: string) => {
    if (value == null || value.trim() === "") {
        return fallback;
    }
    const parsed = Number(value);
    if (Number.isNaN(parsed)) {
        throw new Error(`${context} 不是有效数字: ${value}`);
    }
    return parsed;
};

export const parseBoolean = (value: string | null | undefined, fallback: boolean, context: string) => {
    if (value == null || value.trim() === "") {
        return fallback;
    }
    if (value === "true") {
        return true;
    }
    if (value === "false") {
        return false;
    }
    throw new Error(`${context} 不是有效布尔值(true/false): ${value}`);
};

const validateColor3 = (value: string, context: string) => {
    if (!/^#[0-9a-fA-F]{6}$/.test(value)) {
        throw new Error(`${context} 不是有效色值(#RRGGBB): ${value}`);
    }
};

export const parseTypedValue = (value: string, valueType: ValueType, context: string): WorldPropertyValue => {
    if (valueType === "number") {
        return parseNumber(value, 0, context);
    }
    if (valueType === "boolean") {
        if (value !== "true" && value !== "false") {
            throw new Error(`${context} 不是有效布尔值(true/false): ${value}`);
        }
        return value === "true";
    }
    if (valueType === "vector3") {
        return parseVector3(value, context);
    }
    if (valueType === "color3") {
        validateColor3(value, context);
        return value;
    }
    return value;
};

export const cloneWorldPropertyValue = (value: WorldPropertyValue): WorldPropertyValue => (
    value instanceof Vector3 ? value.clone() : value
);

export const clonePrefabBehaviorDefaults = (behaviors: PrefabBehaviorDefaults): PrefabBehaviorDefaults => {
    const cloned: PrefabBehaviorDefaults = {};
    if (behaviors.EnemyAi) {
        cloned.EnemyAi = { ...behaviors.EnemyAi };
    }
    if (behaviors.Movement) {
        cloned.Movement = { ...behaviors.Movement };
    }
    if (behaviors.Collectible) {
        cloned.Collectible = { ...behaviors.Collectible };
    }
    if (behaviors.Player) {
        cloned.Player = { ...behaviors.Player };
    }
    if (behaviors.TurnBasedUnit) {
        cloned.TurnBasedUnit = { ...behaviors.TurnBasedUnit };
    }
    return cloned;
};

export const validateUiRefScope = (src: string, prefix: string, context: string) => {
    if (!src.startsWith(prefix)) {
        throw new Error(`${context} 只能引用 ${prefix} 前缀，当前为: ${src}`);
    }
};

export const parseGlobalDataStates = (
    globalDataNode: Element,
    contextPrefix: string,
    mutableRule: (key: string) => boolean,
) => {
    const schema = new Map<string, WorldPropertySchema>();
    const initialValues = new Map<string, WorldPropertyValue>();
    const stateNodes = Array.from(globalDataNode.querySelectorAll(":scope > State"));
    for (const stateNode of stateNodes) {
        const key = requiredAttr(stateNode, "key");
        const value = stateNode.getAttribute("value");
        if (value === null) {
            throw new Error(`缺少属性: <${stateNode.tagName}>.value`);
        }
        const valueType = parseValueType(
            stateNode.getAttribute("valueType"),
            "string",
            `${contextPrefix}.State(${key})`,
        );
        const parsedValue = parseTypedValue(value, valueType, `${contextPrefix}.State(${key})`);
        schema.set(key, {
            id: key,
            valueType,
            mutable: mutableRule(key),
        });
        initialValues.set(key, parsedValue);
    }
    return { schema, initialValues };
};

export const parseSystems = (rootNode: Element, contextPrefix: string): WorldSystemConfig[] => {
    const systems: WorldSystemConfig[] = [];
    const systemNodes = Array.from(rootNode.querySelectorAll(":scope > Systems > System"));
    for (const systemNode of systemNodes) {
        const name = requiredAttr(systemNode, "name");
        systems.push({
            name,
            enabled: parseBoolean(systemNode.getAttribute("enabled"), true, `${contextPrefix}.System(${name}).enabled`),
        });
    }
    return systems;
};

export const loadXml = async (path: string) => {
    const response = await fetch(path);
    if (!response.ok) {
        throw new Error(`加载 XML 失败: ${path} (${response.status})`);
    }
    const xmlText = await response.text();
    const doc = new DOMParser().parseFromString(xmlText, "application/xml");
    const parserError = doc.querySelector("parsererror");
    if (parserError) {
        throw new Error(`XML 解析失败: ${path}`);
    }
    return doc;
};
