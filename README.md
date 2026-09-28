# 📋 Gestor de Tareas — FullStack MVC (Módulo 6.1)

Proyecto completo de **gestión de tareas (Todo list)** con arquitectura **MVC**:
**Node.js + Express + EJS + Tailwind CSS + MongoDB (Atlas)**, más un **frontend
propio** (HTML + Tailwind + JavaScript con **Axios**) que consume la API REST.

> ✅ Implementa todo lo que pide la práctica del PDF *“Módulo 6.1 — Práctica:
> MVC ‘Gestión de tareas’”*:
> - Crear una tarea (con estado **incompleto**)
> - Actualizar una tarea existente
> - Actualizar una tarea a **completada**
> - Eliminar una tarea (**borrado lógico**)
> - Listar todas las tareas **incompletas**
> - Listar todas las tareas **completas**
> - **Validaciones** en cada operación
> - Vistas, rutas y controladores MVC cuyas rutas **coinciden con las del
>   backend del Módulo 5**

---

## 🗂️ Estructura del proyecto

```
Gestor_de_tareas_mod_6/
├── backend_gestor_tareas/          → Backend FullStack MVC
│   ├── server.js                   → Entrada: middlewares, layout, rutas, MongoDB
│   ├── models/                     → MODELO (Mongoose)
│   │   ├── Tarea.js                →   título, descripción, categoría, completado,
│   │   │                              fechaCreacion, fechaEliminacion (borrado lógico)
│   │   └── Categoria.js            →   nombre (único), descripción
│   ├── controllers/                → CONTROLADORES
│   │   ├── tarea.controller.js     →   lógica de la API REST (/api/tareas)
│   │   ├── categoria.controller.js →   lógica de la API REST (/api/categorias)
│   │   ├── tarea.web.controller.js →   lógica de las VISTAS (EJS)
│   │   └── categoria.web.controller.js
│   ├── routes/                     → Rutas (API + vistas)
│   │   ├── tareas.routes.js
│   │   ├── categorias.routes.js
│   │   └── vistas.routes.js
│   ├── views/                      → VISTAS (EJS + Tailwind)
│   │   ├── layout.ejs              →   plantilla base (navbar + footer)
│   │   ├── error.ejs
│   │   ├── partials/mensajes.ejs   →   mensajes flash (?creada=1, etc.)
│   │   ├── tareas/                 →   index (listado), nueva, editar
│   │   └── categorias/             →   index, form
│   ├── public/css/                 → input.css (Tailwind) → output.css (compilado)
│   ├── .env                        → credenciales (NO se sube a GitHub)
│   └── .env.example                → plantilla de configuración
│
└── frontend_gestor_tareas/         → Frontend SPA (consumo de la API REST con Axios)
    ├── server.js                   → servidor estático (sin dependencias)
    ├── public/
    │   ├── index.html              → interfaz con Tailwind (tarjetas, modal, toasts)
    │   ├── js/axios.min.js         → cliente HTTP Axios (servido localmente)
    │   ├── js/app.js               → lógica: CRUD, filtros, stats, progreso (usa axios)
    │   ├── js/app.config.js        → URL de la API (http://localhost:9000/api)
    │   └── css/input.css           → Tailwind de entrada
    └── package.json
```

## ✨ Dos formas de usar la aplicación

| Interfaz | URL | Qué es |
|---|---|---|
| **Frontend SPA** | `http://localhost:5500` | Interfaz moderna con Tailwind: tarjetas, filtros, barra de progreso, estadísticas, modal y notificaciones. Consume la API REST. |
| **Vistas MVC (EJS)** | `http://localhost:9000/tareas` | Vistas server-side renderizadas por Express (lo que pide la práctica del PDF). |
| **API REST** | `http://localhost:9000/api/tareas` | La API del Módulo 5, intacta, para Postman u otros clientes. |

---

## 🚀 Instalación paso a paso

### Paso 0 — Requisitos

