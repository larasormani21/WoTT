/// <reference types="vite/client" />

// Exposed for Cucumber/Selenium tests in features/; production code uses
// useMonacoEditor (composables/useMonacoEditor.ts) instead.
declare global {
  interface Window {
    monacoEditor?: import('monaco-editor').editor.IStandaloneCodeEditor
  }
}

export {}
