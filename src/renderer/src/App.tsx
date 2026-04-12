import { useMemo, useState } from "react";
import { Excalidraw } from "@excalidraw/excalidraw";
import type { ExcalidrawImperativeAPI } from "@excalidraw/excalidraw/types";
import "@excalidraw/excalidraw/index.css";

import Editor from "./components/Editor";
import Spinner from "./components/Spinner";
import Toolbar from "./components/Toolbar";
import { useScene } from "./hooks/useScene";
import { createScrollLock } from "./lib/lockEmbeddables";
import { colors, colorsByTheme } from "./theme";

const TEXT = {
  terminalPlaceholder: "Terminal — coming in Step 3"
} as const;

const NODE_FONT_SIZE = 14;
const NODE_BORDER_RADIUS = 4;

const CANVAS_ACTIONS = {
  changeViewBackgroundColor: false,
  clearCanvas: false,
  export: false,
  loadScene: false,
  saveToActiveFile: false
} as const;

const EMBEDDABLE_LAYOUT: React.CSSProperties = {
  width: "100%",
  height: "100%",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: NODE_FONT_SIZE,
  fontFamily: "monospace",
  borderRadius: NODE_BORDER_RADIUS,
  userSelect: "none"
};

export default function App(): React.JSX.Element {
  const [excalidrawAPI, setExcalidrawAPI] = useState<ExcalidrawImperativeAPI | null>(null);
  const [scrollLocked, setScrollLocked] = useState(false);

  const { initialData, ready, handleChange } = useScene();
  const handleScrollChange = useMemo(() => createScrollLock(setScrollLocked), []);

  const renderEmbeddable: React.ComponentProps<typeof Excalidraw>["renderEmbeddable"] = (
    element,
    appState
  ) => {
    const themeColors = colorsByTheme[appState.theme === "light" ? "light" : "dark"];
    const style: React.CSSProperties = {
      ...EMBEDDABLE_LAYOUT,
      background: themeColors.base,
      color: themeColors.text,
      pointerEvents: scrollLocked ? "none" : "auto"
    };

    // Route by customData.type — stable even if the user renames the link label.
    const type = element.customData?.type;
    if (type === "editor") {
      return (
        <Editor theme={appState.theme === "light" ? "light" : "dark"} scrollLocked={scrollLocked} />
      );
    }
    if (type === "terminal") return <div style={style}>{TEXT.terminalPlaceholder}</div>;
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
        validateEmbeddable={(link) => link === "editor" || link === "terminal"}
        onChange={handleChange}
        onScrollChange={handleScrollChange}
        renderTopRightUI={() => (excalidrawAPI ? <Toolbar excalidrawAPI={excalidrawAPI} /> : null)}
        UIOptions={{ canvasActions: CANVAS_ACTIONS }}
      />
    </div>
  );
}
