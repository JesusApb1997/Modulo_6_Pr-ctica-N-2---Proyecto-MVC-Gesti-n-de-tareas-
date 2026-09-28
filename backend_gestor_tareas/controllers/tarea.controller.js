// ============================================================
// controllers/tarea.controller.js - Controlador de Tareas
// ============================================================
// Funciones (controladores):
//   crearTarea        → POST   /api/tareas
//   listarTareas      → GET    /api/tareas
//   listarCompletadas → GET    /api/tareas/completas
//   listarIncompletas → GET    /api/tareas/incompletas
//   listarPorCategoria→ GET    /api/tareas/categoria/:idCategoria
//   obtenerTarea      → GET    /api/tareas/:id
//   actualizarTarea   → PUT    /api/tareas/:id
//   marcarCompletada  → PATCH  /api/tareas/:id/completar
//   eliminarTarea     → DELETE /api/tareas/:id
//
// Reglas aplicadas:
//   - Las listas solo devuelven tareas ACTIVAS (fechaEliminacion = null).
//   - Una tarea nueva se crea SIEMPRE 'incompleta' (completado = false).
//   - La categoría debe existir en la base de datos.
//   - DELETE hace un BORRADO LÓGICO: asigna fechaEliminacion.
// ============================================================

const mongoose = require('mongoose');
const Tarea = require('../models/Tarea');
const Categoria = require('../models/Categoria');

// Filtro base: solo tareas activas (no eliminadas)
const soloActivas = { fechaEliminacion: null };

// Helper: comprobar que un id sea un ObjectId válido de MongoDB
const esIdValido = (id) => mongoose.Types.ObjectId.isValid(id);

// 1. POST /api/tareas - Crear una tarea (queda 'incompleta')
const crearTarea = async (req, res) => {
  const { titulo, descripcion, categoria } = req.body;

  // Validación 1: el título es obligatorio y no puede ir vacío
  if (titulo === undefined || String(titulo).trim() === '') {
    return res.status(400).json({ error: 'El título de la tarea es obligatorio' });
  }

  // Validación 2: la categoría es obligatoria y debe ser un ObjectId válido
  if (!categoria) {
    return res.status(400).json({ error: 'La tarea debe pertenecer a una categoría' });
  }
  if (!esIdValido(categoria)) {
    return res.status(400).json({ error: 'El id de la categoría no es válido' });
  }

  // Validación 3: la categoría debe existir en la base de datos
  const categoriaExiste = await Categoria.findById(categoria);
  if (!categoriaExiste) {
    return res.status(400).json({ error: 'La categoría indicada no existe' });
  }

  // Validación 4 (opcional): la descripción, si llega, debe ser texto
  if (descripcion !== undefined && typeof descripcion !== 'string') {
    return res.status(400).json({ error: 'La descripción debe ser un texto' });
  }

  // Crear la tarea. Se fuerza completado: false (estado 'incompleto')
  const nuevaTarea = new Tarea({
    titulo: String(titulo).trim(),
    descripcion: descripcion !== undefined ? String(descripcion).trim() : '',
    categoria,
    completado: false
  });

  const tareaGuardada = await nuevaTarea.save();

  // Devolver la tarea con los datos de su categoría
  const tareaConCategoria = await tareaGuardada.populate('categoria', 'nombre descripcion');

  res.status(201).json({
    mensaje: 'Tarea creada exitosamente',
    tarea: tareaConCategoria
  });
};

// 2. GET /api/tareas - Listar TODAS las tareas activas
const listarTareas = async (req, res) => {
  const tareas = await Tarea.find(soloActivas)
    .populate('categoria', 'nombre descripcion')
    .sort({ fechaCreacion: -1 });

  res.json({
    total: tareas.length,
    tareas
  });
};

// 3. GET /api/tareas/completas - Listar las tareas completadas
const listarCompletadas = async (req, res) => {
  const tareas = await Tarea.find({ ...soloActivas, completado: true })
    .populate('categoria', 'nombre descripcion')
    .sort({ fechaCreacion: -1 });

  res.json({
    total: tareas.length,
    tareas
  });
};

// 4. GET /api/tareas/incompletas - Listar las tareas pendientes
const listarIncompletas = async (req, res) => {
  const tareas = await Tarea.find({ ...soloActivas, completado: false })
    .populate('categoria', 'nombre descripcion')
    .sort({ fechaCreacion: -1 });

  res.json({
    total: tareas.length,
    tareas
  });
};

// 5. GET /api/tareas/categoria/:idCategoria - Listar tareas de una categoría
//    Opcional: ?estado=completas | ?estado=incompletas para filtrar
const listarPorCategoria = async (req, res) => {
  const { idCategoria } = req.params;
  const { estado } = req.query;

  // Validación 1: id de categoría válido
  if (!esIdValido(idCategoria)) {
    return res.status(400).json({ error: 'El id de la categoría no es válido' });
  }

  // Validación 2: la categoría debe existir
  const categoria = await Categoria.findById(idCategoria);
  if (!categoria) {
    return res.status(404).json({ error: 'Categoría no encontrada' });
  }

  // Validación 3: el filtro de estado solo admite dos valores
  let filtro = { ...soloActivas, categoria: idCategoria };
  if (estado !== undefined) {
    if (estado === 'completas') {
      filtro.completado = true;
    } else if (estado === 'incompletas') {
      filtro.completado = false;
    } else {
      return res.status(400).json({
        error: 'El parámetro estado solo admite los valores: completas | incompletas'
      });
    }
  }

  const tareas = await Tarea.find(filtro)
    .populate('categoria', 'nombre descripcion')
    .sort({ fechaCreacion: -1 });

  res.json({
    categoria: {
      _id: categoria._id,
      nombre: categoria.nombre,
      descripcion: categoria.descripcion
    },
    total: tareas.length,
    tareas
  });
};

