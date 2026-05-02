<template>
  <div class="flex gap-3">

    <PrimaryButton tone="neutral" @click="$emit('load')">
      Upload Thing Description
    </PrimaryButton>

    <div class="flex items-center gap-2 text-sm text-gray-600">
      <span>Language:</span>

      <select id="language-select" :value="language"
        @change="(changeEvent) => $emit('update:language', (changeEvent.target as HTMLSelectElement).value)"
        class="px-3 py-2 border rounded-lg bg-white shadow-sm focus:ring-2 focus:ring-green-500">
        <option disabled value="">
          Select language...
        </option>
        <option value="javascript">JavaScript</option>
      </select>
    </div>

    <PrimaryButton tone="success" :disabled="!canGenerate" @click="$emit('validate')">
      Validate
    </PrimaryButton>

    <PrimaryButton tone="primary" :disabled="!canGenerate" @click="$emit('generate')">
      Generate
    </PrimaryButton>

  </div>
</template>

<script setup lang="ts">
import PrimaryButton from './ui/PrimaryButton.vue'

defineProps<{
  canGenerate: boolean
  language: string
}>()

defineEmits(['load', 'generate', 'validate', 'update:language'])
</script>
