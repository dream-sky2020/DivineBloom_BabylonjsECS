export const REGISTERED_UI_NODE_TYPES = [
    "Text",
    "Button",
    "Toggle",
    "Slider",
] as const;

const REGISTERED_UI_NODE_TYPE_SET = new Set<string>(REGISTERED_UI_NODE_TYPES);

export const isRegisteredUiNodeType = (nodeType: string): boolean => (
    REGISTERED_UI_NODE_TYPE_SET.has(nodeType)
);
