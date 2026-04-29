// @ts-check
const path = require("path");
const tseslint = require("typescript-eslint");

module.exports = tseslint.config(
    {
        ignores: ["dist/", "node_modules/", "config/", "samples/"],
    },
    ...tseslint.configs.recommended,
    {
        files: ["src/**/*.ts"],
        languageOptions: {
            parser: tseslint.parser,
            parserOptions: {
                project: path.resolve(__dirname, "../tsconfig.json"),
            },
        },
        rules: {
            "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
            "@typescript-eslint/explicit-member-accessibility": ["error", {
                overrides: { constructors: "no-public" },
            }],
            "@typescript-eslint/no-explicit-any": "warn",
            "no-console": "warn",
            eqeqeq: ["error", "always"],
        },
    },
    {
        files: ["src/generated/**/*.ts"],
        rules: {
            "@typescript-eslint/no-unused-vars": "off",
            "@typescript-eslint/explicit-member-accessibility": "off",
            "@typescript-eslint/no-explicit-any": "off",
        },
    },
);
