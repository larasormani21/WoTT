export const APP_URL = 'http://localhost:5173'
export const TIMEOUT_MS = 5000

// Mutable singleton — hooks assign `browser.driver`, step files read it.
export const browser = { driver: null }

export async function getEditorContent() {
  return await browser.driver.executeScript(
    'return window.monacoEditor && window.monacoEditor.getValue();'
  )
}
