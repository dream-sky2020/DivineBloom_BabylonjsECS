import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { RegisteredSystem } from "../types";

export const EnemyChaseSystem: RegisteredSystem = {
    name: "EnemyChaseSystem",
    requires: [
        { id: "runtime.gameOver", kind: "boolean", access: "read" },
        { id: "runtime.invincibleTime", kind: "number", access: "read" },
        { id: "runtime.invincibleTime", kind: "number", access: "write" },
        { id: "runtime.hp", kind: "number", access: "read" },
        { id: "runtime.hp", kind: "number", access: "write" },
        { id: "runtime.gameOver", kind: "boolean", access: "write" },
        { id: "gameBound", kind: "number", access: "read" },
        { id: "enemy.turnCurrentWeight", kind: "number", access: "read" },
        { id: "enemy.turnTargetWeight", kind: "number", access: "read" },
        { id: "enemy.hitDistance", kind: "number", access: "read" },
        { id: "enemy.invincibleDurationOnHit", kind: "number", access: "read" },
        { id: "enemy.respawnY", kind: "number", access: "read" },
        { id: "enemy.gameOverMessage", kind: "string", access: "read" },
    ],
    create: (context) => {
        const enemies = context.states.entities.byTag.get("enemy") ?? [];
        const player = context.states.entities.byTag.get("player")?.[0];
        if (!player) {
            throw new Error("EnemyChaseSystem 缺少 player 标签实体");
        }

        return (deltaTime) => {
        const gameOver = context.data.get("runtime.gameOver", "boolean", "EnemyChaseSystem");
        if (gameOver) {
            return;
        }

        const turnCurrentWeight = context.data.get("enemy.turnCurrentWeight", "number", "EnemyChaseSystem");
        const turnTargetWeight = context.data.get("enemy.turnTargetWeight", "number", "EnemyChaseSystem");
        const hitDistance = context.data.get("enemy.hitDistance", "number", "EnemyChaseSystem");
        const invincibleDuration = context.data.get("enemy.invincibleDurationOnHit", "number", "EnemyChaseSystem");
        const enemyRespawnY = context.data.get("enemy.respawnY", "number", "EnemyChaseSystem");
        const gameBound = context.data.get("gameBound", "number", "EnemyChaseSystem");
        const gameOverMessage = context.data.get("enemy.gameOverMessage", "string", "EnemyChaseSystem");
        const enemyAiByEntityId = context.behaviors.enemyAiByEntityId;
        const movementByEntityId = context.behaviors.movementByEntityId;

        for (const enemy of enemies) {
            const movement = movementByEntityId.get(enemy.entityId);
            if (!movement) {
                continue;
            }
            const enemySpeed = movement.speed;
            let enemyAi = enemyAiByEntityId.get(enemy.entityId);
            if (!enemyAi) {
                enemyAi = { direction: new Vector3(1, 0, 0) };
                enemyAiByEntityId.set(enemy.entityId, enemyAi);
            }
            const currentDirection = enemyAi.direction;
            const toPlayer = player.mesh.position.subtract(enemy.mesh.position);
            toPlayer.y = 0;
            let nextDirection = currentDirection;
            if (toPlayer.lengthSquared() > 0.001) {
                const targetDirection = toPlayer.normalize();
                nextDirection = currentDirection
                    .scale(turnCurrentWeight)
                    .add(targetDirection.scale(turnTargetWeight))
                    .normalize();
            }
            enemyAi.direction = nextDirection;

            enemy.mesh.position.addInPlace(nextDirection.scale(enemySpeed * deltaTime));

            if (Math.abs(enemy.mesh.position.x) > gameBound) {
                nextDirection.x *= -1;
                enemy.mesh.position.x = context.services.clamp(enemy.mesh.position.x, -gameBound, gameBound);
            }
            if (Math.abs(enemy.mesh.position.z) > gameBound) {
                nextDirection.z *= -1;
                enemy.mesh.position.z = context.services.clamp(enemy.mesh.position.z, -gameBound, gameBound);
            }

            const invincibleTime = context.data.get("runtime.invincibleTime", "number", "EnemyChaseSystem");
            if (invincibleTime <= 0 && Vector3.Distance(enemy.mesh.position, player.mesh.position) < hitDistance) {
                const hp = context.data.get("runtime.hp", "number", "EnemyChaseSystem");
                const nextHp = hp - 1;
                context.data.set("runtime.hp", "number", nextHp, "EnemyChaseSystem");
                context.data.set("runtime.invincibleTime", "number", invincibleDuration, "EnemyChaseSystem");
                enemy.mesh.position = new Vector3(
                    context.services.randomInRange(-gameBound, gameBound),
                    enemyRespawnY,
                    context.services.randomInRange(-gameBound, gameBound),
                );
                context.services.updateHud();
                if (nextHp <= 0) {
                    context.data.set("runtime.gameOver", "boolean", true, "EnemyChaseSystem");
                    context.services.showMessage(gameOverMessage);
                }
            }
        }
        };
    },
};
