import { ProjectConfig, WorldConfig, WorldPropertySchema, WorldPropertyValue } from "../types";
import { cloneWorldPropertyValue } from "./shared";

export const mergeProjectAndWorldState = (
    project: ProjectConfig,
    world: WorldConfig,
    persistedProjectValues?: ReadonlyMap<string, WorldPropertyValue>,
) => {
    const propertySchema = new Map<string, WorldPropertySchema>();
    const initialValues = new Map<string, WorldPropertyValue>();
    for (const [id, schema] of project.globalStateSchema.entries()) {
        propertySchema.set(id, schema);
    }
    for (const [id, value] of project.globalStateInitialValues.entries()) {
        const persisted = persistedProjectValues?.get(id);
        initialValues.set(id, cloneWorldPropertyValue(persisted ?? value));
    }

    for (const [id, schema] of world.globalStateSchema.entries()) {
        if (propertySchema.has(id)) {
            throw new Error(`World.GlobalData 不允许覆盖 Project.GlobalData 字段: ${id}`);
        }
        propertySchema.set(id, schema);
    }
    for (const [id, value] of world.globalStateInitialValues.entries()) {
        if (initialValues.has(id)) {
            throw new Error(`World.GlobalData 不允许覆盖 Project.GlobalData 初始值: ${id}`);
        }
        initialValues.set(id, cloneWorldPropertyValue(value));
    }

    return { propertySchema, initialValues };
};
