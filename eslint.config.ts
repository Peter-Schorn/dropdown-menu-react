import eslint from "@eslint/js";
import globals from "globals";
import react from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";
import stylistic from "@stylistic/eslint-plugin";
import jsdoc from "eslint-plugin-jsdoc";
import tsdoc from "eslint-plugin-tsdoc";
import sonarjs from "eslint-plugin-sonarjs";
import "eslint-import-resolver-typescript";
import { defineConfig, globalIgnores } from "eslint/config";

export default defineConfig(
    globalIgnores(["**/dist", "**/src-gen"]),
    {
        files: [
            "**/*.{ts,tsx,js}",
        ],
        settings: {
            react: {
                version: "detect"
            }
        },
        languageOptions: {
            ecmaVersion: 2020,
            parserOptions: {
                ecmaFeatures: {
                    jsx: true
                },
                tsconfigRootDir: import.meta.dirname,
                projectService: true
            },
        },
        extends: [
            eslint.configs.recommended,
            tseslint.configs.recommendedTypeChecked,
            jsdoc.configs["flat/recommended-typescript"],

            reactHooks.configs.flat.recommended,
            react.configs.flat.recommended!,
            // disables rules that require react to be in scope, since it's not
            // necessary anymore in react 17+
            react.configs.flat["jsx-runtime"]!,
        ],
        plugins: {
            "react": react,
            // @ts-ignore
            "react-hooks": reactHooks,
            "react-refresh": reactRefresh,
            "@typescript-eslint": tseslint.plugin,
            "@stylistic": stylistic,
            "jsdoc": jsdoc,
            "tsdoc": tsdoc,
            "sonarjs": sonarjs
        },
        rules: {

            "react-refresh/only-export-components": [
                "error",
                { allowConstantExport: true },
            ],

            "react/no-unescaped-entities": ["error", {
                // allow " characters
                forbid: [">", "\\", "}"]
            }],

            "react-hooks/immutability": ["warn"],

            "react/display-name": ["error", {
                ignoreTranspilerName: false,
                checkContextObjects: true,
            }],

            // there is a bug where this doesn't even work correctly
            "react/prop-types": "off",

            "jsdoc/require-jsdoc": "off",
            "jsdoc/tag-lines": "off",
            "jsdoc/require-param": "off",
            "jsdoc/require-returns": "off",
            "jsdoc/check-tag-names": "off",
            // reports warning when not documenting declared parameters, but
            // tsdoc doesn't allow this
            "jsdoc/check-param-names": "off",

            "tsdoc/syntax": "warn",

            "@typescript-eslint/explicit-function-return-type": "error",
            "@stylistic/semi": ["error", "always"],
            "@stylistic/no-extra-semi": "error",
            "@stylistic/member-delimiter-style": ["error", {
                multiline: {
                    delimiter: "semi",
                    requireLast: true
                },
                singleline: {
                    delimiter: "comma",
                    requireLast: false
                },
            }],
            "@stylistic/no-trailing-spaces": "warn",

            "@stylistic/quotes": ["error", "double", { avoidEscape: true }],
            "@stylistic/jsx-quotes": ["error", "prefer-double"],
            "prefer-const": "error",
            "@typescript-eslint/no-unused-vars": ["warn", {
                varsIgnorePattern: "^_+$",
                argsIgnorePattern: "^_+$",
                ignoreRestSiblings: true
            }],
            eqeqeq: "error",
            "no-unreachable": "warn",
            "@typescript-eslint/no-misused-promises": ["error", {
                checksVoidReturn: {
                    inheritedMethods: false,
                    // Disables checking an asynchronous function passed as a
                    // JSX attribute expected to be a function that returns
                    // void.
                    attributes: false,
                    arguments: false
                }
            }],
            // disallows c-style for-loops when a for-of loop could be used
            // instead
            "@typescript-eslint/prefer-for-of": "error",

            // TODO: Reenable this
            // "@stylistic/max-len": ["error", {
            //     code: 80,
            //     // ignore eslint-disable comments
            //     ignorePattern: "^\\s*//\\s*eslint-disable",
            //     ignoreComments: false,
            // }],

            "no-var": "error",
            "@typescript-eslint/ban-ts-comment": "off",
            "func-style": ["error", "declaration", {
                allowArrowFunctions: false
            }],
            "curly": "error",
            "@typescript-eslint/switch-exhaustiveness-check": ["error", {
                requireDefaultForNonUnion: true,
                considerDefaultExhaustiveForUnions: true
            }],

            // do not allow ignoring the return value of a function
            // https://sonarsource.github.io/rspec/#/rspec/S2201/javascript
            "sonarjs/no-ignored-return": "error",
            "no-console": ["error", {
                allow: ["clear"]
            }],
            "@typescript-eslint/no-this-alias": "off",
            "no-param-reassign": "error",

            // probably should stay off
            "@typescript-eslint/restrict-template-expressions": "off",
            "no-control-regex": "off",

            // custom:

            "no-restricted-syntax": ["error", {
                "selector": "TSQualifiedName[left.name='React']",
                "message": "Import React types instead of using the React namespace."
            }]
        },
    },
    // client-side (browser) code - the core source code of the library
    {
        files: [
            "src/**/*.{ts,tsx,js}"
        ],
        languageOptions: {
            globals: globals.browser
        }
    },

    // build compat tests
    {
        files: [
            "tests/types/react-19_0/**/*.{ts,tsx,js}"
        ],
        languageOptions: {
            globals: globals.node
        },
        rules: {
            "no-console": "off",
            "@typescript-eslint/no-explicit-any": "off",
            "@typescript-eslint/no-unsafe-assignment": "off",
            "@typescript-eslint/no-unsafe-member-access": "off",
            "@typescript-eslint/no-unsafe-call": "off",
            "@typescript-eslint/no-unused-vars": "off"
        }
    },
    // config files and scripts
    {
        files: [
            "vite.config.ts",
            "eslint.config.ts",
            "scripts/**/*.{ts,js}"
        ],
        languageOptions: {
            globals: globals.node
        },
        rules: {
            "no-console": "off"
        }
    }
);
