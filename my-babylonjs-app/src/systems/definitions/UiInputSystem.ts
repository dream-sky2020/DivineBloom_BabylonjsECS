import { RegisteredSystem } from "../types";

export const UiInputSystem: RegisteredSystem = {
    name: "UiInputSystem",
    requires: [
        { id: "runtime.ui.restartPressed", kind: "boolean", access: "read" },
        { id: "runtime.ui.restartPressed", kind: "boolean", access: "write" },
        { id: "runtime.ui.speedBoostEnabled", kind: "boolean", access: "read" },
        { id: "runtime.input.restartPressedFromUi", kind: "boolean", access: "write" },
        { id: "runtime.input.speedBoostFromUi", kind: "boolean", access: "write" },
    ],
    create: (context) => {
        let hasRestartPulse = false;

        return () => {
            if (hasRestartPulse) {
                context.data.set("runtime.input.restartPressedFromUi", "boolean", false, "UiInputSystem");
                hasRestartPulse = false;
            }

            const uiRestartPressed = context.data.get("runtime.ui.restartPressed", "boolean", "UiInputSystem");
            if (uiRestartPressed) {
                context.data.set("runtime.input.restartPressedFromUi", "boolean", true, "UiInputSystem");
                context.data.set("runtime.ui.restartPressed", "boolean", false, "UiInputSystem");
                hasRestartPulse = true;
            }

            const uiSpeedBoostEnabled = context.data.get("runtime.ui.speedBoostEnabled", "boolean", "UiInputSystem");
            context.data.set("runtime.input.speedBoostFromUi", "boolean", uiSpeedBoostEnabled, "UiInputSystem");
        };
    },
};
