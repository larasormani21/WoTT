import { ref } from 'vue'
import type { Ref } from 'vue'
import { useRouter } from 'vue-router'
import { generateTestSuite } from '../api/tdApi'
import { useMonacoEditor } from './useMonacoEditor'
import { hasActionsWithMissingBindings } from '../utils/hasActionsWithMissingBindings'
import { generatedCode, actionsWithMissingBindings } from '../store/testSuiteStore'
import type { TDValidationError } from '../types/thingDescription'
import type { ValidateOutcome } from '../types/api'

export function useTestSuiteGeneration(deps: {
  validate: (editorContent: string, isEmpty: boolean) => Promise<ValidateOutcome>
  validationErrors: Ref<TDValidationError[]>
}) {
  const isGenerating = ref(false)
  const errorMessage = ref('')
  const router = useRouter()
  const { applyMarkers } = useMonacoEditor()

  async function generate(editorContent: string, isEmpty: boolean, language: string) {
    isGenerating.value = true
    errorMessage.value = ''
    generatedCode.value = null

    const validationOutcome = await deps.validate(editorContent, isEmpty)

    if (validationOutcome === 'skipped-empty') {
      errorMessage.value = 'No Thing Description to validate'
      isGenerating.value = false
      return
    }

    if (validationOutcome === 'invalid' || validationOutcome === 'request-error') {
      if (validationOutcome === 'request-error') {
        errorMessage.value = 'Validation request failed'
      }
      isGenerating.value = false
      return
    }

    const result = await generateTestSuite(editorContent, language)

    switch (result.kind) {
      case 'success':
        generatedCode.value = result.code
        actionsWithMissingBindings.value = hasActionsWithMissingBindings(JSON.parse(editorContent))
        router.push('/test-suite')
        break
      case 'invalid-td':
        deps.validationErrors.value = result.errors
        applyMarkers(result.errors)
        errorMessage.value = result.message
        break
      case 'error':
        errorMessage.value = result.message
        break
    }

    isGenerating.value = false
  }

  return { isGenerating, errorMessage, generate }
}
