import { useCallback, useEffect, useMemo, useState } from "react";
import { Excalidraw } from "@excalidraw/excalidraw";
import type { ExcalidrawImperativeAPI } from "@excalidraw/excalidraw/types";
import "@excalidraw/excalidraw/index.css";

import EditorPanel from "./components/Editor/EditorPanel";
import TerminalPanel from "./components/Terminal/TerminalPanel";
import AiPanel from "./components/AI/AiPanel";
import BrowserPanel from "./components/Browser/BrowserPanel";
import Icon from "./components/Icon";
import LoadingOverlay from "./components/LoadingOverlay";
import Toolbar from "./components/Toolbar/Toolbar";
import { useScene } from "./hooks/useScene";
import { createScrollLock } from "./lib/lockEmbeddables";
import { colors } from "./theme";
import type { AiProvider, EditorType, Workspace } from "../../shared/types";

const EMBEDDABLE_TYPE_EDITOR = "editor";
const EMBEDDABLE_TYPE_TERMINAL = "terminal";
const EMBEDDABLE_TYPE_AI = "ai";
const EMBEDDABLE_TYPE_BROWSER = "browser";

const CANVAS_ACTIONS = {
  changeViewBackgroundColor: false,
  clearCanvas: false,
  export: false,
  loadScene: false,
  saveToActiveFile: false,
  saveAsImage: false
} as const;

