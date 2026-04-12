import { useState } from "react";
import { Code2, Terminal } from "lucide-react";
import type { ExcalidrawImperativeAPI } from "@excalidraw/excalidraw/types";
import { createEmbeddableElement } from "../lib/createEmbeddable";
import type { EmbeddableType } from "../types/embeddable";

interface Props {
  excalidrawAPI: ExcalidrawImperativeAPI;
}

function addNode(excalidrawAPI: ExcalidrawImperativeAPI, type: EmbeddableType): void {
  const { scrollX, scrollY, zoom } = excalidrawAPI.getAppState();
  const existingElements = excalidrawAPI.getSceneElements();
  const newElement = createEmbeddableElement(type, scrollX, scrollY, zoom.value, existingElements);
  excalidrawAPI.updateScene({ elements: [...existingElements, newElement] });
}

const ICON_PX = 16;
const ICON_STROKE_WIDTH = 1.5;
const ISLAND_GAP = "0.125rem";
const ISLAND_PADDING = "0.25rem";

const TEXT = {
  addEditor: "Add Editor",
  addTerminal: "Add Terminal",
} as const;

function ToolButton({
  icon,
  title,
  onClick,
}: {
  icon: React.ReactNode;
  title: string;
  onClick: () => void;
}): React.JSX.Element {
  const [hovered, setHovered] = useState(false);

  return (
    <button
      title={title}
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        width: "var(--default-button-size, 2rem)",
        height: "var(--default-button-size, 2rem)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        border: 0,
        borderRadius: "var(--border-radius-lg, 0.5rem)",
        background: hovered ? "var(--button-hover-bg)" : "transparent",
        color: "var(--icon-fill-color, #e3e3e8)",
        cursor: "pointer",
        padding: 0,
      }}
    >
      {icon}
    </button>
  );
}

export default function Toolbar({ excalidrawAPI }: Props): React.JSX.Element {
  return (
    <div
      style={{
        display: "flex",
        gap: ISLAND_GAP,
        background: "var(--island-bg-color)",
        borderRadius: "var(--border-radius-lg, 0.5rem)",
        boxShadow: "var(--shadow-island)",
        padding: ISLAND_PADDING,
      }}
    >
      <ToolButton
        icon={<Code2 size={ICON_PX} strokeWidth={ICON_STROKE_WIDTH} />}
        title={TEXT.addEditor}
        onClick={() => addNode(excalidrawAPI, "editor")}
      />
      <ToolButton
        icon={<Terminal size={ICON_PX} strokeWidth={ICON_STROKE_WIDTH} />}
        title={TEXT.addTerminal}
        onClick={() => addNode(excalidrawAPI, "terminal")}
      />
    </div>
  );
}
