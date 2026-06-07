import { GameDataAccessor } from "../systems/dataAccessor";
import { WorldInputBinding } from "../world/types";

export type RuntimeInputState = {
    upPressed: boolean;
    downPressed: boolean;
    leftPressed: boolean;
    rightPressed: boolean;
    restartPressed: boolean;
    prevWorldPressed: boolean;
    nextWorldPressed: boolean;
    speedBoost: boolean;
    moveX: number;
    moveZ: number;
};

export type InputAdapter = {
    configure: (data: GameDataAccessor, bindings: WorldInputBinding[]) => void;
    handleKeyChange: (code: string, pressed: boolean, isRepeat: boolean) => void;
};
