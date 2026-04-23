import { useEffect, useState } from "react";
import { IconPlus, IconX } from "@tabler/icons-react";
import { colorsByTheme } from "../../theme";

const INPUT_FONT_SIZE = 13;
const DIMENSION_INPUT_WIDTH = 56;
const BORDER_RADIUS = 4;
const TABLER_STROKE = 1.5;
const DROPDOWN_WIDTH = 240;
const DROPDOWN_MAX_HEIGHT = 320;
const DROPDOWN_ITEM_HEIGHT = 32;
const DROPDOWN_GROUP_LABEL_FONT_SIZE = 11;
const ICON_SIZE = 16;
const CUSTOM_DEVICES_STORAGE_KEY = "pad.local:customDevices";

const TEXT = {
  customGroup: "Custom",
  addDevice: "Add custom size",
  addDeviceNamePlaceholder: "Name",
  addDeviceConfirm: "Add",
  deleteDevice: "Delete",
  dimensionSeparator: "×"
} as const;

interface DevicePreset {
  name: string;
  width: number;
  height: number;
}

interface DeviceGroup {
  label: string;
  devices: DevicePreset[];
}

export const TOUCH_CAPABLE_GROUPS = new Set(["Phones", "Tablets"]);

const DEVICE_GROUPS: DeviceGroup[] = [
  {
    label: "Phones",
    devices: [
      { name: "Galaxy Note 9", width: 414, height: 846 },
      { name: "Galaxy S10/S10+", width: 360, height: 760 },
      { name: "Galaxy S20", width: 360, height: 800 },
      { name: "Galaxy S20+", width: 384, height: 854 },
      { name: "Galaxy S25", width: 360, height: 780 },
      { name: "Galaxy S25+", width: 384, height: 832 },
      { name: "Galaxy S25 Ultra", width: 384, height: 824 },
      { name: "Galaxy S9/S9+", width: 360, height: 740 },
      { name: "iPhone 11 Pro", width: 375, height: 812 },
      { name: "iPhone 11 Pro Max", width: 414, height: 896 },
      { name: "iPhone 12/13 + Pro", width: 390, height: 844 },
      { name: "iPhone 12/13 Pro Max", width: 428, height: 926 },
      { name: "iPhone 12/13 mini", width: 375, height: 812 },
      { name: "iPhone 14 / 15 / 16", width: 390, height: 844 },
      { name: "iPhone 14 / 15 / 16 Plus", width: 430, height: 932 },
      { name: "iPhone 15 / 16 Pro", width: 393, height: 852 },
      { name: "iPhone 16 Pro Max", width: 430, height: 932 },
      { name: "iPhone 17 / 17 Pro", width: 393, height: 852 },
      { name: "iPhone 17 Pro Max", width: 440, height: 956 },
      { name: "iPhone Air", width: 390, height: 844 },
      { name: "iPhone SE", width: 375, height: 667 },
      { name: "iPhone X/XS", width: 375, height: 812 },
      { name: "iPhone XR/11", width: 414, height: 896 },
      { name: "iPhone XS Max", width: 414, height: 896 },
      { name: "Pixel 5", width: 393, height: 851 },
      { name: "Pixel 8 / 9 (Chrome)", width: 412, height: 915 },
      { name: "Pixel 8 / 9 (Firefox)", width: 412, height: 915 }
    ]
  },
  {
    label: "Tablets",
    devices: [
      { name: "Galaxy Tab S9", width: 800, height: 1280 },
      { name: "Galaxy Tab S9 Ultra", width: 848, height: 1312 },
      { name: "Galaxy Tab S9+", width: 832, height: 1280 },
      { name: "iPad", width: 768, height: 1024 },
      { name: "iPad (10th / 11th gen)", width: 820, height: 1180 },
      { name: "iPad Air", width: 820, height: 1180 },
      { name: "iPad Mini", width: 768, height: 1024 },
      { name: "iPad Mini (6th gen)", width: 744, height: 1133 },
      { name: "iPad Pro 11-inch (M4)", width: 834, height: 1194 },
      { name: "iPad Pro 11-inch (old)", width: 834, height: 1194 },
      { name: "iPad Pro 12.9-inch (old)", width: 1024, height: 1366 },
      { name: "iPad Pro 13-inch (M4)", width: 1032, height: 1376 }
    ]
  },
  {
    label: "Laptops",
    devices: [
      { name: "Laptop with HiDPI screen", width: 1440, height: 900 },
      { name: "Laptop with MDPI screen", width: 1280, height: 800 },
      { name: "Laptop with touch", width: 1280, height: 950 }
    ]
  },
  {
    label: "TVs",
    devices: [
      { name: "720p HD Television", width: 1280, height: 720 },
      { name: "1080p Full HD Television", width: 1920, height: 1080 },
      { name: "4K Ultra HD Television", width: 3840, height: 2160 }
    ]
  }
];

