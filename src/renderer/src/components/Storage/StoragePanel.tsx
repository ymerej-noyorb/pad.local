import { useEffect, useRef, useState } from "react";
import {
  IconFolderOpen,
  IconTrash,
  IconChevronRight,
  IconChevronDown,
  IconAlertTriangle,
  IconRefresh
} from "@tabler/icons-react";
import { Highlight } from "prism-react-renderer";
import type { PrismTheme } from "prism-react-renderer";
import type { DataFile } from "../../../../shared/types";
import { colorsByTheme } from "../../theme";

const MENU_GAP = 8;
const Z_INDEX = 9999;
const BORDER_RADIUS = 8;
const PADDING = 6;
const ROW_HEIGHT = "2.25rem";
const ROW_BORDER_RADIUS = 6;
const FONT_SIZE = "0.875rem";
const MONO_FONT_SIZE = "0.8125rem";
const ICON_SIZE = 14;
const ACTION_ICON_SIZE = 13;
const ACTION_BUTTON_SIZE = 24;
const TABLER_STROKE = 1.5;
const JSON_MAX_HEIGHT = 220;
const PATH_FONT_SIZE = "0.75rem";

const TEXT = {
  title: "Local storage",
  openFolder: "Open in explorer",
  refresh: "Refresh",
  loading: "Loading…",
  empty: "No files found.",
  deleteLabel: "Delete",
  deleteCancelLabel: "Cancel",
  deleteConfirmLabel: "Delete permanently",
  criticalWarning: "Deleting this file will reset its data on next launch."
} as const;

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function formatDate(ms: number): string {
  return new Date(ms).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
}

function buildPrismTheme(isDark: boolean): PrismTheme {
  const palette = isDark ? colorsByTheme.dark : colorsByTheme.light;
  return {
    plain: { color: palette.subtext, backgroundColor: "transparent" },
    styles: [
      { types: ["property"], style: { color: palette.blue } },
      { types: ["string"], style: { color: palette.green } },
      { types: ["number"], style: { color: palette.peach } },
      { types: ["boolean"], style: { color: palette.mauve } },
      { types: ["null"], style: { color: palette.mauve } },
      { types: ["punctuation", "operator"], style: { color: palette.subtext } }
    ]
  };
}

function formatJson(raw: string): string {
  try {
    return JSON.stringify(JSON.parse(raw), null, 2);
  } catch {
    return raw;
  }
}

