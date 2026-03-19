import securityPlugin from 'eslint-plugin-security'
import js from '@eslint/js'

//Default eslint config for code analysis
export default [
    {
        files: ["**/*.js", "**/*.mjs", "**/*.cjs"],
        languageOptions: {
            ecmaVersion: "latest",
            sourceType: "module",
            // C'est ici que ça se passe :
            globals: {
                // For code element like - URLSearchParams, window, document, etc.
                browser: true, 
                // For code element like - require, process, __dirname, etc.
                node: true,    
                // For code element like - Map, Set, etc.
                es2021: true   
            }
        },
        rules: {
            "no-undef": "error",
            // tes autres règles...
        }
    }
]