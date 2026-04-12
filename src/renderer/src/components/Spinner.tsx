const SPINNER_DEFAULT_SIZE = 24;
const SPINNER_STROKE_WIDTH = 2;
const SPINNER_ARC_FRACTION = 0.25;

interface SpinnerProps {
  size?: number;
  color: string;
}

export default function Spinner({
  size = SPINNER_DEFAULT_SIZE,
  color
}: SpinnerProps): React.JSX.Element {
  const radius = (size - SPINNER_STROKE_WIDTH * 2) / 2;
  const circumference = 2 * Math.PI * radius;
  const center = size / 2;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="pad-spin">
      {/* Track */}
      <circle
        cx={center}
        cy={center}
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth={SPINNER_STROKE_WIDTH}
        strokeOpacity={0.25}
      />
      {/* Active arc */}
      <circle
        cx={center}
        cy={center}
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth={SPINNER_STROKE_WIDTH}
        strokeDasharray={`${circumference * SPINNER_ARC_FRACTION} ${circumference * (1 - SPINNER_ARC_FRACTION)}`}
        strokeLinecap="round"
      />
    </svg>
  );
}
