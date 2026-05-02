export type TDValidationError = {
  instancePath: string
  message?: string
  keyword: string
  params?: {
    missingProperty?: string
    [key: string]: unknown
  }
}

export type ValidationState = 'idle' | 'valid' | 'invalid'
