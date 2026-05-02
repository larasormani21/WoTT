<template>
  <div class="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">

    <div class="flex items-center justify-between px-4 py-2 border-b border-gray-100 bg-gray-50">
      <span class="text-sm text-gray-600">
        {{ title }}
      </span>

      <div class="flex gap-2">
        <StatusPill v-for="badge in badges" :key="badge" :label="badge" />
      </div>
    </div>

    <MonacoEditor
      :value="modelValue"
      @update:value="emit('update:modelValue', $event)"
      :language="language"
      theme="vs-dark"
      height="500px"
      :options="editorOptions"
      @mount="handleEditorMount"
    />
  </div>
</template>

<script setup lang="ts">
import MonacoEditor from '@guolao/vue-monaco-editor'
import { useMonaco } from '@guolao/vue-monaco-editor'
import StatusPill from './ui/StatusPill.vue'
import type { editor } from 'monaco-editor'
import { useMonacoEditor } from '../composables/useMonacoEditor'

const props = defineProps<{
  modelValue: string
  title: string
  language: string
  badges: string[]
  registerEditor?: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const { monacoRef } = useMonaco()
const { register } = useMonacoEditor()

const editorOptions = {
  minimap: { enabled: false },
  fontSize: 14,
  automaticLayout: true
}

const handleEditorMount = (editorInstance: editor.IStandaloneCodeEditor) => {
  window.monacoEditor = editorInstance
  if (props.registerEditor) {
    register(editorInstance, monacoRef.value)
  }
}
</script>
