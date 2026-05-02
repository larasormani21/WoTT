import { describe, it, expect } from 'vitest'
import { formatValidationError } from '../src/utils/formatValidationError'
import type { TDValidationError } from '../src/types/thingDescription'

describe('formatValidationError', () => {
  it('formats required keyword error', () => {
    const error: TDValidationError = {
      instancePath: '/properties',
      keyword: 'required',
      params: { missingProperty: 'title' }
    }
    expect(formatValidationError(error)).toBe('Missing required field: title')
  })

  it('formats type keyword error', () => {
    const error: TDValidationError = {
      instancePath: '/properties/temperature',
      keyword: 'type',
      message: 'should be number'
    }
    expect(formatValidationError(error)).toBe('Invalid type at /properties/temperature')
  })

  it('formats type keyword error at root', () => {
    const error: TDValidationError = {
      instancePath: '',
      keyword: 'type',
      message: 'should be object'
    }
    expect(formatValidationError(error)).toBe('Invalid type at root')
  })

  it('formats other keyword errors', () => {
    const error: TDValidationError = {
      instancePath: '/actions/blink',
      keyword: 'additionalProperties',
      message: 'should not have additional properties'
    }
    expect(formatValidationError(error)).toBe('/actions/blink: should not have additional properties')
  })

  it('formats error at root with message', () => {
    const error: TDValidationError = {
      instancePath: '',
      keyword: 'minItems',
      message: 'should have at least 1 item'
    }
    expect(formatValidationError(error)).toBe('root: should have at least 1 item')
  })
})
