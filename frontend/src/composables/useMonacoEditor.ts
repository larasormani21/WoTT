import { shallowRef } from 'vue'
import type { editor } from 'monaco-editor'
import type { TDValidationError } from '../types/thingDescription'
import { formatValidationError } from '../utils/formatValidationError'

const registeredEditorInstance = shallowRef<editor.IStandaloneCodeEditor | null>(null)
const registeredMonacoNamespace = shallowRef<typeof import('monaco-editor') | null>(null)

const MARKER_OWNER = 'td-validation'

function findLineForPath(model: editor.ITextModel, instancePath: string): number {
  if (!instancePath) return 1
  const fieldName = instancePath.split('/').pop()
  if (!fieldName) return 1
  const lines = model.getLinesContent()
  const index = lines.findIndex((line: string) => line.includes(`"${fieldName}"`))
  return index >= 0 ? index + 1 : 1
}

export function useMonacoEditor() {
  function register(
    editorInstance: editor.IStandaloneCodeEditor,
    monacoNamespace: typeof import('monaco-editor') | null
  ) {
    registeredEditorInstance.value = editorInstance
    if (monacoNamespace) registeredMonacoNamespace.value = monacoNamespace
  }

  function applyMarkers(errors: TDValidationError[]) {
    const monaco = registeredMonacoNamespace.value
    const editorInstance = registeredEditorInstance.value
    if (!monaco || !editorInstance) return

    const model = editorInstance.getModel()
    if (!model) return

    monaco.editor.setModelMarkers(
      model,
      MARKER_OWNER,
      errors.map(validationError => ({
        startLineNumber: findLineForPath(model, validationError.instancePath),
        endLineNumber: findLineForPath(model, validationError.instancePath),
        startColumn: 1,
        endColumn: 1,
        message: formatValidationError(validationError),
        severity: monaco.MarkerSeverity.Error,
      }))
    )
  }

  function clearMarkers() {
    const monaco = registeredMonacoNamespace.value
    const editorInstance = registeredEditorInstance.value
    if (!monaco || !editorInstance) return

    const model = editorInstance.getModel()
    if (!model) return

    monaco.editor.setModelMarkers(model, MARKER_OWNER, [])
  }

  return { register, applyMarkers, clearMarkers }
}
