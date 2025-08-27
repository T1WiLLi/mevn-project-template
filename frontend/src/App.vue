<script setup lang="ts">
import { ref, onMounted } from 'vue';
import axios from 'axios';

const message = ref('Loading...');

onMounted(async () => {
  try {
    const res = await axios.get('api/');
    message.value = res.data.message;
  } catch (err) {
    message.value = 'Failed to fetch message';
    console.error(err);
  }
});
</script>

<template>
  <div class="welcome-screen">
    <h1>Welcome!</h1>
    <p>{{ message }}</p>
    <p>
      Visit
      <a href="https://vuejs.org/" target="_blank" rel="noopener">vuejs.org</a>
      to read the documentation
    </p>
  </div>
</template>

<style scoped>
.welcome-screen {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 80vh;
  font-family: sans-serif;
}

h1 {
  font-size: 2.5rem;
  margin-bottom: 1rem;
}

p {
  font-size: 1.2rem;
  text-align: center;
}
</style>