<script setup lang="ts">
import CodeEditorPanel from '../components/CodeEditorPanel.vue'
import AlertBox from '../components/ui/AlertBox.vue'
import PrimaryButton from '../components/ui/PrimaryButton.vue'
import { generatedCode, selectedLanguage, actionsWithMissingBindings } from '../store/testSuiteStore'
import { downloadTestSuite } from '../utils/testSuiteDownload'

const onDownload = () => {
  downloadTestSuite(generatedCode.value ?? '', selectedLanguage.value)
}
</script>

<template>
  <div class="px-6 py-4 space-y-5">
    <div class="flex items-center justify-between">
      <h2 class="text-lg font-semibold text-gray-800">
        Test Suite Editor
      </h2>

      <PrimaryButton tone="primary" :disabled="!generatedCode" @click="onDownload">
        <svg class="w-4 h-4" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
            d="M12 13V4m0 9-4-4m4 4 4-4M1 16v3a2 2 0 0 0 2 2h18a2 2 0 0 0 2-2v-3" />
        </svg>
        Download
      </PrimaryButton>
    </div>

    <AlertBox v-if="actionsWithMissingBindings" tone="warning" class="flex items-start gap-2">
      <svg class="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
          d="M10 11h2v5m-2 0h4m-2.592-8.5h.01M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
      </svg>
      <span>
        Some actions are missing an HTTP method. The generated test suite may be incomplete. Please verify that all
        actions include proper bindings.
      </span>
    </AlertBox>

    <CodeEditorPanel
      :modelValue="generatedCode ?? ''"
      title="Test Suite Editor"
      :language="selectedLanguage"
      :badges="[selectedLanguage]"
      @update:modelValue="generatedCode = $event"
    />

  </div>
</template>
