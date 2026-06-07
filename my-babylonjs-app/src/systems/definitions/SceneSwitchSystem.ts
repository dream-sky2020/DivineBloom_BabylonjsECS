import { RegisteredSystem } from "../types";

export const SceneSwitchSystem: RegisteredSystem = {
    name: "SceneSwitchSystem",
    requires: [
        { id: "runtime.input.prevWorldPressed", kind: "boolean", access: "read" },
        { id: "runtime.input.nextWorldPressed", kind: "boolean", access: "read" },
    ],
    create: (context) => {
        let wasPrevPressed = false;
        let wasNextPressed = false;

        return () => {
            const prevPressed = context.data.get("runtime.input.prevWorldPressed", "boolean", "SceneSwitchSystem");
            const nextPressed = context.data.get("runtime.input.nextWorldPressed", "boolean", "SceneSwitchSystem");

            if (nextPressed && !wasNextPressed) {
                void context.services.switchToNextWorld();
            } else if (prevPressed && !wasPrevPressed) {
                void context.services.switchToPreviousWorld();
            }

            wasPrevPressed = prevPressed;
            wasNextPressed = nextPressed;
        };
    },
};
