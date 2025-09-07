<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import api from '@/api/api';
import { setCookie } from './utils/util';

const { t, locale } = useI18n();

// Authentication state
const isLoggedIn = ref(false);
const currentUser = ref<any>(null);
const loginForm = reactive({
  email: '',
  password: ''
});

// App state
const message = ref(t('message.loading'));
const users = ref<any[]>([]);
const loading = ref(false);
const newUser = reactive({
  name: '',
  email: '',
  password: ''
});
const error = ref<string | null>(null);
const loginError = ref<string | null>(null);
const loginLoading = ref(false);

// Computed
const canAccessUsers = computed(() => {
  return currentUser.value?.permissions?.includes('user:read') || 
         currentUser.value?.roles?.includes('admin');
});

const canCreateUsers = computed(() => {
  return currentUser.value?.permissions?.includes('user:create') || 
         currentUser.value?.roles?.includes('admin');
});

const canDeleteUsers = computed(() => {
  return currentUser.value?.permissions?.includes('user:delete') || 
         currentUser.value?.roles?.includes('admin');
});

onMounted(async () => {
  // Check if user is already logged in
  await checkAuthStatus();
  
  if (!isLoggedIn.value) {
    try {
      const res = await api.get('');
      message.value = res.data.message || t('message.failedFetch');
    } catch (err) {
      message.value = t('message.failedFetch');
      console.error(err);
    }
  }
});

async function checkAuthStatus() {
  try {
    const res = await api.get('/auth/me');
    currentUser.value = res.data;
    isLoggedIn.value = true;
    message.value = `Welcome back, ${currentUser.value.name}!`;
    
    // Fetch users if logged in and has permission
    if (canAccessUsers.value) {
      await fetchUsers();
    }
  } catch (err) {
    console.error(err);
    isLoggedIn.value = false;
    currentUser.value = null;
  }
}

async function login() {
  if (!loginForm.email || !loginForm.password) {
    loginError.value = 'Email and password are required';
    return;
  }

  loginLoading.value = true;
  loginError.value = null;

  try {
    const res = await api.post('/auth/login', {
      email: loginForm.email,
      password: loginForm.password
    });

    currentUser.value = res.data.user;
    isLoggedIn.value = true;
    message.value = `Welcome, ${currentUser.value.name}!`;
    
    // Clear login form
    loginForm.email = '';
    loginForm.password = '';
    
    // Fetch users if has permission
    if (canAccessUsers.value) {
      await fetchUsers();
    }
  } catch (err: any) {
    console.error('Login error:', err);
    loginError.value = err.response?.data?.message || 'Login failed';
  } finally {
    loginLoading.value = false;
  }
}

async function logout() {
  try {
    await api.get('/auth/logout');
  } catch (err) {
    console.error('Logout error:', err);
  } finally {
    isLoggedIn.value = false;
    currentUser.value = null;
    users.value = [];
    message.value = 'You have been logged out';
  }
}

async function fetchUsers() {
  if (!canAccessUsers.value) {
    error.value = 'You do not have permission to view users';
    return;
  }

  loading.value = true;
  error.value = null;
  
  try {
    const res = await api.get('/users');
    users.value = res.data || [];
  } catch (err: any) {
    console.error(err);
    if (err.response?.status === 401) {
      error.value = 'Authentication required';
    } else if (err.response?.status === 403) {
      error.value = 'You do not have permission to view users';
    } else {
      error.value = t('error.fetchUsers');
    }
  } finally {
    loading.value = false;
  }
}

async function createUser() {
  if (!canCreateUsers.value) {
    error.value = 'You do not have permission to create users';
    return;
  }

  try {
    const res = await api.post('/users', newUser);
    users.value.push(res.data.user);
    newUser.name = '';
    newUser.email = '';
    newUser.password = '';
    error.value = null;
  } catch (err: any) {
    console.error(err);
    if (err.response?.status === 401) {
      error.value = 'Authentication required';
    } else if (err.response?.status === 403) {
      error.value = 'You do not have permission to create users';
    } else {
      error.value = err.response?.data?.errors || t('error.createUser');
    }
  }
}

