<template>
  <div class="p-6 text-center">
    <button
      @click="count++"
      class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
    >
      Clicked {{ count }} times
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';

const count = ref(0);
</script>