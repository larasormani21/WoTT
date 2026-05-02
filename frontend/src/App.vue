<template>
  <div class="min-h-screen bg-gray-50 flex justify-center">
    <div class="w-full max-w-6xl">
      <Header />
      <router-view />
    </div>
  </div>
</template>

<script setup lang="ts">
import Header from './components/AppHeader.vue'
</script>
