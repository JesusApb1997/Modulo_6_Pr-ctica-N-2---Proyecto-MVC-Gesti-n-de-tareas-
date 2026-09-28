// ============================================================
// models/Categoria.js - Modelo de Categoría (Mongoose)
// ============================================================
// Los atributos de una categoría son (según el enunciado):
//   - nombre       (obligatorio, único)
//   - descripcion  (opcional)
// ============================================================

const mongoose = require('mongoose');

const categoriaSchema = new mongoose.Schema(
  {
    nombre: {
      type: String,
      required: [true, 'El nombre de la categoría es obligatorio'],
      trim: true,
      maxlength: [80, 'El nombre no puede superar los 80 caracteres'],
      unique: true
    },
    descripcion: {
      type: String,
      trim: true,
      maxlength: [300, 'La descripción no puede superar los 300 caracteres'],
      default: ''
    }
  },
  {
    versionKey: false, // No guardar el campo __v
    collection: 'categorias'
  }
);

// Índice único a nivel de MongoDB sobre el nombre (declarado con unique: true
// en el campo nombre, para evitar duplicados)

const Categoria = mongoose.model('Categoria', categoriaSchema);

module.exports = Categoria;
