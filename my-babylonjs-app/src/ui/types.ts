export type UiTextNodeConfig = {
    id: string;
    text?: string;
    bindText?: string;
    bindVisible?: string;
    left: number;
    top: number;
    color: string;
    fontSize: number;
};

export type UiButtonNodeConfig = {
    id: string;
    text: string;
    bindPressed: string;
    bindVisible?: string;
    left: number;
    top: number;
    width: number;
    height: number;
    fontSize: number;
    color: string;
    background: string;
};

export type UiToggleNodeConfig = {
    id: string;
    text: string;
    bindChecked: string;
    bindVisible?: string;
    left: number;
    top: number;
    width: number;
    height: number;
    fontSize: number;
    color: string;
};

export type UiSliderNodeConfig = {
    id: string;
    bindValue: string;
    bindVisible?: string;
    left: number;
    top: number;
    width: number;
    height: number;
    min: number;
    max: number;
    step: number;
    background: string;
    thumbColor: string;
};

export type UiLayoutConfig = {
    id: string;
    texts: UiTextNodeConfig[];
    buttons: UiButtonNodeConfig[];
    toggles: UiToggleNodeConfig[];
    sliders: UiSliderNodeConfig[];
};
