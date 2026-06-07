import { Color3 } from "@babylonjs/core/Maths/math.color";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import { Texture } from "@babylonjs/core/Materials/Textures/texture";
import { ParticleSystem } from "@babylonjs/core/Particles/particleSystem";
import { Scene } from "@babylonjs/core/scene";

export const createBurstParticles = (
    scene: Scene,
    particleTexturePath: string,
    position: Vector3,
    tint = new Color3(1, 0.86, 0.25),
) => {
    const emitter = MeshBuilder.CreateBox("particle-emitter", { size: 0.1 }, scene);
    emitter.isVisible = false;
    emitter.position.copyFrom(position);

    const particleSystem = new ParticleSystem("collect-burst", 120, scene);
    particleSystem.particleTexture = new Texture(particleTexturePath, scene, true, false);
    particleSystem.emitter = emitter;

    particleSystem.color1 = tint.toColor4(0.95);
    particleSystem.color2 = new Color3(1, 1, 1).toColor4(0.85);
    particleSystem.colorDead = new Color3(0.2, 0.2, 0.2).toColor4(0);

    particleSystem.minSize = 0.18;
    particleSystem.maxSize = 0.42;
    particleSystem.minLifeTime = 0.28;
    particleSystem.maxLifeTime = 0.55;
    particleSystem.emitRate = 350;
    particleSystem.manualEmitCount = 45;

    particleSystem.minEmitPower = 2.5;
    particleSystem.maxEmitPower = 6.5;
    particleSystem.updateSpeed = 1 / 60;
    particleSystem.gravity = new Vector3(0, -5.8, 0);
    particleSystem.direction1 = new Vector3(-1.8, 2.6, -1.8);
    particleSystem.direction2 = new Vector3(1.8, 3.8, 1.8);

    particleSystem.start();
    setTimeout(() => {
        particleSystem.dispose();
        emitter.dispose();
    }, 700);
};

export const createTrailParticles = (scene: Scene, particleTexturePath: string, emitter: Mesh) => {
    const trail = new ParticleSystem("player-trail", 500, scene);
    trail.particleTexture = new Texture(particleTexturePath, scene, true, false);
    trail.emitter = emitter;

    trail.minEmitBox = new Vector3(-0.2, -0.45, -0.2);
    trail.maxEmitBox = new Vector3(0.2, -0.7, 0.2);

    trail.color1 = new Color3(0.3, 0.9, 1).toColor4(0.6);
    trail.color2 = new Color3(0.9, 1, 1).toColor4(0.45);
    trail.colorDead = new Color3(0.05, 0.1, 0.25).toColor4(0);

    trail.minSize = 0.08;
    trail.maxSize = 0.22;
    trail.minLifeTime = 0.15;
    trail.maxLifeTime = 0.35;
    trail.emitRate = 0;
    trail.minEmitPower = 0.8;
    trail.maxEmitPower = 2.6;
    trail.updateSpeed = 1 / 60;
    trail.gravity = new Vector3(0, -1.2, 0);
    trail.direction1 = new Vector3(-0.4, -1.2, -0.4);
    trail.direction2 = new Vector3(0.4, -2.2, 0.4);
    trail.blendMode = ParticleSystem.BLENDMODE_ADD;
    trail.start();

    return trail;
};
