import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { RegisteredSystem } from "../types";

export const OrbCollectSystem: RegisteredSystem = {
    name: "OrbCollectSystem",
    requires: [
        { id: "runtime.gameOver", kind: "boolean", access: "read" },
        { id: "runtime.score", kind: "number", access: "read" },
        { id: "runtime.score", kind: "number", access: "write" },
        { id: "runtime.elapsedTime", kind: "number", access: "read" },
        { id: "targetScore", kind: "number", access: "read" },
        { id: "orb.floatBaseY", kind: "number", access: "read" },
        { id: "orb.floatAmplitude", kind: "number", access: "read" },
        { id: "orb.floatFrequency", kind: "number", access: "read" },
        { id: "orb.collectDistance", kind: "number", access: "read" },
        { id: "orb.winMessage", kind: "string", access: "read" },
        { id: "runtime.gameOver", kind: "boolean", access: "write" },
    ],
    create: (context) => {
        const orbs = context.states.entities.byTag.get("orb") ?? [];
        const collectibleByEntityId = context.behaviors.collectibleByEntityId;
        const player = context.states.entities.byTag.get("player")?.[0];
        if (!player) {
            throw new Error("OrbCollectSystem 缺少 player 标签实体");
        }
        for (const orbEntity of orbs) {
            const collectible = collectibleByEntityId.get(orbEntity.entityId);
            orbEntity.mesh.isVisible = !collectible?.collected;
        }

        return () => {
        const gameOver = context.data.get("runtime.gameOver", "boolean", "OrbCollectSystem");
        if (gameOver) {
            return;
        }

        const elapsedTime = context.data.get("runtime.elapsedTime", "number", "OrbCollectSystem");
        const floatBaseY = context.data.get("orb.floatBaseY", "number", "OrbCollectSystem");
        const floatAmplitude = context.data.get("orb.floatAmplitude", "number", "OrbCollectSystem");
        const floatFrequency = context.data.get("orb.floatFrequency", "number", "OrbCollectSystem");
        const collectDistance = context.data.get("orb.collectDistance", "number", "OrbCollectSystem");
        const targetScore = context.data.get("targetScore", "number", "OrbCollectSystem");
        const winMessage = context.data.get("orb.winMessage", "string", "OrbCollectSystem");

        for (let i = 0; i < orbs.length; i += 1) {
            const orbEntity = orbs[i];
            const collectible = collectibleByEntityId.get(orbEntity.entityId);
            if (!collectible) {
                continue;
            }
            const orb = orbEntity.mesh;
            orb.isVisible = !collectible.collected;
            if (orb.isVisible) {
                orb.position.y = floatBaseY + Math.sin(elapsedTime * floatFrequency + i) * floatAmplitude;
            }
            if (orb.isVisible && Vector3.Distance(orb.position, player.mesh.position) < collectDistance) {
                collectible.collected = true;
                orb.isVisible = false;
                context.services.createBurstParticles(orb.position.clone());
                const score = context.data.get("runtime.score", "number", "OrbCollectSystem");
                const nextScore = score + collectible.value;
                context.data.set("runtime.score", "number", nextScore, "OrbCollectSystem");
                context.services.updateHud();
                if (nextScore >= targetScore) {
                    context.data.set("runtime.gameOver", "boolean", true, "OrbCollectSystem");
                    context.services.showMessage(winMessage);
                    break;
                }
            }
        }
        };
    },
};
