import HelloWorld from '@/components/HelloWorld.vue'
import HomePage from '@/pages/HomePage.vue'
import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', component: HomePage },
    { path: '/home', component: HelloWorld },
    { path: '/:catchAll(.*)', redirect: '/' }
  ],
})

export default router
