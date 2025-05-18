import './style.css'
import { createApp } from 'vue' //Importamos la funcion para crear la app
import router from './router/router.js' //Importamos el router
import App from './App.vue' //Importamos el componente App.vue


const app = createApp(App) //Creamos la app

app.use(router) //Usamos el router

app.mount('#app') //Montamos la app en el elemento con id app
