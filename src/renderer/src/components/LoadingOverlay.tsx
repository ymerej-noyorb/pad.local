import { useState } from "react";

const FADE_OUT_TRANSITION = "opacity 0.3s";
const OVERLAY_Z_INDEX = 9999;

interface LoadingOverlayProps {
  icon: React.ReactNode;
  color: string;
  background: string;
  loaded: boolean;
}

export default function LoadingOverlay({
  icon,
  color,
  background,
  loaded
}: LoadingOverlayProps): React.JSX.Element | null {
  const [hidden, setHidden] = useState(false);

  if (hidden) return null;

  return (
    <div
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background,
        color,
        opacity: loaded ? 0 : 1,
        transition: loaded ? FADE_OUT_TRANSITION : "none",
        pointerEvents: "none",
        userSelect: "none",
        zIndex: OVERLAY_Z_INDEX
      }}
      onTransitionEnd={() => {
        if (loaded) setHidden(true);
      }}
    >
      <div className="pad-pulse">{icon}</div>
    </div>
  );
}
