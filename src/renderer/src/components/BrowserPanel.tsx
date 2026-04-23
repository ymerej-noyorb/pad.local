import { useEffect, useRef, useState } from "react";
import { IconWorld, IconBug, IconRefresh, IconDevices, IconHandFinger } from "@tabler/icons-react";
import { colorsByTheme } from "../theme";
import { patchWebviewIframeHeight } from "../lib/patchWebview";
import LoadingOverlay from "./LoadingOverlay";

const TOP_BAR_HEIGHT = 40;
const ICON_SIZE = 16;
const DEVTOOLS_ICON_SIZE = 14;
const INPUT_FONT_SIZE = 13;
const DIMENSION_INPUT_WIDTH = 56;
const BORDER_RADIUS = 4;
const TABLER_STROKE = 1.5;
const DROPDOWN_WIDTH = 240;
const DROPDOWN_MAX_HEIGHT = 320;
const DROPDOWN_ITEM_HEIGHT = 32;
const DROPDOWN_GROUP_LABEL_FONT_SIZE = 11;

const TEXT = {
  addressPlaceholder: "Enter URL (e.g. http://localhost:3000)",
  refresh: "Refresh",
  touchOn: "Touch simulation: on",
  touchOff: "Touch simulation: off",
  responsive: "Responsive",
  devtools: "DevTools",
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

const TOUCH_CAPABLE_GROUPS = new Set(["Phones", "Tablets"]);

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

interface BrowserPanelProps {
  url: string;
  touchCapable: boolean;
  touchEnabled: boolean;
  width: number;
  height: number;
  theme: "dark" | "light";
  scrollLocked: boolean;
  onResize: (width: number, height: number) => void;
  onUrlChange: (url: string) => void;
  onTouchStateChange: (touchCapable: boolean, touchEnabled: boolean) => void;
}

function normalizeUrl(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) return "";
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `http://${trimmed}`;
}

