import { createRouter, createWebHistory } from 'vue-router'
import SpotifyBattle from '../components/SpotifyBattle.vue'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: SpotifyBattle
  },
  {
    path: '/callback',
    name: 'Callback',
    component: SpotifyBattle
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router