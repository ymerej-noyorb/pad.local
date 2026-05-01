import { useEffect, useRef, useState } from "react";

const MIN_WIDTH = 200;
const Z_INDEX = 9999;
const BORDER_RADIUS = 8;
const PADDING = 6;
const MENU_GAP = 8;
const INPUT_HEIGHT = "2.25rem";
const INPUT_FONT_SIZE = "0.9375rem";
const INPUT_BORDER_RADIUS = 6;

const TEXT = {
  placeholder: "https://"
} as const;

export default function BrowserUrlInput({
  anchorRef,
  positionRef,
  onSubmit,
  onClose
}: {
  anchorRef: React.RefObject<HTMLButtonElement | null>;
  positionRef?: React.RefObject<HTMLElement | null>;
  onSubmit: (url: string) => void;
  onClose: () => void;
}): React.JSX.Element | null {
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [position, setPosition] = useState<{ bottom: number; left: number } | null>(null);
  const [url, setUrl] = useState("");

  useEffect(() => {
    const ref = positionRef ?? anchorRef;
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    setPosition({
      bottom: window.innerHeight - rect.top + MENU_GAP,
      left: rect.left + rect.width / 2
    });
  }, [anchorRef, positionRef]);

  useEffect(() => {
    inputRef.current?.focus();
  }, [position]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent): void {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node) &&
        !anchorRef.current?.contains(event.target as Node)
      ) {
        onClose();
      }
    }
    function handleKeyDown(event: KeyboardEvent): void {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [anchorRef, onClose]);

  function handleSubmit(): void {
    const trimmed = url.trim();
    if (!trimmed) return;
    onSubmit(trimmed);
    onClose();
  }

  if (!position) return null;

  return (
    <div
      ref={containerRef}
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
      <input
        ref={inputRef}
        type="text"
        value={url}
        onChange={(event) => setUrl(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter") handleSubmit();
        }}
        placeholder={TEXT.placeholder}
        style={{
          width: "100%",
          height: INPUT_HEIGHT,
          padding: "0 0.625rem",
          borderRadius: INPUT_BORDER_RADIUS,
          border: "none",
          background: "var(--button-hover-bg)",
          color: "var(--text-primary-color)",
          fontSize: INPUT_FONT_SIZE,
          fontFamily: "var(--ui-font)",
          outline: "none",
          boxSizing: "border-box"
        }}
      />
    </div>
  );
}
