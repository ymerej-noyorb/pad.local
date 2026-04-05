import type { ExcalidrawImperativeAPI } from "@excalidraw/excalidraw/types";
import { createEmbeddableElement, type EmbeddableLink } from "../lib/createEmbeddable";
import { colors } from "../theme";

interface Props {
  excalidrawAPI: ExcalidrawImperativeAPI;
}

function addNode(excalidrawAPI: ExcalidrawImperativeAPI, link: EmbeddableLink): void {
  const { scrollX, scrollY, zoom } = excalidrawAPI.getAppState();
  const element = createEmbeddableElement(link, { scrollX, scrollY, zoom });
  excalidrawAPI.updateScene({ elements: [...excalidrawAPI.getSceneElements(), element] });
}

const TOOLBAR_TOP = 12;
const TOOLBAR_GAP = 8;
const TOOLBAR_Z_INDEX = 10;
const TOOLBAR_BORDER_RADIUS = 8;
const BUTTON_FONT_SIZE = 13;
const BUTTON_FONT_WEIGHT = 500;
const BUTTON_BORDER_RADIUS = 6;

const TEXT = {
  addEditor: "Add Editor",
  addTerminal: "Add Terminal"
} as const;

const buttonStyle: React.CSSProperties = {
  background: colors.surface1,
  color: colors.text,
  border: "none",
  borderRadius: BUTTON_BORDER_RADIUS,
  padding: "5px 14px",
  fontSize: BUTTON_FONT_SIZE,
  fontWeight: BUTTON_FONT_WEIGHT,
  cursor: "pointer",
  lineHeight: "22px"
};

export default function Toolbar({ excalidrawAPI }: Props): React.JSX.Element {
  return (
    <div
      style={{
        position: "fixed",
        top: TOOLBAR_TOP,
        left: "50%",
        transform: "translateX(-50%)",
        display: "flex",
        gap: TOOLBAR_GAP,
        zIndex: TOOLBAR_Z_INDEX,
        background: colors.surface0,
        padding: "5px 10px",
        borderRadius: TOOLBAR_BORDER_RADIUS,
        boxShadow: `0 2px 10px ${colors.shadow}`
      }}
    >
      <button style={buttonStyle} onClick={() => addNode(excalidrawAPI, "!editor")}>
        {TEXT.addEditor}
      </button>
      <button style={buttonStyle} onClick={() => addNode(excalidrawAPI, "!terminal")}>
        {TEXT.addTerminal}
      </button>
    </div>
  );
}
