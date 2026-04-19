import {
  siGnubash,
  siPerplexity,
  siClaude,
  siGooglegemini,
  siMistralai,
  siCursor,
  siWindsurf,
  siVscodium,
  siZsh,
  siFishshell,
  siDash,
  siNushell,
  siExcalidraw
} from "simple-icons";

const DEFAULT_SIZE = 16;

const SI_ICONS = {
  bash: siGnubash.path,
  perplexity: siPerplexity.path,
  claude: siClaude.path,
  gemini: siGooglegemini.path,
  mistral: siMistralai.path,
  cursor: siCursor.path,
  windsurf: siWindsurf.path,
  vscodium: siVscodium.path,
  zsh: siZsh.path,
  fish: siFishshell.path,
  dash: siDash.path,
  nushell: siNushell.path,
  excalidraw: siExcalidraw.path
} as const;

export type SiIconName = keyof typeof SI_ICONS;

interface Props {
  name: SiIconName;
  size?: number;
}

export default function Icon({ name, size = DEFAULT_SIZE }: Props): React.JSX.Element {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
    >
      <path d={SI_ICONS[name]} />
    </svg>
  );
}
