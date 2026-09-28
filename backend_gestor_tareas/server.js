// ============================================================
// server.js - Servidor principal (FullStack MVC) — Módulo 6.1
//             Gestor de Tareas: Express + EJS + Tailwind + MongoDB
// ============================================================
// Para ejecutar:
//   npm run dev    (arranca nodemon + compilación Tailwind en vivo)
//   npm start      (arranca con node)
//
// Arquitectura MVC del proyecto:
//   server.js                    → Entrada: middlewares, rutas, conexión MongoDB
//   models/                      → MODELOS   (esquemas de MongoDB: Tarea, Categoria)
//   views/                       → VISTAS    (plantillas EJS + Tailwind CSS)
//   controllers/                 → CONTROLADORES (API REST + lógica de vistas)
//   routes/                      → Rutas de la API y de las páginas web
//   public/                      → Archivos estáticos (css compilado, imágenes)
// ============================================================

// --- Dependencias ---
// override: true → el .env tiene prioridad sobre variables del sistema
// (evita que un PORT definido fuera del proyecto pise el puerto del .env)
require('dotenv').config({ override: true });
const path = require('path');
const express = require('express');
const cors = require('cors');
const methodOverride = require('method-override');
const expressLayouts = require('express-ejs-layouts');
const mongoose = require('mongoose');
const dns = require('dns');

// Servidores DNS públicos (ayudan a resolver los registros SRV de Atlas)
dns.setServers(['8.8.8.8', '8.8.4.4']);

// --- Importar rutas ---
const categoriasApiRoutes = require('./routes/categorias.routes');
const tareasApiRoutes = require('./routes/tareas.routes');
const vistasRoutes = require('./routes/vistas.routes');

// --- Configuración ---
const app = express();
// Number('0') es 0 (falsy) → usaría 3000; evita arrancar en el puerto 0
const port = Number(process.env.PORT) || 3000;
const mongoUri = process.env.MONGODB_URI || process.env.MONGODB_URL;

// --- Motor de vistas (EJS) ---
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Layout global: toda vista se inyecta en views/layout.ejs (variable 'body')
// y el error.ejs (que es una página completa) se excluye del layout.
app.use(expressLayouts);
app.set('layout', 'layout');
app.set('layout extractScripts', false);

// --- Middlewares ---
// CORS: permite peticiones desde cualquier origen (frontend externo, Postman, etc.)
app.use(cors());

// express.json(): interpreta el cuerpo de las peticiones en formato JSON (API REST)
app.use(express.json());

// express.urlencoded(): interpreta formularios HTML y cuerpos JSON (vistas MVC)
app.use(express.urlencoded({ extended: true }));

// method-override: permite usar PUT/PATCH/DELETE desde formularios HTML
// (los formularios solo soportan GET/POST de forma nativa)
app.use(methodOverride(function (req, res) {
  if (req.body && typeof req.body === 'object' && '_method' in req.body) {
    const method = req.body._method;
    delete req.body._method;
    return method;
  }
}));

// Archivos estáticos: public/css/output.css (Tailwind compilado), imágenes, etc.
app.use(express.static(path.join(__dirname, 'public')));

// Exponer 'req' en todas las vistas EJS (permite leer req.query en los parciales,
// p. ej. para mostrar los mensajes flash ?creada=1, ?actualizada=1, etc.)
app.use((req, res, next) => {
  res.locals.req = req;
  next();
});

// --- Rutas de las VISTAS (MVC) ---
// Coinciden con lo que solicitaba el backend:
//   GET  /                    → Inicio (redirige al listado)
//   GET  /tareas              → Listar TODAS las tareas
//   GET  /tareas/completas    → Listar tareas completas
//   GET  /tareas/incompletas  → Listar tareas incompletas
//   GET  /tareas/nueva        → Formulario de creación
//   POST /tareas              → Crear tarea (queda incompleta)
//   GET  /tareas/:id/editar   → Formulario de edición
//   PUT  /tareas/:id          → Actualizar tarea
//   PATCH /tareas/:id/completar → Marcar como completada
//   DELETE /tareas/:id        → Eliminar (borrado lógico)
//   CRUD web de categorías en /categorias
app.use('/', vistasRoutes);

