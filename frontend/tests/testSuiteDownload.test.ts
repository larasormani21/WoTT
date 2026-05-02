import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { extensionFor, downloadTestSuite } from '../src/utils/testSuiteDownload'

describe('extensionFor', () => {
  it('returns .js for javascript', () => {
    expect(extensionFor('javascript')).toBe('.js')
  })

  it('returns .java for java', () => {
    expect(extensionFor('java')).toBe('.java')
  })

  it('returns .py for python', () => {
    expect(extensionFor('python')).toBe('.py')
  })

  it('returns .txt for unknown language', () => {
    expect(extensionFor('cobol')).toBe('.txt')
  })
})

describe('downloadTestSuite', () => {
  let createdAnchor: HTMLAnchorElement
  const fakeObjectUrl = 'blob:fake-url'

  beforeEach(() => {
    createdAnchor = document.createElement('a')
    vi.spyOn(createdAnchor, 'click').mockImplementation(() => {})

    vi.spyOn(document, 'createElement').mockImplementation((tag: string) => {
      if (tag === 'a') return createdAnchor
      return document.createElement(tag)
    })

    vi.spyOn(URL, 'createObjectURL').mockReturnValue(fakeObjectUrl)
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('sets the correct download filename for javascript', () => {
    downloadTestSuite('const x = 1', 'javascript')
    expect(createdAnchor.download).toBe('test-suite.js')
  })

  it('sets the correct download filename for java', () => {
    downloadTestSuite('public class Test {}', 'java')
    expect(createdAnchor.download).toBe('test-suite.java')
  })

  it('uses the object URL as the anchor href', () => {
    downloadTestSuite('code', 'javascript')
    expect(createdAnchor.href).toContain('fake-url')
  })

  it('clicks the anchor to trigger the download', () => {
    downloadTestSuite('code', 'javascript')
    expect(createdAnchor.click).toHaveBeenCalledOnce()
  })

  it('revokes the object URL after clicking', () => {
    downloadTestSuite('code', 'javascript')
    expect(URL.revokeObjectURL).toHaveBeenCalledWith(fakeObjectUrl)
  })
})
