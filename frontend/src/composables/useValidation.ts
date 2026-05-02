import { ref } from 'vue'
import { validateThingDescription } from '../api/tdApi'
import { useMonacoEditor } from './useMonacoEditor'
import type { TDValidationError, ValidationState } from '../types/thingDescription'
import type { ValidateOutcome } from '../types/api'

export function useValidation() {
  const validationState = ref<ValidationState>('idle')
  const validationErrors = ref<TDValidationError[]>([])
  const { applyMarkers, clearMarkers } = useMonacoEditor()

  async function validate(editorContent: string, isEmpty: boolean): Promise<ValidateOutcome> {
    validationState.value = 'idle'
    validationErrors.value = []
    clearMarkers()

    if (isEmpty) {
      return 'skipped-empty'
    }

    const result = await validateThingDescription(editorContent)

    switch (result.kind) {
      case 'valid':
        validationState.value = 'valid'
        return 'valid'
      case 'invalid':
        validationState.value = 'invalid'
        validationErrors.value = result.errors
        applyMarkers(result.errors)
        return 'invalid'
      case 'error':
        return 'request-error'
    }
  }

  function reset() {
    validationState.value = 'idle'
    validationErrors.value = []
    clearMarkers()
  }

  return { validationState, validationErrors, validate, reset }
}
