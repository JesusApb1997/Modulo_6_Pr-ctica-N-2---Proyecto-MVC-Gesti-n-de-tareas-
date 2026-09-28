// ============================================================
// controllers/categoria.web.controller.js - Controlador WEB de Categorías
// ============================================================
// Controladores que atienden las VISTAS (EJS) para el CRUD de categorías.
// Las rutas coinciden con las que pedía el backend del Módulo 5:
//
//   listarCategorias    → GET    /categorias
//   formularioNueva     → GET    /categorias/nueva
//   crearCategoria      → POST   /categorias
//   formularioEditar    → GET    /categorias/:id/editar
//   actualizarCategoria → PUT    /categorias/:id
//   eliminarCategoria   → DELETE /categorias/:id
//
// Validaciones aplicadas (mismas reglas que la API):
//   - Nombre obligatorio, no vacío y único (insensible a mayúsculas).
//   - El :id debe ser un ObjectId válido de MongoDB.
//   - No se puede eliminar una categoría con tareas ACTIVAS asignadas.
// ============================================================

const mongoose = require('mongoose');
const Categoria = require('../models/Categoria');
const Tarea = require('../models/Tarea');

// Helper: comprobar que un id sea un ObjectId válido de MongoDB
const esIdValido = (id) => mongoose.Types.ObjectId.isValid(id);

// Helper: escapar caracteres especiales para usar el nombre en un $regex
const escaparRegex = (texto) => String(texto).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Helper: buscar duplicados por nombre (insensible a mayúsculas)
const buscarDuplicada = (nombre) =>
  Categoria.findOne({
    nombre: { $regex: `^${escaparRegex(String(nombre).trim())}$`, $options: 'i' }
  });

// ---------------------------------------------------------------------------
// GET /categorias — listar todas las categorías
// ---------------------------------------------------------------------------
const listarCategorias = async (req, res, next) => {
  try {
    const categorias = await Categoria.find().sort({ nombre: 1 });

    // Mensaje informativo cuando la categoría no pudo eliminarse
    // (tiene tareas activas asignadas)
    const errorEliminar = req.query.errorEliminar || null;

    res.render('categorias/index', {
      titulo: 'Categorías',
      categorias,
      errorEliminar
    });
  } catch (error) {
    next(error);
  }
};

// ---------------------------------------------------------------------------
// GET /categorias/nueva — formulario de creación
// ---------------------------------------------------------------------------
const formularioNueva = (req, res) => {
  res.render('categorias/form', {
    titulo: 'Nueva categoría',
    modo: 'crear',
    categorias: null,
    errores: [],
    datos: { nombre: '', descripcion: '' }
  });
};

// ---------------------------------------------------------------------------
// POST /categorias — crear una categoría
// ---------------------------------------------------------------------------
const crearCategoria = async (req, res, next) => {
  try {
    const { nombre, descripcion } = req.body;
    const errores = [];

    // Validación 1: nombre obligatorio
    if (!nombre || String(nombre).trim() === '') {
      errores.push('El nombre de la categoría es obligatorio.');
    } else {
      // Validación 2: nombre único (insensible a mayúsculas)
      const duplicada = await buscarDuplicada(nombre);
      if (duplicada) {
        errores.push(`Ya existe una categoría con el nombre "${String(nombre).trim()}".`);
      }
    }

    if (errores.length > 0) {
      return res.status(400).render('categorias/form', {
        titulo: 'Nueva categoría',
        modo: 'crear',
        categorias: null,
        errores,
        datos: { nombre: nombre || '', descripcion: descripcion || '' }
      });
    }

    await Categoria.create({
      nombre: String(nombre).trim(),
      descripcion: descripcion ? String(descripcion).trim() : ''
    });

    res.redirect('/categorias?creada=1');
  } catch (error) {
    next(error);
  }
};

// ---------------------------------------------------------------------------
// GET /categorias/:id/editar — formulario de edición
// ---------------------------------------------------------------------------
const formularioEditar = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Validación: id con formato válido
    if (!esIdValido(id)) {
      return res.status(400).render('error', {
        titulo: 'Identificador no válido',
        mensaje: 'El id de la categoría no tiene el formato correcto.',
        codigo: 400
      });
    }

    const categoria = await Categoria.findById(id);
    if (!categoria) {
      return res.status(404).render('error', {
        titulo: 'Categoría no encontrada',
        mensaje: 'La categoría indicada no existe.',
        codigo: 404
      });
    }

    res.render('categorias/form', {
      titulo: 'Editar categoría',
      modo: 'editar',
      categoria,
      errores: [],
      datos: { nombre: categoria.nombre, descripcion: categoria.descripcion }
    });
  } catch (error) {
    next(error);
  }
};

// ---------------------------------------------------------------------------
// PUT /categorias/:id — actualizar una categoría
// ---------------------------------------------------------------------------
const actualizarCategoria = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { nombre, descripcion } = req.body;

    // Validación: id con formato válido
    if (!esIdValido(id)) {
      return res.status(400).render('error', {
        titulo: 'Identificador no válido',
        mensaje: 'El id de la categoría no tiene el formato correcto.',
        codigo: 400
      });
    }

    const categoria = await Categoria.findById(id);
    if (!categoria) {
      return res.status(404).render('error', {
        titulo: 'Categoría no encontrada',
        mensaje: 'La categoría indicada no existe.',
        codigo: 404
      });
    }

    const errores = [];
    if (!nombre || String(nombre).trim() === '') {
      errores.push('El nombre de la categoría es obligatorio.');
    } else if (String(nombre).trim().toLowerCase() !== String(categoria.nombre).toLowerCase()) {
      // Validación: el nuevo nombre no debe pertenecer a OTRA categoría
      const duplicada = await buscarDuplicada(nombre);
      if (duplicada) {
        errores.push(`Ya existe otra categoría con el nombre "${String(nombre).trim()}".`);
      }
    }

    if (errores.length > 0) {
      return res.status(400).render('categorias/form', {
        titulo: 'Editar categoría',
        modo: 'editar',
        categoria,
        errores,
        datos: { nombre: nombre || '', descripcion: descripcion || '' }
      });
    }

    // Aplicar los cambios y guardar
    categoria.nombre = String(nombre).trim();
    categoria.descripcion = descripcion ? String(descripcion).trim() : '';
    await categoria.save();

    res.redirect('/categorias?actualizada=1');
  } catch (error) {
    next(error);
  }
};

// ---------------------------------------------------------------------------
// DELETE /categorias/:id — eliminar una categoría
// ---------------------------------------------------------------------------
const eliminarCategoria = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Validación: id con formato válido
    if (!esIdValido(id)) {
      return res.redirect('/categorias?errorEliminar=1');
    }

    // No se puede eliminar una categoría con tareas ACTIVAS asignadas.
    // (las tareas borradas — fechaEliminacion != null — ya no se muestran)
    const tieneTareasActivas = await Tarea.findOne({ categoria: id, fechaEliminacion: null });
    if (tieneTareasActivas) {
      return res.redirect('/categorias?errorEliminar=1');
    }

    await Categoria.findByIdAndDelete(id);

    res.redirect('/categorias?eliminada=1');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  listarCategorias,
  formularioNueva,
  crearCategoria,
  formularioEditar,
  actualizarCategoria,
  eliminarCategoria
};
