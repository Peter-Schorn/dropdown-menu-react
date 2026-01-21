import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import dts from "vite-plugin-dts";
import typedCssModules from "vite-plugin-typed-css-modules";

export default defineConfig({
    build: {
        sourcemap: true,
        lib: {
            entry: {
                index: "src/index.ts",
                loglevel: "src/logLevelModuleIntegration.ts"
            },
            formats: ["es"],
            cssFileName: "index"
        },
        rollupOptions: {
            // do NOT bundle react
            external: [
                "react",
                "react-dom",
                "loglevel"
            ]
        }
    },

    plugins: [
        react(),
        typedCssModules({
            include: [
                "**/*.module.css"
            ],
            rootDir: "src-gen",
            srcDir: "src"
        }),
        dts({
            insertTypesEntry: true
        })
    ]
});
