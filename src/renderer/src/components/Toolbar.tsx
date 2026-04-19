import { useEffect, useRef, useState } from "react";
import type { ExcalidrawImperativeAPI } from "@excalidraw/excalidraw/types";
import { createEmbeddableElement } from "../lib/createEmbeddable";
import type { AiProvider, EditorType, EditorInfo, ShellInfo } from "../../../shared/types";
import { AI_PROVIDERS } from "../../../shared/aiProviders";
import type { IconName } from "../lib/iconData";
import Icon from "./Icon";
import Picker, { type PickerOption } from "./Picker";

interface Props {
  excalidrawAPI: ExcalidrawImperativeAPI;
}

const ICON_PX = 16;
const ISLAND_GAP = "0.125rem";
const ISLAND_PADDING = "0.25rem";

const TEXT = {
  addEditor: "Add Editor",
  addTerminal: "Add Terminal",
  addAi: "Add AI"
} as const;

const EDITOR_ICON: Record<EditorType, IconName> = {
  vscode: "vscode",
  cursor: "cursor",
  windsurf: "windsurf",
  vscodium: "vscodium"
};

const AI_ICON: Record<AiProvider, IconName> = {
  claude: "claude",
  chatgpt: "openai",
  gemini: "gemini",
  copilot: "copilot",
  perplexity: "perplexity",
  mistral: "mistral"
};

function getShellIcon(label: string): IconName {
  const lower = label.toLowerCase();
  if (lower.includes("powershell")) return "powershell";
  if (lower.includes("git")) return "git";
  if (lower.includes("bash")) return "bash";
  if (lower.includes("zsh")) return "zsh";
  if (lower.includes("fish")) return "fish";
  if (lower.includes("cmd")) return "windows";
  return "terminal";
}

function ToolButton({
  icon,
  title,
  onClick,
  buttonRef
}: {
  icon: IconName;
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
      <Icon name={icon} size={ICON_PX} />
    </button>
  );
}

export default function Toolbar({ excalidrawAPI }: Props): React.JSX.Element {
  const [editorOptions, setEditorOptions] = useState<PickerOption[]>([]);
  const [shellOptions, setShellOptions] = useState<PickerOption[]>([]);
  const [activePicker, setActivePicker] = useState<"editor" | "terminal" | "ai" | null>(null);

  const editorButtonRef = useRef<HTMLButtonElement>(null);
  const terminalButtonRef = useRef<HTMLButtonElement>(null);
  const aiButtonRef = useRef<HTMLButtonElement>(null);

  const aiOptions: PickerOption[] = AI_PROVIDERS.map((provider) => ({
    value: provider.id,
    label: provider.label,
    icon: <Icon name={AI_ICON[provider.id]} size={ICON_PX} />
  }));

  useEffect(() => {
    window.api.detectEditors().then((editors: EditorInfo[]) => {
      setEditorOptions(
        editors.map((editor) => ({
          value: editor.type,
          label: editor.label,
          icon: <Icon name={EDITOR_ICON[editor.type as EditorType]} size={ICON_PX} />
        }))
      );
    });
    window.api.detectShells().then((shells: ShellInfo[]) => {
      setShellOptions(
        shells.map((shell) => ({
          value: shell.path,
          label: shell.label,
          icon: <Icon name={getShellIcon(shell.label)} size={ICON_PX} />
        }))
      );
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

  function handleAiSelect(providerId: string): void {
    setActivePicker(null);
    const provider = AI_PROVIDERS.find((p) => p.id === providerId);
    if (!provider) return;
    const { scrollX, scrollY, zoom } = excalidrawAPI.getAppState();
    const existingElements = excalidrawAPI.getSceneElements();
    const newElement = createEmbeddableElement(
      "ai",
      { providerId: provider.id, url: provider.url },
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
          icon="code"
          title={TEXT.addEditor}
          onClick={() => setActivePicker(activePicker === "editor" ? null : "editor")}
        />
        <ToolButton
          buttonRef={terminalButtonRef}
          icon="terminal"
          title={TEXT.addTerminal}
          onClick={() => setActivePicker(activePicker === "terminal" ? null : "terminal")}
        />
        <ToolButton
          buttonRef={aiButtonRef}
          icon="bot"
          title={TEXT.addAi}
          onClick={() => setActivePicker(activePicker === "ai" ? null : "ai")}
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

      {activePicker === "ai" && (
        <Picker
          options={aiOptions}
          onSelect={handleAiSelect}
          onClose={() => setActivePicker(null)}
          anchorRef={aiButtonRef}
        />
      )}
    </>
  );
}
