import {createRouter, createWebHistory} from 'vue-router'
import Home from '../pages/Home.vue'

//Rutas -> 

const routes = [
    {path: '/', component: Home},
];

//Creamos el router
const router = createRouter({
    history: createWebHistory(),
    routes
});

//Exportamos el router
export default router;