export default function BrowserPanel({
  url: initialUrl,
  touchCapable: initialTouchCapable,
  touchEnabled: initialTouchEnabled,
  width,
  height,
  theme,
  scrollLocked,
  onResize,
  onUrlChange,
  onTouchStateChange
}: BrowserPanelProps): React.JSX.Element {
  const [src, setSrc] = useState(initialUrl);
  const [addressInput, setAddressInput] = useState(initialUrl);
  const [loadedSrc, setLoadedSrc] = useState<string | null>(null);
  const [devtoolsHovered, setDevtoolsHovered] = useState(false);
  const [refreshHovered, setRefreshHovered] = useState(false);
  const [touchCapable, setTouchCapable] = useState(initialTouchCapable);
  const [touchEnabled, setTouchEnabled] = useState(initialTouchEnabled);
  const [touchHovered, setTouchHovered] = useState(false);
  const [devicesOpen, setDevicesOpen] = useState(false);
  const [devicesHovered, setDevicesHovered] = useState(false);
  const [hoveredDeviceName, setHoveredDeviceName] = useState<string | null>(null);
  const webviewRef = useRef<Electron.WebviewTag>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const onUrlChangeRef = useRef(onUrlChange);
  useEffect(() => {
    onUrlChangeRef.current = onUrlChange;
  }, [onUrlChange]);
  const onTouchStateChangeRef = useRef(onTouchStateChange);
  useEffect(() => {
    onTouchStateChangeRef.current = onTouchStateChange;
  }, [onTouchStateChange]);
  const isTouchStateMounted = useRef(false);
  useEffect(() => {
    if (!isTouchStateMounted.current) {
      isTouchStateMounted.current = true;
      return;
    }
    onTouchStateChangeRef.current(touchCapable, touchEnabled);
  }, [touchCapable, touchEnabled]);
  const themeColors = colorsByTheme[theme];

  const loaded = loadedSrc === src;

  useEffect(() => {
    const webview = webviewRef.current;
    if (!webview || !src) return;

    const handleDomReady = (): void => {
      patchWebviewIframeHeight(webview);
      setLoadedSrc(src);
    };

    const handleDidNavigate = (event: Electron.DidNavigateEvent): void => {
      setAddressInput(event.url);
      onUrlChangeRef.current(event.url);
    };

    const handleDidNavigateInPage = (event: Electron.DidNavigateInPageEvent): void => {
      if (!event.isMainFrame) return;
      setAddressInput(event.url);
      onUrlChangeRef.current(event.url);
    };

    webview.addEventListener("dom-ready", handleDomReady);
    webview.addEventListener("did-navigate", handleDidNavigate);
    webview.addEventListener("did-navigate-in-page", handleDidNavigateInPage);
    return () => {
      webview.removeEventListener("dom-ready", handleDomReady);
      webview.removeEventListener("did-navigate", handleDidNavigate);
      webview.removeEventListener("did-navigate-in-page", handleDidNavigateInPage);
    };
  }, [src]);

  function handleNavigate(): void {
    const normalized = normalizeUrl(addressInput);
    if (!normalized) return;
    setSrc(normalized);
    setAddressInput(normalized);
    onUrlChange(normalized);
  }

  function handleAddressKeyDown(event: React.KeyboardEvent<HTMLInputElement>): void {
    if (event.key === "Enter") handleNavigate();
  }

  useEffect(() => {
    if (!touchEnabled) return;

    const webview = webviewRef.current;
    if (!webview) return;

    let touchActive = false;

    const syncCdp = (inside: boolean): void => {
      if (inside === touchActive) return;
      touchActive = inside;
      window.api.browserSetTouchEmulation(webview.getWebContentsId(), inside);
    };

    // DOM mouse events are unreliable here: CDP setEmitTouchEventsForMouse operates at the
    // Chromium compositor level and converts/consumes hover mousemove across the entire window,
    // so document.mousemove and container.mouseleave do not fire during hover.
    // Polling screen.getCursorScreenPoint() from the main process bypasses the event pipeline.
    const POLL_INTERVAL_MS = 50;
    const pollId = setInterval(async () => {
      const pos = await window.api.getCursorPosition();
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;
      const inside =
        pos.x >= rect.left && pos.x <= rect.right && pos.y >= rect.top && pos.y <= rect.bottom;
      syncCdp(inside);
    }, POLL_INTERVAL_MS);

    return () => {
      clearInterval(pollId);
      if (touchActive) {
        window.api.browserSetTouchEmulation(webview.getWebContentsId(), false);
      }
    };
  }, [touchEnabled]);

  function handleToggleTouch(): void {
    setTouchEnabled((prev) => !prev);
  }

  function commitWidth(rawValue: string): void {
    const value = Number(rawValue);
    if (value > 0) onResize(value, height);
  }

  function commitHeight(rawValue: string): void {
    const value = Number(rawValue);
    if (value > 0) onResize(width, value);
  }

  const topBarStyle: React.CSSProperties = {
    height: TOP_BAR_HEIGHT,
    display: "flex",
    alignItems: "center",
    gap: "0.375rem",
    padding: "0 0.5rem",
    background: themeColors.surface0,
    borderBottom: `1px solid ${themeColors.surface1}`,
    flexShrink: 0,
    overflow: "hidden"
  };

  const addressInputStyle: React.CSSProperties = {
    flex: 1,
    height: 26,
    padding: "0 0.5rem",
    background: themeColors.base,
    border: `1px solid ${themeColors.surface1}`,
    borderRadius: BORDER_RADIUS,
    color: themeColors.text,
    fontSize: INPUT_FONT_SIZE,
    outline: "none",
    minWidth: 0,
    fontFamily: "inherit"
  };

  const dimInputStyle: React.CSSProperties = {
    width: DIMENSION_INPUT_WIDTH,
    height: 26,
    padding: "0 0.25rem",
    background: themeColors.base,
    border: `1px solid ${themeColors.surface1}`,
    borderRadius: BORDER_RADIUS,
    color: themeColors.text,
    fontSize: INPUT_FONT_SIZE,
    outline: "none",
    textAlign: "center",
    fontFamily: "inherit",
    flexShrink: 0
  };

  const iconButtonStyle = (hovered: boolean): React.CSSProperties => ({
    height: 26,
    width: 26,
    padding: 0,
    background: hovered ? themeColors.surface1 : "transparent",
    border: `1px solid ${themeColors.surface1}`,
    borderRadius: BORDER_RADIUS,
    color: themeColors.text,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0
  });

  const devtoolsButtonStyle: React.CSSProperties = {
    height: 26,
    padding: "0 0.4rem",
    background: devtoolsHovered ? themeColors.surface1 : "transparent",
    border: `1px solid ${themeColors.surface1}`,
    borderRadius: BORDER_RADIUS,
    color: themeColors.text,
    fontSize: INPUT_FONT_SIZE - 1,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: "0.25rem",
    flexShrink: 0,
    whiteSpace: "nowrap",
    fontFamily: "inherit"
  };

  const separatorStyle: React.CSSProperties = {
    color: themeColors.overlay0,
    fontSize: INPUT_FONT_SIZE,
    flexShrink: 0,
    userSelect: "none"
  };

  const containerStyle: React.CSSProperties = {
    width: "100%",
    height: "100%",
    display: "flex",
    flexDirection: "column",
    borderRadius: BORDER_RADIUS,
    overflow: "hidden",
    background: themeColors.base
  };

  const webviewContainerStyle: React.CSSProperties = {
    flex: 1,
    position: "relative",
    overflow: "hidden",
    pointerEvents: scrollLocked ? "none" : "auto"
  };

  const webviewStyle: React.CSSProperties = {
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    display: "block",
    border: "none"
  };

  const dropdownStyle: React.CSSProperties = {
    position: "absolute",
    top: 8,
    left: 8,
    width: DROPDOWN_WIDTH,
    maxHeight: DROPDOWN_MAX_HEIGHT,
    overflowY: "auto",
    background: themeColors.surface0,
    border: `1px solid ${themeColors.surface1}`,
    borderRadius: BORDER_RADIUS,
    zIndex: 10
  };

  const dropdownGroupLabelStyle: React.CSSProperties = {
    padding: "0.375rem 0.5rem 0.125rem",
    fontSize: DROPDOWN_GROUP_LABEL_FONT_SIZE,
    color: themeColors.overlay0,
    textTransform: "uppercase",
    letterSpacing: "0.06em",
    userSelect: "none"
  };

  const dropdownItemStyle = (hovered: boolean): React.CSSProperties => ({
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

  const dropdownItemDimsStyle: React.CSSProperties = {
    color: themeColors.overlay0,
    fontSize: INPUT_FONT_SIZE - 1,
    flexShrink: 0
  };

  return (
    <div ref={containerRef} style={containerStyle}>
      <div style={topBarStyle}>
        <IconWorld size={ICON_SIZE} stroke={TABLER_STROKE} color={themeColors.overlay0} />
        <button
          style={iconButtonStyle(refreshHovered)}
          onClick={() => webviewRef.current?.reload()}
          onMouseEnter={() => setRefreshHovered(true)}
          onMouseLeave={() => setRefreshHovered(false)}
          title={TEXT.refresh}
        >
          <IconRefresh size={ICON_SIZE} stroke={TABLER_STROKE} />
        </button>
        <input
          type="text"
          value={addressInput}
          onChange={(event) => setAddressInput(event.target.value)}
          onKeyDown={handleAddressKeyDown}
          placeholder={TEXT.addressPlaceholder}
          style={addressInputStyle}
        />
        {!touchCapable && (
          <>
            <input
              key={"w" + width}
              type="number"
              defaultValue={Math.round(width)}
              onBlur={(event) => commitWidth(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") commitWidth(event.currentTarget.value);
              }}
              style={dimInputStyle}
            />
            <span style={separatorStyle}>{TEXT.dimensionSeparator}</span>
            <input
              key={"h" + height}
              type="number"
              defaultValue={Math.round(height)}
              onBlur={(event) => commitHeight(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") commitHeight(event.currentTarget.value);
              }}
              style={dimInputStyle}
            />
          </>
        )}
        <button
          style={iconButtonStyle(devicesHovered)}
          onClick={() => setDevicesOpen((open) => !open)}
          onMouseEnter={() => setDevicesHovered(true)}
          onMouseLeave={() => setDevicesHovered(false)}
          title={TEXT.responsive}
        >
          <IconDevices size={ICON_SIZE} stroke={TABLER_STROKE} />
        </button>
        {touchCapable && (
          <button
            style={{
              ...iconButtonStyle(touchHovered || touchEnabled),
              color: touchEnabled ? themeColors.blue : themeColors.text
            }}
            onClick={handleToggleTouch}
            onMouseEnter={() => setTouchHovered(true)}
            onMouseLeave={() => setTouchHovered(false)}
            title={touchEnabled ? TEXT.touchOn : TEXT.touchOff}
          >
            <IconHandFinger size={ICON_SIZE} stroke={TABLER_STROKE} />
          </button>
        )}
        <button
          style={devtoolsButtonStyle}
          onClick={() => webviewRef.current?.openDevTools()}
          onMouseEnter={() => setDevtoolsHovered(true)}
          onMouseLeave={() => setDevtoolsHovered(false)}
          title={TEXT.devtools}
        >
          <IconBug size={DEVTOOLS_ICON_SIZE} stroke={TABLER_STROKE} />
          {TEXT.devtools}
        </button>
      </div>
      <div style={webviewContainerStyle}>
        {src && (
          <webview ref={webviewRef} src={src} partition="persist:browser" style={webviewStyle} />
        )}
        {src && (
          <LoadingOverlay
            icon={<IconWorld size={48} stroke={TABLER_STROKE} color={themeColors.overlay0} />}
            color={themeColors.overlay0}
            background={themeColors.base}
            loaded={loaded}
          />
        )}
        {devicesOpen && (
          <>
            <div
              style={{ position: "absolute", inset: 0, zIndex: 9 }}
              onClick={() => setDevicesOpen(false)}
            />
            <div style={dropdownStyle}>
              {DEVICE_GROUPS.map((group) => (
                <div key={group.label}>
                  <div style={dropdownGroupLabelStyle}>{group.label}</div>
                  {group.devices.map((device) => (
                    <button
                      key={device.name}
                      style={dropdownItemStyle(hoveredDeviceName === device.name)}
                      onMouseEnter={() => setHoveredDeviceName(device.name)}
                      onMouseLeave={() => setHoveredDeviceName(null)}
                      onClick={() => {
                        const capable = TOUCH_CAPABLE_GROUPS.has(group.label);
                        if (!capable && touchEnabled) setTouchEnabled(false);
                        setTouchCapable(capable);
                        onResize(device.width, device.height + TOP_BAR_HEIGHT);
                        setDevicesOpen(false);
                      }}
                    >
                      <span>{device.name}</span>
                      <span style={dropdownItemDimsStyle}>
                        {device.width}×{device.height}
                      </span>
                    </button>
                  ))}
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
