import { useEffect, useRef, useState } from "react";
import {
  IconDatabase,
  IconApps,
  IconBrandChrome,
  IconBrandNodejs,
  IconBrandGithub,
  IconBrandVscode,
  IconAtom2
} from "@tabler/icons-react";
import type { EditorInfo } from "../../../../shared/types";

const Z_INDEX = 9999;
const BORDER_RADIUS = 8;
const PADDING = 6;
const ROW_HEIGHT = "2.25rem";
const ROW_PADDING = "0 0.625rem";
const ROW_FONT_SIZE = "0.9375rem";
const ROW_BORDER_RADIUS = 6;
const ICON_SIZE = 16;
const ICON_GAP = "0.75rem";
const TABLER_STROKE = 1.5;
const DIVIDER_STYLE = {
  height: "1px",
  background: "var(--default-border-color, rgba(255,255,255,0.08))",
  margin: `${PADDING}px 0`
};

const APP_NAME = "pad.local";
const GITHUB_URL = "https://github.com/ymerej-noyorb/pad.local";

const TEXT = {
  storage: "App data",
  github: "GitHub"
} as const;

const RUNTIME_ROWS: { label: string; key: keyof typeof window.api.versions; icon: React.ReactNode }[] = [
  { label: "Electron", key: "electron", icon: <IconAtom2 size={ICON_SIZE} stroke={TABLER_STROKE} /> },
  { label: "Node", key: "node", icon: <IconBrandNodejs size={ICON_SIZE} stroke={TABLER_STROKE} /> },
  { label: "Chrome", key: "chrome", icon: <IconBrandChrome size={ICON_SIZE} stroke={TABLER_STROKE} /> }
];

function IconWrap({ children }: { children: React.ReactNode }): React.JSX.Element {
  return (
    <span
      style={{ display: "flex", alignItems: "center", flexShrink: 0, width: ICON_SIZE, height: ICON_SIZE }}
    >
      {children}
    </span>
  );
}

function AboutRow({
  left,
  right,
  icon
}: {
  left: string;
  right: string;
  icon: React.ReactNode;
}): React.JSX.Element {
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
      <span style={{ display: "flex", alignItems: "center", gap: ICON_GAP }}>
        <IconWrap>{icon}</IconWrap>
        {left}
      </span>
      <span style={{ opacity: 0.5, fontFamily: "monospace", fontSize: "0.75rem" }}>{right}</span>
    </div>
  );
}

const MENU_GAP = 8;

export default function AboutPanel({
  anchorRef,
  positionRef,
  onClose,
  onOpenStorage,
  editors
}: {
  anchorRef: React.RefObject<HTMLButtonElement | null>;
  positionRef?: React.RefObject<HTMLElement | null>;
  onClose: () => void;
  onOpenStorage: () => void;
  editors: EditorInfo[];
}): React.JSX.Element | null {
  const panelRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState<{ bottom: number; left: number; width: number } | null>(
    null
  );
  const [storageHovered, setStorageHovered] = useState(false);
  const [githubHovered, setGithubHovered] = useState(false);

  useEffect(() => {
    const ref = positionRef ?? anchorRef;
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    setPosition({
      bottom: window.innerHeight - rect.top + MENU_GAP,
      left: rect.left + rect.width / 2,
      width: rect.width
    });
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
        width: position.width,
        background: "var(--island-bg-color)",
        borderRadius: BORDER_RADIUS,
        boxShadow: "var(--shadow-island)",
        padding: PADDING,
        zIndex: Z_INDEX
      }}
    >
      <AboutRow
        left={APP_NAME}
        right={`v${__APP_VERSION__}`}
        icon={<IconApps size={ICON_SIZE} stroke={TABLER_STROKE} />}
      />

      {RUNTIME_ROWS.map(({ label, key, icon }) => (
        <AboutRow key={key} left={label} right={window.api.versions[key]} icon={icon} />
      ))}

      {editors.map((editor) => (
        <AboutRow
          key={editor.type}
          left={editor.label}
          right={editor.version ?? ""}
          icon={<IconBrandVscode size={ICON_SIZE} stroke={TABLER_STROKE} />}
        />
      ))}

      <div style={DIVIDER_STYLE} />

      <button
        onClick={() => {
          onClose();
          onOpenStorage();
        }}
        onMouseEnter={() => setStorageHovered(true)}
        onMouseLeave={() => setStorageHovered(false)}
        type="button"
        style={{
          display: "flex",
          alignItems: "center",
          gap: ICON_GAP,
          width: "100%",
          height: ROW_HEIGHT,
          padding: ROW_PADDING,
          borderRadius: ROW_BORDER_RADIUS,
          border: 0,
          background: storageHovered ? "var(--button-hover-bg)" : "transparent",
          color: "var(--text-primary-color)",
          fontSize: ROW_FONT_SIZE,
          fontFamily: "var(--ui-font)",
          cursor: "pointer"
        }}
      >
        <IconWrap>
          <IconDatabase size={ICON_SIZE} stroke={TABLER_STROKE} />
        </IconWrap>
        {TEXT.storage}
      </button>

      <button
        onClick={() => window.api.openExternal(GITHUB_URL)}
        onMouseEnter={() => setGithubHovered(true)}
        onMouseLeave={() => setGithubHovered(false)}
        type="button"
        style={{
          display: "flex",
          alignItems: "center",
          gap: ICON_GAP,
          width: "100%",
          height: ROW_HEIGHT,
          padding: ROW_PADDING,
          borderRadius: ROW_BORDER_RADIUS,
          border: 0,
          background: githubHovered ? "var(--button-hover-bg)" : "transparent",
          color: "var(--text-primary-color)",
          fontSize: ROW_FONT_SIZE,
          fontFamily: "var(--ui-font)",
          cursor: "pointer"
        }}
      >
        <IconWrap>
          <IconBrandGithub size={ICON_SIZE} stroke={TABLER_STROKE} />
        </IconWrap>
        {TEXT.github}
      </button>
    </div>
  );
}
