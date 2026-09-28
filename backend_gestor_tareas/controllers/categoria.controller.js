// ============================================================
// controllers/categoria.controller.js - Controlador de Categorías
// ============================================================
// Funciones (controladores):
//   crearCategoria      → POST   /api/categorias
//   listarCategorias    → GET    /api/categorias
//   obtenerCategoria    → GET    /api/categorias/:id
//   actualizarCategoria → PUT    /api/categorias/:id
//   eliminarCategoria   → DELETE /api/categorias/:id
//
// Validaciones aplicadas:
//   - El nombre es obligatorio, no puede ir vacío y no debe repetirse.
//   - La descripción es opcional.
//   - El :id debe ser un ObjectId válido de MongoDB.
//   - No se puede eliminar una categoría que tenga tareas asignadas.
// ============================================================

const mongoose = require('mongoose');
const Categoria = require('../models/Categoria');
const Tarea = require('../models/Tarea');

// Helper: comprobar que un id sea un ObjectId válido de MongoDB
const esIdValido = (id) => mongoose.Types.ObjectId.isValid(id);

// 1. POST /api/categorias - Crear una categoría
const crearCategoria = async (req, res) => {
  const { nombre, descripcion } = req.body;

  // Validación 1: el nombre es obligatorio y no puede ir vacío
  if (nombre === undefined || String(nombre).trim() === '') {
    return res.status(400).json({ error: 'El nombre de la categoría es obligatorio' });
  }

  // Validación 2: no puede existir otra categoría con el mismo nombre
  const nombreNormalizado = String(nombre).trim().toLowerCase();
  const duplicada = await Categoria.findOne({
    nombre: { $regex: `^${nombreNormalizado.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, $options: 'i' }
  });

  if (duplicada) {
    return res.status(400).json({ error: `Ya existe una categoría con el nombre "${nombre}"` });
  }

  // Crear y guardar la categoría
  const nuevaCategoria = new Categoria({
    nombre: String(nombre).trim(),
    descripcion: descripcion !== undefined ? String(descripcion).trim() : ''
  });

  const categoriaGuardada = await nuevaCategoria.save();

  res.status(201).json({
    mensaje: 'Categoría creada exitosamente',
    categoria: categoriaGuardada
  });
};

// 2. GET /api/categorias - Listar todas las categorías
const listarCategorias = async (req, res) => {
  const categorias = await Categoria.find().sort({ nombre: 1 });

  res.json({
    total: categorias.length,
    categorias
  });
};

// 3. GET /api/categorias/:id - Obtener una categoría por su ID
const obtenerCategoria = async (req, res) => {
  const { id } = req.params;

  // Validación: el id debe ser un ObjectId válido
  if (!esIdValido(id)) {
    return res.status(400).json({ error: 'El id de la categoría no es válido' });
  }

  const categoria = await Categoria.findById(id);

  if (!categoria) {
    return res.status(404).json({ error: 'Categoría no encontrada' });
  }

  res.json({ categoria });
};

// 4. PUT /api/categorias/:id - Actualizar una categoría existente
const actualizarCategoria = async (req, res) => {
  const { id } = req.params;
  const { nombre, descripcion } = req.body;

  // Validación: el id debe ser un ObjectId válido
  if (!esIdValido(id)) {
    return res.status(400).json({ error: 'El id de la categoría no es válido' });
  }

  const categoria = await Categoria.findById(id);
  if (!categoria) {
    return res.status(404).json({ error: 'Categoría no encontrada' });
  }

  // Validación: debe enviarse al menos un campo para actualizar
  if (nombre === undefined && descripcion === undefined) {
    return res.status(400).json({ error: 'No se recibieron campos para actualizar' });
  }

  // Validación: si se envía nombre, no puede ir vacío
  if (nombre !== undefined && String(nombre).trim() === '') {
    return res.status(400).json({ error: 'El nombre de la categoría no puede estar vacío' });
  }

  // Validación: el nuevo nombre no debe pertenecer a otra categoría
  if (nombre !== undefined && String(nombre).trim() !== categoria.nombre) {
    const duplicada = await Categoria.findOne({
      nombre: { $regex: `^${String(nombre).trim().toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, $options: 'i' }
    });

    if (duplicada) {
      return res.status(400).json({ error: `Ya existe otra categoría con el nombre "${nombre}"` });
    }
  }

  // Aplicar los cambios
  if (nombre !== undefined) categoria.nombre = String(nombre).trim();
  if (descripcion !== undefined) categoria.descripcion = String(descripcion).trim();

  const categoriaActualizada = await categoria.save();

  res.json({
    mensaje: 'Categoría actualizada exitosamente',
    categoria: categoriaActualizada
  });
};

// 5. DELETE /api/categorias/:id - Eliminar una categoría
const eliminarCategoria = async (req, res) => {
  const { id } = req.params;

  // Validación: el id debe ser un ObjectId válido
  if (!esIdValido(id)) {
    return res.status(400).json({ error: 'El id de la categoría no es válido' });
  }

  const categoria = await Categoria.findById(id);
  if (!categoria) {
    return res.status(404).json({ error: 'Categoría no encontrada' });
  }

  // Validación: no se puede eliminar una categoría con tareas ACTIVAS asignadas.
  // Las tareas borradas (fechaEliminacion != null) ya no se muestran en la app,
  // por lo que no impiden eliminar la categoría.
  const tieneTareasActivas = await Tarea.findOne({ categoria: id, fechaEliminacion: null });
  if (tieneTareasActivas) {
    return res.status(400).json({
      error: 'No se puede eliminar la categoría porque tiene tareas activas asignadas. Reasigna o elimina primero sus tareas.'
    });
  }

  await Categoria.findByIdAndDelete(id);

  res.json({ mensaje: 'Categoría eliminada exitosamente' });
};

module.exports = {
  crearCategoria,
  listarCategorias,
  obtenerCategoria,
  actualizarCategoria,
  eliminarCategoria
};
