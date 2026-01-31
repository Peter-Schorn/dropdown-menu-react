import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import typedCssModules from "vite-plugin-typed-css-modules";

export default defineConfig({
    build: {
        sourcemap: true,
        // necessary because `tsc` is used to emit declaration files into the
        // `dist` folder, which would be deleted by `vite build` if
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
        })
    ]
});
