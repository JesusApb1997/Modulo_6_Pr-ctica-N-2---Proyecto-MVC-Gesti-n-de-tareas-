# 📋 Gestor de Tareas — API REST (Módulo 5.3)

Proyecto backend: **API REST de gestión de tareas (Todo list)** construida con
**Node.js + Express + MongoDB (Mongoose)** aplicando buenas prácticas.

## ✨ Funcionalidades

- Crear, actualizar, completar y eliminar tareas.
- Las tareas se crean siempre en estado **incompleto**.
- Listar tareas **completas**, **incompletas** o **por categoría**.
- Gestión de **categorías** (crear, listar, actualizar, eliminar).
- **Borrado lógico**: eliminar una tarea no la destruye, solo le asigna
  `fechaEliminacion` y deja de aparecer en las listas.
- Validaciones: campos obligatorios, categoría existente, `ObjectId` válidos,
  nombres de categoría únicos (insensible a mayúsculas).

## 🧰 Requisitos

- Node.js (v18 o superior)
- Una base de datos MongoDB Atlas (o local)
- Postman (o cualquier cliente REST) para probar los endpoints

## ⚙️ Instalación y configuración

```bash
# 1. Instalar dependencias
npm install

# 2. Crear el archivo .env a partir de la plantilla
cp .env.example .env
#    Luego editar .env y pegar tu URI de MongoDB Atlas en MONGODB_URI

# 3. Arrancar el servidor (con nodemon)
npm run dev
#    o bien:
npm start
```

El servidor arranca en `http://localhost:9000` (o el puerto definido en `PORT`).

> ⚠️ El archivo `.env` contiene credenciales y **no se sube a GitHub**.
> Usa `.env.example` como plantilla.

## 🔌 Endpoints

### Categorías

| Método | Ruta | Descripción |
|---|---|---|
| POST | `/api/categorias` | Crear categoría (`nombre` obligatorio y único, `descripcion` opcional) |
| GET | `/api/categorias` | Listar todas las categorías |
| GET | `/api/categorias/:id` | Ver una categoría por id |
| PUT | `/api/categorias/:id` | Actualizar una categoría |
| DELETE | `/api/categorias/:id` | Eliminar categoría (solo si no tiene tareas activas) |

### Tareas

| Método | Ruta | Descripción |
|---|---|---|
| POST | `/api/tareas` | Crear tarea — siempre queda **incompleta** (`titulo` y `categoria` obligatorios) |
| GET | `/api/tareas` | Listar todas las tareas activas |
| GET | `/api/tareas/completas` | Listar tareas completas |
| GET | `/api/tareas/incompletas` | Listar tareas incompletas |
| GET | `/api/tareas/categoria/:idCategoria` | Tareas por categoría (`?estado=completas` o `?estado=incompletas` opcional) |
| GET | `/api/tareas/:id` | Ver una tarea por id |
| PUT | `/api/tareas/:id` | Actualizar una tarea |
| PATCH | `/api/tareas/:id/completar` | Marcar una tarea como completada |
| DELETE | `/api/tareas/:id` | Eliminar tarea (borrado lógico) |

## 📦 Ejemplos de petición (Postman)

### Crear una categoría

```
POST http://localhost:9000/api/categorias
Content-Type: application/json

{
  "nombre": "Personal",
  "descripcion": "Tareas del hogar"
}
```

### Crear una tarea

```
POST http://localhost:9000/api/tareas
Content-Type: application/json

{
  "titulo": "Comprar leche",
  "descripcion": "Ir al supermercado",
  "categoria": "ID_DE_LA_CATEGORIA"
}
```

> El `categoria` debe ser el `_id` de una categoría creada antes.

### Marcar una tarea como completada

```
PATCH http://localhost:9000/api/tareas/ID_DE_LA_TAREA/completar
```

## 🗂️ Estructura del proyecto

```
├── server.js                    → Entrada: middlewares, rutas, conexión MongoDB
├── models/
│   ├── Categoria.js             → Esquema de categoría
│   └── Tarea.js                 → Esquema de tarea
├── controllers/
│   ├── categoria.controller.js  → Lógica y validaciones de categorías
│   └── tarea.controller.js      → Lógica y validaciones de tareas
├── routes/
│   ├── categorias.routes.js
│   └── tareas.routes.js
├── .env.example                 → Plantilla de configuración
└── package.json
```

## 🗄️ Base de datos

El proyecto se conecta a MongoDB Atlas en la base de datos
`base_de_datos_gestion_tareas`, con las colecciones:

- `categorias` → documentos de categoría
- `modulo_5_gestion_tareas` → documentos de tarea