export default function StoragePanel({
  anchorRef,
  positionRef,
  onClose
}: {
  anchorRef: React.RefObject<HTMLButtonElement | null>;
  positionRef?: React.RefObject<HTMLElement | null>;
  onClose: () => void;
}): React.JSX.Element | null {
  const panelRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState<{ bottom: number; left: number; width: number } | null>(
    null
  );
  const [storagePath, setStoragePath] = useState<string>("");
  const [files, setFiles] = useState<DataFile[] | null>(null);
  const [expandedFile, setExpandedFile] = useState<string | null>(null);
  const [fileContent, setFileContent] = useState<Record<string, string>>({});
  const [confirmingDelete, setConfirmingDelete] = useState<string | null>(null);

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

  function loadFiles(): void {
    window.api.listDataFiles().then(setFiles);
  }

  useEffect(() => {
    window.api.getStoragePath().then(setStoragePath);
    window.api.listDataFiles().then(setFiles);
    const interval = setInterval(() => window.api.listDataFiles().then(setFiles), 2000);
    return () => clearInterval(interval);
  }, []);

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

  async function handleToggleExpand(name: string): Promise<void> {
    if (expandedFile === name) {
      setExpandedFile(null);
      return;
    }
    setExpandedFile(name);
    if (!fileContent[name]) {
      const content = await window.api.readDataFile(name);
      setFileContent((previous) => ({ ...previous, [name]: content }));
    }
  }

  async function handleDelete(name: string): Promise<void> {
    await window.api.deleteDataFile(name);
    setFiles((previous) => previous?.filter((file) => file.name !== name) ?? null);
    setFileContent((previous) => {
      const updated = { ...previous };
      delete updated[name];
      return updated;
    });
    if (expandedFile === name) setExpandedFile(null);
    setConfirmingDelete(null);
  }

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
        zIndex: Z_INDEX,
        display: "flex",
        flexDirection: "column",
        gap: 0
      }}
    >
      <Header
        storagePath={storagePath}
        onOpenFolder={() => window.api.openStorageFolder()}
        onRefresh={loadFiles}
      />

      <div
        style={{
          height: 1,
          background: "var(--default-border-color, rgba(255,255,255,0.08))",
          margin: `${PADDING}px 0`
        }}
      />

      <div
        style={{
          overflowY: "auto",
          maxHeight: 420,
          display: "flex",
          flexDirection: "column"
        }}
      >
        {files === null && (
          <div
            style={{
              padding: "0.5rem 0.625rem",
              fontSize: FONT_SIZE,
              color: "var(--text-primary-color)",
              opacity: 0.5,
              fontFamily: "var(--ui-font)"
            }}
          >
            {TEXT.loading}
          </div>
        )}
        {files !== null && files.length === 0 && (
          <div
            style={{
              padding: "0.5rem 0.625rem",
              fontSize: FONT_SIZE,
              color: "var(--text-primary-color)",
              opacity: 0.5,
              fontFamily: "var(--ui-font)"
            }}
          >
            {TEXT.empty}
          </div>
        )}
        {files !== null &&
          files.map((file) => (
            <FileRow
              key={file.name}
              file={file}
              isExpanded={expandedFile === file.name}
              content={fileContent[file.name] ?? null}
              isConfirmingDelete={confirmingDelete === file.name}
              onToggleExpand={() => handleToggleExpand(file.name)}
              onDeleteRequest={() =>
                setConfirmingDelete(confirmingDelete === file.name ? null : file.name)
              }
              onDeleteConfirm={() => handleDelete(file.name)}
              onDeleteCancel={() => setConfirmingDelete(null)}
            />
          ))}
      </div>
    </div>
  );
}

function Header({
  storagePath,
  onOpenFolder,
  onRefresh
}: {
  storagePath: string;
  onOpenFolder: () => void;
  onRefresh: () => void;
}): React.JSX.Element {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "0.25rem",
        padding: "0 0.25rem"
      }}
    >
      <span
        style={{
          flex: 1,
          fontSize: PATH_FONT_SIZE,
          fontFamily: "monospace",
          color: "var(--text-primary-color)",
          opacity: 0.5,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap"
        }}
        title={storagePath}
      >
        {storagePath}
      </span>
      <ActionButton title={TEXT.refresh} onClick={onRefresh}>
        <IconRefresh size={ACTION_ICON_SIZE} stroke={TABLER_STROKE} />
      </ActionButton>
      <ActionButton title={TEXT.openFolder} onClick={onOpenFolder}>
        <IconFolderOpen size={ACTION_ICON_SIZE} stroke={TABLER_STROKE} />
      </ActionButton>
    </div>
  );
}

