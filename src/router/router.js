import { createRouter, createWebHistory } from 'vue-router'
import { subscribeToAuth } from '@/services/auth'

/* ────────── vistas públicas ────────── */
const Login    = () => import('@/pages/Login.vue')
const Register = () => import('@/pages/Register.vue')

/* ────────── layout y vistas privadas ────────── */
const AppShell   = () => import('@/components/layout/AppShell.vue')  // incluye AppNavbar + AppBottomNav
const HomeMap    = () => import('@/pages/HomeMap.vue')     // antiguo MapView
const PostList   = () => import('@/pages/PostList.vue')
const PostDetail = () => import('@/pages/PostDetail.vue')
const CreatePost = () => import('@/pages/CreatePost.vue')
const Events     = () => import('@/pages/Events.vue')      // (placeholder)
const MyProfile  = () => import('@/pages/MyProfile.vue')
const EditProfile= () => import('@/pages/MyProfileEdit.vue')
const Settings   = () => import('@/pages/Settings.vue')    // (opcional)

/* ────────── definición de rutas ────────── */
const routes = [
  /* públicas */
  { path: '/login',    component: Login },
  { path: '/register', component: Register },

  /* privadas envueltas en AppShell */
  {
    path: '/',
    component: AppShell,
    meta: { requiresAuth: true },
    children: [
      { path: '', redirect: '/map' },           // @ '/'
      { path: 'map',     component: HomeMap },
      { path: 'posts',   component: PostList },
      { path: 'posts/create', component: CreatePost },
      { path: 'posts/:id',    component: PostDetail },
      { path: 'events',  component: Events },
      { path: 'profile/me',       component: MyProfile },
      { path: 'profile/edit',     component: EditProfile },
      { path: 'settings',         component: Settings }
    ]
  },

  /* fallback */
  { path: '/:pathMatch(.*)*', redirect: '/map' }
]

/* ────────── creación del router ────────── */
const router = createRouter({
  history: createWebHistory(),
  routes,
 scrollBehavior(to, from, savedPosition) {
  
   if (to.hash) {
     return { el: to.hash }
   }
  
   if (savedPosition) {
     return savedPosition
   }
   
   return { top: 0 }
 }
})

/* ────────── estado de auth reactivo ────────── */
let currentUser = { id: null, email: null }
subscribeToAuth(u => { currentUser = u })

/* ────────── guard global ────────── */
router.beforeEach((to) => {
  if (to.meta.requiresAuth && !currentUser.id) {
    return { path: '/login', query: { redirect: to.fullPath } }
  }
  if ((to.path === '/login' || to.path === '/register') && currentUser.id) {
    return '/map'                // ya logueado: evita volver a login
  }
})

export default router
