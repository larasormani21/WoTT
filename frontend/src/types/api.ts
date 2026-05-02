import type { TDValidationError } from './thingDescription'

export type ValidateResult =
  | { kind: 'valid' }
  | { kind: 'invalid'; errors: TDValidationError[] }
  | { kind: 'error'; message: string }

export type GenerateResult =
  | { kind: 'success'; code: string }
  | { kind: 'invalid-td'; errors: TDValidationError[]; message: string }
  | { kind: 'error'; message: string }

export type ValidateOutcome = 'valid' | 'invalid' | 'request-error' | 'skipped-empty'
