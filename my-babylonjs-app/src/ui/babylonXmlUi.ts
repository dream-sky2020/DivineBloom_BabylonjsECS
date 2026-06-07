import { Scene } from "@babylonjs/core/scene";
import { AdvancedDynamicTexture } from "@babylonjs/gui/2D/advancedDynamicTexture";
import { Button } from "@babylonjs/gui/2D/controls/button";
import { Checkbox } from "@babylonjs/gui/2D/controls/checkbox";
import { Control } from "@babylonjs/gui/2D/controls/control";
import { Slider } from "@babylonjs/gui/2D/controls/sliders/slider";
import { TextBlock } from "@babylonjs/gui/2D/controls/textBlock";
import { GameDataAccessor } from "../systems/dataAccessor";
import {
    UiButtonNodeConfig,
    UiLayoutConfig,
    UiSliderNodeConfig,
    UiTextNodeConfig,
    UiToggleNodeConfig,
} from "./types";

type CreateBabylonXmlUiArgs = {
    scene: Scene;
    data: GameDataAccessor;
    layout: UiLayoutConfig;
};

type BabylonXmlUiRuntime = {
    refresh: () => void;
    dispose: () => void;
};

const readDataAsString = (data: GameDataAccessor, key: string): string => {
    const schema = data.getSchema(key);
    if (!schema) {
        return "";
    }
    if (schema.valueType === "number") {
        return String(data.get(key, "number", "XmlUi"));
    }
    if (schema.valueType === "boolean") {
        return String(data.get(key, "boolean", "XmlUi"));
    }
    if (schema.valueType === "vector3") {
        const value = data.get(key, "vector3", "XmlUi");
        return `${value.x.toFixed(2)},${value.y.toFixed(2)},${value.z.toFixed(2)}`;
    }
    if (schema.valueType === "color3") {
        return data.get(key, "color3", "XmlUi");
    }
    return data.get(key, "string", "XmlUi");
};

const readDataAsBoolean = (data: GameDataAccessor, key: string): boolean => {
    const schema = data.getSchema(key);
    if (!schema) {
        return false;
    }
    if (schema.valueType === "boolean") {
        return data.get(key, "boolean", "XmlUi");
    }
    if (schema.valueType === "number") {
        return data.get(key, "number", "XmlUi") !== 0;
    }
    return readDataAsString(data, key).length > 0;
};

const readDataAsNumber = (data: GameDataAccessor, key: string): number => {
    const schema = data.getSchema(key);
    if (!schema) {
        return 0;
    }
    if (schema.valueType === "number") {
        return data.get(key, "number", "XmlUi");
    }
    if (schema.valueType === "boolean") {
        return data.get(key, "boolean", "XmlUi") ? 1 : 0;
    }
    const parsed = Number(readDataAsString(data, key));
    return Number.isNaN(parsed) ? 0 : parsed;
};

const writeBoolean = (data: GameDataAccessor, key: string, value: boolean) => {
    const schema = data.getSchema(key);
    if (!schema || schema.valueType !== "boolean" || !schema.mutable) {
        throw new Error(`UI 尝试写入不可用布尔字段: ${key}`);
    }
    data.set(key, "boolean", value, "XmlUi");
};

const writeNumber = (data: GameDataAccessor, key: string, value: number) => {
    const schema = data.getSchema(key);
    if (!schema || schema.valueType !== "number" || !schema.mutable) {
        throw new Error(`UI 尝试写入不可用数字字段: ${key}`);
    }
    data.set(key, "number", value, "XmlUi");
};

const resolveTextTemplate = (template: string, data: GameDataAccessor): string => (
    template.replace(/\{([^}]+)\}/g, (_, token: string) => readDataAsString(data, token.trim()))
);

const createTextNode = (config: UiTextNodeConfig): TextBlock => {
    const textBlock = new TextBlock(config.id, config.text ?? "");
    textBlock.color = config.color;
    textBlock.fontSize = config.fontSize;
    textBlock.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
    textBlock.textVerticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
    textBlock.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
    textBlock.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
    textBlock.leftInPixels = config.left;
    textBlock.topInPixels = config.top;
    textBlock.resizeToFit = true;
    textBlock.zIndex = 20;
    return textBlock;
};

