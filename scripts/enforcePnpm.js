// This script is meant to be run during the preinstall phase of npm. When this
// package is the top-level package being installed (i.e., not as a dependency
// of another package), it will ensure that only pnpm is used to install
// dependencies.

const ua = process.env.npm_config_user_agent ?? "";
const event = process.env.npm_lifecycle_event ?? "";

// check if this package is the top-level package being installed
const isLocal = process.env.INIT_CWD === process.cwd();
const isInstallPhase = event === "preinstall";

if (!(isLocal && isInstallPhase)) {
    process.exit(0);
}

if (!ua.includes("pnpm")) {
    console.error(
        "=============================== ERROR ============================\n" +
        "Please use pnpm to install dependencies in this repository.\n" +
        "=================================================================="
    );
    process.exit(1);
}
