import { useEffect, useRef, useState } from "react";
import { Code2, Terminal } from "lucide-react";
import type { ExcalidrawImperativeAPI } from "@excalidraw/excalidraw/types";
import { createEmbeddableElement } from "../lib/createEmbeddable";
import type { EditorInfo, ShellInfo } from "../../../shared/types";
import Picker, { type PickerOption } from "./Picker";

interface Props {
  excalidrawAPI: ExcalidrawImperativeAPI;
}

const ICON_PX = 16;
const ICON_STROKE_WIDTH = 1.5;
const ISLAND_GAP = "0.125rem";
const ISLAND_PADDING = "0.25rem";

const TEXT = {
  addEditor: "Add Editor",
  addTerminal: "Add Terminal"
} as const;

function ToolButton({
  icon,
  title,
  onClick,
  buttonRef
}: {
  icon: React.ReactNode;
  title: string;
  onClick: () => void;
  buttonRef?: React.RefObject<HTMLButtonElement | null>;
}): React.JSX.Element {
  const [hovered, setHovered] = useState(false);

  return (
    <button
      ref={buttonRef}
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
        padding: 0
      }}
    >
      {icon}
    </button>
  );
}

export default function Toolbar({ excalidrawAPI }: Props): React.JSX.Element {
  const [editorOptions, setEditorOptions] = useState<PickerOption[]>([]);
  const [shellOptions, setShellOptions] = useState<PickerOption[]>([]);
  const [activePicker, setActivePicker] = useState<"editor" | "terminal" | null>(null);

  const editorButtonRef = useRef<HTMLButtonElement>(null);
  const terminalButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    window.api.detectEditors().then((editors: EditorInfo[]) => {
      setEditorOptions(editors.map((editor) => ({ value: editor.type, label: editor.label })));
    });
    window.api.detectShells().then((shells: ShellInfo[]) => {
      setShellOptions(shells.map((shell) => ({ value: shell.path, label: shell.label })));
    });
  }, []);

  function handleEditorSelect(editorType: string): void {
    setActivePicker(null);
    const { scrollX, scrollY, zoom } = excalidrawAPI.getAppState();
    const existingElements = excalidrawAPI.getSceneElements();
    const newElement = createEmbeddableElement(
      "editor",
      { editorType },
      scrollX,
      scrollY,
      zoom.value,
      existingElements
    );
    excalidrawAPI.updateScene({ elements: [...existingElements, newElement] });
  }

  function handleShellSelect(shell: string): void {
    setActivePicker(null);
    const { scrollX, scrollY, zoom } = excalidrawAPI.getAppState();
    const existingElements = excalidrawAPI.getSceneElements();
    const newElement = createEmbeddableElement(
      "terminal",
      { shell },
      scrollX,
      scrollY,
      zoom.value,
      existingElements
    );
    excalidrawAPI.updateScene({ elements: [...existingElements, newElement] });
  }

  return (
    <>
      <div
        style={{
          display: "flex",
          gap: ISLAND_GAP,
          background: "var(--island-bg-color)",
          borderRadius: "var(--border-radius-lg, 0.5rem)",
          boxShadow: "var(--shadow-island)",
          padding: ISLAND_PADDING
        }}
      >
        <ToolButton
          buttonRef={editorButtonRef}
          icon={<Code2 size={ICON_PX} strokeWidth={ICON_STROKE_WIDTH} />}
          title={TEXT.addEditor}
          onClick={() => setActivePicker(activePicker === "editor" ? null : "editor")}
        />
        <ToolButton
          buttonRef={terminalButtonRef}
          icon={<Terminal size={ICON_PX} strokeWidth={ICON_STROKE_WIDTH} />}
          title={TEXT.addTerminal}
          onClick={() => setActivePicker(activePicker === "terminal" ? null : "terminal")}
        />
      </div>

      {activePicker === "editor" && editorOptions.length > 0 && (
        <Picker
          options={editorOptions}
          onSelect={handleEditorSelect}
          onClose={() => setActivePicker(null)}
          anchorRef={editorButtonRef}
        />
      )}

      {activePicker === "terminal" && shellOptions.length > 0 && (
        <Picker
          options={shellOptions}
          onSelect={handleShellSelect}
          onClose={() => setActivePicker(null)}
          anchorRef={terminalButtonRef}
        />
      )}
    </>
  );
}
