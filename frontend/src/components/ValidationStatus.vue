<template>
  <div v-if="state !== 'idle'" class="flex items-center gap-2 text-sm">

    <AlertBox v-if="state === 'valid'" tone="success" size="chip">
      ✔ Thing Description is valid
    </AlertBox>

    <AlertBox v-if="state === 'invalid'" tone="error" size="chip">
      ✖ Thing Description is invalid ({{ errors.length }} errors)
    </AlertBox>

  </div>
</template>

<script setup lang="ts">
import type { TDValidationError, ValidationState } from '../types/thingDescription'
import AlertBox from './ui/AlertBox.vue'

defineProps<{
  state: ValidationState
  errors: TDValidationError[]
}>()
</script>