async function deleteUser(id: string) {
  if (!canDeleteUsers.value) {
    error.value = 'You do not have permission to delete users';
    return;
  }

  try {
    await api.delete(`/users/${id}`);
    users.value = users.value.filter(u => u.id !== id);
    error.value = null;
  } catch (err: any) {
    console.error(err);
    if (err.response?.status === 401) {
      error.value = 'Authentication required';
    } else if (err.response?.status === 403) {
      error.value = 'You do not have permission to delete users';
    } else {
      error.value = t('error.deleteUser');
    }
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
    
    <!-- Login Section -->
    <section v-if="!isLoggedIn" class="login-section">
      <h2>Login</h2>
      <div class="login-form">
        <input 
          v-model="loginForm.email" 
          type="email" 
          placeholder="Email"
          :disabled="loginLoading"
        />
        <input 
          v-model="loginForm.password" 
          type="password" 
          placeholder="Password"
          :disabled="loginLoading"
          @keyup.enter="login"
        />
        <button @click="login" :disabled="loginLoading">
          {{ loginLoading ? 'Logging in...' : 'Login' }}
        </button>
      </div>
      
      <div v-if="loginError" class="error">{{ loginError }}</div>
      
      <div class="demo-credentials">
        <h4>Demo Credentials:</h4>
        <p><strong>Admin:</strong> admin@example.com / password123</p>
        <p><strong>User:</strong> user@example.com / userpass</p>
      </div>
    </section>

    <!-- Authenticated User Section -->
    <section v-else class="user-info">
      <div class="user-header">
        <h2>Welcome, {{ currentUser?.name }}!</h2>
        <button @click="logout" class="logout-btn">Logout</button>
      </div>
      
      <div class="user-details">
        <p><strong>Email:</strong> {{ currentUser?.email }}</p>
        <p><strong>Roles:</strong> {{ currentUser?.roles?.join(', ') || 'None' }}</p>
        <p><strong>Permissions:</strong> {{ currentUser?.permissions?.join(', ') || 'None' }}</p>
      </div>
    </section>

    <p>{{ message }}</p>

    <button @click="toggleLang" class="lang-toggle">
      {{ $t('button.switchLang') }}
    </button>

    <!-- User Management Section (only if logged in and has permissions) -->
    <section v-if="isLoggedIn" class="user-management">
      <h2>{{ $t('title.manageUsers') }}</h2>
      
      <div v-if="!canAccessUsers" class="permission-error">
        You do not have permission to view users. Required permission: 'user:read'
      </div>

      <template v-else>
        <!-- Create User Form (if has permission) -->
        <div v-if="canCreateUsers" class="user-form">
          <h3>Create New User</h3>
          <input v-model="newUser.name" :placeholder="$t('form.name')" />
          <input v-model="newUser.email" :placeholder="$t('form.email')" />
          <input v-model="newUser.password" :placeholder="$t('form.password')" type="password" />
          <button @click="createUser">{{ $t('button.createUser') }}</button>
        </div>
        
        <div v-else class="permission-info">
          You do not have permission to create users. Required permission: 'user:create'
        </div>

        <!-- Users List -->
        <div v-if="loading">{{ $t('message.loadingUsers') }}</div>
        <div v-if="error" class="error">{{ error }}</div>

        <div v-if="users.length" class="users-list">
          <h3>Users</h3>
          <ul>
            <li v-for="user in users" :key="user.id" class="user-item">
              <div class="user-info-item">
                <strong>{{ user.name }}</strong> ({{ user.email }})
              </div>
              <button 
                v-if="canDeleteUsers" 
                @click="deleteUser(user.id)" 
                class="delete-btn"
              >
                {{ $t('button.delete') }}
              </button>
            </li>
          </ul>
        </div>

        <p v-else-if="!loading">{{ $t('message.noUsers') }}</p>
      </template>
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
  max-width: 800px;
  margin: 0 auto;
}

h1 {
  font-size: 2.5rem;
  margin-bottom: 1rem;
  color: #333;
}

/* Login Section */
.login-section {
  background: #f9f9f9;
  padding: 2rem;
  border-radius: 8px;
  margin: 2rem 0;
  width: 100%;
  max-width: 400px;
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.login-form input {
  padding: 0.75rem;
  font-size: 1rem;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.login-form button {
  padding: 0.75rem;
  font-size: 1rem;
  cursor: pointer;
  background: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  transition: background 0.2s;
}

.login-form button:hover:not(:disabled) {
  background: #0056b3;
}

.login-form button:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.demo-credentials {
  margin-top: 1rem;
  padding: 1rem;
  background: #e9ecef;
  border-radius: 4px;
  font-size: 0.9rem;
}

.demo-credentials h4 {
  margin: 0 0 0.5rem 0;
  color: #495057;
}

.demo-credentials p {
  margin: 0.25rem 0;
  font-family: monospace;
}

/* User Info Section */
.user-info {
  background: #e8f5e8;
  padding: 2rem;
  border-radius: 8px;
  margin: 2rem 0;
  width: 100%;
  max-width: 500px;
}

.user-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.user-header h2 {
  margin: 0;
  color: #155724;
}

.logout-btn {
  padding: 0.5rem 1rem;
  background: #dc3545;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9rem;
}

.logout-btn:hover {
  background: #c82333;
}

.user-details p {
  margin: 0.5rem 0;
  color: #155724;
}

/* Language Toggle */
.lang-toggle {
  margin: 1rem 0;
  padding: 0.5rem 1rem;
  background: #6c757d;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.lang-toggle:hover {
  background: #545b62;
}

/* User Management */
.user-management {
  margin-top: 2rem;
  width: 100%;
  max-width: 600px;
}

.user-form {
  background: #f8f9fa;
  padding: 1.5rem;
  border-radius: 8px;
  margin-bottom: 2rem;
}

.user-form h3 {
  margin: 0 0 1rem 0;
  color: #495057;
}

.user-form {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.user-form input {
  padding: 0.75rem;
  font-size: 1rem;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.user-form button {
  padding: 0.75rem;
  font-size: 1rem;
  cursor: pointer;
  background: #28a745;
  color: white;
  border: none;
  border-radius: 4px;
}

.user-form button:hover {
  background: #218838;
}

.users-list h3 {
  color: #495057;
  margin-bottom: 1rem;
}

.users-list ul {
  list-style: none;
  padding: 0;
}

.user-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  margin: 0.5rem 0;
  background: #f8f9fa;
  border-radius: 4px;
  border: 1px solid #e9ecef;
}

.user-info-item {
  flex-grow: 1;
}

.delete-btn {
  padding: 0.5rem 1rem;
  background: #dc3545;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9rem;
}

.delete-btn:hover {
  background: #c82333;
}

/* Error and Permission Messages */
.error {
  color: #dc3545;
  background: #f8d7da;
  padding: 0.75rem;
  border-radius: 4px;
  margin: 1rem 0;
  border: 1px solid #f5c6cb;
}

.permission-error, .permission-info {
  background: #fff3cd;
  color: #856404;
  padding: 1rem;
  border-radius: 4px;
  margin: 1rem 0;
  border: 1px solid #ffeaa7;
}

/* Responsive */
@media (max-width: 768px) {
  .welcome-screen {
    padding: 1rem;
  }
  
  .user-header {
    flex-direction: column;
    gap: 1rem;
    align-items: flex-start;
  }
  
  .user-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }
}
</style>