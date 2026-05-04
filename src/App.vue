<script setup lang="ts">
import { useHead } from '@unhead/vue'

useHead({
  titleTemplate: (title) => (title ? `${title} — thread-base` : 'thread-base'),
})
</script>

<template>
  <RouterView />
</template>
