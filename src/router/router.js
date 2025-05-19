import {createRouter, createWebHistory} from 'vue-router'
import Home from '../pages/Home.vue'
import Register from '../pages/Register.vue'
import Login from '../pages/Login.vue'

//Rutas -> 

const routes = [
    {path: '/', component: Home},
    {path: '/register', component: Register},
    {path: '/login', component: Login},
];

//Creamos el router
const router = createRouter({
    history: createWebHistory(),
    routes
});

//Exportamos el router
export default router;