import securityPlugin from 'eslint-plugin-security'
import js from '@eslint/js'

//Default eslint config for code analysis
export default [
  js.configs.recommended,
  securityPlugin.configs.recommended,
  {
    files: ["**/*.js", "**/*.mjs", "**/*.cjs"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals:{
        browser: true,
        node: true,
        es2021: true
      }
    },
    rules: {}
  }
]