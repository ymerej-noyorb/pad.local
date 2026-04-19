import { useEffect, useRef, useState } from "react";

const PICKER_WIDTH = 200;
const PICKER_BORDER_RADIUS = 8;
const PICKER_PADDING = 4;
const OPTION_PADDING = "0.3rem 0.75rem";
const OPTION_BORDER_RADIUS = 6;
const OPTION_FONT_SIZE = 13;
const OPTION_ICON_SIZE = 16;
const OPTION_ICON_GAP = 8;

export interface PickerOption {
  value: string;
  label: string;
  icon?: React.ReactNode;
}

interface PickerProps {
  options: PickerOption[];
  onSelect: (value: string) => void;
  onClose: () => void;
  anchorRef: React.RefObject<HTMLElement | null>;
}

export default function Picker({
  options,
  onSelect,
  onClose,
  anchorRef
}: PickerProps): React.JSX.Element | null {
  const pickerRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState<{ top: number; right: number } | null>(null);

  useEffect(() => {
    if (!anchorRef.current) return;
    const rect = anchorRef.current.getBoundingClientRect();
    // Anchor to the right edge of the button so the picker doesn't overflow the window.
    setPosition({ top: rect.bottom + 6, right: window.innerWidth - rect.right });
  }, [anchorRef]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent): void {
      const target = event.target as Node;
      if (
        pickerRef.current &&
        !pickerRef.current.contains(target) &&
        !anchorRef.current?.contains(target)
      ) {
        onClose();
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose, anchorRef]);

  if (!position) return null;

  return (
    <div
      ref={pickerRef}
      style={{
        position: "fixed",
        top: position.top,
        right: position.right,
        width: PICKER_WIDTH,
        background: "var(--island-bg-color)",
        borderRadius: PICKER_BORDER_RADIUS,
        boxShadow: "var(--shadow-island)",
        padding: PICKER_PADDING,
        zIndex: 9999
      }}
    >
      {options.map((option) => (
        <PickerRow key={option.value} option={option} onSelect={onSelect} />
      ))}
    </div>
  );
}

function PickerRow({
  option,
  onSelect
}: {
  option: PickerOption;
  onSelect: (value: string) => void;
}): React.JSX.Element {
  const [hovered, setHovered] = useState(false);

  return (
    <button
      onClick={() => onSelect(option.value)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: "flex",
        alignItems: "center",
        gap: OPTION_ICON_GAP,
        width: "100%",
        padding: OPTION_PADDING,
        borderRadius: OPTION_BORDER_RADIUS,
        border: 0,
        background: hovered ? "var(--button-hover-bg)" : "transparent",
        color: "var(--text-primary-color)",
        fontSize: OPTION_FONT_SIZE,
        fontFamily: "var(--ui-font)",
        textAlign: "left",
        cursor: "pointer"
      }}
    >
      {option.icon && (
        <span
          style={{
            display: "flex",
            alignItems: "center",
            flexShrink: 0,
            width: OPTION_ICON_SIZE,
            height: OPTION_ICON_SIZE
          }}
        >
          {option.icon}
        </span>
      )}
      {option.label}
    </button>
  );
}
