import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import typedCssModules from "vite-plugin-typed-css-modules";

export default defineConfig((config) => {

    const debugMode = config.mode === "development";

    return {
        build: {
            // Disable minification in dev mode for easier debugging. In
            // production mode, use the default (esbuild) minifier.
            minify: debugMode ? false : undefined,
            sourcemap: true,
            // necessary because `tsc` is used to emit declaration files into
            // the `dist` folder, which would be deleted by `vite build` if
            // `emptyOutDir` were true
            emptyOutDir: false,
            lib: {
                name: "dropdown-menu",
                entry: {
                    index: "src/index.ts",
                    loglevel: "src/loglevel.ts"
                },
                formats: ["es"],
                cssFileName: "index"
            },
            rollupOptions: {
                treeshake: !debugMode,
                external: [
                    "react",
                    "react/jsx-runtime",
                    "react/jsx-dev-runtime",
                    "react-dom",
                    "loglevel"
                ]
            },
        },

        define: {
            __DEV__: debugMode
        },

        plugins: [
            react(),
            typedCssModules({
                include: [
                    "**/*.module.css",
                    "index.css"
                ],
                rootDir: "src-gen",
                srcDir: "src",
            })
        ]
    };
});
