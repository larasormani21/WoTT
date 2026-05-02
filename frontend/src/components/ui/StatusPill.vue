<template>
  <span class="text-xs px-2 py-1 rounded bg-gray-200 text-gray-700 uppercase">{{ label }}</span>
</template>

<script setup lang="ts">
defineProps<{
  label: string
}>()
</script>
