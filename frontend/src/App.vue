<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import api from '@/api/api';
import { setCookie } from './utils/util';

const { t, locale } = useI18n();

// State
const message = ref(t('message.loading'));
const users = ref<any[]>([]);
const loading = ref(false);
const newUser = reactive({
  name: '',
  email: '',
  password: ''
});
const error = ref<string | null>(null);

onMounted(async () => {
  try {
    const res = await api.get('');
    message.value = res.data.message || t('message.failedFetch');
    await fetchUsers();
  } catch (err) {
    message.value = t('message.failedFetch');
    console.error(err);
  }
});

async function fetchUsers() {
  loading.value = true;
  try {
    const res = await api.get('/users');
    users.value = res.data || [];
  } catch (err) {
    console.error(err);
    error.value = t('error.fetchUsers');
  } finally {
    loading.value = false;
  }
}

async function createUser() {
  try {
    const res = await api.post('/users', newUser);
    users.value.push(res.data.user);
    newUser.name = '';
    newUser.email = '';
    newUser.password = '';
  } catch (err: any) {
    console.error(err);
    error.value = err.response?.data?.errors || t('error.createUser');
  }
}

async function deleteUser(id: string) {
  try {
    await api.delete(`/users/${id}`);
    users.value = users.value.filter(u => u.id !== id);
  } catch (err) {
    console.error(err);
    error.value = t('error.deleteUser');
  }
}

function toggleLang() {
  const newLang = locale.value === 'en' ? 'fr' : 'en';
  locale.value = newLang;
  setCookie('_lang', newLang, 43200);
}

</script>

<template>
  <div class="welcome-screen">
    <h1>{{ $t('title.welcome') }}</h1>
    <p>{{ message }}</p>

    <button @click="toggleLang">
      {{ $t('button.switchLang') }}
    </button>

    <section class="user-management">
      <h2>{{ $t('title.manageUsers') }}</h2>

      <div class="user-form">
        <input v-model="newUser.name" :placeholder="$t('form.name')" />
        <input v-model="newUser.email" :placeholder="$t('form.email')" />
        <input v-model="newUser.password" :placeholder="$t('form.password')" type="password" />
        <button @click="createUser">{{ $t('button.createUser') }}</button>
      </div>

      <div v-if="loading">{{ $t('message.loadingUsers') }}</div>
      <div v-if="error" class="error">{{ error }}</div>

      <ul v-if="users.length">
        <li v-for="user in users" :key="user.id">
          {{ user.name }} ({{ user.email }})
          <button @click="deleteUser(user.id)">{{ $t('button.delete') }}</button>
        </li>
      </ul>

      <p v-else>{{ $t('message.noUsers') }}</p>
    </section>

    <p>
      {{ $t('message.visitDocs') }}
      <a href="https://vuejs.org/" target="_blank" rel="noopener">vuejs.org</a>
    </p>
  </div>
</template>


<style scoped>
.welcome-screen {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: start;
  height: auto;
  font-family: sans-serif;
  padding: 2rem;
}

h1 {
  font-size: 2.5rem;
  margin-bottom: 1rem;
}

.user-management {
  margin-top: 2rem;
  width: 100%;
  max-width: 400px;
}

.user-form {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.user-form input {
  padding: 0.5rem;
  font-size: 1rem;
}

.user-form button {
  padding: 0.5rem;
  font-size: 1rem;
  cursor: pointer;
}

ul {
  list-style: none;
  padding: 0;
}

li {
  display: flex;
  justify-content: space-between;
  margin: 0.5rem 0;
}

.error {
  color: red;
  margin-bottom: 1rem;
}
</style>
