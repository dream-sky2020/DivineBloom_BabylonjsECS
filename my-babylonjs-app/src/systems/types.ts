import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { GameBehaviors } from "../behaviors/types";
import { GameDataAccessor, PropertyRequirement } from "./dataAccessor";
import { GameStateApi } from "../states/types";

export type RuntimeSystem = (deltaTime: number) => void;

export type GameSystemContext = {
    data: GameDataAccessor;
    states: GameStateApi;
    behaviors: GameBehaviors;
    services: {
        clamp: (value: number, min: number, max: number) => number;
        randomInRange: (min: number, max: number) => number;
        updateHud: () => void;
        showMessage: (text: string) => void;
        createBurstParticles: (position: Vector3) => void;
        reload: () => void;
        switchToPreviousWorld: () => Promise<void>;
        switchToNextWorld: () => Promise<void>;
    };
};

export type RegisteredSystem = {
    name: string;
    requires: PropertyRequirement[];
    create: (context: GameSystemContext) => RuntimeSystem;
};
