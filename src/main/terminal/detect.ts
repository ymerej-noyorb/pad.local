import { existsSync, readFileSync } from "fs";
import { join, basename } from "path";
import type { ShellInfo } from "../../shared/types";

const WINDOWS_SHELL_CANDIDATES: Array<{ path: string; label: string }> = [
  {
    path: join(process.env.PROGRAMFILES ?? "C:\\Program Files", "PowerShell", "7", "pwsh.exe"),
    label: "PowerShell 7"
  },
  {
    path: join(
      process.env.SYSTEMROOT ?? "C:\\Windows",
      "System32",
      "WindowsPowerShell",
      "v1.0",
      "powershell.exe"
    ),
    label: "Windows PowerShell"
  },
  { path: join(process.env.SYSTEMROOT ?? "C:\\Windows", "System32", "cmd.exe"), label: "CMD" },
  {
    path: "C:\\Program Files\\Git\\bin\\bash.exe",
    label: "Git Bash"
  }
];

function detectWindowsShells(): ShellInfo[] {
  return WINDOWS_SHELL_CANDIDATES.flatMap(({ path, label }) => {
    if (!existsSync(path)) return [];
    return [{ path, label }];
  });
}

function detectUnixShells(): ShellInfo[] {
  const ETC_SHELLS = "/etc/shells";
  if (!existsSync(ETC_SHELLS)) return [];

  const contents = readFileSync(ETC_SHELLS, "utf-8");
  return contents
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.startsWith("/") && existsSync(line))
    .map((path) => ({ path, label: basename(path) }));
}

export function detectShells(): ShellInfo[] {
  if (process.platform === "win32") return detectWindowsShells();
  return detectUnixShells();
}
