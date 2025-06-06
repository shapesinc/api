import js from "@eslint/js";
import react from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";
import tseslint from "typescript-eslint";
import importPlugin from "eslint-plugin-import";

import globals from "globals";

export default tseslint.config(
    {
        ignores: ["dist/**/*", "node_modules/**/*", "*.js"],
    },
    {
        files: ["**/*.js"],
        extends: [js.configs.recommended],
        languageOptions: {
            ecmaVersion: "latest",
            sourceType: "module",
            globals: { ...globals.browser, ...globals.node },
        },
    },
    {
        files: ["src/**/*.{ts,tsx}"],
        extends: [js.configs.recommended, ...tseslint.configs.recommended],
        plugins: {
            import: importPlugin,
            react,
            "react-hooks": reactHooks,
        },
        settings: {
            "import/resolver": {
                typescript: {
                    project: ["./tsconfig.{app,node}.json"],
                },
            },
            react: {
                version: "detect",
            },
        },

        languageOptions: {
            ecmaVersion: "latest",
            sourceType: "module",
            globals: { ...globals.browser, ...globals.node },
            parser: tseslint.parser,
            parserOptions: {
                project: ["./tsconfig.{app,node}.json"],
                tsconfigRootDir: ".",
                ecmaFeatures: {
                    jsx: true,
                },
            },
        },
        linterOptions: {
            reportUnusedDisableDirectives: true,
        },
        rules: {
            // TypeScript specific rules
            "@typescript-eslint/no-unused-vars": [
                "error",
                {
                    argsIgnorePattern: "^_",
                    varsIgnorePattern: "^_",
                    caughtErrorsIgnorePattern: "^_",
                },
            ],
            "@typescript-eslint/no-explicit-any": "warn",
            "@typescript-eslint/explicit-function-return-type": "off",
            "@typescript-eslint/explicit-module-boundary-types": "off",
            "@typescript-eslint/no-non-null-assertion": "warn",
            "@typescript-eslint/consistent-type-imports": [
                "error",
                { prefer: "type-imports" },
            ],
            "@typescript-eslint/no-import-type-side-effects": "error",

            // React specific rules
            "react/react-in-jsx-scope": "off", // Not needed with new JSX transform
            "react/prop-types": "off", // Using TypeScript for prop validation

            // React hooks rules
            "react-hooks/rules-of-hooks": "error",
            "react-hooks/exhaustive-deps": "warn",

            // General rules
            "no-console": "off", // Allow console.log in CLI application
            "no-unused-vars": "off", // Using TypeScript version instead
            "no-var": "error",
            "object-shorthand": "error",
            "prefer-const": "error",
            "prefer-template": "error",
        },
    },
    {
        files: ["**/*.config.{js,ts}", "scripts/**/*.{js,ts}"],
        languageOptions: {
            globals: { ...globals.browser, ...globals.node },
        },
    }
);
