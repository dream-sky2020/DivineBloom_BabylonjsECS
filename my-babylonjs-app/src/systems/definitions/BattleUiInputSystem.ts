import { RegisteredSystem } from "../types";

export const BattleUiInputSystem: RegisteredSystem = {
    name: "BattleUiInputSystem",
    requires: [
        { id: "runtime.ui.selectedActionId", kind: "string", access: "read" },
        { id: "runtime.ui.selectedTargetEntityId", kind: "string", access: "read" },
    ],
    create: (context) => {
        return () => {
            // Read and keep latest UI selections available to battle flow systems.
            context.data.get("runtime.ui.selectedActionId", "string", "BattleUiInputSystem");
            context.data.get("runtime.ui.selectedTargetEntityId", "string", "BattleUiInputSystem");
        };
    },
};
