// ============================================================
// controllers/tarea.web.controller.js - Controlador WEB de Tareas
// ============================================================
// Controladores que atienden las VISTAS (EJS) del proyecto MVC.
// Las rutas coinciden con las que pedía el backend del Módulo 5:
//
//   listarTareas        → GET    /tareas                 (?filtro=todas|completas|incompletas)
//   listarCompletadas   → GET    /tareas/completas
//   listarIncompletas   → GET    /tareas/incompletas
//   listarPorCategoria  → GET    /tareas/categoria/:idCategoria
//   formularioNueva     → GET    /tareas/nueva
//   crearTarea          → POST   /tareas                 (queda incompleta)
//   formularioEditar    → GET    /tareas/:id/editar
//   actualizarTarea     → PUT    /tareas/:id
//   marcarCompletada    → PATCH  /tareas/:id/completar
//   eliminarTarea       → DELETE /tareas/:id             (borrado lógico)
//
// Reglas (validaciones correspondientes, según el enunciado):
//   - Título obligatorio y no vacío.
//   - Categoría obligatoria, ObjectId válido y existente.
//   - Una tarea nueva se crea SIEMPRE 'incompleta' (completado = false).
//   - Las listas solo muestran tareas ACTIVAS (fechaEliminacion = null).
//   - DELETE hace BORRADO LÓGICO (asigna fechaEliminacion).
//   - Ante un error, se re-renderiza el formulario conservando lo escrito.
// ============================================================

const mongoose = require('mongoose');
const Tarea = require('../models/Tarea');
const Categoria = require('../models/Categoria');

// Filtro base: solo tareas activas (no eliminadas)
const soloActivas = { fechaEliminacion: null };

// Helper: comprobar que un id sea un ObjectId válido de MongoDB
const esIdValido = (id) => mongoose.Types.ObjectId.isValid(id);

// Helper: opciones comunes para todas las vistas del gestor
const cargarCategorias = () => Categoria.find().sort({ nombre: 1 });

// ---------------------------------------------------------------------------
// GET /tareas (con ?filtro=todas|completas|incompletas)
// GET /tareas/completas
// GET /tareas/incompletas
// ---------------------------------------------------------------------------
const listarTareas = async (req, res, next) => {
  try {
    const filtro = req.query.filtro || 'todas';

    let query = { ...soloActivas };
    if (filtro === 'completas') query.completado = true;
    if (filtro === 'incompletas') query.completado = false;

    const [tareas, categorias] = await Promise.all([
      Tarea.find(query).populate('categoria', 'nombre').sort({ fechaCreacion: -1 }),
      cargarCategorias()
    ]);

    res.render('tareas/index', {
      titulo: 'Gestor de Tareas',
      tareas,
      categorias,
      filtroActual: filtro
    });
  } catch (error) {
    next(error);
  }
};

// GET /tareas/completas — alias con filtro fijo
const listarCompletadas = (req, res) => {
  req.query.filtro = 'completas';
  listarTareas(req, res);
};

// GET /tareas/incompletas — alias con filtro fijo
const listarIncompletas = (req, res) => {
  req.query.filtro = 'incompletas';
  listarTareas(req, res);
};

// ---------------------------------------------------------------------------
// GET /tareas/categoria/:idCategoria — tareas de una categoría
// (opcional: ?estado=completas|incompletas)
// ---------------------------------------------------------------------------
const listarPorCategoria = async (req, res, next) => {
  try {
    const { idCategoria } = req.params;
    const { estado } = req.query;

    // Validación 1: id de categoría válido
    if (!esIdValido(idCategoria)) {
      return res.status(400).render('error', {
        titulo: 'Identificador no válido',
        mensaje: 'El id de la categoría no tiene el formato correcto.',
        codigo: 400
      });
    }

    // Validación 2: la categoría debe existir
    const categoria = await Categoria.findById(idCategoria);
    if (!categoria) {
      return res.status(404).render('error', {
        titulo: 'Categoría no encontrada',
        mensaje: 'La categoría indicada no existe.',
        codigo: 404
      });
    }

    // Validación 3: filtro de estado (solo dos valores permitidos)
    let query = { ...soloActivas, categoria: idCategoria };
    if (estado === 'completas') query.completado = true;
    if (estado === 'incompletas') query.completado = false;

    const [tareas, categorias] = await Promise.all([
      Tarea.find(query).populate('categoria', 'nombre').sort({ fechaCreacion: -1 }),
      cargarCategorias()
    ]);

    // Reutiliza la misma vista de listado resaltando la categoría elegida
    res.render('tareas/index', {
      titulo: `Tareas — ${categoria.nombre}`,
      tareas,
      categorias,
      filtroActual: estado || 'todas',
      categoriaActual: { _id: categoria._id, nombre: categoria.nombre }
    });
  } catch (error) {
    next(error);
  }
};

