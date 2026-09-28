
// routes/categorias.routes.js - Rutas de la API para Categorías

// Resumen de endpoints:
//   POST   /api/categorias          → Crear una categoría
//   GET    /api/categorias          → Listar todas las categorías
//   GET    /api/categorias/:id      → Obtener una categoría por ID
//   PUT    /api/categorias/:id      → Actualizar una categoría
//   DELETE /api/categorias/:id      → Eliminar una categoría
//
// En Postman (servidor local en el puerto configurado, ej. 3000):
//   POST   → http://localhost:3000/api/categorias  (Body → JSON)
//            { "nombre": "Personal", "descripcion": "Tareas del hogar" }
//   GET    → http://localhost:3000/api/categorias


const express = require('express');
const router = express.Router();
const {
  crearCategoria,
  listarCategorias,
  obtenerCategoria,
  actualizarCategoria,
  eliminarCategoria
} = require('../controllers/categoria.controller');

// --- Endpoints ---

// POST /api/categorias - Crear una categoría
router.post('/', crearCategoria);

// GET /api/categorias - Listar todas las categorías
router.get('/', listarCategorias);

// GET /api/categorias/:id - Obtener una categoría por su ID
router.get('/:id', obtenerCategoria);

// PUT /api/categorias/:id - Actualizar una categoría
router.put('/:id', actualizarCategoria);

// DELETE /api/categorias/:id - Eliminar una categoría
router.delete('/:id', eliminarCategoria);

module.exports = router;
