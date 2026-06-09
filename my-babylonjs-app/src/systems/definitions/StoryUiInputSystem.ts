import { RegisteredSystem } from "../types";

export const StoryUiInputSystem: RegisteredSystem = {
    name: "StoryUiInputSystem",
    requires: [
        { id: "runtime.ui.nextDialoguePressed", kind: "boolean", access: "read" },
        { id: "runtime.ui.nextDialoguePressed", kind: "boolean", access: "write" },
        { id: "runtime.ui.selectedChoiceIndex", kind: "number", access: "read" },
        { id: "runtime.ui.autoPlayEnabled", kind: "boolean", access: "read" },
        { id: "runtime.ui.skipPressed", kind: "boolean", access: "read" },
    ],
    create: (context) => {
        return () => {
            const nextDialoguePressed = context.data.get("runtime.ui.nextDialoguePressed", "boolean", "StoryUiInputSystem");
            if (nextDialoguePressed) {
                // Consume one-shot dialogue advance pulse from XML UI.
                context.data.set("runtime.ui.nextDialoguePressed", "boolean", false, "StoryUiInputSystem");
            }

            // Read-only state consumption for branching and playback controls.
            context.data.get("runtime.ui.selectedChoiceIndex", "number", "StoryUiInputSystem");
            context.data.get("runtime.ui.autoPlayEnabled", "boolean", "StoryUiInputSystem");
            context.data.get("runtime.ui.skipPressed", "boolean", "StoryUiInputSystem");
        };
    },
};
