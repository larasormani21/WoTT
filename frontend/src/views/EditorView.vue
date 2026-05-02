<template>
  <div class="px-6 py-4 space-y-5">

    <EditorToolbar :canGenerate="isParseableThingDescription && !isGenerating" :language="selectedLanguage"
      @update:language="newLanguage => selectedLanguage = newLanguage" @load="openFilePicker" @validate="runValidation"
      @generate="runGenerate" />
    <AlertBox v-if="errorMessage" tone="error">{{ errorMessage }}</AlertBox>
    <ValidationStatus :state="validationState" :errors="validationErrors" />
    <CodeEditorPanel v-model="editorContent" title="Thing Description Editor"
      language="json" :badges="['JSON', 'JSON-LD']" register-editor
      @update:modelValue="onEditorChange" />
    <EditorStatusBar :charCount="characterCount" />
    <ValidationErrors :errors="validationErrors" />
    <input type="file" ref="fileInputRef" class="hidden" accept=".json,.jsonld" @change="handleFileUpload" />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useThingDescriptionEditor } from '../composables/useThingDescriptionEditor'
import { useFileUpload } from '../composables/useFileUpload'
import { useValidation } from '../composables/useValidation'
import { useTestSuiteGeneration } from '../composables/useTestSuiteGeneration'
import { isFileJsonOrJsonLd } from '../utils/isFileJsonOrJsonLd'
import { selectedLanguage } from '../store/testSuiteStore'
import EditorToolbar from '../components/EditorToolbar.vue'
import CodeEditorPanel from '../components/CodeEditorPanel.vue'
import EditorStatusBar from '../components/EditorStatusBar.vue'
import ValidationStatus from '../components/ValidationStatus.vue'
import ValidationErrors from '../components/ValidationErrors.vue'
import AlertBox from '../components/ui/AlertBox.vue'

const fileInputRef = ref<HTMLInputElement | null>(null)
const { editorContent, isEditorEmpty, characterCount, isParseableThingDescription } = useThingDescriptionEditor()
const { openFilePicker, handleFileUpload } = useFileUpload({
  fileInputRef,
  isAccepted: isFileJsonOrJsonLd,
  onLoad: (text) => { editorContent.value = text },
  onReject: (reason) => { errorMessage.value = reason },
})
const { validationState, validationErrors, validate, reset } = useValidation()
const { isGenerating, errorMessage, generate } = useTestSuiteGeneration({ validate, validationErrors })

async function runValidation() {
  if (isEditorEmpty.value) {
    errorMessage.value = 'No Thing Description to validate'
    return
  }
  await validate(editorContent.value, isEditorEmpty.value)
}

async function runGenerate() {
  await generate(editorContent.value, isEditorEmpty.value, selectedLanguage.value)
}

function onEditorChange(value: string) {
  editorContent.value = value
  errorMessage.value = ''
  reset()
}
</script>
