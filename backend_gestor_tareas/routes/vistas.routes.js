// ============================================================
// routes/vistas.routes.js - Rutas de las VISTAS (MVC)
// ============================================================
// Las rutas de las vistas COINCIDEN con las que pedía el backend
// del Módulo 5 (sin el prefijo /api):
//
//   GET    /                        → Inicio (redirige a /tareas)
//   GET    /tareas                  → Listar todas las tareas
//   GET    /tareas/completas        → Listar tareas completas
//   GET    /tareas/incompletas      → Listar tareas incompletas
//   GET    /tareas/nueva            → Formulario de creación
//   POST   /tareas                  → Crear tarea (incompleta)
//   GET    /tareas/categoria/:idCategoria → Tareas de una categoría
//   GET    /tareas/:id/editar       → Formulario de edición
//   PUT    /tareas/:id              → Actualizar tarea
//   PATCH  /tareas/:id/completar    → Marcar como completada
//   DELETE /tareas/:id              → Eliminar (borrado lógico)
//
//   GET    /categorias              → Listar categorías
//   GET    /categorias/nueva        → Formulario de creación
//   POST   /categorias              → Crear categoría
//   GET    /categorias/:id/editar   → Formulario de edición
//   PUT    /categorias/:id          → Actualizar categoría
//   DELETE /categorias/:id          → Eliminar categoría
//
// IMPORTANTE: las rutas fijas (/nueva, /completas, /incompletas,
// /categoria/:idCategoria) van ANTES que /:id para que Express
// no confunda esos textos con un id de tarea.
// ============================================================

const express = require('express');
const router = express.Router();

const tareaWeb = require('../controllers/tarea.web.controller');
const categoriaWeb = require('../controllers/categoria.web.controller');

// --- Tareas ---

// Inicio: redirige al listado de tareas
router.get('/', (req, res) => res.redirect('/tareas'));

// Listados (rutas fijas primero)
router.get('/tareas', tareaWeb.listarTareas);
router.get('/tareas/completas', tareaWeb.listarCompletadas);
router.get('/tareas/incompletas', tareaWeb.listarIncompletas);
router.get('/tareas/categoria/:idCategoria', tareaWeb.listarPorCategoria);

// Crear
router.get('/tareas/nueva', tareaWeb.formularioNueva);
router.post('/tareas', tareaWeb.crearTarea);

// Actualizar y completar
router.get('/tareas/:id/editar', tareaWeb.formularioEditar);
router.put('/tareas/:id', tareaWeb.actualizarTarea);
router.patch('/tareas/:id/completar', tareaWeb.marcarCompletada);

// Eliminar (borrado lógico)
router.delete('/tareas/:id', tareaWeb.eliminarTarea);

// --- Categorías ---

// Listar y crear
router.get('/categorias', categoriaWeb.listarCategorias);
router.get('/categorias/nueva', categoriaWeb.formularioNueva);
router.post('/categorias', categoriaWeb.crearCategoria);

// Actualizar
router.get('/categorias/:id/editar', categoriaWeb.formularioEditar);
router.put('/categorias/:id', categoriaWeb.actualizarCategoria);

// Eliminar
router.delete('/categorias/:id', categoriaWeb.eliminarCategoria);

module.exports = router;
