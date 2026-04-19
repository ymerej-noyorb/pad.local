import { useEffect, useRef, useState } from "react";
import type { ExcalidrawImperativeAPI } from "@excalidraw/excalidraw/types";
import {
  IconBrandVscode,
  IconBrandOpenai,
  IconBrandWindows,
  IconBrandPowershell,
  IconBrandGit,
  IconBrandGithubCopilot,
  IconCode,
  IconTerminal,
  IconRobot
} from "@tabler/icons-react";
import { createEmbeddableElement } from "../lib/createEmbeddable";
import type { AiProvider, EditorType, EditorInfo, ShellInfo } from "../../../shared/types";
import { AI_PROVIDERS } from "../../../shared/aiProviders";
import Icon from "./Icon";
import Picker, { type PickerOption } from "./Picker";

interface Props {
  excalidrawAPI: ExcalidrawImperativeAPI;
}

const ICON_PX = 20;
const BUTTON_SIZE = "2.25rem";
const TABLER_STROKE = 1.5;
const ISLAND_GAP = "0.125rem";
const ISLAND_PADDING = "0.375rem";

const TEXT = {
  addEditor: "New editor",
  addTerminal: "New terminal",
  addAi: "New AI"
} as const;

const EDITOR_ICONS: Record<EditorType, React.JSX.Element> = {
  vscode: <IconBrandVscode size={ICON_PX} stroke={TABLER_STROKE} />,
  cursor: <Icon name="cursor" size={ICON_PX} />,
  windsurf: <Icon name="windsurf" size={ICON_PX} />,
  vscodium: <Icon name="vscodium" size={ICON_PX} />
};

const AI_ICONS: Record<AiProvider, React.JSX.Element> = {
  claude: <Icon name="claude" size={ICON_PX} />,
  chatgpt: <IconBrandOpenai size={ICON_PX} stroke={TABLER_STROKE} />,
  gemini: <Icon name="gemini" size={ICON_PX} />,
  copilot: <IconBrandGithubCopilot size={ICON_PX} stroke={TABLER_STROKE} />,
  perplexity: <Icon name="perplexity" size={ICON_PX} />,
  mistral: <Icon name="mistral" size={ICON_PX} />
};

function getShellIcon(label: string): React.JSX.Element {
  const lower = label.toLowerCase();
  if (lower.includes("powershell"))
    return <IconBrandPowershell size={ICON_PX} stroke={TABLER_STROKE} />;
  if (lower.includes("git")) return <IconBrandGit size={ICON_PX} stroke={TABLER_STROKE} />;
  if (lower.includes("bash")) return <Icon name="bash" size={ICON_PX} />;
  if (lower.includes("zsh")) return <Icon name="zsh" size={ICON_PX} />;
  if (lower.includes("fish")) return <Icon name="fish" size={ICON_PX} />;
  if (lower.includes("cmd")) return <IconBrandWindows size={ICON_PX} stroke={TABLER_STROKE} />;
  return <IconTerminal size={ICON_PX} stroke={TABLER_STROKE} />;
}

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
        width: BUTTON_SIZE,
        height: BUTTON_SIZE,
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
  const [activePicker, setActivePicker] = useState<"editor" | "terminal" | "ai" | null>(null);

  const editorButtonRef = useRef<HTMLButtonElement>(null);
  const terminalButtonRef = useRef<HTMLButtonElement>(null);
  const aiButtonRef = useRef<HTMLButtonElement>(null);

  const aiOptions: PickerOption[] = AI_PROVIDERS.map((provider) => ({
    value: provider.id,
    label: provider.label,
    icon: AI_ICONS[provider.id]
  }));

  useEffect(() => {
    window.api.detectEditors().then((editors: EditorInfo[]) => {
      setEditorOptions(
        editors.map((editor) => ({
          value: editor.type,
          label: editor.label,
          icon: EDITOR_ICONS[editor.type as EditorType]
        }))
      );
    });
    window.api.detectShells().then((shells: ShellInfo[]) => {
      setShellOptions(
        shells.map((shell) => ({
          value: shell.path,
          label: shell.label,
          icon: getShellIcon(shell.label)
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
          icon={<IconCode size={ICON_PX} stroke={TABLER_STROKE} />}
          title={TEXT.addEditor}
          onClick={() => setActivePicker(activePicker === "editor" ? null : "editor")}
        />
        <ToolButton
          buttonRef={terminalButtonRef}
          icon={<IconTerminal size={ICON_PX} stroke={TABLER_STROKE} />}
          title={TEXT.addTerminal}
          onClick={() => setActivePicker(activePicker === "terminal" ? null : "terminal")}
        />
        <ToolButton
          buttonRef={aiButtonRef}
          icon={<IconRobot size={ICON_PX} stroke={TABLER_STROKE} />}
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
