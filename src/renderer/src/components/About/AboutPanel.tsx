import { useEffect, useRef, useState } from "react";

const MIN_WIDTH = 200;
const Z_INDEX = 9999;
const BORDER_RADIUS = 8;
const PADDING = 6;
const ROW_HEIGHT = "2.25rem";
const ROW_PADDING = "0 0.625rem";
const ROW_FONT_SIZE = "0.9375rem";
const ROW_BORDER_RADIUS = 6;
const DIVIDER_STYLE = { height: "1px", background: "var(--default-border-color, rgba(255,255,255,0.08))", margin: `${PADDING}px 0` };

const APP_NAME = "pad.local";
const GITHUB_URL = "https://github.com/ymerej-noyorb/pad.local";

const RUNTIME_ROWS: { label: string; key: keyof typeof window.api.versions }[] = [
  { label: "Electron", key: "electron" },
  { label: "Node", key: "node" },
  { label: "Chrome", key: "chrome" }
];

function AboutRow({ left, right }: { left: string; right: string }): React.JSX.Element {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        height: ROW_HEIGHT,
        padding: ROW_PADDING,
        borderRadius: ROW_BORDER_RADIUS,
        fontSize: ROW_FONT_SIZE,
        color: "var(--text-primary-color)",
        fontFamily: "var(--ui-font)"
      }}
    >
      <span>{left}</span>
      <span style={{ opacity: 0.5, fontFamily: "monospace", fontSize: "0.75rem" }}>{right}</span>
    </div>
  );
}

const MENU_GAP = 8;

export default function AboutPanel({
  anchorRef,
  positionRef,
  onClose
}: {
  anchorRef: React.RefObject<HTMLButtonElement | null>;
  positionRef?: React.RefObject<HTMLElement | null>;
  onClose: () => void;
}): React.JSX.Element | null {
  const panelRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState<{ bottom: number; left: number } | null>(null);
  const [githubHovered, setGithubHovered] = useState(false);

  useEffect(() => {
    const ref = positionRef ?? anchorRef;
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    setPosition({ bottom: window.innerHeight - rect.top + MENU_GAP, left: rect.left + rect.width / 2 });
  }, [anchorRef, positionRef]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent): void {
      if (
        panelRef.current &&
        !panelRef.current.contains(event.target as Node) &&
        !anchorRef.current?.contains(event.target as Node)
      ) {
        onClose();
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [anchorRef, onClose]);

  if (!position) return null;

  return (
    <div
      ref={panelRef}
      style={{
        position: "fixed",
        bottom: position.bottom,
        left: position.left,
        transform: "translateX(-50%)",
        minWidth: MIN_WIDTH,
        background: "var(--island-bg-color)",
        borderRadius: BORDER_RADIUS,
        boxShadow: "var(--shadow-island)",
        padding: PADDING,
        zIndex: Z_INDEX
      }}
    >
      <AboutRow left={APP_NAME} right={`v${__APP_VERSION__}`} />

      <div style={DIVIDER_STYLE} />

      {RUNTIME_ROWS.map(({ label, key }) => (
        <AboutRow key={key} left={label} right={window.api.versions[key]} />
      ))}

      <div style={DIVIDER_STYLE} />

      <button
        onClick={() => window.api.openExternal(GITHUB_URL)}
        onMouseEnter={() => setGithubHovered(true)}
        onMouseLeave={() => setGithubHovered(false)}
        type="button"
        style={{
          display: "flex",
          alignItems: "center",
          width: "100%",
          height: ROW_HEIGHT,
          padding: ROW_PADDING,
          borderRadius: ROW_BORDER_RADIUS,
          border: 0,
          background: githubHovered ? "var(--button-hover-bg)" : "transparent",
          color: "var(--text-primary-color)",
          fontSize: ROW_FONT_SIZE,
          fontFamily: "var(--ui-font)",
          cursor: "pointer",
          opacity: 0.6
        }}
      >
        GitHub
      </button>
    </div>
  );
}
