<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import api from '@/api/api';
import { setCookie } from '../utils/util';

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
const editingUser = ref<any>(null);
const editUser = reactive({
  id: '',
  name: '',
  email: ''
});
const error = ref<string | object | null>(null);

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
  error.value = null; // Clear previous errors
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
  error.value = null; // Clear previous errors
  try {
    const res = await api.post('/users', newUser);
    users.value.push(res.data.user);
    newUser.name = '';
    newUser.email = '';
    newUser.password = '';
  } catch (err: any) {
    console.error(err);
    // Handle validation errors (object) or general errors (string)
    if (err.response?.data?.errors && typeof err.response.data.errors === 'object') {
      error.value = err.response.data.errors;
    } else {
      error.value = err.response?.data?.message || t('error.createUser');
    }
  }
}

function startEdit(user: any) {
  editingUser.value = user;
  editUser.id = user.id;
  editUser.name = user.name;
  editUser.email = user.email;
  error.value = null;
}

function cancelEdit() {
  editingUser.value = null;
  editUser.id = '';
  editUser.name = '';
  editUser.email = '';
  error.value = null;
}

async function updateUser() {
  error.value = null;
  try {
    await api.put(`/users/${editUser.id}`, {
      name: editUser.name,
      email: editUser.email
    });
    
    // Update the user in the list
    const userIndex = users.value.findIndex(u => u.id === editUser.id);
    if (userIndex !== -1) {
      users.value[userIndex] = { ...users.value[userIndex], name: editUser.name, email: editUser.email };
    }
    
    cancelEdit();
  } catch (err: any) {
    console.error(err);
    if (err.response?.data?.errors && typeof err.response.data.errors === 'object') {
      error.value = err.response.data.errors;
    } else {
      error.value = err.response?.data?.message || t('error.updateUser');
    }
  }
}

async function deleteUser(id: string) {
  try {
    await api.delete(`/users/${id}`);
    users.value = users.value.filter(u => u.id !== id);
    error.value = null;
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
  <div class="flex flex-col items-center justify-start min-h-screen font-sans p-8">
    <h1 class="text-4xl font-bold mb-4">{{ $t('title.welcome') }}</h1>
    <p class="mb-6">{{ message }}</p>

    <button 
      @click="toggleLang"
      class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors mb-8"
    >
      {{ $t('button.switchLang') }}
    </button>

    <section class="w-full max-w-2xl mt-8">
      <h2 class="text-2xl font-semibold mb-4 text-center">{{ $t('title.manageUsers') }}</h2>

      <!-- Create User Form -->
      <div v-if="!editingUser" class="flex flex-col gap-2 mb-4 p-4 bg-white border rounded-lg shadow-sm">
        <h3 class="text-lg font-medium mb-2">{{ $t('form.createUser', 'Create New User') }}</h3>
        <input 
          v-model="newUser.name" 
          :placeholder="$t('form.name')" 
          class="px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <input 
          v-model="newUser.email" 
          :placeholder="$t('form.email')" 
          class="px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <input 
          v-model="newUser.password" 
          :placeholder="$t('form.password')" 
          type="password"
          class="px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button 
          @click="createUser"
          class="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
        >
          {{ $t('button.createUser') }}
        </button>
      </div>

      <!-- Edit User Form -->
      <div v-if="editingUser" class="flex flex-col gap-2 mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h3 class="text-lg font-medium mb-2 text-blue-800">{{ $t('form.editUser', 'Edit User') }}</h3>
        <input 
          v-model="editUser.name" 
          :placeholder="$t('form.name')" 
          class="px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <input 
          v-model="editUser.email" 
          :placeholder="$t('form.email')" 
          class="px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <div class="flex gap-2">
          <button 
            @click="updateUser"
            class="flex-1 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          >
            {{ $t('button.updateUser', 'Update User') }}
          </button>
          <button 
            @click="cancelEdit"
            class="flex-1 px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
          >
            {{ $t('button.cancel', 'Cancel') }}
          </button>
        </div>
      </div>

      <div v-if="loading" class="text-center text-gray-600 mb-4">
        {{ $t('message.loadingUsers') }}
      </div>
      
      <!-- Error Display -->
      <div v-if="error" class="mb-4">
        <!-- Single string error -->
        <div v-if="typeof error === 'string'" class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-center">
          {{ error }}
        </div>
        <!-- Object with validation errors -->
        <div v-else-if="typeof error === 'object'" class="bg-red-50 border border-red-200 rounded-md p-4">
          <h3 class="text-red-800 font-medium mb-2 text-sm">{{ $t('error.validationTitle', 'Please fix the following errors:') }}</h3>
          <ul class="space-y-1">
            <li v-for="(message, field) in error" :key="field" class="text-red-700 text-sm flex items-start">
              <span class="text-red-500 mr-2">•</span>
              <span><strong class="capitalize">{{ field }}:</strong> {{ message }}</span>
            </li>
          </ul>
        </div>
      </div>

      <!-- Users List -->
      <div v-if="users.length" class="space-y-2">
        <h3 class="text-lg font-medium mb-3">{{ $t('title.usersList', 'Users List') }}</h3>
        <div v-for="user in users" :key="user.id" class="flex justify-between items-center p-3 bg-gray-50 rounded-lg border">
          <div class="flex-1">
            <span class="font-medium">{{ user.name }}</span>
            <span class="text-gray-600 ml-2">({{ user.email }})</span>
          </div>
          <div class="flex gap-2">
            <button 
              @click="startEdit(user)"
              :disabled="editingUser !== null"
              class="px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {{ $t('button.edit', 'Edit') }}
            </button>
            <button 
              @click="deleteUser(user.id)"
              :disabled="editingUser !== null"
              class="px-3 py-1 bg-red-500 text-white text-sm rounded hover:bg-red-600 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {{ $t('button.delete') }}
            </button>
          </div>
        </div>
      </div>

      <p v-else-if="!loading" class="text-center text-gray-500 py-8">{{ $t('message.noUsers') }}</p>
    </section>

    <p class="mt-8 text-center">
      {{ $t('message.visitDocs') }}
      <a 
        href="https://vuejs.org/" 
        target="_blank" 
        rel="noopener"
        class="text-blue-500 hover:text-blue-700 underline"
      >
        vuejs.org
      </a>
    </p>
  </div>
</template>

<style scoped>
/* Minimal CSS - most styling handled by Tailwind */
</style>