import { ICONS, type IconName } from "../lib/iconData";

const DEFAULT_SIZE = 16;

interface Props {
  name: IconName;
  size?: number;
}

export default function Icon({ name, size = DEFAULT_SIZE }: Props): React.JSX.Element {
  const { body, width, height } = ICONS[name];
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox={`0 0 ${width} ${height}`}
      dangerouslySetInnerHTML={{ __html: body }}
    />
  );
}
