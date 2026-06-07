import { RegisteredSystem } from "../types";

export const TimeSystem: RegisteredSystem = {
    name: "TimeSystem",
    requires: [
        { id: "runtime.elapsedTime", kind: "number", access: "read" },
        { id: "runtime.elapsedTime", kind: "number", access: "write" },
    ],
    create: (context) => (deltaTime) => {
        const elapsedTime = context.data.get("runtime.elapsedTime", "number", "TimeSystem");
        context.data.set("runtime.elapsedTime", "number", elapsedTime + deltaTime, "TimeSystem");
    },
};
