import { createRoot } from "react-dom/client";
import { PanelRenderer } from "../types";
import { StoryOverlay } from "./StoryOverlay";
import "./storyOverlay.css";

export const createStoryPanelRenderer: PanelRenderer = ({
    overlayRoot,
    layout,
    data,
}) => {
    const host = document.createElement("div");
    host.className = "story-overlay-host";
    overlayRoot.appendChild(host);

    const root = createRoot(host);
    root.render(<StoryOverlay layout={layout} data={data} />);

    return {
        refresh: () => {},
        dispose: () => {
            root.unmount();
            host.remove();
        },
    };
};