export default function App(): React.JSX.Element {
  const [excalidrawAPI, setExcalidrawAPI] = useState<ExcalidrawImperativeAPI | null>(null);
  const [scrollLocked, setScrollLocked] = useState(false);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [activeWorkspaceId, setActiveWorkspaceId] = useState<string>("");
  const [isSwitching, setIsSwitching] = useState(false);

  const { initialData, ready, handleChange, forceSave } = useScene(activeWorkspaceId);
  const handleScrollChange = useMemo(() => createScrollLock(setScrollLocked), []);
  // Null-out the API reference while Excalidraw is unmounted so stale callbacks are never called.
  const activeExcalidrawAPI = ready ? excalidrawAPI : null;

  useEffect(() => {
    window.api.listWorkspaces().then((state) => {
      setWorkspaces(state.workspaces);
      setActiveWorkspaceId(state.activeId);
    });
  }, []);

  async function handleSwitchWorkspace(id: string): Promise<void> {
    setIsSwitching(true);
    await forceSave();
    const updated = await window.api.switchWorkspace(id);
    setWorkspaces(updated.workspaces);
    setActiveWorkspaceId(updated.activeId);
    setIsSwitching(false);
  }

  async function handleCreateWorkspace(): Promise<void> {
    await forceSave();
    const updated = await window.api.createWorkspace("New workspace");
    setWorkspaces(updated.workspaces);
    setActiveWorkspaceId(updated.activeId);
  }

  async function handleRenameWorkspace(id: string, name: string): Promise<void> {
    const updated = await window.api.renameWorkspace(id, name);
    setWorkspaces(updated.workspaces);
  }

  async function handleDeleteWorkspace(id: string): Promise<void> {
    const isActive = id === activeWorkspaceId;
    if (isActive) await forceSave();
    const updated = await window.api.deleteWorkspace(id);
    setWorkspaces(updated.workspaces);
    if (updated.activeId !== activeWorkspaceId) {
      setActiveWorkspaceId(updated.activeId);
    }
  }

  const renderEmbeddable = useCallback<
    NonNullable<React.ComponentProps<typeof Excalidraw>["renderEmbeddable"]>
  >(
    (element, appState) => {
      const type = element.customData?.type;
      const theme = appState.theme === "light" ? "light" : "dark";

      if (type === EMBEDDABLE_TYPE_EDITOR) {
        const editorType = (element.customData?.editorType ?? "vscode") as EditorType;
        return <EditorPanel editorType={editorType} theme={theme} scrollLocked={scrollLocked} />;
      }

      if (type === EMBEDDABLE_TYPE_TERMINAL) {
        const shell = (element.customData?.shell ?? "") as string;
        return <TerminalPanel id={element.id} shell={shell} scrollLocked={scrollLocked} />;
      }

      if (type === EMBEDDABLE_TYPE_AI) {
        const providerId = element.customData?.providerId as AiProvider;
        const url = element.customData?.url as string;
        return (
          <AiPanel providerId={providerId} url={url} theme={theme} scrollLocked={scrollLocked} />
        );
      }

      if (type === EMBEDDABLE_TYPE_BROWSER) {
        const url = (element.customData?.url ?? "") as string;
        const touchCapable = (element.customData?.touchCapable ?? false) as boolean;
        const touchEnabled = (element.customData?.touchEnabled ?? false) as boolean;
        return (
          <BrowserPanel
            url={url}
            touchCapable={touchCapable}
            touchEnabled={touchEnabled}
            width={element.width}
            height={element.height}
            theme={theme}
            scrollLocked={scrollLocked}
            onResize={(width, height) => {
              activeExcalidrawAPI?.updateScene({
                elements: activeExcalidrawAPI
                  .getSceneElements()
                  .map((el) => (el.id === element.id ? { ...el, width, height } : el))
              });
            }}
            onUrlChange={(newUrl) => {
              activeExcalidrawAPI?.updateScene({
                elements: activeExcalidrawAPI
                  .getSceneElements()
                  .map((el) =>
                    el.id === element.id
                      ? { ...el, customData: { ...el.customData, url: newUrl } }
                      : el
                  )
              });
            }}
            onTouchStateChange={(newTouchCapable, newTouchEnabled) => {
              activeExcalidrawAPI?.updateScene({
                elements: activeExcalidrawAPI.getSceneElements().map((el) =>
                  el.id === element.id
                    ? {
                        ...el,
                        customData: {
                          ...el.customData,
                          touchCapable: newTouchCapable,
                          touchEnabled: newTouchEnabled
                        }
                      }
                    : el
                )
              });
            }}
          />
        );
      }

      return null;
    },
    [scrollLocked, activeExcalidrawAPI]
  );

  return (
    <div style={{ position: "fixed", inset: 0 }}>
      {ready && (
        <Excalidraw
          excalidrawAPI={setExcalidrawAPI}
          initialData={initialData ?? undefined}
          gridModeEnabled
          renderEmbeddable={renderEmbeddable}
          validateEmbeddable={(link) =>
            link === EMBEDDABLE_TYPE_EDITOR ||
            link === EMBEDDABLE_TYPE_TERMINAL ||
            link === EMBEDDABLE_TYPE_AI ||
            link === EMBEDDABLE_TYPE_BROWSER
          }
          onChange={handleChange}
          onScrollChange={handleScrollChange}
          renderTopRightUI={() =>
            activeExcalidrawAPI ? (
              <div
                style={{
                  position: "fixed",
                  bottom: "1.5rem",
                  left: 0,
                  right: 0,
                  display: "flex",
                  justifyContent: "center",
                  pointerEvents: "none",
                  zIndex: 10
                }}
              >
                <div style={{ pointerEvents: "auto" }}>
                  <Toolbar
                    excalidrawAPI={activeExcalidrawAPI}
                    workspaces={workspaces}
                    activeWorkspaceId={activeWorkspaceId}
                    isSwitching={isSwitching}
                    onSwitchWorkspace={handleSwitchWorkspace}
                    onRenameWorkspace={handleRenameWorkspace}
                    onCreateWorkspace={handleCreateWorkspace}
                    onDeleteWorkspace={handleDeleteWorkspace}
                  />
                </div>
              </div>
            ) : null
          }
          UIOptions={{ canvasActions: CANVAS_ACTIONS }}
        />
      )}
      <LoadingOverlay
        icon={<Icon name="excalidraw" size={48} />}
        color={colors.overlay0}
        background={colors.base}
        loaded={activeExcalidrawAPI !== null}
      />
    </div>
  );
}
