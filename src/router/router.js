// src/router/index.js
import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

/* ────────── vistas públicas ────────── */
const Login = () => import('@/pages/Login.vue')
const Register = () => import('@/pages/Register.vue')

/* ────────── layout y vistas privadas ────────── */
const AppShell = () => import('@/components/layout/AppShell.vue')

const HomeMap = () => import('@/pages/HomeMap.vue')
const PostList = () => import('@/pages/PostList.vue')
const PostDetail = () => import('@/pages/PostDetail.vue')
const CreatePost = () => import('@/pages/CreatePost.vue')
const Events = () => import('@/pages/Events.vue')

const MyProfile = () => import('@/pages/MyProfile.vue')
const EditProfile = () => import('@/pages/MyProfileEdit.vue')
const UserProfile = () => import('@/pages/UserProfile.vue')

/* ────────── nuevas vistas de motos ────────── */
const MyBikes = () => import('@/pages/MyBikes.vue')
const NewBike = () => import('@/pages/BikeFormNew.vue')
const EditBike = () => import('@/pages/BikeFormEdit.vue')

/* ────────── rutas ────────── */
const routes = [
  /* públicas */
  { path: '/ingresar', component: Login },
  { path: '/registro', component: Register },

  /* privadas envueltas en AppShell */
  {
    path: '/',
    component: AppShell,
    meta: { requiresAuth: true },
    children: [
      { path: '', redirect: '/rutas/nueva' },

      { path: 'rutas/nueva', component: HomeMap },

      { path: 'comunidad', component: PostList },
      { path: 'comunidad/publicar', component: CreatePost },
      { path: 'comunidad/:id', component: PostDetail },

      { path: 'eventos', component: Events },

      { path: 'perfil', component: MyProfile },
      { path: 'perfil/editar', component: EditProfile },

      { path: 'usuario/:id', component: UserProfile },

      { path: 'garaje', component: MyBikes },
      { path: 'garaje/nueva', component: NewBike },
      { path: 'garaje/:id/editar', component: EditBike },
    ],
  },

  /* direcciones viejas (en inglés): redirigen a las nuevas conservando la query */
  ...[
    ['/login', '/ingresar'],
    ['/register', '/registro'],
    ['/map', '/rutas/nueva'],
    ['/posts', '/comunidad'],
    ['/posts/create', '/comunidad/publicar'],
    ['/posts/:id', (p) => `/comunidad/${p.id}`],
    ['/events', '/eventos'],
    ['/profile/me', '/perfil'],
    ['/profile/edit', '/perfil/editar'],
    ['/my-bikes', '/garaje'],
    ['/my-bikes/new', '/garaje/nueva'],
    ['/my-bikes/:id/edit', (p) => `/garaje/${p.id}/editar`],
  ].map(([path, to]) => ({
    path,
    redirect: (r) => ({ path: typeof to === 'function' ? to(r.params) : to, query: r.query }),
  })),

  /* fallback */
  { path: '/:pathMatch(.*)*', redirect: '/rutas/nueva' },
]

/* ────────── router ────────── */
const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior(to, from, savedPosition) {
    if (to.hash) return { el: to.hash }
    if (savedPosition) return savedPosition
    return { top: 0 }
  },
})

/* ────────── guard auth ────────── */
router.beforeEach(async (to) => {
  // El store se pide acá adentro: cuando se importa este archivo, Pinia todavía no está registrado
  const auth = useAuthStore()
  await auth.init()

  if (to.meta.requiresAuth && !auth.isLoggedIn) {
    return { path: '/ingresar', query: { redirect: to.fullPath } }
  }
  if ((to.path === '/ingresar' || to.path === '/registro') && auth.isLoggedIn) {
    return '/rutas/nueva'
  }
})

export default router
