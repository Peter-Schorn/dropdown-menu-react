import { JSDOM } from "jsdom";
import { createRoot } from "react-dom/client";

import { configurePolyfills } from "./configurePolyfills.js";
import { assert } from "./utils.js";

// ensure the library is not leaking the global __DEV__ declaration
assert(
    // @ts-expect-error
    typeof ___DEV___ === "undefined",
    "Expected ___DEV___ to be undefined"
);

// ---- setup DOM ----
const dom = new JSDOM(
    "<!doctype html><html><body><div id='root'></div></body></html>"
);

// ---- configure polyfills ----
configurePolyfills(dom);

const originalConsoleError = console.error;
console.error = (...args: unknown[]): void => {
    originalConsoleError(...args);
    throw new Error(
        "console.error was called; failing test"
    );
};

const originalConsoleWarn = console.warn;
console.warn = (...args: unknown[]): void => {
    originalConsoleWarn(...args);
    throw new Error(
        "console.warn was called; failing test"
    );
};


// ---- dynamic import AFTER configuring polyfills and globals ----
const { App } = await import("./App.js");

// ---- render ----
const container = document.getElementById("root")!;
const root = createRoot(container);

console.log("--- RENDER APP ---");
root.render(<App />);

// yield to allow react to do some actual work
await new Promise(resolve => setTimeout(resolve, 500));

// cleanup
root.unmount();
