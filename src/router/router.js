// src/router/index.js
import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

/* ────────── vistas públicas ────────── */
const Login = () => import('@/pages/Login.vue')
const Register = () => import('@/pages/Register.vue')
const ForgotPassword = () => import('@/pages/ForgotPassword.vue')
const ResetPassword = () => import('@/pages/ResetPassword.vue')
const PublicRoute = () => import('@/pages/PublicRoute.vue')
const RidePage = () => import('@/pages/RidePage.vue')
/* ────────── layout y vistas privadas ────────── */
const AppShell = () => import('@/components/layout/AppShell.vue')

const HomeMap = () => import('@/pages/HomeMap.vue')
const MyRoutes = () => import('@/pages/MyRoutes.vue')
const Discover = () => import('@/pages/Discover.vue')
const PostDetail = () => import('@/pages/PostDetail.vue')
const CreatePost = () => import('@/pages/CreatePost.vue')

const MyProfile = () => import('@/pages/MyProfile.vue')
const EditProfile = () => import('@/pages/MyProfileEdit.vue')
const UserProfile = () => import('@/pages/UserProfile.vue')

/* ────────── nuevas vistas de motos ────────── */
const BikeForm = () => import('@/pages/BikeForm.vue')

/* ────────── rutas ────────── */
const routes = [
  /* públicas */
  { path: '/ingresar', component: Login },
  { path: '/registro', component: Register },
  { path: '/recuperar', component: ForgotPassword },
  { path: '/restablecer', component: ResetPassword },
  // link compartido de una ruta: se ve sin cuenta
  { path: '/r/:id', component: PublicRoute },
  // link de una rodada: se ve y se anota gente sin cuenta
  { path: '/s/:id', component: RidePage },

  /* privadas envueltas en AppShell */
  {
    path: '/',
    component: AppShell,
    meta: { requiresAuth: true },
    children: [
      { path: '', redirect: '/rutas/nueva' },

      { path: 'rutas', component: MyRoutes },
      { path: 'descubrir', component: Discover },
      // Explorar y Comunidad viven ahora en Descubrir (pestañas Rutas y Salidas)
      { path: 'explorar', redirect: '/descubrir' },
      { path: 'rutas/nueva', component: HomeMap },
      { path: 'rutas/:id/editar', component: HomeMap },

      { path: 'comunidad', redirect: { path: '/descubrir', query: { tab: 'salidas' } } },
      { path: 'comunidad/publicar', component: CreatePost },
      { path: 'comunidad/:id', component: PostDetail },

      { path: 'perfil', component: MyProfile },
      { path: 'perfil/editar', component: EditProfile },

      { path: 'usuario/:id', component: UserProfile },

      // el garaje se administra en la pestaña Garaje del perfil
      { path: 'garaje', redirect: { path: '/perfil', query: { tab: 'garaje' } } },
      { path: 'garaje/nueva', component: BikeForm },
      { path: 'garaje/:id/editar', component: BikeForm },
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
    if (to.hash && !to.hash.includes('access_token')) return { el: to.hash }
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
