import { useMemo, useState } from "react";
import { Excalidraw } from "@excalidraw/excalidraw";
import type { ExcalidrawImperativeAPI } from "@excalidraw/excalidraw/types";
import "@excalidraw/excalidraw/index.css";

import Editor from "./components/Editor";
import Terminal from "./components/Terminal";
import Spinner from "./components/Spinner";
import Toolbar from "./components/Toolbar";
import { useScene } from "./hooks/useScene";
import { createScrollLock } from "./lib/lockEmbeddables";
import { colors } from "./theme";
import type { EditorType } from "../../shared/types";

const EMBEDDABLE_TYPE_EDITOR = "editor";
const EMBEDDABLE_TYPE_TERMINAL = "terminal";

const CANVAS_ACTIONS = {
  changeViewBackgroundColor: false,
  clearCanvas: false,
  export: false,
  loadScene: false,
  saveToActiveFile: false
} as const;

export default function App(): React.JSX.Element {
  const [excalidrawAPI, setExcalidrawAPI] = useState<ExcalidrawImperativeAPI | null>(null);
  const [scrollLocked, setScrollLocked] = useState(false);

  const { initialData, ready, handleChange } = useScene();
  const handleScrollChange = useMemo(() => createScrollLock(setScrollLocked), []);

  const renderEmbeddable: React.ComponentProps<typeof Excalidraw>["renderEmbeddable"] = (
    element,
    appState
  ) => {
    const type = element.customData?.type;
    const theme = appState.theme === "light" ? "light" : "dark";

    if (type === EMBEDDABLE_TYPE_EDITOR) {
      const editorType = (element.customData?.editorType ?? "vscode") as EditorType;
      return <Editor editorType={editorType} theme={theme} scrollLocked={scrollLocked} />;
    }

    if (type === EMBEDDABLE_TYPE_TERMINAL) {
      const shell = (element.customData?.shell ?? "") as string;
      return <Terminal id={element.id} shell={shell} scrollLocked={scrollLocked} />;
    }

    return null;
  };

  if (!ready) {
    return (
      <div
        style={{
          position: "fixed",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: colors.base
        }}
      >
        <Spinner size={28} color={colors.overlay0} />
      </div>
    );
  }

  return (
    <div style={{ position: "fixed", inset: 0 }}>
      <Excalidraw
        excalidrawAPI={setExcalidrawAPI}
        initialData={initialData ?? undefined}
        gridModeEnabled
        renderEmbeddable={renderEmbeddable}
        validateEmbeddable={(link) =>
          link === EMBEDDABLE_TYPE_EDITOR || link === EMBEDDABLE_TYPE_TERMINAL
        }
        onChange={handleChange}
        onScrollChange={handleScrollChange}
        renderTopRightUI={() => (excalidrawAPI ? <Toolbar excalidrawAPI={excalidrawAPI} /> : null)}
        UIOptions={{ canvasActions: CANVAS_ACTIONS }}
      />
    </div>
  );
}
