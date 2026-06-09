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
        const projectSchema = propertySchema.get(id);
        if (projectSchema && projectSchema.valueType !== schema.valueType) {
            throw new Error(
                `World.GlobalData 覆盖字段 ${id} 类型不匹配: Project=${projectSchema.valueType}, World=${schema.valueType}`,
            );
        }
        propertySchema.set(id, schema);
    }
    for (const [id, value] of world.globalStateInitialValues.entries()) {
        initialValues.set(id, cloneWorldPropertyValue(value));
    }

    return { propertySchema, initialValues };
};
