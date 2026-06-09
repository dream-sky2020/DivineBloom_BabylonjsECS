import { isRegisteredUiNodeType } from "./registry";
import { UiLayoutConfig } from "./types";

const requiredAttr = (element: Element, attrName: string) => {
    const value = element.getAttribute(attrName);
    if (!value) {
        throw new Error(`缺少属性: <${element.tagName}>.${attrName}`);
    }
    return value;
};

const parseNumber = (raw: string | null | undefined, fallback: number, context: string): number => {
    if (raw == null || raw.trim() === "") {
        return fallback;
    }
    const value = Number(raw);
    if (Number.isNaN(value)) {
        throw new Error(`${context} 不是有效数字: ${raw}`);
    }
    return value;
};

const loadXml = async (path: string): Promise<Document> => {
    const response = await fetch(path);
    if (!response.ok) {
        throw new Error(`加载 UI XML 失败: ${path} (${response.status})`);
    }
    const xmlText = await response.text();
    const doc = new DOMParser().parseFromString(xmlText, "application/xml");
    const parserError = doc.querySelector("parsererror");
    if (parserError) {
        throw new Error(`UI XML 解析失败: ${path}`);
    }
    return doc;
};

export const loadUiLayout = async (path: string): Promise<UiLayoutConfig> => {
    const doc = await loadXml(path);
    const uiNode = doc.querySelector("Ui");
    if (!uiNode) {
        throw new Error(`UI 文件缺少根节点 <Ui>: ${path}`);
    }
    const uiId = requiredAttr(uiNode, "id");
    const children = Array.from(uiNode.children);
    const unknownNodes = children.filter((node) => !isRegisteredUiNodeType(node.tagName));
    if (unknownNodes.length > 0) {
        throw new Error(`UI ${uiId} 存在未注册节点: ${unknownNodes[0].tagName}`);
    }

    const textNodes = children.filter((node) => node.tagName === "Text");
    const buttonNodes = children.filter((node) => node.tagName === "Button");
    const toggleNodes = children.filter((node) => node.tagName === "Toggle");
    const sliderNodes = children.filter((node) => node.tagName === "Slider");
    const inputNodes = children.filter((node) => node.tagName === "Input");

    const texts = textNodes.map((node) => {
        const id = requiredAttr(node, "id");
        const text = node.getAttribute("text") ?? undefined;
        const bindText = node.getAttribute("bindText") ?? node.getAttribute("bind:text") ?? undefined;
        if (!text && !bindText) {
            throw new Error(`UI ${uiId} Text(${id}) 至少需要 text 或 bind:text`);
        }

        return {
            id,
            text,
            bindText,
            bindVisible: node.getAttribute("bindVisible") ?? node.getAttribute("bind:visible") ?? undefined,
            fontFamily: node.getAttribute("fontFamily") ?? undefined,
            bindFontFamily: node.getAttribute("bindFontFamily") ?? node.getAttribute("bind:fontFamily") ?? undefined,
            left: parseNumber(node.getAttribute("left"), 0, `UI ${uiId} Text(${id}).left`),
            top: parseNumber(node.getAttribute("top"), 0, `UI ${uiId} Text(${id}).top`),
            color: node.getAttribute("color") ?? "#ffffff",
            fontSize: parseNumber(node.getAttribute("fontSize"), 24, `UI ${uiId} Text(${id}).fontSize`),
        };
    });
    const buttons = buttonNodes.map((node) => {
        const id = requiredAttr(node, "id");
        return {
            id,
            text: requiredAttr(node, "text"),
            bindPressed: node.getAttribute("bindPressed") ?? requiredAttr(node, "bind:pressed"),
            bindVisible: node.getAttribute("bindVisible") ?? node.getAttribute("bind:visible") ?? undefined,
            left: parseNumber(node.getAttribute("left"), 0, `UI ${uiId} Button(${id}).left`),
            top: parseNumber(node.getAttribute("top"), 0, `UI ${uiId} Button(${id}).top`),
            width: parseNumber(node.getAttribute("width"), 180, `UI ${uiId} Button(${id}).width`),
            height: parseNumber(node.getAttribute("height"), 44, `UI ${uiId} Button(${id}).height`),
            fontSize: parseNumber(node.getAttribute("fontSize"), 20, `UI ${uiId} Button(${id}).fontSize`),
            color: node.getAttribute("color") ?? "#ffffff",
            background: node.getAttribute("background") ?? "#2f6fed",
            fontFamily: node.getAttribute("fontFamily") ?? undefined,
        };
    });
    const toggles = toggleNodes.map((node) => {
        const id = requiredAttr(node, "id");
        return {
            id,
            text: requiredAttr(node, "text"),
            bindChecked: node.getAttribute("bindChecked") ?? requiredAttr(node, "bind:checked"),
            bindVisible: node.getAttribute("bindVisible") ?? node.getAttribute("bind:visible") ?? undefined,
            left: parseNumber(node.getAttribute("left"), 0, `UI ${uiId} Toggle(${id}).left`),
            top: parseNumber(node.getAttribute("top"), 0, `UI ${uiId} Toggle(${id}).top`),
            width: parseNumber(node.getAttribute("width"), 220, `UI ${uiId} Toggle(${id}).width`),
            height: parseNumber(node.getAttribute("height"), 26, `UI ${uiId} Toggle(${id}).height`),
            fontSize: parseNumber(node.getAttribute("fontSize"), 18, `UI ${uiId} Toggle(${id}).fontSize`),
            color: node.getAttribute("color") ?? "#ffffff",
            fontFamily: node.getAttribute("fontFamily") ?? undefined,
        };
    });
    const sliders = sliderNodes.map((node) => {
        const id = requiredAttr(node, "id");
        return {
            id,
            bindValue: node.getAttribute("bindValue") ?? requiredAttr(node, "bind:value"),
            bindVisible: node.getAttribute("bindVisible") ?? node.getAttribute("bind:visible") ?? undefined,
            left: parseNumber(node.getAttribute("left"), 0, `UI ${uiId} Slider(${id}).left`),
            top: parseNumber(node.getAttribute("top"), 0, `UI ${uiId} Slider(${id}).top`),
            width: parseNumber(node.getAttribute("width"), 220, `UI ${uiId} Slider(${id}).width`),
            height: parseNumber(node.getAttribute("height"), 24, `UI ${uiId} Slider(${id}).height`),
            min: parseNumber(node.getAttribute("min"), 0, `UI ${uiId} Slider(${id}).min`),
            max: parseNumber(node.getAttribute("max"), 1, `UI ${uiId} Slider(${id}).max`),
            step: parseNumber(node.getAttribute("step"), 0.01, `UI ${uiId} Slider(${id}).step`),
            background: node.getAttribute("background") ?? "#2f2f2f",
            thumbColor: node.getAttribute("thumbColor") ?? "#8bd3ff",
        };
    });
    const inputs = inputNodes.map((node) => {
        const id = requiredAttr(node, "id");
        return {
            id,
            bindValue: node.getAttribute("bindValue") ?? requiredAttr(node, "bind:value"),
            bindVisible: node.getAttribute("bindVisible") ?? node.getAttribute("bind:visible") ?? undefined,
            left: parseNumber(node.getAttribute("left"), 0, `UI ${uiId} Input(${id}).left`),
            top: parseNumber(node.getAttribute("top"), 0, `UI ${uiId} Input(${id}).top`),
            width: parseNumber(node.getAttribute("width"), 320, `UI ${uiId} Input(${id}).width`),
            height: parseNumber(node.getAttribute("height"), 46, `UI ${uiId} Input(${id}).height`),
            color: node.getAttribute("color") ?? "#ffffff",
            background: node.getAttribute("background") ?? "rgba(0, 0, 0, 0.5)",
            fontSize: parseNumber(node.getAttribute("fontSize"), 24, `UI ${uiId} Input(${id}).fontSize`),
            placeholder: node.getAttribute("placeholder") ?? undefined,
            fontFamily: node.getAttribute("fontFamily") ?? undefined,
            bindFontFamily: node.getAttribute("bindFontFamily") ?? node.getAttribute("bind:fontFamily") ?? undefined,
        };
    });

    return {
        id: uiId,
        texts,
        buttons,
        toggles,
        sliders,
        inputs,
    };
};
