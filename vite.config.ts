import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import dts from "vite-plugin-dts";
import typedCssModules from "vite-plugin-typed-css-modules";

export default defineConfig({
    build: {
        lib: {
            entry: "src/index.ts",
            formats: ["es"],
            fileName: "index"
        },
        rollupOptions: {
            // do NOT bundle react
            external: ["react", "react-dom"]
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
