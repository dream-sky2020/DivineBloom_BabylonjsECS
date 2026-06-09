export type UiTextNodeConfig = {
    id: string;
    text?: string;
    bindText?: string;
    bindVisible?: string;
    fontFamily?: string;
    bindFontFamily?: string;
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
    fontFamily?: string;
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
    fontFamily?: string;
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

export type UiInputNodeConfig = {
    id: string;
    bindValue: string;
    bindVisible?: string;
    left: number;
    top: number;
    width: number;
    height: number;
    color: string;
    background: string;
    fontSize: number;
    placeholder?: string;
    fontFamily?: string;
    bindFontFamily?: string;
};

export type UiLayoutConfig = {
    id: string;
    texts: UiTextNodeConfig[];
    buttons: UiButtonNodeConfig[];
    toggles: UiToggleNodeConfig[];
    sliders: UiSliderNodeConfig[];
    inputs: UiInputNodeConfig[];
};
