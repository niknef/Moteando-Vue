import {createRouter, createWebHistory} from 'vue-router'
import { subscribeToAuth } from '../services/auth';
import Home from '../pages/Home.vue'
import Register from '../pages/Register.vue'
import Login from '../pages/Login.vue'
import MyProfile from '../pages/MyProfile.vue'
import MyProfileEdit from '../pages/MyProfileEdit.vue'
import CreatePost from '../pages/CreatePost.vue'
import Posts from '../pages/PostList.vue'



//Rutas -> 

const routes = [
    {path: '/', component: Home},
    {path: '/register', component: Register},
    {path: '/login', component: Login},
    {path: '/my-profile', component: MyProfile, meta: {requiresAuth: true}},
    {path: '/my-profile/edit', component: MyProfileEdit, meta: {requiresAuth: true}},
    {path: '/create-post', component: CreatePost, meta: {requiresAuth: true}},
    {path: '/post', component: Posts, meta: {requiresAuth: true}},
];

//Creamos el router
const router = createRouter({
    history: createWebHistory(),
    routes
});

// Nos suscribimos a la autenticación.
let user = {
    id: null,
    email: null,
}
subscribeToAuth(newUserData => user = newUserData);


// Agregamos un "guard" global para nuestro router.
router.beforeEach((to, from) => {
    
    // Si la ruta requiere que el usuario esté autenticado, y no lo está, entonces lo "pateamos" al login.
    if(to.meta.requiresAuth && user.id === null) {
        // Retornamos la URL a donde lo queremos mandar.
        return '/login';
    }
});
//Exportamos el router
export default router;