function FileRow({
  file,
  isExpanded,
  content,
  isConfirmingDelete,
  onToggleExpand,
  onDeleteRequest,
  onDeleteConfirm,
  onDeleteCancel
}: {
  file: DataFile;
  isExpanded: boolean;
  content: string | null;
  isConfirmingDelete: boolean;
  onToggleExpand: () => void;
  onDeleteRequest: () => void;
  onDeleteConfirm: () => void;
  onDeleteCancel: () => void;
}): React.JSX.Element {
  const [hovered, setHovered] = useState(false);

  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      <div
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.25rem",
          minHeight: ROW_HEIGHT,
          padding: "0 0.25rem",
          borderRadius: ROW_BORDER_RADIUS,
          background: isExpanded || hovered ? "var(--button-hover-bg)" : "transparent"
        }}
      >
        <button
          onClick={onToggleExpand}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: ICON_SIZE,
            flexShrink: 0,
            border: 0,
            background: "transparent",
            color: "var(--icon-fill-color)",
            cursor: "pointer",
            padding: 0
          }}
        >
          {isExpanded ? (
            <IconChevronDown size={ICON_SIZE} stroke={TABLER_STROKE} />
          ) : (
            <IconChevronRight size={ICON_SIZE} stroke={TABLER_STROKE} />
          )}
        </button>

        <button
          onClick={onToggleExpand}
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-start",
            justifyContent: "center",
            gap: "0.125rem",
            border: 0,
            background: "transparent",
            color: "var(--text-primary-color)",
            cursor: "pointer",
            padding: "0.25rem 0",
            textAlign: "left",
            minWidth: 0
          }}
        >
          <span
            style={{
              fontFamily: "monospace",
              fontSize: MONO_FONT_SIZE,
              fontWeight: 500,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              width: "100%"
            }}
          >
            {file.name}
          </span>
          <span
            style={{
              fontSize: "0.75rem",
              opacity: 0.5,
              fontFamily: "var(--ui-font)",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              width: "100%"
            }}
          >
            {file.description}
          </span>
        </button>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-end",
            gap: "0.125rem",
            flexShrink: 0
          }}
        >
          <span
            style={{
              fontFamily: "monospace",
              fontSize: "0.75rem",
              opacity: 0.5,
              color: "var(--text-primary-color)"
            }}
          >
            {formatSize(file.sizeBytes)}
          </span>
          <span
            style={{
              fontSize: "0.7rem",
              opacity: 0.4,
              color: "var(--text-primary-color)",
              fontFamily: "var(--ui-font)",
              whiteSpace: "nowrap"
            }}
          >
            {formatDate(file.lastModified)}
          </span>
        </div>

        {(hovered || isConfirmingDelete) && !isConfirmingDelete && (
          <ActionButton title={TEXT.deleteLabel} onClick={onDeleteRequest}>
            <IconTrash size={ACTION_ICON_SIZE} stroke={TABLER_STROKE} />
          </ActionButton>
        )}

        {isConfirmingDelete && (
          <ActionButton title={TEXT.deleteCancelLabel} onClick={onDeleteCancel}>
            <span
              style={{
                fontSize: "0.7rem",
                fontFamily: "var(--ui-font)",
                color: "var(--text-primary-color)"
              }}
            >
              ✕
            </span>
          </ActionButton>
        )}
      </div>

      {isConfirmingDelete && (
        <DeleteConfirmation
          isCritical={file.isCritical}
          onConfirm={onDeleteConfirm}
          onCancel={onDeleteCancel}
        />
      )}

      {isExpanded && <JsonContent content={content} />}
    </div>
  );
}

