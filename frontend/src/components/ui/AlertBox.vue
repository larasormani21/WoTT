<template>
  <div :class="containerClasses">
    <slot />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  tone: 'error' | 'warning' | 'success'
  size?: 'banner' | 'chip'
}>()

const containerClasses = computed(() => {
  const padding = (props.size ?? 'banner') === 'chip' ? 'px-3 py-1' : 'px-4 py-2'
  const base = `border rounded-lg text-sm ${padding}`

  switch (props.tone) {
    case 'error':   return `${base} bg-red-50 border-red-200 text-red-600`
    case 'warning': return `${base} bg-yellow-50 border-yellow-200 text-yellow-800`
    default:        return `${base} bg-green-50 border-green-200 text-green-600`
  }
})
</script>
