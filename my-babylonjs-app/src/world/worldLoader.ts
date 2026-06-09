import { loadUiLayout } from "../ui/core/xmlLayout";
import { PrefabDef, ProjectBundle, WorldBundle, WorldPropertyValue } from "./types";
import { applyOverrides } from "./loader/overrides";
import { parseAssetManifest, parsePrefab, parseProject, parseWorld } from "./loader/parsers";
import { mergeProjectAndWorldState } from "./loader/stateMerge";
import { cloneWorldPropertyValue, loadXml } from "./loader/shared";

export { applyOverrides } from "./loader/overrides";

export const loadProjectBundle = async (projectPath: string): Promise<ProjectBundle> => {
    const projectDoc = await loadXml(projectPath);
    const project = parseProject(projectDoc);
    return { project };
};

export const loadWorldBundle = async (
    worldPath: string,
    projectBundle: ProjectBundle,
    persistedProjectValues?: ReadonlyMap<string, WorldPropertyValue>,
): Promise<WorldBundle> => {
    const worldDoc = await loadXml(worldPath);
    const parsedWorld = parseWorld(worldDoc);
    const world = {
        ...parsedWorld,
        inputBindings: [...projectBundle.project.globalInputBindings, ...parsedWorld.inputBindings],
    };
    const worldUiLayout = world.uiSrc ? await loadUiLayout(world.uiSrc) : undefined;
    const globalUiLayouts = await Promise.all(projectBundle.project.globalUiRefs.map((path) => loadUiLayout(path)));

    const manifestDoc = await loadXml(world.manifestSrc);
    const assets = parseAssetManifest(manifestDoc);

    const prefabs = new Map<string, PrefabDef>();
    for (const [prefabId, prefabPath] of world.prefabRefs.entries()) {
        const prefabDoc = await loadXml(prefabPath);
        const prefab = parsePrefab(prefabDoc);
        if (prefab.id !== prefabId) {
            throw new Error(`Prefab ID 不匹配: 引用 ${prefabId}，文件内 ${prefab.id}`);
        }
        prefabs.set(prefabId, prefab);
    }

    const { propertySchema, initialValues } = mergeProjectAndWorldState(
        projectBundle.project,
        world,
        persistedProjectValues,
    );

    for (const entity of world.entities) {
        const prefab = prefabs.get(entity.prefabId);
        if (!prefab) {
            throw new Error(`未找到 prefab: ${entity.prefabId}`);
        }
        const instance = applyOverrides(prefab, entity.overrides);
        for (const [path, valueType] of instance.exportables.entries()) {
            const propertyId = `${entity.id}.${path}`;
            let value: WorldPropertyValue;
            if (path === "Transform.position") {
                value = instance.transformPosition.clone();
            } else if (path === "Renderable.Material.diffuseColor") {
                value = instance.renderable.materialDiffuseColor ?? "#ffffff";
            } else if (path === "Renderable.size") {
                value = instance.renderable.size ?? 1.6;
            } else {
                throw new Error(`实体 ${entity.id} 不支持导出字段: ${path}`);
            }

            propertySchema.set(propertyId, {
                id: propertyId,
                valueType,
                mutable: path === "Transform.position" || propertyId.startsWith("runtime."),
            });
            initialValues.set(propertyId, cloneWorldPropertyValue(value));
        }
    }

    return { world, worldUiLayout, globalUiLayouts, assets, prefabs, propertySchema, initialValues };
};
