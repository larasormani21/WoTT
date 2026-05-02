<template>
  <div class="flex justify-between items-center text-xs text-gray-400 px-1">
    <span>{{ charCount }} chars</span>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  charCount: number
}>()
</script>