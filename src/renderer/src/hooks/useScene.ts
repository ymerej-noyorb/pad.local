import { useEffect, useRef, useState } from "react";
import type { Excalidraw } from "@excalidraw/excalidraw";
import type { SavedScene } from "../types/scene";

type ExcalidrawChangeHandler = NonNullable<React.ComponentProps<typeof Excalidraw>["onChange"]>;

const SAVE_DEBOUNCE_MS = 500;

const DEFAULT_SCENE: SavedScene = {
  elements: [],
  appState: { scrollX: 0, scrollY: 0, theme: "dark" }
};

export function useScene(): {
  initialData: SavedScene | null;
  ready: boolean;
  handleChange: ExcalidrawChangeHandler;
} {
  const [initialData, setInitialData] = useState<SavedScene | null>(null);
  const [ready, setReady] = useState(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    window.api.loadScene().then((json: string | null) => {
      if (json) {
        try {
          setInitialData(JSON.parse(json));
        } catch {
          setInitialData(DEFAULT_SCENE);
        }
      } else {
        setInitialData(DEFAULT_SCENE);
      }
      setReady(true);
    });
  }, []);

  const handleChange: ExcalidrawChangeHandler = (elements, appState, files) => {
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      window.api.saveScene(
        JSON.stringify({
          elements,
          appState: { scrollX: appState.scrollX, scrollY: appState.scrollY, theme: appState.theme },
          files
        })
      );
    }, SAVE_DEBOUNCE_MS);
  };

  return { initialData, ready, handleChange };
}
