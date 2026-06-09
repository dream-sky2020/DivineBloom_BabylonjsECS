type CreateDomGameUiOptions = {
    document: Document;
    isDeveloperMode: boolean;
};

export type DomGameUi = {
    canvas: HTMLCanvasElement;
    setDevStatus: (text: string) => void;
    updateHud: (score: number, targetScore: number, hp: number) => void;
    showMessage: (text: string) => void;
    hideMessage: () => void;
};

export const createDomGameUi = (options: CreateDomGameUiOptions): DomGameUi => {
    const { document, isDeveloperMode } = options;
    const canvas = document.getElementById("renderCanvas");
    const scoreLabel = document.getElementById("score");
    const hpLabel = document.getElementById("hp");
    const messageLabel = document.getElementById("message");

    if (!(canvas instanceof HTMLCanvasElement)) {
        throw new Error("未找到渲染画布 #renderCanvas");
    }

    const devStatusLabel = document.createElement("div");
    devStatusLabel.style.position = "fixed";
    devStatusLabel.style.right = "16px";
    devStatusLabel.style.top = "16px";
    devStatusLabel.style.zIndex = "12";
    devStatusLabel.style.padding = "8px 10px";
    devStatusLabel.style.borderRadius = "8px";
    devStatusLabel.style.background = "rgba(0, 0, 0, 0.45)";
    devStatusLabel.style.color = "#dbeafe";
    devStatusLabel.style.fontFamily = "\"Segoe UI\", system-ui, sans-serif";
    devStatusLabel.style.fontSize = "12px";
    devStatusLabel.style.lineHeight = "1.4";
    devStatusLabel.style.display = "none";
    document.body.appendChild(devStatusLabel);

    const setDevStatus = (text: string) => {
        if (!isDeveloperMode) {
            devStatusLabel.style.display = "none";
            return;
        }
        devStatusLabel.textContent = text;
        devStatusLabel.style.display = "block";
    };

    const updateHud = (score: number, targetScore: number, hp: number) => {
        if (!(scoreLabel instanceof HTMLDivElement) || !(hpLabel instanceof HTMLDivElement)) {
            return;
        }
        scoreLabel.textContent = `分数：${score} / ${targetScore}`;
        hpLabel.textContent = `生命：${hp}`;
    };

    const showMessage = (text: string) => {
        if (!(messageLabel instanceof HTMLDivElement)) {
            return;
        }
        messageLabel.textContent = text;
        messageLabel.style.display = "block";
    };

    const hideMessage = () => {
        if (!(messageLabel instanceof HTMLDivElement)) {
            return;
        }
        messageLabel.style.display = "none";
    };

    return {
        canvas,
        setDevStatus,
        updateHud,
        showMessage,
        hideMessage,
    };
};
