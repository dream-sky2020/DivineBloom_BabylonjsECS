import { RegisteredSystem } from "../types";

export const PlayerMovementSystem: RegisteredSystem = {
    name: "PlayerMovementSystem",
    requires: [
        { id: "runtime.gameOver", kind: "boolean", access: "read" },
        { id: "runtime.input.moveX", kind: "number", access: "read" },
        { id: "runtime.input.moveZ", kind: "number", access: "read" },
        { id: "runtime.input.speedBoost", kind: "boolean", access: "read" },
        { id: "runtime.input.speedBoostFromUi", kind: "boolean", access: "read" },
        { id: "runtime.ui.speedBoostScale", kind: "number", access: "read" },
        { id: "playerSpeedBoostMultiplier", kind: "number", access: "read" },
        { id: "gameBound", kind: "number", access: "read" },
        { id: "player.trailEmitRateMoving", kind: "number", access: "read" },
        { id: "player.trailEmitRateIdle", kind: "number", access: "read" },
    ],
    create: (context) => {
        const player = context.states.entities.byTag.get("player")?.[0];
        if (!player) {
            throw new Error("PlayerMovementSystem 缺少 player 标签实体");
        }
        const trail = player.trail;
        if (!trail) {
            throw new Error("PlayerMovementSystem 缺少玩家 trail 引用");
        }
        const movementByEntityId = context.behaviors.movementByEntityId;

        return (deltaTime) => {
        const gameOver = context.data.get("runtime.gameOver", "boolean", "PlayerMovementSystem");
        if (gameOver) {
            trail.emitRate = 0;
            return;
        }

        const moveX = context.data.get("runtime.input.moveX", "number", "PlayerMovementSystem");
        const moveZ = context.data.get("runtime.input.moveZ", "number", "PlayerMovementSystem");
        const hasInput = moveX !== 0 || moveZ !== 0;
        const speedBoostKeyboard = context.data.get("runtime.input.speedBoost", "boolean", "PlayerMovementSystem");
        const speedBoostFromUi = context.data.get("runtime.input.speedBoostFromUi", "boolean", "PlayerMovementSystem");
        const speedMultiplier = speedBoostFromUi
            ? context.data.get("runtime.ui.speedBoostScale", "number", "PlayerMovementSystem")
            : speedBoostKeyboard
                ? context.data.get("playerSpeedBoostMultiplier", "number", "PlayerMovementSystem")
                : 1;
        const movement = movementByEntityId.get(player.entityId);
        if (!movement) {
            throw new Error("PlayerMovementSystem 缺少玩家 MovementBehavior");
        }
        const effectiveSpeed = movement.speed * speedMultiplier;
        const movingEmitRate = context.data.get("player.trailEmitRateMoving", "number", "PlayerMovementSystem");
        const idleEmitRate = context.data.get("player.trailEmitRateIdle", "number", "PlayerMovementSystem");
        trail.emitRate = hasInput ? movingEmitRate : idleEmitRate;
        const gameBound = context.data.get("gameBound", "number", "PlayerMovementSystem");
        player.mesh.position.x += moveX * effectiveSpeed * deltaTime;
        player.mesh.position.z += moveZ * effectiveSpeed * deltaTime;
        player.mesh.position.x = context.services.clamp(player.mesh.position.x, -gameBound, gameBound);
        player.mesh.position.z = context.services.clamp(player.mesh.position.z, -gameBound, gameBound);
        };
    },
};
