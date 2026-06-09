import { GameDataAccessor } from "../../../systems/dataAccessor";

const TEMPLATE_TOKEN_PATTERN = /\{([^}]+)\}/g;

export const readDataAsString = (data: GameDataAccessor, key: string): string => {
    const schema = data.getSchema(key);
    if (!schema) {
        return "";
    }
    if (schema.valueType === "number") {
        return String(data.get(key, "number", "ReactStoryUi"));
    }
    if (schema.valueType === "boolean") {
        return String(data.get(key, "boolean", "ReactStoryUi"));
    }
    if (schema.valueType === "vector3") {
        const value = data.get(key, "vector3", "ReactStoryUi");
        return `${value.x.toFixed(2)},${value.y.toFixed(2)},${value.z.toFixed(2)}`;
    }
    if (schema.valueType === "color3") {
        return data.get(key, "color3", "ReactStoryUi");
    }
    return data.get(key, "string", "ReactStoryUi");
};

export const readDataAsBoolean = (data: GameDataAccessor, key: string): boolean => {
    const schema = data.getSchema(key);
    if (!schema) {
        return false;
    }
    if (schema.valueType === "boolean") {
        return data.get(key, "boolean", "ReactStoryUi");
    }
    if (schema.valueType === "number") {
        return data.get(key, "number", "ReactStoryUi") !== 0;
    }
    return readDataAsString(data, key).length > 0;
};

export const readDataAsNumber = (data: GameDataAccessor, key: string): number => {
    const schema = data.getSchema(key);
    if (!schema) {
        return 0;
    }
    if (schema.valueType === "number") {
        return data.get(key, "number", "ReactStoryUi");
    }
    if (schema.valueType === "boolean") {
        return data.get(key, "boolean", "ReactStoryUi") ? 1 : 0;
    }
    const parsed = Number(readDataAsString(data, key));
    return Number.isNaN(parsed) ? 0 : parsed;
};

export const writeBoolean = (data: GameDataAccessor, key: string, value: boolean) => {
    const schema = data.getSchema(key);
    if (!schema || schema.valueType !== "boolean" || !schema.mutable) {
        throw new Error(`React UI 尝试写入不可用布尔字段: ${key}`);
    }
    data.set(key, "boolean", value, "ReactStoryUi");
};

export const writeNumber = (data: GameDataAccessor, key: string, value: number) => {
    const schema = data.getSchema(key);
    if (!schema || schema.valueType !== "number" || !schema.mutable) {
        throw new Error(`React UI 尝试写入不可用数字字段: ${key}`);
    }
    data.set(key, "number", value, "ReactStoryUi");
};

export const writeString = (data: GameDataAccessor, key: string, value: string) => {
    const schema = data.getSchema(key);
    if (!schema || schema.valueType !== "string" || !schema.mutable) {
        throw new Error(`React UI 尝试写入不可用字符串字段: ${key}`);
    }
    data.set(key, "string", value, "ReactStoryUi");
};

export const resolveTextTemplate = (template: string, data: GameDataAccessor): string => (
    template.replace(TEMPLATE_TOKEN_PATTERN, (_, token: string) => readDataAsString(data, token.trim()))
);

export const extractTemplateKeys = (template: string): string[] => {
    const keys = new Set<string>();
    for (const match of template.matchAll(TEMPLATE_TOKEN_PATTERN)) {
        const token = match[1]?.trim();
        if (token) {
            keys.add(token);
        }
    }
    return [...keys];
};
