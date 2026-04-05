import { useMemo, useState } from "react";
import { Excalidraw } from "@excalidraw/excalidraw";
import type { ExcalidrawImperativeAPI } from "@excalidraw/excalidraw/types";
import "@excalidraw/excalidraw/index.css";

import Toolbar from "./components/Toolbar";
import { useScene } from "./hooks/useScene";
import { createScrollLock } from "./lib/lockEmbeddables";
import { colors } from "./theme";

const TEXT = {
  editorPlaceholder: "Editor — coming in Step 2",
  terminalPlaceholder: "Terminal — coming in Step 3"
} as const;

const NODE_FONT_SIZE = 14;
const NODE_BORDER_RADIUS = 4;

const CANVAS_ACTIONS = {
  changeViewBackgroundColor: false,
  clearCanvas: false,
  loadScene: false,
  saveToActiveFile: false,
  toggleTheme: false
} as const;

const embeddableStyle: React.CSSProperties = {
  width: "100%",
  height: "100%",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  background: colors.base,
  color: colors.text,
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
    element
  ) => {
    const style = { ...embeddableStyle, pointerEvents: scrollLocked ? "none" : "auto" } as const;

    if (element.link === "!editor") return <div style={style}>{TEXT.editorPlaceholder}</div>;
    if (element.link === "!terminal") return <div style={style}>{TEXT.terminalPlaceholder}</div>;
    return null;
  };

  if (!ready) return <></>;

  return (
    <div style={{ position: "fixed", inset: 0 }}>
      <Excalidraw
        excalidrawAPI={setExcalidrawAPI}
        initialData={initialData ?? undefined}
        gridModeEnabled
        theme="dark"
        renderEmbeddable={renderEmbeddable}
        validateEmbeddable={(link) => link === "!editor" || link === "!terminal"}
        onChange={handleChange}
        onScrollChange={handleScrollChange}
        renderTopRightUI={() => excalidrawAPI ? <Toolbar excalidrawAPI={excalidrawAPI} /> : null}
        UIOptions={{ canvasActions: CANVAS_ACTIONS }}
      />
    </div>
  );
}