- **Node.js v18 o superior** (`node -v`)
- Una base de datos **MongoDB Atlas** (o local) accesible

### Paso 1 — Configurar las variables de entorno (backend)

Crea (o edita) el archivo `backend_gestor_tareas/.env`:

```env
# Cadena de conexión a MongoDB Atlas
MONGODB_URI=mongodb+srv://USUARIO:CONTRASEÑA@cluster0.xxxxx.mongodb.net/base_de_datos_gestion_tareas?appName=Cluster0&retryWrites=true&w=majority

# Puerto del servidor backend
PORT=9000

# Entorno de ejecución
NODE_ENV=development
```

> ⚠️ El archivo `.env` contiene credenciales y **no se sube a GitHub**
> (está en `.gitignore`). Usa `.env.example` como plantilla.

### Paso 2 — Instalar dependencias del backend

```bash
cd backend_gestor_tareas
npm install
```

### Paso 3 — Arrancar el backend

```bash
# Opción A (recomendada): nodemon + Tailwind en modo watch
npm run dev

# Opción B: servidor simple
npm start
```

Deberías ver:

```
✅ Conexión establecida con MongoDB
  🌐 Servidor:   http://localhost:9000
  🖥️  Vistas:     http://localhost:9000/tareas
  📡 API Base:   http://localhost:9000/api/tareas
```

> La primera vez que se compila Tailwind se genera `public/css/output.css`.
> Con `npm run dev` se recompila solo al cambiar las vistas.

### Paso 4 — Instalar y arrancar el frontend (en OTRA terminal independiente)

> ⚠️ Cada proyecto se maneja por separado: cada uno tiene su propio
> `package.json`, su `npm install` y su propia terminal.
> **No ejecutes `npm run dev` en la carpeta raíz**: ahí no hay `package.json`
> y npm fallará con `ENOENT ... Could not read package.json`.

```bash
cd frontend_gestor_tareas
npm install          # Tailwind (dev) + Axios (dependencia)
npm run css          # compila public/css/output.css (una vez)
npm start            # sirve la SPA en http://localhost:5500
```

Abre **http://localhost:5500** 🎉

> 💡 Si prefieres no usar el servidor estático, puedes abrir
> `frontend_gestor_tareas/public/index.html` directamente en el navegador:
> el frontend llama a la API por CORS (ya habilitado en el backend).
> La URL de la API se cambia en `public/js/app.config.js`.

### Paso 5 — (Alternativa) Probar solo con las vistas MVC

Si no quieres usar el frontend SPA, todo el flujo de la práctica funciona
solo con el backend: entra a `http://localhost:9000/tareas`, crea una
categoría en `/categorias`, y gestiona las tareas con los botones de cada
tarjeta (Completar / Editar / Eliminar).

## 🔗 Cómo se conectan frontend y backend (Axios)

El frontend **no** toca la base de datos: todo pasa por la API REST usando
**Axios** (cargado localmente desde `public/js/axios.min.js`):

1. `public/js/app.config.js` define la URL base: `http://localhost:9000/api`.
2. `public/js/app.js` crea una **instancia de axios** con esa base:

```js
const api = axios.create({
  baseURL: 'http://localhost:9000/api',
  headers: { 'Content-Type': 'application/json' },
  timeout: 10000
});

// Ejemplo: crear una tarea
await api.post('/tareas', { titulo, descripcion, categoria });

// Ejemplo: listar incompletas
const { data } = await api.get('/tareas/incompletas');
```

3. El backend permite CORS (`cors()` en `server.js`), por lo que el
   navegador acepta las peticiones desde `http://localhost:5500`.
4. Si el backend está apagado, la app muestra un aviso: *"No se pudo
   conectar con el backend en http://localhost:9000"*.

---

