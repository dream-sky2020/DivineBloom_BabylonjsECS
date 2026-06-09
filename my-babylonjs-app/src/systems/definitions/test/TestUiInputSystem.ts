import { RegisteredSystem } from "../../types";

export const TestUiInputSystem: RegisteredSystem = {
    name: "TestUiInputSystem",
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
                context.data.set("runtime.input.restartPressedFromUi", "boolean", false, "TestUiInputSystem");
                hasRestartPulse = false;
            }

            const uiRestartPressed = context.data.get("runtime.ui.restartPressed", "boolean", "TestUiInputSystem");
            if (uiRestartPressed) {
                context.data.set("runtime.input.restartPressedFromUi", "boolean", true, "TestUiInputSystem");
                context.data.set("runtime.ui.restartPressed", "boolean", false, "TestUiInputSystem");
                hasRestartPulse = true;
            }

            const uiSpeedBoostEnabled = context.data.get("runtime.ui.speedBoostEnabled", "boolean", "TestUiInputSystem");
            context.data.set("runtime.input.speedBoostFromUi", "boolean", uiSpeedBoostEnabled, "TestUiInputSystem");
        };
    },
};
