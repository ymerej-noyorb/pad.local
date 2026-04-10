import { useEffect, useRef, useState } from "react";
import type { SavedScene } from "../types/scene";

const SAVE_DEBOUNCE_MS = 500;

const DEFAULT_SCENE: SavedScene = {
  elements: [],
  appState: { scrollX: 0, scrollY: 0, theme: "dark" }
};

export function useScene(): {
  initialData: SavedScene | null;
  ready: boolean;
  handleChange: React.ComponentProps<
    typeof import("@excalidraw/excalidraw").Excalidraw
  >["onChange"];
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

  const handleChange: React.ComponentProps<
    typeof import("@excalidraw/excalidraw").Excalidraw
  >["onChange"] = (elements, appState) => {
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      window.api.saveScene(
        JSON.stringify({
          elements,
          appState: { scrollX: appState.scrollX, scrollY: appState.scrollY, theme: appState.theme }
        })
      );
    }, SAVE_DEBOUNCE_MS);
  };

  return { initialData, ready, handleChange };
}
