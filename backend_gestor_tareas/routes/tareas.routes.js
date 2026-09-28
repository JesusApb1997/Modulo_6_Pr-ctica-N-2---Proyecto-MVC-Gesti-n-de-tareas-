// ============================================================
// routes/tareas.routes.js - Rutas de la API para Tareas
// ============================================================
// Resumen de endpoints (según el enunciado del proyecto):
//   POST   /api/tareas                        → Crear una tarea (incompleta)
//   PUT    /api/tareas/:id                    → Actualizar una tarea existente
//   PATCH  /api/tareas/:id/completar          → Marcar una tarea como completada
//   DELETE /api/tareas/:id                    → Eliminar una tarea (borrado lógico)
//   GET    /api/tareas/incompletas            → Listar tareas incompletas
//   GET    /api/tareas/completas              → Listar tareas completas
//   GET    /api/tareas/categoria/:idCategoria → Listar tareas por categoría
//                                              (opcional: ?estado=completas|incompletas)
//
// Endpoints adicionales útiles:
//   GET    /api/tareas                        → Listar TODAS las tareas activas
//   GET    /api/tareas/:id                    → Obtener una tarea por ID
//
// En Postman (servidor local en el puerto configurado, ej. 3000):
//   POST → http://localhost:3000/api/tareas  (Body → JSON)
//          { "titulo": "Comprar pan", "descripcion": "En la panadería",
//            "categoria": "65f2a1b2c3d4e5f6a7b8c9d0" }
//
// IMPORTANTE: Las rutas fijas (/completas, /incompletas, /categoria/:id)
// DEBEN ir ANTES de /:id para que Express no confunda esos textos
// con un id de tarea.
// ============================================================

const express = require('express');
const router = express.Router();
const {
  crearTarea,
  listarTareas,
  listarCompletadas,
  listarIncompletas,
  listarPorCategoria,
  obtenerTarea,
  actualizarTarea,
  marcarCompletada,
  eliminarTarea
} = require('../controllers/tarea.controller');

// --- Endpoints ---

// POST /api/tareas - Crear una tarea (queda en estado 'incompleto')
router.post('/', crearTarea);

// GET /api/tareas - Listar TODAS las tareas activas
router.get('/', listarTareas);

// GET /api/tareas/completas - Listar tareas completadas
router.get('/completas', listarCompletadas);

// GET /api/tareas/incompletas - Listar tareas pendientes
router.get('/incompletas', listarIncompletas);

// GET /api/tareas/categoria/:idCategoria - Listar tareas de una categoría
router.get('/categoria/:idCategoria', listarPorCategoria);

// GET /api/tareas/:id - Obtener una tarea activa por su ID
router.get('/:id', obtenerTarea);

// PUT /api/tareas/:id - Actualizar una tarea existente
router.put('/:id', actualizarTarea);

// PATCH /api/tareas/:id/completar - Marcar la tarea como completada
router.patch('/:id/completar', marcarCompletada);

// DELETE /api/tareas/:id - Eliminar tarea (borrado lógico)
router.delete('/:id', eliminarTarea);

module.exports = router;