// --- Rutas de la API REST (se conservan del Módulo 5) ---
app.use('/api/categorias', categoriasApiRoutes);
app.use('/api/tareas', tareasApiRoutes);

// --- Middleware 404: ruta no encontrada ---
// (layout: false → error.ejs ya es una página HTML completa)
app.use((req, res) => {
  res.status(404).render('error', {
    layout: false,
    titulo: 'Página no encontrada',
    mensaje: 'La página que buscas no existe.',
    codigo: 404
  });
});

// --- Middleware de errores ---
// Express 5 envía aquí cualquier error lanzado en las rutas/controladores.
// En las vistas mostramos una página de error amigable; en la API, JSON.
app.use((err, req, res, next) => {
  // Errores de validación de Mongoose (campos obligatorios, tipos, etc.)
  if (err.name === 'ValidationError') {
    const detalles = Object.values(err.errors).map(e => e.message);
    // Si la petición venía de la API → JSON; si venía de una vista → página de error
    if (req.originalUrl.startsWith('/api')) {
      return res.status(400).json({ error: 'Datos no válidos', detalles });
    }
    return res.status(400).render('error', {
      layout: false,
      titulo: 'Datos no válidos',
      mensaje: detalles.join('. '),
      codigo: 400
    });
  }

  // Id de MongoDB mal formado (CastError)
  if (err.name === 'CastError') {
    if (req.originalUrl.startsWith('/api')) {
      return res.status(400).json({ error: 'El id enviado no es válido' });
    }
    return res.status(400).render('error', {
      layout: false,
      titulo: 'Identificador no válido',
      mensaje: 'El id enviado no tiene el formato correcto.',
      codigo: 400
    });
  }

  // Índice único duplicado (ej. nombre de categoría repetido)
  if (err.code === 11000) {
    if (req.originalUrl.startsWith('/api')) {
      return res.status(400).json({ error: 'Ya existe un registro con ese valor' });
    }
    return res.status(400).render('error', {
      layout: false,
      titulo: 'Registro duplicado',
      mensaje: 'Ya existe un registro con ese valor.',
      codigo: 400
    });
  }

  // Cualquier otro error inesperado
  console.error('Error del servidor:', err);
  if (req.originalUrl.startsWith('/api')) {
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
  res.status(500).render('error', {
    layout: false,
    titulo: 'Error interno',
    mensaje: 'Ocurrió un error inesperado en el servidor.',
    codigo: 500
  });
});

// --- Conexión a MongoDB y arranque del servidor ---
// Se conecta primero a la base de datos y, si todo sale bien,
// recién entonces el servidor empieza a escuchar peticiones.
const conectarYArrancar = async () => {
  try {
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 10000 // Si MongoDB tarda más de 10s, falla
    });
    console.log('✅ Conexión establecida con MongoDB');

    app.listen(port, () => {
      console.log('=============================================');
      console.log('  📋 Gestor de Tareas — FullStack MVC activo');
      console.log('=============================================');
      console.log(`  🌐 Servidor:   http://localhost:${port}`);
      console.log(`  🖥️  Vistas:     http://localhost:${port}/tareas`);
      console.log(`  ✅ Completas:  http://localhost:${port}/tareas/completas`);
      console.log(`  ⏳ Pendientes: http://localhost:${port}/tareas/incompletas`);
      console.log(`  🗂️  Categorías: http://localhost:${port}/categorias`);
      console.log(`  📡 API Base:   http://localhost:${port}/api/tareas`);
      console.log('=============================================');
    });
  } catch (error) {
    console.error('❌ No se pudo conectar con MongoDB:', error.message);
    console.error('   Revisa la variable MONGODB_URI en el archivo .env');
    process.exit(1);
  }
};

conectarYArrancar();
