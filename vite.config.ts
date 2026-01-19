import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import dts from "vite-plugin-dts";
import typedCssModules from "vite-plugin-typed-css-modules";

export default defineConfig({
    build: {
        lib: {
            entry: {
                index: "src/index.ts",
                loglevel: "src/logLevelModuleIntegration.ts"
            },
            formats: ["es"]
        },
        rollupOptions: {
            // do NOT bundle react
            external: [
                "react",
                "react-dom",
                "loglevel"
            ],
            output: {
                assetFileNames: (assetInfo) => {
                    // console.log("\nassetInfo:", assetInfo);
                    // console.log("------ end assetInfo ------");
                    if (assetInfo.names.some(name => name.endsWith(".css"))) {
                        return "index.css";
                    }
                    return assetInfo.names[0] ?? "[name][extname]";
                },
            }
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
