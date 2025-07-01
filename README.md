# 🏍️ Moteando - Proyecto Parcial Clientes Web Mobile

Moteando es una red social para motociclistas creada como trabajo práctico para la materia **Clientes Web Mobile + Proyecto Final** (Escuela Da Vinci). El proyecto simula una comunidad donde los usuarios pueden compartir rutas, comentar publicaciones y personalizar su perfil.

---

## 🧪 Tecnologías utilizadas

- **Vue 3** - Framework JavaScript (API Options)
- **Vite** - Herramienta de build ultrarrápida
- **Supabase** - Backend como servicio (auth, DB y realtime)
- **Tailwind CSS** - Framework de estilos utility-first
- **MapTiler** - Framework de estilos utility-first
- **OpenRouteService** - Framework de estilos utility-first

---

## 📁 Estructura del proyecto

```bash
src/
├── components/          # Componentes reutilizables (UI, formularios, etc.)
├── pages/               # Vistas principales (Home, Login, Register, Perfil, etc.)
├── services/            # Lógica para conectar con Supabase (auth, posts, comments)
├── router/              # Configuración de rutas con Vue Router
├── assets/              # Imágenes, íconos, etc.
└── main.js              # Punto de entrada principal
```

---

## 🔐 Autenticación

El sistema permite:
- Registro y login de usuarios vía Supabase Auth
- Gestión del estado global de usuario mediante Observer
- Guardado de sesión en `localStorage`
- Personalización del perfil: nombre, bio, modelo de moto y avatar

---

## 🗺️ Funcionalidades principales

- 📝 **Publicaciones**: los usuarios pueden crear rutas (posts) con descripción, duración, puntos de inicio y fin.
- 💬 **Comentarios en tiempo real**: cada post permite recibir comentarios usando Supabase Realtime.
- 👤 **Perfiles**: cada usuario puede editar su perfil y ver el de otros.
- 🏍️ **Garaje**: Cada usuario tiene un garaje con hasta 5 motos.
- 🗺️ **Mapa**: Mapa para creacion de posts.
- 🔒 **Protección de rutas**: páginas como Perfil y Editar Perfil están protegidas por autenticación.

---

## ⚙️ Cómo funciona

- Se inicia la app con `npm run dev` gracias a Vite.
- Vue se encarga del frontend con SFCs.
- Supabase provee:
  - Autenticación (registro/login/logout)
  - Base de datos PostgreSQL para `users`, `posts` y `comments`
  - Realtime con `on('postgres_changes')`
- Tailwind permite un diseño responsivo y moderno sin necesidad de CSS personalizado.


---


## 📲 Contacto

Nicolas.firpo@davinci.edu.ar
