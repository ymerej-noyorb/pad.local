const FADE_OUT_TRANSITION = "opacity 0.3s";

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
}: LoadingOverlayProps): React.JSX.Element {
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
        zIndex: 9999
      }}
    >
      <div className="pad-pulse">{icon}</div>
    </div>
  );
}
