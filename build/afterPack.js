const { mkdirSync, writeFileSync } = require("fs");
const { join } = require("path");

// Inject portable markers into the Windows app output directory.
// Both the zip (portable) and nsis (installer) targets use this same output,
// so the markers end up in both. index.ts excludes Program Files installs from
// portable mode to avoid false positives with the NSIS installer.
exports.default = async function afterPack(context) {
  if (context.electronPlatformName !== "win32") return;
  mkdirSync(join(context.appOutDir, "padlocal-data"), { recursive: true });
  writeFileSync(join(context.appOutDir, ".portable"), "");
};
