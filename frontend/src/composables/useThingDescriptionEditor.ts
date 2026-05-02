import { ref, computed } from 'vue'

const EDITOR_PLACEHOLDER = `{
  "title": "Upload or write a Thing Description to start"
}`

export function useThingDescriptionEditor() {
  const editorContent = ref(EDITOR_PLACEHOLDER)

  const isEditorEmpty = computed(() => {
    const trimmed = editorContent.value.trim()
    return !trimmed || trimmed === EDITOR_PLACEHOLDER
  })

  const characterCount = computed(() => editorContent.value.length)

  const isParseableThingDescription = computed(() => {
    if (isEditorEmpty.value) return false
    try {
      const parsed = JSON.parse(editorContent.value)
      return typeof parsed === 'object' && parsed !== null && typeof parsed.title === 'string'
    } catch {
      return false
    }
  })

  return { editorContent, isEditorEmpty, characterCount, isParseableThingDescription }
}
