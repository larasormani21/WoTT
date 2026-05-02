<template>
  <div v-if="errors.length"
       class="mt-3 bg-red-50 border border-red-200 rounded-lg p-3">

    <div class="text-sm font-semibold text-red-700 mb-2">
      Validation errors:
    </div>

    <ul class="text-sm text-red-600 space-y-1">
      <li v-for="(validationError, i) in errors" :key="i">
        • {{ formatValidationError(validationError) }}
      </li>
    </ul>

  </div>
</template>

<script setup lang="ts">
import type { TDValidationError } from '../types/thingDescription'
import { formatValidationError } from '../utils/formatValidationError'

defineProps<{
  errors: TDValidationError[]
}>()
</script>
