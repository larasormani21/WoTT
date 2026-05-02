<template>
  <button :disabled="disabled" @click="$emit('click')" :class="buttonClasses">
    <slot />
  </button>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  tone: 'neutral' | 'success' | 'primary'
  disabled?: boolean
}>()

defineEmits(['click'])

const buttonClasses = computed(() => {
  const base = 'flex items-center gap-2 px-4 py-2 rounded-lg text-white disabled:opacity-50 hover:brightness-90 transition-colors'

  switch (props.tone) {
    case 'neutral': return `${base} bg-gray-900`
    case 'success': return `${base} bg-green-600`
    default:        return `${base} bg-blue-600`
  }
})
</script>
