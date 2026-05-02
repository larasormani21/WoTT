export function isFileJsonOrJsonLd(fileName: string): boolean {
  return fileName.endsWith('.json') || fileName.endsWith('.jsonld')
}
