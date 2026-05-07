import { useEffect, useRef, useState } from "react";
import { IconPencil, IconTrash, IconPlus, IconCheck } from "@tabler/icons-react";
import type { Workspace } from "../../../../shared/types";

const MENU_GAP = 8;
const Z_INDEX = 9999;
const BORDER_RADIUS_MENU = 8;
const BORDER_RADIUS_ROW = 6;
const PADDING = 6;
const ROW_HEIGHT = "2.25rem";
const FONT_SIZE = "0.9375rem";
const ICON_SIZE = 14;
const ACTION_ICON_SIZE = 13;
const LARGE_ICON_SIZE = 16;
const ACTION_BUTTON_SIZE = 24;
const TABLER_STROKE = 1.5;

const TEXT = {
  newWorkspace: "New workspace",
  rename: "Rename",
  delete: "Delete"
} as const;

export default function WorkspacePanel({
  anchorRef,
  positionRef,
  onClose,
  workspaces,
  activeId,
  isSwitching,
  onSwitch,
  onRename,
  onCreate,
  onDelete
}: {
  anchorRef: React.RefObject<HTMLButtonElement | null>;
  positionRef?: React.RefObject<HTMLElement | null>;
  onClose: () => void;
  workspaces: Workspace[];
  activeId: string;
  isSwitching: boolean;
  onSwitch: (id: string) => void;
  onRename: (id: string, name: string) => void;
  onCreate: () => void;
  onDelete: (id: string) => void;
}): React.JSX.Element | null {
  const panelRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState<{ bottom: number; left: number; width: number } | null>(
    null
  );
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const editInputRef = useRef<HTMLInputElement>(null);

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

  useEffect(() => {
    if (editingId && editInputRef.current) {
      editInputRef.current.focus();
      editInputRef.current.select();
    }
  }, [editingId]);

  function handleSwitch(id: string): void {
    if (id === activeId || isSwitching) return;
    onClose();
    onSwitch(id);
  }

  function startRename(workspace: Workspace): void {
    setEditingId(workspace.id);
    setEditName(workspace.name);
  }

  function commitRename(): void {
    if (!editingId) return;
    const trimmed = editName.trim();
    if (trimmed) onRename(editingId, trimmed);
    setEditingId(null);
  }

  function handleCreate(): void {
    onClose();
    onCreate();
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
        borderRadius: BORDER_RADIUS_MENU,
        boxShadow: "var(--shadow-island)",
        padding: PADDING,
        zIndex: Z_INDEX
      }}
    >
      {workspaces.map((workspace) => (
        <WorkspaceRow
          key={workspace.id}
          workspace={workspace}
          isActive={workspace.id === activeId}
          isEditing={editingId === workspace.id}
          editName={editName}
          editInputRef={editInputRef}
          canDelete={workspaces.length > 1}
          onSwitch={handleSwitch}
          onStartRename={startRename}
          onRenameChange={setEditName}
          onRenameCommit={commitRename}
          onRenameCancel={() => setEditingId(null)}
          onDelete={(id) => {
            onDelete(id);
            if (workspaces.length <= 2) onClose();
          }}
        />
      ))}

      <div
        style={{
          height: 1,
          background: "var(--default-border-color, rgba(255,255,255,0.08))",
          margin: `${PADDING}px 0`
        }}
      />

      <button
        onClick={handleCreate}
        onMouseEnter={(event) => (event.currentTarget.style.background = "var(--button-hover-bg)")}
        onMouseLeave={(event) => (event.currentTarget.style.background = "transparent")}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.625rem",
          width: "100%",
          height: ROW_HEIGHT,
          padding: "0 0.625rem",
          border: 0,
          borderRadius: BORDER_RADIUS_ROW,
          background: "transparent",
          color: "var(--text-primary-color)",
          fontSize: FONT_SIZE,
          fontFamily: "var(--ui-font)",
          cursor: "pointer"
        }}
      >
        <IconPlus size={LARGE_ICON_SIZE} stroke={TABLER_STROKE} />
        {TEXT.newWorkspace}
      </button>
    </div>
  );
}

function WorkspaceRow({
  workspace,
  isActive,
  isEditing,
  editName,
  editInputRef,
  canDelete,
  onSwitch,
  onStartRename,
  onRenameChange,
  onRenameCommit,
  onRenameCancel,
  onDelete
}: {
  workspace: Workspace;
  isActive: boolean;
  isEditing: boolean;
  editName: string;
  editInputRef: React.RefObject<HTMLInputElement | null>;
  canDelete: boolean;
  onSwitch: (id: string) => void;
  onStartRename: (workspace: Workspace) => void;
  onRenameChange: (value: string) => void;
  onRenameCommit: () => void;
  onRenameCancel: () => void;
  onDelete: (id: string) => void;
}): React.JSX.Element {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "0.25rem",
        height: ROW_HEIGHT,
        padding: "0 0.25rem 0 0.5rem",
        borderRadius: BORDER_RADIUS_ROW,
        background: isActive ? "var(--button-hover-bg)" : "transparent"
      }}
    >
      <span
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: ICON_SIZE,
          flexShrink: 0,
          color: isActive ? "var(--color-primary)" : "transparent"
        }}
      >
        <IconCheck size={ICON_SIZE} stroke={TABLER_STROKE} />
      </span>

      {isEditing ? (
        <input
          ref={editInputRef}
          value={editName}
          onChange={(event) => onRenameChange(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") onRenameCommit();
            if (event.key === "Escape") onRenameCancel();
          }}
          onBlur={onRenameCommit}
          style={{
            flex: 1,
            height: "1.5rem",
            padding: "0 0.25rem",
            border: "1px solid var(--color-primary)",
            borderRadius: 4,
            background: "var(--island-bg-color)",
            color: "var(--text-primary-color)",
            fontSize: FONT_SIZE,
            fontFamily: "var(--ui-font)",
            outline: "none"
          }}
        />
      ) : (
        <button
          onClick={() => onSwitch(workspace.id)}
          style={{
            flex: 1,
            height: "100%",
            padding: 0,
            border: 0,
            background: "transparent",
            color: "var(--text-primary-color)",
            fontSize: FONT_SIZE,
            fontWeight: isActive ? 500 : 400,
            fontFamily: "var(--ui-font)",
            textAlign: "left",
            cursor: isActive ? "default" : "pointer",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap"
          }}
        >
          {workspace.name}
        </button>
      )}

      {hovered && !isEditing && (
        <>
          <ActionButton
            title={TEXT.rename}
            onClick={() => onStartRename(workspace)}
            icon={<IconPencil size={ACTION_ICON_SIZE} stroke={TABLER_STROKE} />}
          />
          {canDelete && (
            <ActionButton
              title={TEXT.delete}
              onClick={() => onDelete(workspace.id)}
              icon={<IconTrash size={ACTION_ICON_SIZE} stroke={TABLER_STROKE} />}
            />
          )}
        </>
      )}
    </div>
  );
}

function ActionButton({
  title,
  onClick,
  icon
}: {
  title: string;
  onClick: () => void;
  icon: React.ReactNode;
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
      {icon}
    </button>
  );
}