function DeleteConfirmation({
  isCritical,
  onConfirm,
  onCancel
}: {
  isCritical: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}): React.JSX.Element {
  const [confirmHovered, setConfirmHovered] = useState(false);

  return (
    <div
      style={{
        margin: "0 0.25rem 0.25rem",
        padding: "0.5rem 0.625rem",
        borderRadius: ROW_BORDER_RADIUS,
        border: "1px solid var(--default-border-color, rgba(255,255,255,0.08))",
        display: "flex",
        flexDirection: "column",
        gap: "0.5rem"
      }}
    >
      {isCritical && (
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            gap: "0.375rem",
            fontSize: "0.75rem",
            fontFamily: "var(--ui-font)",
            color: "var(--color-warning, #f9e2af)",
            opacity: 0.85
          }}
        >
          <IconAlertTriangle
            size={13}
            stroke={TABLER_STROKE}
            style={{ marginTop: 1, flexShrink: 0 }}
          />
          {TEXT.criticalWarning}
        </div>
      )}
      <div style={{ display: "flex", gap: "0.375rem", justifyContent: "flex-end" }}>
        <button
          onClick={onCancel}
          onMouseEnter={(event) =>
            (event.currentTarget.style.background = "var(--button-hover-bg)")
          }
          onMouseLeave={(event) => (event.currentTarget.style.background = "transparent")}
          style={{
            padding: "0.25rem 0.625rem",
            border: "1px solid var(--default-border-color, rgba(255,255,255,0.08))",
            borderRadius: 4,
            background: "transparent",
            color: "var(--text-primary-color)",
            fontSize: "0.75rem",
            fontFamily: "var(--ui-font)",
            cursor: "pointer"
          }}
        >
          {TEXT.deleteCancelLabel}
        </button>
        <button
          onClick={onConfirm}
          onMouseEnter={() => setConfirmHovered(true)}
          onMouseLeave={() => setConfirmHovered(false)}
          style={{
            padding: "0.25rem 0.625rem",
            border: 0,
            borderRadius: 4,
            background: confirmHovered ? "var(--color-danger, #f38ba8)" : "rgba(243,139,168,0.15)",
            color: confirmHovered ? "#1e1e2e" : "var(--color-danger, #f38ba8)",
            fontSize: "0.75rem",
            fontFamily: "var(--ui-font)",
            cursor: "pointer",
            fontWeight: 500
          }}
        >
          {TEXT.deleteConfirmLabel}
        </button>
      </div>
    </div>
  );
}

function JsonContent({ content }: { content: string | null }): React.JSX.Element {
  const isDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  const prismTheme = buildPrismTheme(isDark);

  return (
    <div
      style={{
        margin: "0 0.25rem 0.25rem",
        borderRadius: ROW_BORDER_RADIUS,
        overflow: "hidden",
        border: "1px solid var(--default-border-color, rgba(255,255,255,0.08))"
      }}
    >
      {content === null ? (
        <pre
          style={{
            margin: 0,
            padding: "0.5rem",
            fontSize: "0.75rem",
            fontFamily: "monospace",
            color: "var(--text-primary-color)",
            opacity: 0.4
          }}
        >
          {TEXT.loading}
        </pre>
      ) : (
        <Highlight theme={prismTheme} code={formatJson(content)} language="json">
          {({ tokens, getLineProps, getTokenProps }) => (
            <pre
              style={{
                margin: 0,
                padding: "0.5rem",
                fontSize: "0.75rem",
                fontFamily: "monospace",
                maxHeight: JSON_MAX_HEIGHT,
                overflowY: "auto",
                background: "transparent",
                whiteSpace: "pre-wrap",
                wordBreak: "break-word"
              }}
            >
              {tokens.map((line, lineIndex) => (
                <div key={lineIndex} {...getLineProps({ line })}>
                  {line.map((token, tokenIndex) => (
                    <span key={tokenIndex} {...getTokenProps({ token })} />
                  ))}
                </div>
              ))}
            </pre>
          )}
        </Highlight>
      )}
    </div>
  );
}

function ActionButton({
  title,
  onClick,
  children
}: {
  title: string;
  onClick: () => void;
  children: React.ReactNode;
}): React.JSX.Element {
  return (
    <button
      title={title}
      onClick={(event) => {
        event.stopPropagation();
        onClick();
      }}
      onMouseEnter={(event) => (event.currentTarget.style.background = "var(--button-hover-bg)")}
      onMouseLeave={(event) => (event.currentTarget.style.background = "transparent")}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: ACTION_BUTTON_SIZE,
        height: ACTION_BUTTON_SIZE,
        border: 0,
        borderRadius: 4,
        background: "transparent",
        color: "var(--icon-fill-color)",
        cursor: "pointer",
        flexShrink: 0,
        padding: 0
      }}
    >
      {children}
    </button>
  );
}
