import { Scene } from "@babylonjs/core/scene";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { GameDataAccessor } from "./dataAccessor";

type CreateGameServicesArgs = {
    data: GameDataAccessor;
    ui: {
        updateHud: (score: number, targetScore: number, hp: number) => void;
        showMessage: (text: string) => void;
    };
    scene: Scene;
    particleTexturePath: string;
    clamp: (value: number, min: number, max: number) => number;
    randomInRange: (min: number, max: number) => number;
    createBurstParticles: (scene: Scene, particleTexturePath: string, position: Vector3) => void;
    reload: () => void;
    switchToPreviousWorld: () => Promise<void>;
    switchToNextWorld: () => Promise<void>;
};

export const createGameServices = ({
    data,
    ui,
    scene,
    particleTexturePath,
    clamp,
    randomInRange,
    createBurstParticles,
    reload,
    switchToPreviousWorld,
    switchToNextWorld,
}: CreateGameServicesArgs) => {
    const updateHud = () => {
        const score = data.get("runtime.score", "number", "HUD");
        const targetScore = data.get("targetScore", "number", "HUD");
        const hp = data.get("runtime.hp", "number", "HUD");
        ui.updateHud(score, targetScore, hp);
    };

    return {
        clamp,
        randomInRange,
        updateHud,
        showMessage: ui.showMessage,
        createBurstParticles: (position: Vector3) => createBurstParticles(scene, particleTexturePath, position),
        reload,
        switchToPreviousWorld,
        switchToNextWorld,
    };
};
