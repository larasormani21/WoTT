import type { ValidateResult, GenerateResult } from '../types/api'
import type { TDValidationError } from '../types/thingDescription'

async function postJson(url: string, body: string): Promise<Response> {
  return fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body,
  })
}

export async function validateThingDescription(editorContent: string): Promise<ValidateResult> {
  try {
    const response = await postJson('/api/td/validate', editorContent)
    const responseBody = await response.json().catch(() => ({})) as {
      valid?: boolean
      errors?: TDValidationError[]
      error?: string
    }

    if (!response.ok) {
      return { kind: 'error', message: responseBody.error ?? `Server error: ${response.status}` }
    }

    if (responseBody.valid) {
      return { kind: 'valid' }
    }

    return { kind: 'invalid', errors: responseBody.errors ?? [] }
  } catch (fetchError) {
    const message = fetchError instanceof Error ? fetchError.message : 'Unknown error'
    return { kind: 'error', message }
  }
}

export async function generateTestSuite(editorContent: string, language: string): Promise<GenerateResult> {
  try {
    const response = await postJson(`/api/td/generate?language=${encodeURIComponent(language)}`, editorContent)

    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({})) as {
        error?: string
        errors?: TDValidationError[]
      }
      if (response.status === 400 && Array.isArray(errorBody.errors)) {
        return {
          kind: 'invalid-td',
          errors: errorBody.errors,
          message: errorBody.error ?? 'Invalid Thing Description',
        }
      }
      return { kind: 'error', message: errorBody.error ?? `Server error: ${response.status}` }
    }

    const code = await response.text()
    return { kind: 'success', code }
  } catch (fetchError) {
    const message = fetchError instanceof Error ? fetchError.message : 'Unknown error'
    return { kind: 'error', message }
  }
}
