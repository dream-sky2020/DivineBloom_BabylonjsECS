import { CSSProperties, useEffect, useMemo, useState } from "react";
import { GameDataAccessor } from "../../../systems/dataAccessor";
import { UiLayoutConfig } from "../../core/types";
import {
    extractTemplateKeys,
    readDataAsBoolean,
    readDataAsNumber,
    readDataAsString,
    resolveTextTemplate,
    writeBoolean,
    writeNumber,
    writeString,
} from "./storyBinding";

type StoryOverlayProps = {
    layout: UiLayoutConfig;
    data: GameDataAccessor;
};

const buildSubscriptionKeys = (layout: UiLayoutConfig): string[] => {
    const keys = new Set<string>();
    for (const text of layout.texts) {
        if (text.bindText) {
            keys.add(text.bindText);
        }
        if (text.bindVisible) {
            keys.add(text.bindVisible);
        }
        if (text.bindFontFamily) {
            keys.add(text.bindFontFamily);
        }
        if (text.text) {
            for (const key of extractTemplateKeys(text.text)) {
                keys.add(key);
            }
        }
    }
    for (const button of layout.buttons) {
        keys.add(button.bindPressed);
        if (button.bindVisible) {
            keys.add(button.bindVisible);
        }
    }
    for (const toggle of layout.toggles) {
        keys.add(toggle.bindChecked);
        if (toggle.bindVisible) {
            keys.add(toggle.bindVisible);
        }
    }
    for (const slider of layout.sliders) {
        keys.add(slider.bindValue);
        if (slider.bindVisible) {
            keys.add(slider.bindVisible);
        }
    }
    for (const input of layout.inputs) {
        keys.add(input.bindValue);
        if (input.bindVisible) {
            keys.add(input.bindVisible);
        }
        if (input.bindFontFamily) {
            keys.add(input.bindFontFamily);
        }
    }
    return [...keys];
};

const absolutePosition = (left: number, top: number): CSSProperties => ({
    position: "absolute",
    left,
    top,
});

export const StoryOverlay = ({ layout, data }: StoryOverlayProps) => {
    const [version, setVersion] = useState(0);
    const subscriptionKeys = useMemo(() => buildSubscriptionKeys(layout), [layout]);

    useEffect(() => {
        const disposers = subscriptionKeys.map((key) => data.subscribe(key, () => {
            setVersion((value) => value + 1);
        }));
        return () => {
            for (const dispose of disposers) {
                dispose();
            }
        };
    }, [data, subscriptionKeys]);

    return (
        <div className="story-overlay-root" data-layout-id={layout.id} data-version={version}>
            <div className="story-overlay-stage" />
            <div className="story-overlay-panel">
                {layout.texts.map((text) => {
                    const visible = text.bindVisible ? readDataAsBoolean(data, text.bindVisible) : true;
                    if (!visible) {
                        return null;
                    }
                    const textValue = text.bindText
                        ? readDataAsString(data, text.bindText)
                        : resolveTextTemplate(text.text ?? "", data);
                    const fontFamily = text.bindFontFamily
                        ? readDataAsString(data, text.bindFontFamily)
                        : text.fontFamily;
                    return (
                        <p
                            key={text.id}
                            className="story-overlay-text"
                            data-ui-id={text.id}
                            style={{
                                ...absolutePosition(text.left, text.top),
                                color: text.color,
                                fontSize: text.fontSize,
                                fontFamily,
                            }}
                        >
                            {textValue}
                        </p>
                    );
                })}

                {layout.inputs.map((input) => {
                    const visible = input.bindVisible ? readDataAsBoolean(data, input.bindVisible) : true;
                    if (!visible) {
                        return null;
                    }
                    const fontFamily = input.bindFontFamily
                        ? readDataAsString(data, input.bindFontFamily)
                        : input.fontFamily;
                    return (
                        <input
                            key={input.id}
                            className="story-overlay-input"
                            data-ui-id={input.id}
                            style={{
                                ...absolutePosition(input.left, input.top),
                                width: input.width,
                                height: input.height,
                                color: input.color,
                                background: input.background,
                                fontSize: input.fontSize,
                                fontFamily,
                            }}
                            value={readDataAsString(data, input.bindValue)}
                            placeholder={input.placeholder}
                            onChange={(event) => {
                                writeString(data, input.bindValue, event.target.value);
                            }}
                        />
                    );
                })}

                {layout.buttons.map((button) => {
                    const visible = button.bindVisible ? readDataAsBoolean(data, button.bindVisible) : true;
                    if (!visible) {
                        return null;
                    }
                    return (
                        <button
                            key={button.id}
                            type="button"
                            className="story-overlay-button"
                            data-ui-id={button.id}
                            style={{
                                ...absolutePosition(button.left, button.top),
                                width: button.width,
                                height: button.height,
                                color: button.color,
                                background: button.background,
                                fontSize: button.fontSize,
                                fontFamily: button.fontFamily,
                            }}
                            onClick={() => {
                                writeBoolean(data, button.bindPressed, true);
                            }}
                        >
                            {button.text}
                        </button>
                    );
                })}

                {layout.toggles.map((toggle) => {
                    const visible = toggle.bindVisible ? readDataAsBoolean(data, toggle.bindVisible) : true;
                    if (!visible) {
                        return null;
                    }
                    return (
                        <label
                            key={toggle.id}
                            className="story-overlay-toggle"
                            data-ui-id={toggle.id}
                            style={{
                                ...absolutePosition(toggle.left, toggle.top),
                                width: toggle.width,
                                height: toggle.height,
                                color: toggle.color,
                                fontSize: toggle.fontSize,
                                fontFamily: toggle.fontFamily,
                            }}
                        >
                            <input
                                type="checkbox"
                                checked={readDataAsBoolean(data, toggle.bindChecked)}
                                onChange={(event) => {
                                    writeBoolean(data, toggle.bindChecked, event.target.checked);
                                }}
                            />
                            <span>{toggle.text}</span>
                        </label>
                    );
                })}

                {layout.sliders.map((slider) => {
                    const visible = slider.bindVisible ? readDataAsBoolean(data, slider.bindVisible) : true;
                    if (!visible) {
                        return null;
                    }
                    return (
                        <input
                            key={slider.id}
                            type="range"
                            className="story-overlay-slider"
                            data-ui-id={slider.id}
                            min={slider.min}
                            max={slider.max}
                            step={slider.step}
                            value={readDataAsNumber(data, slider.bindValue)}
                            style={{
                                ...absolutePosition(slider.left, slider.top),
                                width: slider.width,
                                height: slider.height,
                                accentColor: slider.thumbColor,
                            }}
                            onChange={(event) => {
                                writeNumber(data, slider.bindValue, Number(event.target.value));
                            }}
                        />
                    );
                })}
            </div>
        </div>
    );
};
