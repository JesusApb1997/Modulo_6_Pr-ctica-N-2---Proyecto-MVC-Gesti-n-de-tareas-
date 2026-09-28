# 🎓 Guía de revisión — Gestor de Tareas (Módulo 6.1)

Proyecto **FullStack MVC**: *Node.js + Express + EJS + Tailwind CSS + MongoDB (Atlas)*,
con **API REST** y un **frontend propio (HTML + Tailwind + Axios)** que la consume.

---

## 📂 Qué contiene el paquete

```
Gestor_de_tareas_mod_6/
├── README.md                    → documentación técnica completa del proyecto
├── GUIA_PARA_EL_PROFESOR.md     → esta guía (revisión en 5 minutos)
├── backend_gestor_tareas/       → Backend MVC (Express + EJS + MongoDB)
└── frontend_gestor_tareas/      → Frontend SPA (Tailwind + Axios)
```

> ⚠️ **Importante:** el paquete **no incluye** la carpeta `node_modules`
> (se regenera con `npm install`) ni los archivos `.env` con credenciales
> (buena práctica: las credenciales nunca se versionan ni se comparten).
> Ambos se crean con los pasos de abajo, en menos de 2 minutos.

---

## 🚀 Revisión en 5 pasos

### 0) Requisitos

- **Node.js 18 o superior** → comprobar con `node -v`
- Una base de datos **MongoDB Atlas** (o local). Solo se necesita la
  *cadena de conexión* (URI) que el profesor colocará en su propio `.env`.

### 1) Configurar las credenciales (backend)

Crear el archivo `backend_gestor_tareas/.env` con este contenido
(el proyecto incluye la plantilla `.env.example` con el mismo formato):

```env
MONGODB_URI=mongodb+srv://USUARIO:CONTRASEÑA@cluster0.xxxxx.mongodb.net/base_de_datos_gestion_tareas?appName=Cluster0&retryWrites=true&w=majority
PORT=9000
NODE_ENV=development
```

*(Reemplazar `USUARIO:CONTRASEÑA@cluster0.xxxxx` por los datos de su propio
clúster de Atlas. Si su IP no está en la lista blanca de Atlas, añadirla en
**Network Access → Add IP address**.)*

### 2) Instalar dependencias

```bash
# Terminal 1 — backend
cd backend_gestor_tareas
npm install

# Terminal 2 — frontend (proyecto independiente, con su propio package.json)
cd frontend_gestor_tareas
npm install
```

### 3) (Opcional) Cargar datos de ejemplo

```bash
cd backend_gestor_tareas
npm run seed
```

Crea 3 categorías (Personal, Trabajo, Estudios) y 5 tareas (3 pendientes y
2 completadas). Es **idempotente**: si la base ya tiene datos, no duplica nada.

### 4) Arrancar

```bash
# Terminal 1 — backend (puerto 9000)
cd backend_gestor_tareas
npm run dev

# Terminal 2 — frontend (puerto 5500)
cd frontend_gestor_tareas
npm start
```

Cuando el backend esté conectado verá:

```
✅ Conexión establecida con MongoDB
  🌐 Servidor:   http://localhost:9000
```

### 5) Abrir la aplicación

| URL | Qué se revisa ahí |
|---|---|
| `http://localhost:5500` | **Frontend SPA** — tarjetas de tareas, filtros, barra de progreso, crear/editar/completar/eliminar con Axios |
| `http://localhost:9000/tareas` | **Vistas MVC (EJS)** — el listado server-side de la práctica |
| `http://localhost:9000/tareas/completas` | Vistas: tareas completas |
| `http://localhost:9000/tareas/incompletas` | Vistas: tareas incompletas |
| `http://localhost:9000/tareas/nueva` | Vista: formulario de creación (la tarea nace *incompleta*) |
| `http://localhost:9000/categorias` | CRUD web de categorías |
| `http://localhost:9000/api/tareas` | **API REST** (también probada en Postman) |

