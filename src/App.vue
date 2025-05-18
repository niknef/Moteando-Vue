<script> 
// api option

import Home from './pages/Home.vue'
//Exportamos el componente App
export default {
    //Name permite configurar el nombre del componente
    name: 'App',
    //Components permite importar otros componentes
    components: { Home },
    //Data es una funcion que retorna un objeto con los datos del componente
    data() {
        return {
            msg: 'Hello Vue!'
        }
    }
}
</script>

<template>
    <div class="container mx-auto p-4">
        <router-view />
    </div>
    <footer class="flex justify-center items-center h-25 bg-slate-800 text-white">
        <p>Da Vinci &copy; 2025</p>
    </footer>
</template>