interface DeviceDropdownProps {
  theme: "dark" | "light";
  onSelect: (width: number, height: number, touchCapable: boolean) => void;
  onClose: () => void;
}

export default function DeviceDropdown({
  theme,
  onSelect,
  onClose
}: DeviceDropdownProps): React.JSX.Element {
  const themeColors = colorsByTheme[theme];

  const [hoveredDeviceName, setHoveredDeviceName] = useState<string | null>(null);
  const [customDevices, setCustomDevices] = useState<DevicePreset[]>(() => {
    try {
      const stored = localStorage.getItem(CUSTOM_DEVICES_STORAGE_KEY);
      return stored ? (JSON.parse(stored) as DevicePreset[]) : [];
    } catch {
      return [];
    }
  });
  const [showAddForm, setShowAddForm] = useState(false);
  const [newDeviceName, setNewDeviceName] = useState("");
  const [newDeviceWidth, setNewDeviceWidth] = useState("");
  const [newDeviceHeight, setNewDeviceHeight] = useState("");
  const [hoveredDeleteIndex, setHoveredDeleteIndex] = useState<number | null>(null);

  useEffect(() => {
    localStorage.setItem(CUSTOM_DEVICES_STORAGE_KEY, JSON.stringify(customDevices));
  }, [customDevices]);

  function handleAddDevice(): void {
    const name = newDeviceName.trim();
    const width = Number(newDeviceWidth);
    const height = Number(newDeviceHeight);
    if (!name || width <= 0 || height <= 0) return;
    setCustomDevices((prev) => [...prev, { name, width, height }]);
    setNewDeviceName("");
    setNewDeviceWidth("");
    setNewDeviceHeight("");
    setShowAddForm(false);
  }

  function handleDeleteCustomDevice(index: number): void {
    setCustomDevices((prev) => prev.filter((_, deviceIndex) => deviceIndex !== index));
  }

  const dropdownStyle: React.CSSProperties = {
    position: "absolute",
    top: 8,
    right: 8,
    width: DROPDOWN_WIDTH,
    maxHeight: DROPDOWN_MAX_HEIGHT,
    overflowY: "auto",
    background: themeColors.surface0,
    border: `1px solid ${themeColors.surface1}`,
    borderRadius: BORDER_RADIUS,
    zIndex: 10
  };

  const groupLabelStyle: React.CSSProperties = {
    padding: "0.375rem 0.5rem 0.125rem",
    fontSize: DROPDOWN_GROUP_LABEL_FONT_SIZE,
    color: themeColors.overlay0,
    textTransform: "uppercase",
    letterSpacing: "0.06em",
    userSelect: "none"
  };

  const itemStyle = (hovered: boolean): React.CSSProperties => ({
    width: "100%",
    height: DROPDOWN_ITEM_HEIGHT,
    padding: "0 0.5rem",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    background: hovered ? themeColors.surface1 : "transparent",
    border: "none",
    color: themeColors.text,
    fontSize: INPUT_FONT_SIZE,
    cursor: "pointer",
    textAlign: "left",
    fontFamily: "inherit"
  });

  const itemDimsStyle: React.CSSProperties = {
    color: themeColors.overlay0,
    fontSize: INPUT_FONT_SIZE - 1,
    flexShrink: 0
  };

  const dividerStyle: React.CSSProperties = {
    height: 1,
    background: themeColors.surface1,
    margin: "0.25rem 0"
  };

  const deleteButtonStyle = (hovered: boolean): React.CSSProperties => ({
    height: 20,
    width: 20,
    padding: 0,
    background: hovered ? themeColors.red : "transparent",
    border: "none",
    borderRadius: BORDER_RADIUS,
    color: hovered ? themeColors.base : themeColors.overlay0,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0
  });

  const addRowStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: "0.25rem",
    padding: "0.375rem 0.5rem"
  };

  const addInputStyle: React.CSSProperties = {
    height: 24,
    padding: "0 0.25rem",
    background: themeColors.base,
    border: `1px solid ${themeColors.surface1}`,
    borderRadius: BORDER_RADIUS,
    color: themeColors.text,
    fontSize: INPUT_FONT_SIZE,
    outline: "none",
    fontFamily: "inherit"
  };

  const addButtonStyle: React.CSSProperties = {
    height: 24,
    padding: "0 0.4rem",
    background: themeColors.blue,
    border: "none",
    borderRadius: BORDER_RADIUS,
    color: themeColors.base,
    fontSize: INPUT_FONT_SIZE,
    cursor: "pointer",
    fontFamily: "inherit",
    flexShrink: 0,
    fontWeight: 600
  };

  const separatorStyle: React.CSSProperties = {
    color: themeColors.overlay0,
    fontSize: INPUT_FONT_SIZE,
    flexShrink: 0,
    userSelect: "none"
  };

  return (
    <>
      <div style={{ position: "absolute", inset: 0, zIndex: 9 }} onClick={onClose} />
      <div style={dropdownStyle}>
        {customDevices.length > 0 && (
          <div>
            <div style={groupLabelStyle}>{TEXT.customGroup}</div>
            {customDevices.map((device, index) => (
              <div
                key={index}
                style={{
                  ...itemStyle(hoveredDeviceName === `custom-${index}`),
                  paddingRight: "0.25rem",
                  gap: "0.5rem"
                }}
                onMouseEnter={() => setHoveredDeviceName(`custom-${index}`)}
                onMouseLeave={() => setHoveredDeviceName(null)}
              >
                <button
                  style={{
                    flex: 1,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    background: "transparent",
                    border: "none",
                    color: themeColors.text,
                    fontSize: INPUT_FONT_SIZE,
                    cursor: "pointer",
                    padding: 0,
                    fontFamily: "inherit",
                    minWidth: 0
                  }}
                  onClick={() => onSelect(device.width, device.height, false)}
                >
                  <span
                    style={{
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                      textAlign: "left"
                    }}
                  >
                    {device.name}
                  </span>
                  <span style={{ ...itemDimsStyle, marginLeft: "0.5rem" }}>
                    {device.width}×{device.height}
                  </span>
                </button>
                <button
                  style={deleteButtonStyle(hoveredDeleteIndex === index)}
                  onMouseEnter={() => setHoveredDeleteIndex(index)}
                  onMouseLeave={() => setHoveredDeleteIndex(null)}
                  onClick={(event) => {
                    event.stopPropagation();
                    handleDeleteCustomDevice(index);
                  }}
                  title={TEXT.deleteDevice}
                >
                  <IconX size={12} stroke={TABLER_STROKE} />
                </button>
              </div>
            ))}
            <div style={dividerStyle} />
          </div>
        )}
        {DEVICE_GROUPS.map((group) => (
          <div key={group.label}>
            <div style={groupLabelStyle}>{group.label}</div>
            {group.devices.map((device) => (
              <button
                key={device.name}
                style={itemStyle(hoveredDeviceName === device.name)}
                onMouseEnter={() => setHoveredDeviceName(device.name)}
                onMouseLeave={() => setHoveredDeviceName(null)}
                onClick={() =>
                  onSelect(device.width, device.height, TOUCH_CAPABLE_GROUPS.has(group.label))
                }
              >
                <span>{device.name}</span>
                <span style={itemDimsStyle}>
                  {device.width}×{device.height}
                </span>
              </button>
            ))}
          </div>
        ))}
        <div style={dividerStyle} />
        {showAddForm ? (
          <div>
            <div style={addRowStyle}>
              <input
                type="text"
                placeholder={TEXT.addDeviceNamePlaceholder}
                value={newDeviceName}
                onChange={(event) => setNewDeviceName(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") handleAddDevice();
                  if (event.key === "Escape") setShowAddForm(false);
                }}
                style={{ ...addInputStyle, flex: 1, minWidth: 0 }}
                autoFocus
              />
            </div>
            <div style={addRowStyle}>
              <input
                type="number"
                placeholder="W"
                value={newDeviceWidth}
                onChange={(event) => setNewDeviceWidth(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") handleAddDevice();
                  if (event.key === "Escape") setShowAddForm(false);
                }}
                style={{ ...addInputStyle, width: DIMENSION_INPUT_WIDTH, textAlign: "center" }}
              />
              <span style={separatorStyle}>{TEXT.dimensionSeparator}</span>
              <input
                type="number"
                placeholder="H"
                value={newDeviceHeight}
                onChange={(event) => setNewDeviceHeight(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") handleAddDevice();
                  if (event.key === "Escape") setShowAddForm(false);
                }}
                style={{ ...addInputStyle, width: DIMENSION_INPUT_WIDTH, textAlign: "center" }}
              />
              <button style={addButtonStyle} onClick={handleAddDevice}>
                {TEXT.addDeviceConfirm}
              </button>
              <button style={deleteButtonStyle(false)} onClick={() => setShowAddForm(false)}>
                <IconX size={12} stroke={TABLER_STROKE} />
              </button>
            </div>
          </div>
        ) : (
          <button
            style={{
              ...itemStyle(hoveredDeviceName === "__add__"),
              color: themeColors.overlay0,
              gap: "0.375rem"
            }}
            onMouseEnter={() => setHoveredDeviceName("__add__")}
            onMouseLeave={() => setHoveredDeviceName(null)}
            onClick={() => setShowAddForm(true)}
          >
            <IconPlus size={ICON_SIZE} stroke={TABLER_STROKE} />
            {TEXT.addDevice}
          </button>
        )}
      </div>
    </>
  );
}