> ✅ **Confirmación de la conexión a Atlas:** al crear una tarea desde la app
> y refrescar **Browse Collections** en MongoDB Atlas, el documento aparece en
> la colección `modulo_5_gestion_tareas` de la base `base_de_datos_gestion_tareas`.

---

## 🧪 Probar la API REST (Postman o curl)

```bash
# Crear categoría
curl -X POST http://localhost:9000/api/categorias -H "Content-Type: application/json" -d "{\"nombre\":\"Prueba\"}"

# Listar categorías (copiar un _id para el siguiente paso)
curl http://localhost:9000/api/categorias

# Crear tarea (siempre queda incompleta)
curl -X POST http://localhost:9000/api/tareas -H "Content-Type: application/json" -d "{\"titulo\":\"Tarea de prueba\",\"categoria\":\"<ID_CATEGORIA>\"}"

# Marcar como completada
curl -X PATCH http://localhost:9000/api/tareas/<ID_TAREA>/completar

# Listar completas / incompletas
curl http://localhost:9000/api/tareas/completas
curl http://localhost:9000/api/tareas/incompletas

# Eliminar (borrado lógico: asigna fechaEliminacion, no destruye el documento)
curl -X DELETE http://localhost:9000/api/tareas/<ID_TAREA>
```

## ✅ Checklist de la práctica (PDF Módulo 6.1)

| Requisito del PDF | Dónde se cumple |
|---|---|
| Vistas, rutas y controladores MVC (coinciden con el Módulo 5) | `views/`, `routes/vistas.routes.js`, `controllers/*.web.controller.js` |
| Crear tarea con estado *incompleto* | `POST /tareas` y `POST /api/tareas` (fuerza `completado: false`) |
| Actualizar tarea existente | `PUT /tareas/:id` y `PUT /api/tareas/:id` |
| Actualizar tarea a *completada* | `PATCH /tareas/:id/completar` y `PATCH /api/tareas/:id/completar` |
| Eliminar tarea (borrado lógico) | `DELETE /tareas/:id` (asigna `fechaEliminacion`) |
| Listar tareas incompletas | `GET /tareas/incompletas` y `GET /api/tareas/incompletas` |
| Listar tareas completas | `GET /tareas/completas` y `GET /api/tareas/completas` |
| Validaciones por operación | Título/categoría obligatorios, ObjectId válido y existente, nombre de categoría único, no eliminar categorías con tareas activas |
| Node.js + Express + EJS + MongoDB | Todo el backend |
| `npm install` / `npm run dev` y funciona | Sí (sin `node_modules` en el paquete) |

## 🗺️ Arquitectura MVC en 30 segundos

```
Petición → routes/ → controllers/ → models/ → MongoDB Atlas
                        ↓
                     views/ (EJS + Tailwind) → HTML al navegador
```

- **Modelo:** `models/Tarea.js` (título, descripción, categoría, completado,
  fechaCreacion, fechaEliminacion) y `models/Categoria.js` (nombre único, descripción).
- **Vista:** plantillas EJS en `views/` envueltas por `views/layout.ejs`,
  estilizadas con Tailwind (CSS compilado en `public/css/output.css`).
- **Controlador:** `tarea.web.controller.js` y `categoria.web.controller.js`
  (vistas) + `tarea.controller.js` y `categoria.controller.js` (API REST).
- **Frontend SPA:** `frontend_gestor_tareas/public/` — HTML + Tailwind + **Axios**
  (`app.js` crea una instancia de axios contra `http://localhost:9000/api`).

## 🩺 Si algo falla

| Síntoma | Solución |
|---|---|
| `npm error ENOENT ... package.json` | Está ejecutando npm en la carpeta raíz. Entrar a `backend_gestor_tareas/` o `frontend_gestor_tareas/`. |
| `No se pudo conectar con MongoDB` | Revisar `MONGODB_URI` en `backend_gestor_tareas/.env` y la lista de IPs de Atlas. |
| Página sin estilos | Ejecutar `npm run css` dentro del proyecto correspondiente. |
| Puerto ocupado (`EADDRINUSE`) | Cerrar el otro proceso o cambiar `PORT` en el `.env`. |
