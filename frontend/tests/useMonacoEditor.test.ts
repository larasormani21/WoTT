import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useMonacoEditor } from '../src/composables/useMonacoEditor'
import type { editor } from 'monaco-editor'

function buildMockMonaco(overrides?: Partial<typeof import('monaco-editor')['editor']>) {
  return {
    MarkerSeverity: { Error: 8 },
    editor: {
      setModelMarkers: vi.fn(),
      ...overrides
    }
  } as unknown as typeof import('monaco-editor')
}

function buildMockEditorWithModel(modelLines: string[]) {
  const model = { getLinesContent: vi.fn().mockReturnValue(modelLines) }
  return {
    getModel: vi.fn().mockReturnValue(model),
    _model: model
  } as unknown as editor.IStandaloneCodeEditor & { _model: { getLinesContent: ReturnType<typeof vi.fn> } }
}

function buildMockEditorWithoutModel() {
  return { getModel: vi.fn().mockReturnValue(null) } as unknown as editor.IStandaloneCodeEditor
}

describe('useMonacoEditor', () => {
  describe('clearMarkers', () => {
    it('clears markers when monaco and editor are available', () => {
      const { register, clearMarkers } = useMonacoEditor()
      const mockMonaco = buildMockMonaco()
      const mockEditor = buildMockEditorWithModel(['line1'])
      register(mockEditor, mockMonaco)

      clearMarkers()

      expect((mockMonaco.editor as { setModelMarkers: ReturnType<typeof vi.fn> }).setModelMarkers)
        .toHaveBeenCalledWith(expect.anything(), 'td-validation', [])
    })

    it('does nothing if model is not available', () => {
      const { register, clearMarkers } = useMonacoEditor()
      const mockMonaco = buildMockMonaco()
      const mockEditor = buildMockEditorWithoutModel()
      register(mockEditor, mockMonaco)

      clearMarkers()

      expect((mockMonaco.editor as { setModelMarkers: ReturnType<typeof vi.fn> }).setModelMarkers)
        .not.toHaveBeenCalled()
    })
  })

  describe('applyMarkers', () => {
    const editorLines = [
      '{"title": "Test TD"}',
      '{"properties": {',
      '  "temperature": {',
      '    "type": "number"',
      '  }',
      '}}'
    ]

    beforeEach(() => {
      vi.clearAllMocks()
    })

    it('sets markers for each validation error', () => {
      const { register, applyMarkers } = useMonacoEditor()
      const mockMonaco = buildMockMonaco()
      const mockEditor = buildMockEditorWithModel(editorLines)
      register(mockEditor, mockMonaco)

      applyMarkers([
        { instancePath: '/properties/temperature', keyword: 'type', message: 'should be number' },
        { instancePath: '/actions/blink', keyword: 'required', params: { missingProperty: 'input' } }
      ])

      expect((mockMonaco.editor as { setModelMarkers: ReturnType<typeof vi.fn> }).setModelMarkers)
        .toHaveBeenCalledWith(expect.anything(), 'td-validation', [
          { startLineNumber: 3, endLineNumber: 3, startColumn: 1, endColumn: 1, message: 'Invalid type at /properties/temperature', severity: 8 },
          { startLineNumber: 1, endLineNumber: 1, startColumn: 1, endColumn: 1, message: 'Missing required field: input', severity: 8 }
        ])
    })

    it('does nothing if model is not available', () => {
      const { register, applyMarkers } = useMonacoEditor()
      const mockMonaco = buildMockMonaco()
      const mockEditor = buildMockEditorWithoutModel()
      register(mockEditor, mockMonaco)

      applyMarkers([])

      expect((mockMonaco.editor as { setModelMarkers: ReturnType<typeof vi.fn> }).setModelMarkers)
        .not.toHaveBeenCalled()
    })
  })
})
