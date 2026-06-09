import { RegisteredSystem } from "../../types";

export const TestPlayerMovementSystem: RegisteredSystem = {
    name: "TestPlayerMovementSystem",
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
            throw new Error("TestPlayerMovementSystem 缺少 player 标签实体");
        }
        const trail = player.trail;
        if (!trail) {
            throw new Error("TestPlayerMovementSystem 缺少玩家 trail 引用");
        }
        const movementByEntityId = context.behaviors.movementByEntityId;

        return (deltaTime) => {
        const gameOver = context.data.get("runtime.gameOver", "boolean", "TestPlayerMovementSystem");
        if (gameOver) {
            trail.emitRate = 0;
            return;
        }

        const moveX = context.data.get("runtime.input.moveX", "number", "TestPlayerMovementSystem");
        const moveZ = context.data.get("runtime.input.moveZ", "number", "TestPlayerMovementSystem");
        const hasInput = moveX !== 0 || moveZ !== 0;
        const speedBoostKeyboard = context.data.get("runtime.input.speedBoost", "boolean", "TestPlayerMovementSystem");
        const speedBoostFromUi = context.data.get("runtime.input.speedBoostFromUi", "boolean", "TestPlayerMovementSystem");
        const speedMultiplier = speedBoostFromUi
            ? context.data.get("runtime.ui.speedBoostScale", "number", "TestPlayerMovementSystem")
            : speedBoostKeyboard
                ? context.data.get("playerSpeedBoostMultiplier", "number", "TestPlayerMovementSystem")
                : 1;
        const movement = movementByEntityId.get(player.entityId);
        if (!movement) {
            throw new Error("TestPlayerMovementSystem 缺少玩家 MovementBehavior");
        }
        const effectiveSpeed = movement.speed * speedMultiplier;
        const movingEmitRate = context.data.get("player.trailEmitRateMoving", "number", "TestPlayerMovementSystem");
        const idleEmitRate = context.data.get("player.trailEmitRateIdle", "number", "TestPlayerMovementSystem");
        trail.emitRate = hasInput ? movingEmitRate : idleEmitRate;
        const gameBound = context.data.get("gameBound", "number", "TestPlayerMovementSystem");
        player.mesh.position.x += moveX * effectiveSpeed * deltaTime;
        player.mesh.position.z += moveZ * effectiveSpeed * deltaTime;
        player.mesh.position.x = context.services.clamp(player.mesh.position.x, -gameBound, gameBound);
        player.mesh.position.z = context.services.clamp(player.mesh.position.z, -gameBound, gameBound);
        };
    },
};
