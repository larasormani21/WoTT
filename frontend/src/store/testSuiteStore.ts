import { ref } from 'vue'

export const generatedCode = ref<string | null>(null)
export const selectedLanguage = ref('javascript')
export const actionsWithMissingBindings = ref<boolean>(false)
