import { RegisteredSystem } from "../types";

export const RestartSystem: RegisteredSystem = {
    name: "RestartSystem",
    requires: [
        { id: "runtime.gameOver", kind: "boolean", access: "read" },
        { id: "runtime.input.restartPressed", kind: "boolean", access: "read" },
        { id: "runtime.input.restartPressedFromUi", kind: "boolean", access: "read" },
    ],
    create: (context) => () => {
        const gameOver = context.data.get("runtime.gameOver", "boolean", "RestartSystem");
        const restartPressed = context.data.get("runtime.input.restartPressed", "boolean", "RestartSystem");
        const restartFromUi = context.data.get("runtime.input.restartPressedFromUi", "boolean", "RestartSystem");
        if (gameOver && (restartPressed || restartFromUi)) {
            context.services.reload();
        }
    },
};
