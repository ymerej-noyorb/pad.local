import type { ExcalidrawImperativeAPI, BinaryFiles } from "@excalidraw/excalidraw/types";

// Mirror of Excalidraw's internal branded type — used only for initialData compatibility.
export type NormalizedZoomValue = number & { _brand: "normalizedZoom" };

export type SavedScene = {
  elements: Parameters<ExcalidrawImperativeAPI["updateScene"]>[0]["elements"];
  appState: {
    scrollX: number;
    scrollY: number;
    zoom?: { value: NormalizedZoomValue };
    theme?: "light" | "dark";
  };
  files?: BinaryFiles;
};

export type SceneElement = {
  x: number;
  y: number;
  width: number;
  height: number;
  isDeleted: boolean;
};
