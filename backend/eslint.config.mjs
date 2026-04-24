import securityPlugin from 'eslint-plugin-security';
import js from '@eslint/js';
import globals from 'globals';


export default [
    js.configs.recommended,
    {
        files: ["**/*.js", "**/*.mjs", "**/*.cjs"],
        languageOptions: {
            ecmaVersion: "latest",
            sourceType: "module",
            globals: {
                ...globals.browser, // Définit window, document, etc.
                ...globals.node     // Définit process, require, etc.
            }
        },
        plugins: {
            security: securityPlugin
        },
        rules: {
            ...securityPlugin.configs.recommended.rules,
            "no-unused-vars": "warn",
            "no-undef": "error",
            "no-eval": "error",
            "no-implied-eval": "error"
        }
    }
];