// 6. GET /api/tareas/:id - Obtener una tarea activa por su ID
const obtenerTarea = async (req, res) => {
  const { id } = req.params;

  // Validación: el id debe ser un ObjectId válido
  if (!esIdValido(id)) {
    return res.status(400).json({ error: 'El id de la tarea no es válido' });
  }

  const tarea = await Tarea.findOne({ _id: id, ...soloActivas })
    .populate('categoria', 'nombre descripcion');

  if (!tarea) {
    return res.status(404).json({ error: 'Tarea no encontrada o ya eliminada' });
  }

  res.json({ tarea });
};

// 7. PUT /api/tareas/:id - Actualizar una tarea existente
const actualizarTarea = async (req, res) => {
  const { id } = req.params;
  const { titulo, descripcion, categoria, completado } = req.body;

  // Validación: el id debe ser un ObjectId válido
  if (!esIdValido(id)) {
    return res.status(400).json({ error: 'El id de la tarea no es válido' });
  }

  const tarea = await Tarea.findOne({ _id: id, ...soloActivas });
  if (!tarea) {
    return res.status(404).json({ error: 'Tarea no encontrada o ya eliminada' });
  }

  // Validación: debe enviarse al menos un campo para actualizar
  if (titulo === undefined && descripcion === undefined && categoria === undefined && completado === undefined) {
    return res.status(400).json({ error: 'No se recibieron campos para actualizar' });
  }

  // Validación: título no vacío si se envía
  if (titulo !== undefined && String(titulo).trim() === '') {
    return res.status(400).json({ error: 'El título de la tarea no puede estar vacío' });
  }

  // Validación: descripción debe ser texto si se envía
  if (descripcion !== undefined && typeof descripcion !== 'string') {
    return res.status(400).json({ error: 'La descripción debe ser un texto' });
  }

  // Validación: completado debe ser booleano si se envía
  if (completado !== undefined && typeof completado !== 'boolean') {
    return res.status(400).json({ error: 'El campo completado debe ser true o false' });
  }

  // Validación: si se cambia la categoría, debe existir
  if (categoria !== undefined) {
    if (!esIdValido(categoria)) {
      return res.status(400).json({ error: 'El id de la categoría no es válido' });
    }
    const categoriaExiste = await Categoria.findById(categoria);
    if (!categoriaExiste) {
      return res.status(400).json({ error: 'La categoría indicada no existe' });
    }
  }

  // Aplicar los cambios permitidos
  if (titulo !== undefined) tarea.titulo = String(titulo).trim();
  if (descripcion !== undefined) tarea.descripcion = String(descripcion).trim();
  if (categoria !== undefined) tarea.categoria = categoria;
  if (completado !== undefined) tarea.completado = completado;

  const tareaActualizada = await tarea.save();
  const tareaConCategoria = await tareaActualizada.populate('categoria', 'nombre descripcion');

  res.json({
    mensaje: 'Tarea actualizada exitosamente',
    tarea: tareaConCategoria
  });
};

// 8. PATCH /api/tareas/:id/completar - Marcar una tarea como 'completada'
const marcarCompletada = async (req, res) => {
  const { id } = req.params;

  // Validación: el id debe ser un ObjectId válido
  if (!esIdValido(id)) {
    return res.status(400).json({ error: 'El id de la tarea no es válido' });
  }

  const tarea = await Tarea.findOne({ _id: id, ...soloActivas });
  if (!tarea) {
    return res.status(404).json({ error: 'Tarea no encontrada o ya eliminada' });
  }

  // Si ya estaba completada, se informa pero no falla (operación idempotente)
  const yaEstabaCompletada = tarea.completado;
  if (!tarea.completado) {
    tarea.completado = true;
    await tarea.save();
  }

  const tareaConCategoria = await tarea.populate('categoria', 'nombre descripcion');

  res.json({
    mensaje: yaEstabaCompletada
      ? 'La tarea ya estaba completada'
      : 'Tarea marcada como completada',
    tarea: tareaConCategoria
  });
};

// 9. DELETE /api/tareas/:id - Eliminar una tarea (BORRADO LÓGICO)
const eliminarTarea = async (req, res) => {
  const { id } = req.params;

  // Validación: el id debe ser un ObjectId válido
  if (!esIdValido(id)) {
    return res.status(400).json({ error: 'El id de la tarea no es válido' });
  }

  // Buscar una tarea activa. Si ya tenía fechaEliminacion, se considera inexistente
  const tarea = await Tarea.findOne({ _id: id, ...soloActivas });
  if (!tarea) {
    return res.status(404).json({ error: 'Tarea no encontrada o ya eliminada' });
  }

  // Borrado lógico: asignar la fecha de eliminación (no se borra el documento)
  tarea.fechaEliminacion = new Date();
  await tarea.save();

  res.json({
    mensaje: 'Tarea eliminada correctamente',
    tarea
  });
};

module.exports = {
  crearTarea,
  listarTareas,
  listarCompletadas,
  listarIncompletas,
  listarPorCategoria,
  obtenerTarea,
  actualizarTarea,
  marcarCompletada,
  eliminarTarea
};
