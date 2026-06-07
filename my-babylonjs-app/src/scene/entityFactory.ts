import { Color3 } from "@babylonjs/core/Maths/math.color";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { AbstractMesh } from "@babylonjs/core/Meshes/abstractMesh";
import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { Texture } from "@babylonjs/core/Materials/Textures/texture";
import { Scene } from "@babylonjs/core/scene";
import { AssetDef, PrefabDef } from "../world/types";
import { parseColor } from "../utils/color";

type CreateEntityMeshArgs = {
    scene: Scene;
    entityId: string;
    assets: Map<string, AssetDef>;
    instance: PrefabDef;
};

export const createSvgBillboard = (
    scene: Scene,
    name: string,
    svgPath: string,
    position: Vector3,
    size = 1.8,
) => {
    const plane = MeshBuilder.CreatePlane(name, { size }, scene);
    plane.position.copyFrom(position);
    plane.billboardMode = AbstractMesh.BILLBOARDMODE_ALL;

    const material = new StandardMaterial(`${name}-material`, scene);
    const texture = new Texture(svgPath, scene, true, false);
    material.diffuseTexture = texture;
    material.opacityTexture = texture;
    material.useAlphaFromDiffuseTexture = true;
    material.disableLighting = true;
    material.emissiveColor = new Color3(1, 1, 1);
    material.backFaceCulling = false;
    plane.material = material;

    return plane;
};

export const createEntityMesh = ({
    scene,
    entityId,
    assets,
    instance,
}: CreateEntityMeshArgs): Mesh => {
    const renderable = instance.renderable;
    const asset = assets.get(renderable.assetId);
    if (!asset) {
        throw new Error(`未找到 asset: ${renderable.assetId}`);
    }

    if (renderable.kind === "billboard") {
        const textureAsset = renderable.textureId ? assets.get(renderable.textureId) : undefined;
        if (!textureAsset?.src) {
            throw new Error(`Billboard 缺少贴图资源: ${renderable.textureId ?? "(未配置)"}`);
        }
        return createSvgBillboard(
            scene,
            entityId,
            textureAsset.src,
            instance.transformPosition,
            renderable.size ?? 1.8,
        );
    }

    const primitive = asset.primitive ?? "box";
    let mesh: Mesh;
    if (primitive === "box") {
        mesh = MeshBuilder.CreateBox(entityId, { size: renderable.size ?? 1.6 }, scene);
    } else if (primitive === "sphere") {
        mesh = MeshBuilder.CreateSphere(entityId, { diameter: renderable.diameter ?? 1.5 }, scene);
    } else if (primitive === "plane") {
        mesh = MeshBuilder.CreatePlane(entityId, { size: renderable.size ?? 1.6 }, scene);
    } else {
        throw new Error(`暂不支持的 primitive: ${primitive}`);
    }
    mesh.position.copyFrom(instance.transformPosition);

    const material = new StandardMaterial(`${entityId}-material`, scene);
    material.diffuseColor = parseColor(renderable.materialDiffuseColor ?? "#ffffff", new Color3(1, 1, 1));
    material.specularColor = parseColor(renderable.materialSpecularColor ?? "#000000", Color3.Black());
    mesh.material = material;

    return mesh;
};
