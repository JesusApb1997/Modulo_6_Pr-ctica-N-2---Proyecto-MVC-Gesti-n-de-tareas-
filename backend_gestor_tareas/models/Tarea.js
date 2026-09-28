// ============================================================
// models/Tarea.js - Modelo de Tarea (Mongoose)
// ============================================================
// Los atributos de una tarea son (según el enunciado):
//   - titulo          (obligatorio)
//   - descripcion     (opcional)
//   - categoria       (referencia a Categoria, obligatoria)
//   - completado      (booleano, por defecto false)
//   - fechaCreacion   (se asigna automáticamente)
//   - fechaEliminacion(null = tarea activa)
//
// BORRADO LÓGICO:
//   Eliminar una tarea NO la borra de la base de datos:
//   solo se le asigna fechaEliminacion y deja de aparecer
//   en las listas (endpoint DELETE /api/tareas/:id).
// ============================================================

const mongoose = require('mongoose');

const tareaSchema = new mongoose.Schema(
  {
    titulo: {
      type: String,
      required: [true, 'El título de la tarea es obligatorio'],
      trim: true,
      maxlength: [150, 'El título no puede superar los 150 caracteres']
    },
    descripcion: {
      type: String,
      trim: true,
      maxlength: [500, 'La descripción no puede superar los 500 caracteres'],
      default: ''
    },
    // Referencia al _id de un documento de la colección 'categorias'
    categoria: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Categoria',
      required: [true, 'La tarea debe pertenecer a una categoría']
    },
    completado: {
      type: Boolean,
      default: false // Al crearse, la tarea queda 'incompleta'
    },
    fechaCreacion: {
      type: Date,
      default: Date.now
    },
    fechaEliminacion: {
      type: Date,
      default: null
    }
  },
  {
    versionKey: false,
    // Las tareas se guardan en la colección creada en MongoDB Atlas
    collection: 'modulo_5_gestion_tareas'
  }
);

const Tarea = mongoose.model('Tarea', tareaSchema);

module.exports = Tarea;
