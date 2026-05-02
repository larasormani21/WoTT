import { describe, it, expect } from 'vitest'
import { isFileJsonOrJsonLd } from '../src/utils/isFileJsonOrJsonLd'

describe('isFileJsonOrJsonLd', () => {
  it('accepts .json files', () => {
    expect(isFileJsonOrJsonLd('file.json')).toBe(true)
  })

  it('accepts .jsonld files', () => {
    expect(isFileJsonOrJsonLd('file.jsonld')).toBe(true)
  })

  it('rejects invalid formats', () => {
    expect(isFileJsonOrJsonLd('file.txt')).toBe(false)
    expect(isFileJsonOrJsonLd('file.xml')).toBe(false)
  })
})
