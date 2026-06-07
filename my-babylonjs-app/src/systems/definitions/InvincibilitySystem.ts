import { RegisteredSystem } from "../types";

export const InvincibilitySystem: RegisteredSystem = {
    name: "InvincibilitySystem",
    requires: [
        { id: "runtime.invincibleTime", kind: "number", access: "read" },
        { id: "runtime.invincibleTime", kind: "number", access: "write" },
    ],
    create: (context) => (deltaTime) => {
        const invincibleTime = context.data.get("runtime.invincibleTime", "number", "InvincibilitySystem");
        if (invincibleTime > 0) {
            context.data.set("runtime.invincibleTime", "number", invincibleTime - deltaTime, "InvincibilitySystem");
        }
    },
};
