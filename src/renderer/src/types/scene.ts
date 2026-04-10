import type { ExcalidrawImperativeAPI } from "@excalidraw/excalidraw/types";

export type SavedScene = {
  elements: Parameters<ExcalidrawImperativeAPI["updateScene"]>[0]["elements"];
  appState: { scrollX: number; scrollY: number; theme?: "light" | "dark" };
};

export type SceneElement = {
  x: number;
  y: number;
  width: number;
  height: number;
  isDeleted: boolean;
};
