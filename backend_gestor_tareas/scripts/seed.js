// ============================================================
// scripts/seed.js - Datos de ejemplo para el Gestor de Tareas
// ============================================================
// ¿Para qué sirve?
//   Deja la base de datos con contenido de ejemplo (categorías
//   y tareas) para poder probar la aplicación de inmediato.
//
// Es IDEMPOTENTE: solo inserta si las colecciones están vacías,
// por lo que puede ejecutarse varias veces sin duplicar datos.
//
// Uso:
//   npm run seed
// ============================================================

// El .env tiene prioridad sobre variables del sistema (igual que en server.js)
require('dotenv').config({ override: true });
const mongoose = require('mongoose');
const dns = require('dns');
const Tarea = require('../models/Tarea');
const Categoria = require('../models/Categoria');

// Servidores DNS públicos (igual que en server.js): ayudan a resolver
// los registros SRV de MongoDB Atlas
dns.setServers(['8.8.8.8', '8.8.4.4']);

const mongoUri = process.env.MONGODB_URI || process.env.MONGODB_URL;

const CATEGORIAS = [
  { nombre: 'Personal', descripcion: 'Tareas del hogar y vida diaria' },
  { nombre: 'Trabajo', descripcion: 'Tareas laborales y proyectos' },
  { nombre: 'Estudios', descripcion: 'Deberes, exámenes y proyectos académicos' }
];

const TAREAS = [
  { titulo: 'Comprar leche', descripcion: 'Ir al supermercado por leche y pan', categoria: 'Personal', completado: false },
  { titulo: 'Enviar reporte semanal', descripcion: 'Resumen de avances del proyecto', categoria: 'Trabajo', completado: false },
  { titulo: 'Estudiar para el examen de Node.js', descripcion: 'Repasar módulos, Express y MongoDB', categoria: 'Estudios', completado: false },
  { titulo: 'Pagar servicios', descripcion: 'Luz, agua e internet', categoria: 'Personal', completado: true },
  { titulo: 'Revisar pull requests', descripcion: 'Revisar y aprobar los PR pendientes del equipo', categoria: 'Trabajo', completado: true }
];

(async () => {
  try {
    if (!mongoUri) {
      console.error('❌ No se encontró MONGODB_URI en el archivo .env');
      process.exit(1);
    }

    await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 10000 });
    console.log('✅ Conexión establecida con MongoDB\n');

    // Solo sembrar si no hay datos (idempotente)
    const [totalCategorias, totalTareas] = await Promise.all([
      Categoria.countDocuments(),
      Tarea.countDocuments({ fechaEliminacion: null })
    ]);

    if (totalCategorias > 0 || totalTareas > 0) {
      console.log(`ℹ️  La base ya tiene datos (${totalCategorias} categorías, ${totalTareas} tareas activas).`);
      console.log('   No se insertó nada para no duplicar. Si quieres empezar de cero,');
      console.log('   vacía las colecciones desde MongoDB Atlas y vuelve a ejecutar: npm run seed');
    } else {
      const categorias = await Categoria.insertMany(CATEGORIAS);
      console.log(`🗂️  ${categorias.length} categorías creadas`);

      const porNombre = Object.fromEntries(categorias.map(c => [c.nombre, c._id]));
      const tareas = TAREAS.map(t => ({
        titulo: t.titulo,
        descripcion: t.descripcion,
        categoria: porNombre[t.categoria],
        completado: t.completado
      }));

      const creadas = await Tarea.insertMany(tareas);
      console.log(`📋 ${creadas.length} tareas creadas (2 completadas, 3 pendientes)`);
    }

    await mongoose.disconnect();
    console.log('\n🎉 Listo. Arranca el servidor con: npm run dev');
  } catch (error) {
    console.error('❌ Error ejecutando el seed:', error.message);
    process.exit(1);
  }
})();
