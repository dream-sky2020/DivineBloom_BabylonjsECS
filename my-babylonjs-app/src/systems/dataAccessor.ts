import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { ValueType, WorldPropertySchema, WorldPropertyValue } from "../world/types";

export type ValueTypeMap = {
    number: number;
    boolean: boolean;
    string: string;
    vector3: Vector3;
    color3: string;
};

export type PropertyAccessMode = "read" | "write";

export type PropertyRequirement = {
    id: string;
    kind: ValueType;
    access: PropertyAccessMode;
};

const withSystemName = (systemName: string | undefined, message: string) => {
    if (!systemName) {
        return message;
    }
    return `[${systemName}] ${message}`;
};

export interface GameDataAccessor {
    get<K extends ValueType>(id: string, kind: K, systemName?: string): ValueTypeMap[K];
    set<K extends ValueType>(id: string, kind: K, value: ValueTypeMap[K], systemName?: string): void;
    subscribe: (id: string, listener: () => void) => () => void;
    has(id: string): boolean;
    getSchema(id: string): WorldPropertySchema | undefined;
    ensure(id: string, kind: ValueType, access: PropertyAccessMode, systemName?: string): void;
}

type ScopedAccessGrant = {
    kind: ValueType;
    read: boolean;
    write: boolean;
};

const grantScopedAccess = (
    grants: Map<string, ScopedAccessGrant>,
    id: string,
    kind: ValueType,
    access: PropertyAccessMode,
    systemName: string,
) => {
    const existing = grants.get(id);
    if (existing && existing.kind !== kind) {
        throw new Error(
            withSystemName(
                systemName,
                `字段 ${id} 被声明为冲突类型: ${existing.kind} 与 ${kind}`,
            ),
        );
    }

    const next: ScopedAccessGrant = existing ?? { kind, read: false, write: false };
    if (access === "read") {
        next.read = true;
    } else {
        next.write = true;
    }
    grants.set(id, next);
};

const assertScopedAccess = (
    grants: Map<string, ScopedAccessGrant>,
    id: string,
    kind: ValueType,
    access: PropertyAccessMode,
    systemName: string,
) => {
    const grant = grants.get(id);
    if (!grant) {
        throw new Error(withSystemName(systemName, `未声明 requires，不允许 ${access}: ${id}`));
    }
    if (grant.kind !== kind) {
        throw new Error(
            withSystemName(
                systemName,
                `${id} 访问类型与 requires 不一致，期望 ${grant.kind}，实际 ${kind}`,
            ),
        );
    }
    if (access === "read" && !grant.read) {
        throw new Error(withSystemName(systemName, `未声明读权限，不允许读取: ${id}`));
    }
    if (access === "write" && !grant.write) {
        throw new Error(withSystemName(systemName, `未声明写权限，不允许写入: ${id}`));
    }
};

export const createGameDataAccessor = (
    schemaEntries: Iterable<[string, WorldPropertySchema]>,
    initialValues: Iterable<[string, WorldPropertyValue]>,
): GameDataAccessor => {
    const schema = new Map<string, WorldPropertySchema>(schemaEntries);
    const values = new Map<string, WorldPropertyValue>(initialValues);
    const listeners = new Map<string, Set<() => void>>();

    const ensure = (id: string, kind: ValueType, access: PropertyAccessMode, systemName?: string) => {
        const schemaEntry = schema.get(id);
        if (!schemaEntry) {
            throw new Error(withSystemName(systemName, `缺少字段: ${id}`));
        }
        if (schemaEntry.valueType !== kind) {
            throw new Error(
                withSystemName(
                    systemName,
                    `${id} 类型错误，期望 ${kind}，实际 ${schemaEntry.valueType}`,
                ),
            );
        }
        if (access === "write" && !schemaEntry.mutable) {
            throw new Error(withSystemName(systemName, `${id} 是只读字段，不允许写入`));
        }
    };

    const get = <K extends ValueType>(id: string, kind: K, systemName?: string): ValueTypeMap[K] => {
        ensure(id, kind, "read", systemName);
        if (!values.has(id)) {
            throw new Error(withSystemName(systemName, `字段未初始化: ${id}`));
        }
        const value = values.get(id);
        if (kind === "number" && typeof value !== "number") {
            throw new Error(withSystemName(systemName, `${id} 值类型错误，期望 number`));
        }
        if (kind === "boolean" && typeof value !== "boolean") {
            throw new Error(withSystemName(systemName, `${id} 值类型错误，期望 boolean`));
        }
        if (kind === "vector3" && !(value instanceof Vector3)) {
            throw new Error(withSystemName(systemName, `${id} 值类型错误，期望 vector3`));
        }
        if ((kind === "string" || kind === "color3") && typeof value !== "string") {
            throw new Error(withSystemName(systemName, `${id} 值类型错误，期望 ${kind}`));
        }
        return value as ValueTypeMap[K];
    };

    const set = <K extends ValueType>(id: string, kind: K, value: ValueTypeMap[K], systemName?: string) => {
        ensure(id, kind, "write", systemName);
        const previousValue = values.get(id);
        values.set(id, value);
        if (previousValue !== value) {
            const propertyListeners = listeners.get(id);
            if (propertyListeners) {
                for (const listener of propertyListeners) {
                    listener();
                }
            }
        }
    };

    return {
        get,
        set,
        subscribe: (id, listener) => {
            let propertyListeners = listeners.get(id);
            if (!propertyListeners) {
                propertyListeners = new Set();
                listeners.set(id, propertyListeners);
            }
            propertyListeners.add(listener);
            return () => {
                const nextPropertyListeners = listeners.get(id);
                if (!nextPropertyListeners) {
                    return;
                }
                nextPropertyListeners.delete(listener);
                if (nextPropertyListeners.size === 0) {
                    listeners.delete(id);
                }
            };
        },
        has: (id) => schema.has(id),
        getSchema: (id) => schema.get(id),
        ensure,
    };
};

export const createScopedGameDataAccessor = (
    accessor: GameDataAccessor,
    requirements: PropertyRequirement[],
    systemName: string,
): GameDataAccessor => {
    const scopedGrants = new Map<string, ScopedAccessGrant>();
    for (const requirement of requirements) {
        accessor.ensure(requirement.id, requirement.kind, requirement.access, systemName);
        grantScopedAccess(scopedGrants, requirement.id, requirement.kind, requirement.access, systemName);
    }

    const scopedSystemName = systemName;

    return {
        get: (id, kind, callerName) => {
            const effectiveSystemName = callerName ?? scopedSystemName;
            assertScopedAccess(scopedGrants, id, kind, "read", effectiveSystemName);
            return accessor.get(id, kind, effectiveSystemName);
        },
        set: (id, kind, value, callerName) => {
            const effectiveSystemName = callerName ?? scopedSystemName;
            assertScopedAccess(scopedGrants, id, kind, "write", effectiveSystemName);
            accessor.set(id, kind, value, effectiveSystemName);
        },
        subscribe: (id, listener) => accessor.subscribe(id, listener),
        has: (id) => accessor.has(id),
        getSchema: (id) => accessor.getSchema(id),
        ensure: (id, kind, access, callerName) => {
            const effectiveSystemName = callerName ?? scopedSystemName;
            accessor.ensure(id, kind, access, effectiveSystemName);
            grantScopedAccess(scopedGrants, id, kind, access, effectiveSystemName);
        },
    };
};
