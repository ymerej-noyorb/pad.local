import { useCallback, useEffect, useRef, useState } from "react";
import type { Excalidraw } from "@excalidraw/excalidraw";
import type { SavedScene, NormalizedZoomValue } from "../types/scene";

type ExcalidrawChangeHandler = NonNullable<React.ComponentProps<typeof Excalidraw>["onChange"]>;
type CurrentScene = {
  elements: Parameters<ExcalidrawChangeHandler>[0];
  appState: Parameters<ExcalidrawChangeHandler>[1];
  files: Parameters<ExcalidrawChangeHandler>[2];
};

const SAVE_DEBOUNCE_MS = 500;

const DEFAULT_SCENE: SavedScene = {
  elements: [],
  appState: { scrollX: 0, scrollY: 0, theme: "dark" }
};

export function useScene(workspaceId: string): {
  initialData: SavedScene | null;
  ready: boolean;
  handleChange: ExcalidrawChangeHandler;
  forceSave: () => Promise<void>;
} {
  // Keyed by workspaceId so that initialData is null (ready=false) whenever the
  // loaded workspace does not yet match the requested one — no synchronous setState needed.
  const [sceneData, setSceneData] = useState<{ workspaceId: string; data: SavedScene } | null>(
    null
  );
  const saveTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const currentScene = useRef<CurrentScene | null>(null);

  const initialData = sceneData?.workspaceId === workspaceId ? sceneData.data : null;
  const ready = initialData !== null;

  useEffect(() => {
    if (!workspaceId) return;
    clearTimeout(saveTimer.current);
    currentScene.current = null;
    window.api.loadScene().then((json: string | null) => {
      let data: SavedScene;
      if (json) {
        try {
          const parsed = JSON.parse(json) as SavedScene;
          // JSON deserializes zoom.value as a plain number; cast it back to the branded type.
          if (parsed.appState?.zoom !== undefined) {
            parsed.appState = {
              ...parsed.appState,
              zoom: { value: parsed.appState.zoom.value as NormalizedZoomValue }
            };
          }
          data = parsed;
        } catch {
          data = DEFAULT_SCENE;
        }
      } else {
        data = DEFAULT_SCENE;
      }
      setSceneData({ workspaceId, data });
    });
  }, [workspaceId]);

  const serializeScene = useCallback((scene: CurrentScene): string => {
    return JSON.stringify({
      elements: scene.elements,
      appState: {
        scrollX: scene.appState.scrollX,
        scrollY: scene.appState.scrollY,
        zoom: scene.appState.zoom,
        theme: scene.appState.theme
      },
      files: scene.files
    });
  }, []);

  const handleChange: ExcalidrawChangeHandler = useCallback(
    (elements, appState, files) => {
      currentScene.current = { elements, appState, files };
      clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => {
        window.api.saveScene(serializeScene({ elements, appState, files }));
      }, SAVE_DEBOUNCE_MS);
    },
    [serializeScene]
  );

  const forceSave = useCallback(async (): Promise<void> => {
    clearTimeout(saveTimer.current);
    if (currentScene.current) {
      await window.api.saveScene(serializeScene(currentScene.current));
    }
  }, [serializeScene]);

  return { initialData, ready, handleChange, forceSave };
}