// ---------------------------------------------------------------------------
// GET /tareas/nueva — formulario de creación
// ---------------------------------------------------------------------------
const formularioNueva = async (req, res, next) => {
  try {
    const categorias = await cargarCategorias();

    // Si no hay categorías, la tarea no puede crearse (categoria es obligatoria):
    // se avisa en la misma vista para que el usuario cree una primero.
    res.render('tareas/nueva', {
      titulo: 'Nueva tarea',
      categorias,
      errores: [],
      datos: { titulo: '', descripcion: '', categoria: '' }
    });
  } catch (error) {
    next(error);
  }
};

// ---------------------------------------------------------------------------
// POST /tareas — crear una tarea (siempre queda 'incompleta')
// ---------------------------------------------------------------------------
const crearTarea = async (req, res, next) => {
  try {
    const { titulo, descripcion, categoria } = req.body;
    const errores = [];

    // Validación 1: título obligatorio
    if (!titulo || String(titulo).trim() === '') {
      errores.push('El título de la tarea es obligatorio.');
    }

    // Validación 2: categoría obligatoria y con formato válido
    if (!categoria) {
      errores.push('La tarea debe pertenecer a una categoría.');
    } else if (!esIdValido(categoria)) {
      errores.push('El id de la categoría no es válido.');
    }

    // Validación 3: la categoría debe existir en la base de datos
    let categoriaDoc = null;
    if (errores.length === 0) {
      categoriaDoc = await Categoria.findById(categoria);
      if (!categoriaDoc) errores.push('La categoría indicada no existe.');
    }

    // Si hay errores de validación: se vuelve a mostrar el formulario
    if (errores.length > 0) {
      const categorias = await cargarCategorias();
      return res.status(400).render('tareas/nueva', {
        titulo: 'Nueva tarea',
        categorias,
        errores,
        datos: { titulo: titulo || '', descripcion: descripcion || '', categoria: categoria || '' }
      });
    }

    // Crear la tarea. completado se fuerza a false (estado 'incompleto')
    await Tarea.create({
      titulo: String(titulo).trim(),
      descripcion: descripcion ? String(descripcion).trim() : '',
      categoria,
      completado: false
    });

    // PRG (Post-Redirect-Get): redirige al listado con mensaje de éxito
    res.redirect('/tareas?creada=1');
  } catch (error) {
    next(error);
  }
};

// ---------------------------------------------------------------------------
// GET /tareas/:id/editar — formulario de edición
// ---------------------------------------------------------------------------
const formularioEditar = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Validación: id con formato válido
    if (!esIdValido(id)) {
      return res.status(400).render('error', {
        titulo: 'Identificador no válido',
        mensaje: 'El id de la tarea no tiene el formato correcto.',
        codigo: 400
      });
    }

    const [tarea, categorias] = await Promise.all([
      Tarea.findOne({ _id: id, ...soloActivas }),
      cargarCategorias()
    ]);

    // La tarea debe existir y estar activa (no eliminada)
    if (!tarea) {
      return res.status(404).render('error', {
        titulo: 'Tarea no encontrada',
        mensaje: 'La tarea no existe o ya fue eliminada.',
        codigo: 404
      });
    }

    res.render('tareas/editar', {
      titulo: 'Editar tarea',
      tarea,
      categorias,
      errores: [],
      datos: {
        titulo: tarea.titulo,
        descripcion: tarea.descripcion,
        categoria: tarea.categoria ? tarea.categoria.toString() : ''
      }
    });
  } catch (error) {
    next(error);
  }
};