## 🖥️ Rutas de las VISTAS (coinciden con el backend del Módulo 5)

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/` | Inicio (redirige a `/tareas`) |
| GET | `/tareas` | Listar **todas** las tareas |
| GET | `/tareas/completas` | Listar tareas **completas** |
| GET | `/tareas/incompletas` | Listar tareas **incompletas** |
| GET | `/tareas/categoria/:idCategoria` | Tareas de una categoría (`?estado=completas\|incompletas`) |
| GET | `/tareas/nueva` | Formulario de **creación** |
| POST | `/tareas` | Crear tarea (queda **incompleta**) |
| GET | `/tareas/:id/editar` | Formulario de **edición** |
| PUT | `/tareas/:id` | **Actualizar** tarea existente |
| PATCH | `/tareas/:id/completar` | Marcar tarea como **completada** |
| DELETE | `/tareas/:id` | **Eliminar** tarea (borrado lógico) |
| GET | `/categorias` | Listar categorías |
| GET | `/categorias/nueva` | Formulario de creación de categoría |
| POST | `/categorias` | Crear categoría |
| GET | `/categorias/:id/editar` | Formulario de edición de categoría |
| PUT | `/categorias/:id` | Actualizar categoría |
| DELETE | `/categorias/:id` | Eliminar categoría (si no tiene tareas activas) |

> Los formularios HTML solo soportan GET/POST, por eso se usa
> **method-override**: los formularios envían `?_method=PUT|PATCH|DELETE`.

## 📡 API REST (se conserva del Módulo 5)

| Método | Ruta | Descripción |
|---|---|---|
| POST | `/api/tareas` | Crear tarea — **siempre incompleta** |
| GET | `/api/tareas` | Listar todas las tareas activas |
| GET | `/api/tareas/completas` | Listar tareas completas |
| GET | `/api/tareas/incompletas` | Listar tareas incompletas |
| GET | `/api/tareas/categoria/:idCategoria` | Tareas por categoría (`?estado=…`) |
| GET | `/api/tareas/:id` | Obtener una tarea |
| PUT | `/api/tareas/:id` | Actualizar una tarea |
| PATCH | `/api/tareas/:id/completar` | Marcar como completada |
| DELETE | `/api/tareas/:id` | Eliminar (borrado lógico) |
| POST | `/api/categorias` | Crear categoría (nombre único) |
| GET | `/api/categorias` | Listar categorías |
| GET/PUT/DELETE | `/api/categorias/:id` | Ver / actualizar / eliminar categoría |

### Ejemplos rápidos (Postman o curl)

```bash
# Crear categoría
curl -X POST http://localhost:9000/api/categorias \
  -H "Content-Type: application/json" \
  -d '{"nombre":"Personal","descripcion":"Tareas del hogar"}'

# Crear tarea (usando el _id de la categoría)
curl -X POST http://localhost:9000/api/tareas \
  -H "Content-Type: application/json" \
  -d '{"titulo":"Comprar leche","descripcion":"Ir al supermercado","categoria":"<ID_CATEGORIA>"}'

# Marcar como completada
curl -X PATCH http://localhost:9000/api/tareas/<ID_TAREA>/completar

# Listar incompletas / completas
curl http://localhost:9000/api/tareas/incompletas
curl http://localhost:9000/api/tareas/completas

