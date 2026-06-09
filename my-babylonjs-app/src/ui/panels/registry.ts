import { createBabylonXmlUi } from "../core/babylonXmlUi";
import { CreatePanelRendererArgs, PanelRenderer, UiRuntime } from "./types";
import { createStoryPanelRenderer } from "./story/storyPanelRenderer";

const PANEL_RENDERERS: Record<string, PanelRenderer> = {
    "story.main": createStoryPanelRenderer,
};

type CreateUiRuntimesArgs = Omit<CreatePanelRendererArgs, "layout"> & {
    layouts: CreatePanelRendererArgs["layout"][];
};

export const createUiRuntimes = (args: CreateUiRuntimesArgs): UiRuntime[] => {
    const { layouts, scene, data, overlayRoot } = args;
    return layouts.map((layout) => {
        const panelRenderer = PANEL_RENDERERS[layout.id];
        if (panelRenderer) {
            return panelRenderer({ scene, data, layout, overlayRoot });
        }
        return createBabylonXmlUi({ scene, data, layout });
    });
};