// ---------------------------------------------------------------------------
// PUT /tareas/:id — actualizar una tarea existente
// ---------------------------------------------------------------------------
const actualizarTarea = async (req, res, next) => {
  const { id } = req.params;
  const { titulo, descripcion, categoria } = req.body;

  try {
    // Validación: id con formato válido
    if (!esIdValido(id)) {
      return res.status(400).render('error', {
        titulo: 'Identificador no válido',
        mensaje: 'El id de la tarea no tiene el formato correcto.',
        codigo: 400
      });
    }

    const tarea = await Tarea.findOne({ _id: id, ...soloActivas });
    if (!tarea) {
      return res.status(404).render('error', {
        titulo: 'Tarea no encontrada',
        mensaje: 'La tarea no existe o ya fue eliminada.',
        codigo: 404
      });
    }

    // Validaciones (iguales a las del POST)
    const errores = [];
    if (!titulo || String(titulo).trim() === '') {
      errores.push('El título de la tarea es obligatorio.');
    }
    if (!categoria) {
      errores.push('La tarea debe pertenecer a una categoría.');
    } else if (!esIdValido(categoria)) {
      errores.push('El id de la categoría no es válido.');
    }

    let categoriaDoc = null;
    if (errores.length === 0) {
      categoriaDoc = await Categoria.findById(categoria);
      if (!categoriaDoc) errores.push('La categoría indicada no existe.');
    }

    if (errores.length > 0) {
      const categorias = await cargarCategorias();
      return res.status(400).render('tareas/editar', {
        titulo: 'Editar tarea',
        tarea,
        categorias,
        errores,
        datos: { titulo: titulo || '', descripcion: descripcion || '', categoria: categoria || '' }
      });
    }

    // Aplicar los cambios y guardar
    tarea.titulo = String(titulo).trim();
    tarea.descripcion = descripcion ? String(descripcion).trim() : '';
    tarea.categoria = categoria;
    await tarea.save();

    res.redirect('/tareas?actualizada=1');
  } catch (error) {
    next(error);
  }
};

// ---------------------------------------------------------------------------
// PATCH /tareas/:id/completar — marcar una tarea como 'completada'
// ---------------------------------------------------------------------------
const marcarCompletada = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Validación: id con formato válido
    if (!esIdValido(id)) {
      return res.status(400).render('error', {
        titulo: 'Identificador no válido',
        mensaje: 'El id de la tarea no tiene el formato correcto.',
        codigo: 400
      });
    }

    const tarea = await Tarea.findOne({ _id: id, ...soloActivas });
    if (!tarea) {
      return res.status(404).render('error', {
        titulo: 'Tarea no encontrada',
        mensaje: 'La tarea no existe o ya fue eliminada.',
        codigo: 404
      });
    }

    // Se marca como completada (si ya lo estaba, no cambia nada: idempotente)
    if (!tarea.completado) {
      tarea.completado = true;
      await tarea.save();
    }

    // Vuelve al listado desde donde se hizo la petición (si es posible)
    const volver = req.get('Referer') || '/tareas';
    res.redirect(volver);
  } catch (error) {
    next(error);
  }
};

// ---------------------------------------------------------------------------
// DELETE /tareas/:id — eliminar una tarea (BORRADO LÓGICO)
// ---------------------------------------------------------------------------
const eliminarTarea = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Validación: id con formato válido
    if (!esIdValido(id)) {
      return res.status(400).render('error', {
        titulo: 'Identificador no válido',
        mensaje: 'El id de la tarea no tiene el formato correcto.',
        codigo: 400
      });
    }

    // Borrado lógico: solo se asigna fechaEliminacion (no se borra el documento)
    const tarea = await Tarea.findOneAndUpdate(
      { _id: id, fechaEliminacion: null },
      { fechaEliminacion: new Date() }
    );

    if (!tarea) {
      return res.status(404).render('error', {
        titulo: 'Tarea no encontrada',
        mensaje: 'La tarea no existe o ya fue eliminada.',
        codigo: 404
      });
    }

    const volver = req.get('Referer') || '/tareas';
    res.redirect(volver);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  listarTareas,
  listarCompletadas,
  listarIncompletas,
  listarPorCategoria,
  formularioNueva,
  crearTarea,
  formularioEditar,
  actualizarTarea,
  marcarCompletada,
  eliminarTarea
};
