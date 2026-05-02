export function extensionFor(language: string): string {
  if (language === 'javascript') return '.js'
  if (language === 'java') return '.java'
  if (language === 'python') return '.py'
  return '.txt'
}


export function downloadTestSuite(code: string, language: string): void {
  const blob = new Blob([code], { type: 'text/plain' })
  const objectUrl = URL.createObjectURL(blob)

  const anchor = document.createElement('a')
  anchor.href = objectUrl
  anchor.download = `test-suite${extensionFor(language)}`
  anchor.click()

  URL.revokeObjectURL(objectUrl)
}