const createButtonNode = (config: UiButtonNodeConfig): Button => {
    const button = Button.CreateSimpleButton(config.id, config.text);
    button.color = config.color;
    button.background = config.background;
    button.fontSize = config.fontSize;
    button.widthInPixels = config.width;
    button.heightInPixels = config.height;
    button.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
    button.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
    button.leftInPixels = config.left;
    button.topInPixels = config.top;
    button.cornerRadius = 8;
    button.thickness = 0;
    button.zIndex = 20;
    return button;
};

const createToggleNode = (config: UiToggleNodeConfig): { checkbox: Checkbox; label: TextBlock } => {
    const checkbox = new Checkbox(`${config.id}.checkbox`);
    checkbox.widthInPixels = config.height;
    checkbox.heightInPixels = config.height;
    checkbox.color = config.color;
    checkbox.background = "rgba(0, 0, 0, 0.25)";
    checkbox.thickness = 2;
    checkbox.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
    checkbox.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
    checkbox.leftInPixels = config.left;
    checkbox.topInPixels = config.top;
    checkbox.zIndex = 20;

    const label = new TextBlock(`${config.id}.label`, config.text);
    label.color = config.color;
    label.fontSize = config.fontSize;
    label.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
    label.textVerticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
    label.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
    label.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
    label.leftInPixels = config.left + config.height + 10;
    label.topInPixels = config.top;
    label.widthInPixels = config.width;
    label.heightInPixels = config.height;
    label.zIndex = 20;
    return { checkbox, label };
};

const createSliderNode = (config: UiSliderNodeConfig): Slider => {
    const slider = new Slider(config.id);
    slider.minimum = config.min;
    slider.maximum = config.max;
    slider.step = config.step;
    slider.heightInPixels = config.height;
    slider.widthInPixels = config.width;
    slider.background = config.background;
    slider.color = config.thumbColor;
    slider.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
    slider.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
    slider.leftInPixels = config.left;
    slider.topInPixels = config.top;
    slider.zIndex = 20;
    return slider;
};

export const createBabylonXmlUi = ({ scene, data, layout }: CreateBabylonXmlUiArgs): BabylonXmlUiRuntime => {
    const texture = AdvancedDynamicTexture.CreateFullscreenUI(`ui:${layout.id}`, true, scene);
    const textBlocks = layout.texts.map((config) => {
        const textBlock = createTextNode(config);
        texture.addControl(textBlock);
        return { config, textBlock };
    });
    const buttons = layout.buttons.map((config) => {
        const button = createButtonNode(config);
        button.onPointerUpObservable.add(() => {
            writeBoolean(data, config.bindPressed, true);
        });
        texture.addControl(button);
        return { config, button };
    });
    const toggles = layout.toggles.map((config) => {
        const nodes = createToggleNode(config);
        nodes.checkbox.onIsCheckedChangedObservable.add((checked) => {
            writeBoolean(data, config.bindChecked, checked);
        });
        texture.addControl(nodes.checkbox);
        texture.addControl(nodes.label);
        return { config, ...nodes };
    });
    const sliders = layout.sliders.map((config) => {
        const slider = createSliderNode(config);
        slider.onValueChangedObservable.add((value: number) => {
            writeNumber(data, config.bindValue, value);
        });
        texture.addControl(slider);
        return { config, slider };
    });

    const refresh = () => {
        for (const { config, textBlock } of textBlocks) {
            if (config.bindText) {
                textBlock.text = readDataAsString(data, config.bindText);
            } else if (config.text) {
                textBlock.text = resolveTextTemplate(config.text, data);
            }
            if (config.bindVisible) {
                textBlock.isVisible = readDataAsBoolean(data, config.bindVisible);
            }
        }
        for (const { config, button } of buttons) {
            if (config.bindVisible) {
                button.isVisible = readDataAsBoolean(data, config.bindVisible);
            }
        }
        for (const { config, checkbox, label } of toggles) {
            const checked = readDataAsBoolean(data, config.bindChecked);
            if (checkbox.isChecked !== checked) {
                checkbox.isChecked = checked;
            }
            if (config.bindVisible) {
                const visible = readDataAsBoolean(data, config.bindVisible);
                checkbox.isVisible = visible;
                label.isVisible = visible;
            }
        }
        for (const { config, slider } of sliders) {
            const nextValue = readDataAsNumber(data, config.bindValue);
            if (Math.abs(slider.value - nextValue) > 0.0001) {
                slider.value = nextValue;
            }
            if (config.bindVisible) {
                slider.isVisible = readDataAsBoolean(data, config.bindVisible);
            }
        }
    };

    return {
        refresh,
        dispose: () => texture.dispose(),
    };
};