# Eliminar (borrado lógico)
curl -X DELETE http://localhost:9000/api/tareas/<ID_TAREA>
```

---

## ✅ Validaciones implementadas (por operación)

- **Crear tarea**: título obligatorio (máx. 150), categoría obligatoria,
  ObjectId válido y **existente** en la base de datos. `completado` se fuerza
  a `false`.
- **Actualizar tarea**: la tarea debe existir y estar activa; mismo conjunto
  de validaciones del POST; en la API, al menos un campo para actualizar.
- **Completar**: id válido, tarea existente y activa (idempotente).
- **Eliminar**: id válido, tarea existente; **borrado lógico** (solo se asigna
  `fechaEliminacion`, el documento no se destruye y desaparece de las listas).
- **Categorías**: nombre obligatorio (máx. 80) y **único** (insensible a
  mayúsculas); no se puede eliminar una categoría con **tareas activas**.
- **Ids mal formados** → error 400 amigable; **recursos inexistentes** → 404.

## 🗄️ Base de datos (MongoDB Atlas)

Base: `base_de_datos_gestion_tareas`
Colecciones: `categorias` y `modulo_5_gestion_tareas` (tareas).

> Si tu IP no está en la lista blanca de Atlas, añádela en
> **Network Access → Add IP address** (o usa `0.0.0.0/0` solo para pruebas).

## 🧰 Scripts disponibles

### Backend (`backend_gestor_tareas/`)

| Comando | Qué hace |
|---|---|
| `npm run dev` | nodemon + compilación Tailwind en vivo (recomendado) — **ejecutar dentro de `backend_gestor_tareas/`** |
| `npm start` | Arranca el servidor con node |
| `npm run css` | Compila Tailwind una vez (`input.css` → `output.css`) |
| `npm run css:watch` | Compila Tailwind en modo watch |
| `npm run seed` | Inserta datos de ejemplo (idempotente, no duplica) |

### Frontend (`frontend_gestor_tareas/`)

| Comando | Qué hace |
|---|---|
| `npm start` | Sirve la SPA en `http://localhost:5500` — **ejecutar dentro de `frontend_gestor_tareas/`** |
| `npm run css` | Compila Tailwind una vez |
| `npm run css:watch` | Compila Tailwind en modo watch |

## 🎓 ¿Cómo compartir este proyecto (con tu profesor)?

- **NO compartas tu `.env`**: contiene tu usuario y contraseña de Atlas.
  El proyecto incluye `.env.example` (plantilla sin credenciales) y el
  `.gitignore` ya excluye el `.env`.
- Comparte el proyecto **sin `node_modules`** (ZIP o repositorio): el
  `.gitignore` lo excluye y se regenera con `npm install`.
- Incluye **`GUIA_PARA_EL_PROFESOR.md`**: es una guía de revisión en 5 pasos
  (configurar su propio `.env`, `npm install`, arrancar y qué revisar).
- Opcional: el profesor puede poblar la app con `npm run seed` (dentro de
  `backend_gestor_tareas/`), que inserta categorías y tareas de ejemplo de
  forma segura (idempotente: nunca duplica).

## 🩺 Solución de problemas

| Problema | Solución |
|---|---|
| `No se pudo conectar con MongoDB` | Revisa `MONGODB_URI` en `.env` y la lista de IPs de Atlas (Network Access). |
| El servidor arranca en el puerto 3000 | Tu sistema tiene una variable `PORT` global que pisa el `.env`. El proyecto ya usa `dotenv` con `override: true`; si aún así falla, verifica que no haya otro proceso en el 9000. |
| `EADDRINUSE` (puerto ocupado) | Cierra el otro proceso o cambia `PORT` en el `.env`. |
| La página se ve sin estilos | Ejecuta `npm run css` (backend y/o frontend) para generar `output.css`. |
| `npm error ENOENT ... Could not read package.json` | Ejecutaste npm en la carpeta raíz del proyecto. Entra primero a la carpeta del proyecto: `cd backend_gestor_tareas` (para `npm run dev`) o `cd frontend_gestor_tareas` (para `npm start`). |
| El frontend dice “No se pudo conectar con el backend” | Arranca primero el backend (`npm run dev`) y revisa la URL en `frontend_gestor_tareas/public/js/app.config.js`. |

## 📦 Entrega

Comprime el proyecto **sin `node_modules` ni `.env`** (como pide la nota del
PDF) y súbelo a la plataforma. Después de descomprimir, solo se necesitan los
comandos `npm install` y `npm run dev` para que funcione.

> 💡 Puedes generarlo con el comando de la sección anterior (PowerShell:
> `Compress-Archive` excluyendo lo sensible), o compartir el repositorio de
> GitHub directamente: el `.gitignore` ya se encarga de excluir
> `node_modules/` y `.env`.
> Detalles para quien recibe el proyecto: **`GUIA_PARA_EL_PROFESOR.md`**.
