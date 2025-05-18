// Importamos el plugin de Vue para Vite.
import vue from '@vitejs/plugin-vue';
import tailwindcss from '@tailwindcss/vite';
import path from 'path'

export default {
    // Agregamos el plugin de Vue.
    plugins: [vue(), tailwindcss()],
    resolve: {
        // Configuramos los alias para las rutas.
        alias: {
            '@': path.resolve(__dirname, './src')
        },
    }
}