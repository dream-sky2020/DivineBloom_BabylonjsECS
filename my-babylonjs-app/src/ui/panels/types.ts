import { Scene } from "@babylonjs/core/scene";
import { GameDataAccessor } from "../../systems/dataAccessor";
import { UiLayoutConfig } from "../core/types";

export type UiRuntime = {
    refresh: () => void;
    dispose: () => void;
};

export type CreatePanelRendererArgs = {
    scene: Scene;
    data: GameDataAccessor;
    layout: UiLayoutConfig;
    overlayRoot: HTMLElement;
};

export type PanelRenderer = (args: CreatePanelRendererArgs) => UiRuntime;
