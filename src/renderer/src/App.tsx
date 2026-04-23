import { useCallback, useMemo, useState } from "react";
import { Excalidraw } from "@excalidraw/excalidraw";
import type { ExcalidrawImperativeAPI } from "@excalidraw/excalidraw/types";
import "@excalidraw/excalidraw/index.css";

import Editor from "./components/Editor";
import Terminal from "./components/Terminal";
import AiPanel from "./components/AiPanel";
import BrowserPanel from "./components/Browser";
import Icon from "./components/Icon";
import LoadingOverlay from "./components/LoadingOverlay";
import Toolbar from "./components/Toolbar";
import { useScene } from "./hooks/useScene";
import { createScrollLock } from "./lib/lockEmbeddables";
import { colors } from "./theme";
import type { AiProvider, EditorType } from "../../shared/types";

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

  const { initialData, ready, handleChange } = useScene();
  const handleScrollChange = useMemo(() => createScrollLock(setScrollLocked), []);

  const renderEmbeddable = useCallback<
    NonNullable<React.ComponentProps<typeof Excalidraw>["renderEmbeddable"]>
  >(
    (element, appState) => {
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
              excalidrawAPI?.updateScene({
                elements: excalidrawAPI
                  .getSceneElements()
                  .map((el) => (el.id === element.id ? { ...el, width, height } : el))
              });
            }}
            onUrlChange={(newUrl) => {
              excalidrawAPI?.updateScene({
                elements: excalidrawAPI
                  .getSceneElements()
                  .map((el) =>
                    el.id === element.id
                      ? { ...el, customData: { ...el.customData, url: newUrl } }
                      : el
                  )
              });
            }}
            onTouchStateChange={(newTouchCapable, newTouchEnabled) => {
              excalidrawAPI?.updateScene({
                elements: excalidrawAPI.getSceneElements().map((el) =>
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
    [scrollLocked, excalidrawAPI]
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
            excalidrawAPI ? (
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
                  <Toolbar excalidrawAPI={excalidrawAPI} />
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
        loaded={ready && excalidrawAPI !== null}
      />
    </div>
  );
}
