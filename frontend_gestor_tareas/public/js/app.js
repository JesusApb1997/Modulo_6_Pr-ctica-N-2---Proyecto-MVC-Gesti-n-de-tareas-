/* ============================================================
   js/app.js - Lógica del frontend (SPA estática)
   ============================================================
   Consume la API REST del backend MVC usando AXIOS
   (cargado desde ./js/axios.min.js antes de este archivo):
     GET    /api/tareas                       → { total, tareas }
     GET    /api/tareas/completas             → { total, tareas }
     GET    /api/tareas/incompletas           → { total, tareas }
     POST   /api/tareas                       → 201 { mensaje, tarea }
     PUT    /api/tareas/:id                   → 200 { mensaje, tarea }
     PATCH  /api/tareas/:id/completar         → 200 { mensaje, tarea }
     DELETE /api/tareas/:id                   → 200 { mensaje, tarea }
     GET    /api/categorias                   → { total, categorias }
   ============================================================ */

// Base de la API: por defecto el backend en el puerto 9000
const API_BASE = window.APP_CONFIG?.API_URL || 'http://localhost:9000/api';

// ------------------- Estado de la aplicación -------------------
const estado = {
  filtro: 'todas',        // todas | completas | incompletas
  categoria: null,        // _id de categoría o null
  tareas: [],
  categorias: [],
  cargando: false
};

// ------------------- Helpers DOM -------------------
const $ = (selector) => document.querySelector(selector);

const el = {
  listaTareas: $('#listaTareas'),
  estadoVacio: $('#estadoVacio'),
  cargando: $('#cargando'),
  estadoConexion: $('#estadoConexion'),
  chipsCategorias: $('#chipsCategorias'),
  statTotal: $('#statTotal'),
  statPendientes: $('#statPendientes'),
  statCompletadas: $('#statCompletadas'),
  statCategorias: $('#statCategorias'),
  barraProgreso: $('#barraProgreso'),
  textoProgreso: $('#textoProgreso'),
  modalTarea: $('#modalTarea'),
  modalTitulo: $('#modalTitulo'),
  modalErrores: $('#modalErrores'),
  formTarea: $('#formTarea'),
  tareaId: $('#tareaId'),
  campoTitulo: $('#campoTitulo'),
  campoDescripcion: $('#campoDescripcion'),
  campoCategoria: $('#campoCategoria'),
  btnGuardar: $('#btnGuardar'),
  btnNueva: $('#btnNueva'),
  btnRecargarCategorias: $('#btnRecargarCategorias'),
  toasts: $('#toasts')
};

// ------------------- Utilidades -------------------

function formatearFecha(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleDateString('es', { day: '2-digit', month: 'short', year: 'numeric' });
}

function escaparHTML(texto) {
  return String(texto ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

// Mensajes flotantes (toasts)
function mostrarToast(mensaje, tipo = 'ok') {
  const colores = {
    ok: 'border-emerald-400/30 bg-emerald-400/10 text-emerald-100',
    error: 'border-red-400/30 bg-red-400/10 text-red-100',
    info: 'border-indigo-400/30 bg-indigo-400/10 text-indigo-100'
  };
  const iconos = { ok: '✅', error: '⚠️', info: 'ℹ️' };

  const div = document.createElement('div');
  div.className = `rounded-xl border px-4 py-3 text-sm shadow-2xl backdrop-blur transition-all duration-300 ${colores[tipo]}`;
  div.innerHTML = `${iconos[tipo]} ${escaparHTML(mensaje)}`;
  el.toasts.appendChild(div);

  setTimeout(() => {
    div.style.opacity = '0';
    div.style.transform = 'translateY(8px)';
    setTimeout(() => div.remove(), 300);
  }, 3500);
}

// ------------------- Cliente de la API (AXIOS) -------------------

// Instancia de axios apuntando al backend (URL en js/app.config.js)
const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
  timeout: 10000 // 10 s máximo por petición
});

// Helper: mantiene la interfaz pedir(ruta, opciones) que usa el resto
// del código. Axios lanza error en respuestas 4xx/5xx → se extrae el
// mensaje ({ error: "..." }) que devuelve el backend para mostrarlo.
async function pedir(ruta, opciones = {}) {
  try {
    const { data } = await api.request({
      url: ruta,
      method: opciones.method || 'get',
      data: opciones.body ? JSON.parse(opciones.body) : undefined
    });
    return data;
  } catch (error) {
    if (error.response) {
      // El backend respondió con un código de error (400, 404, 500...)
      const err = new Error(error.response.data?.error || `Error ${error.response.status}`);
      err.estado = error.response.status;
      throw err;
    }
    // Sin respuesta: backend apagado, CORS, timeout, etc.
    throw new Error('No se pudo conectar con el backend en ' + API_BASE);
  }
}

// ------------------- Carga de datos -------------------

async function cargarCategorias() {
  try {
    const datos = await pedir('/categorias');
    estado.categorias = datos.categorias || [];
    el.statCategorias.textContent = estado.categorias.length;
    pintarChipsCategorias();
    llenarSelectCategorias();
  } catch (error) {
    console.error('No se pudieron cargar las categorías:', error);
  }
}

async function cargarTareas() {
  estado.cargando = true;
  pintarCargando();

  try {
    el.estadoConexion.classList.add('hidden');

    // Elegir endpoint según el filtro activo (coincide con la API)
    let ruta = '';
    if (estado.filtro === 'completas') ruta = '/tareas/completas';
    else if (estado.filtro === 'incompletas') ruta = '/tareas/incompletas';
    else ruta = '/tareas';

    const datos = await pedir(ruta);
    let tareas = datos.tareas || [];

    // Filtro local por categoría (la API no soporta ?categoria= en el listado general)
    if (estado.categoria) {
      tareas = tareas.filter(t => {
        const cat = t.categoria;
        const idCat = cat && typeof cat === 'object' ? cat._id : cat;
        return idCat && String(idCat) === String(estado.categoria);
      });
    }

    estado.tareas = tareas;
    el.estadoConexion.classList.add('hidden');
  } catch (error) {
    estado.tareas = [];
    el.estadoConexion.classList.remove('hidden');
    mostrarToast('Error al cargar tareas: ' + error.message, 'error');
  } finally {
    estado.cargando = false;
    pintarTareas();
  }
}

// ------------------- Renderizado -------------------

function pintarCargando() {
  el.cargando.classList.remove('hidden');
  el.listaTareas.innerHTML = '';
  el.estadoVacio.classList.add('hidden');
}

function pintarChipsCategorias() {
  const chips = [
    { _id: null, nombre: 'Todas' },
    ...estado.categorias.map(c => ({ _id: c._id, nombre: c.nombre }))
  ];

  el.chipsCategorias.querySelectorAll('button[data-categoria]').forEach(b => b.remove());

  chips.forEach(chip => {
    const activo = (chip._id === null && !estado.categoria) ||
                   (chip._id && String(chip._id) === String(estado.categoria));
    const btn = document.createElement('button');
    btn.dataset.categoria = chip._id ?? '';
    btn.className = `rounded-full border px-3 py-1 text-xs font-semibold transition ${
      activo
        ? 'border-indigo-400/50 bg-indigo-500/20 text-indigo-100'
        : 'border-white/10 bg-white/5 text-slate-300 hover:bg-white/10'
    }`;
    btn.textContent = chip.nombre;
    btn.addEventListener('click', () => {
      estado.categoria = chip._id;
      pintarChipsCategorias();
      cargarTareas();
    });
    el.chipsCategorias.appendChild(btn);
  });
}

function llenarSelectCategorias() {
  // Conservar la selección actual
  const previa = el.campoCategoria.value;

  el.campoCategoria.innerHTML = '<option value="">Selecciona una categoría…</option>' +
    estado.categorias.map(c =>
      `<option value="${escaparHTML(c._id)}">${escaparHTML(c.nombre)}</option>`
    ).join('');

  if (previa) el.campoCategoria.value = previa;
}

function pintarTareas() {
  el.cargando.classList.add('hidden');
  el.listaTareas.innerHTML = '';

  const tareas = estado.tareas;

  // Estadísticas (siempre sobre el total real, no del filtro)
  const esFiltro = estado.filtro !== 'todas' || estado.categoria !== null;
  const total = tareas.length;
  const completadas = tareas.filter(t => t.completado).length;
  const pendientes = total - completadas;

  if (esFiltro) {
    // Con filtro activo mostramos los números del filtro
    el.statTotal.textContent = total;
  } else {
    el.statTotal.textContent = total;
  }
  el.statCompletadas.textContent = completadas;
  el.statPendientes.textContent = pendientes;

  // Barra de progreso: completadas / total (0% si no hay tareas)
  const porcentaje = total === 0 ? 0 : Math.round((completadas / total) * 100);
  el.barraProgreso.style.width = `${porcentaje}%`;
  el.textoProgreso.textContent = `${porcentaje}%`;

  // Estado vacío
  if (tareas.length === 0) {
    el.estadoVacio.classList.remove('hidden');
    return;
  }
  el.estadoVacio.classList.add('hidden');

  tareas.forEach(tarea => {
    const cat = tarea.categoria;
    const nombreCat = cat && typeof cat === 'object' ? cat.nombre : '';
    const fecha = formatearFecha(tarea.fechaCreacion);
    const estaCompletada = Boolean(tarea.completado);

    const tarjeta = document.createElement('article');
    tarjeta.className = `tarjeta group flex flex-col gap-3 rounded-2xl border p-5 backdrop-blur transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl ${
      estaCompletada
        ? 'border-emerald-400/20 bg-emerald-400/5'
        : 'border-white/10 bg-white/5'
    }`;

    tarjeta.innerHTML = `
      <div class="flex items-start justify-between gap-2">
        <h3 class="font-semibold leading-snug ${estaCompletada ? 'text-emerald-100/70 line-through' : 'text-slate-100'}">
          ${escaparHTML(tarea.titulo)}
        </h3>
        <span class="shrink-0 rounded-full px-2 py-0.5 text-[11px] font-bold ${
          estaCompletada ? 'bg-emerald-400/15 text-emerald-300' : 'bg-amber-400/15 text-amber-300'
        }">
          ${estaCompletada ? '✓ Completada' : '⏳ Pendiente'}
        </span>
      </div>

      ${tarea.descripcion ? `<p class="text-sm text-slate-400">${escaparHTML(tarea.descripcion)}</p>` : ''}

      <div class="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
        ${nombreCat ? `<span class="rounded-md bg-white/5 px-2 py-0.5">🗂️ ${escaparHTML(nombreCat)}</span>` : ''}
        <span>📅 ${fecha}</span>
      </div>

      <div class="mt-auto flex flex-wrap gap-2 pt-1">
        ${estaCompletada
          ? `<button data-accion="reabrir" class="rounded-lg bg-amber-400/15 px-3 py-1.5 text-xs font-semibold text-amber-200 transition hover:bg-amber-400/25">↩ Reabrir</button>`
          : `<button data-accion="completar" class="rounded-lg bg-emerald-400/15 px-3 py-1.5 text-xs font-semibold text-emerald-200 transition hover:bg-emerald-400/25">✓ Completar</button>`}
        <button data-accion="editar" class="rounded-lg bg-white/10 px-3 py-1.5 text-xs font-semibold text-slate-200 transition hover:bg-white/20">✎ Editar</button>
        <button data-accion="eliminar" class="rounded-lg bg-red-400/15 px-3 py-1.5 text-xs font-semibold text-red-200 transition hover:bg-red-400/25">🗑 Eliminar</button>
      </div>
    `;

    // Acciones de la tarjeta (solo se adjuntan los botones que existen)
    const al = (accion, manejador) => {
      const boton = tarjeta.querySelector(`[data-accion="${accion}"]`);
      if (boton) boton.addEventListener('click', manejador);
    };
    al('completar', () => completarTarea(tarea._id));
    al('reabrir', () => reabrirTarea(tarea));
    al('editar', () => abrirModalEditar(tarea));
    al('eliminar', () => eliminarTarea(tarea));

    el.listaTareas.appendChild(tarjeta);
  });
}

// ------------------- Operaciones CRUD (API) -------------------

async function crearTarea(evento) {
  evento.preventDefault();

  const titulo = el.campoTitulo.value.trim();
  const descripcion = el.campoDescripcion.value.trim();
  const categoria = el.campoCategoria.value;

  // Validaciones en el cliente (espejo de las del backend)
  const errores = [];
  if (!titulo) errores.push('El título de la tarea es obligatorio.');
  if (!categoria) errores.push('La tarea debe pertenecer a una categoría.');
  if (errores.length) return mostrarErroresModal(errores);

  ocultarErroresModal();
  el.btnGuardar.disabled = true;
  el.btnGuardar.textContent = 'Guardando…';

  try {
    if (el.tareaId.value) {
      // EDITAR (PUT /api/tareas/:id)
      await pedir(`/tareas/${el.tareaId.value}`, {
        method: 'PUT',
        body: JSON.stringify({ titulo, descripcion, categoria })
      });
      mostrarToast('Tarea actualizada correctamente');
    } else {
      // CREAR (POST /api/tareas) — siempre queda incompleta
      await pedir('/tareas', {
        method: 'POST',
        body: JSON.stringify({ titulo, descripcion, categoria })
      });
      mostrarToast('Tarea creada correctamente');
    }

    cerrarModal();
    await cargarTareas();
  } catch (error) {
    mostrarErroresModal([error.message]);
  } finally {
    el.btnGuardar.disabled = false;
    el.btnGuardar.textContent = 'Guardar';
  }
}

async function completarTarea(id) {
  try {
    await pedir(`/tareas/${id}/completar`, { method: 'PATCH' });
    mostrarToast('Tarea marcada como completada');
    await cargarTareas();
  } catch (error) {
    mostrarToast(error.message, 'error');
  }
}

// Reabrir una tarea completada (PUT con completado: false)
async function reabrirTarea(tarea) {
  try {
    await pedir(`/tareas/${tarea._id}`, {
      method: 'PUT',
      body: JSON.stringify({ completado: false })
    });
    mostrarToast('Tarea reabierta');
    await cargarTareas();
  } catch (error) {
    mostrarToast(error.message, 'error');
  }
}

async function eliminarTarea(tarea) {
  if (!confirm(`¿Eliminar la tarea "${tarea.titulo}"?`)) return;

  try {
    await pedir(`/tareas/${tarea._id}`, { method: 'DELETE' });
    mostrarToast('Tarea eliminada correctamente');
    await cargarTareas();
  } catch (error) {
    mostrarToast(error.message, 'error');
  }
}

// ------------------- Modal (crear / editar) -------------------

function abrirModalNueva() {
  el.modalTitulo.textContent = 'Nueva tarea';
  el.tareaId.value = '';
  el.formTarea.reset();
  llenarSelectCategorias();
  ocultarErroresModal();
  abrirModal();
}

function abrirModalEditar(tarea) {
  el.modalTitulo.textContent = 'Editar tarea';
  el.tareaId.value = tarea._id;
  el.campoTitulo.value = tarea.titulo;
  el.campoDescripcion.value = tarea.descripcion || '';

  const cat = tarea.categoria;
  const idCat = cat && typeof cat === 'object' ? cat._id : cat;
  llenarSelectCategorias();
  if (idCat) el.campoCategoria.value = String(idCat);

  ocultarErroresModal();
  abrirModal();
}

function abrirModal() {
  el.modalTarea.classList.remove('hidden');
  el.modalTarea.classList.add('flex');
  el.campoTitulo.focus();
}

function cerrarModal() {
  el.modalTarea.classList.add('hidden');
  el.modalTarea.classList.remove('flex');
  el.formTarea.reset();
  el.tareaId.value = '';
  ocultarErroresModal();
}

function mostrarErroresModal(errores) {
  el.modalErrores.innerHTML = errores.map(e => `• ${escaparHTML(e)}`).join('<br>');
  el.modalErrores.classList.remove('hidden');
}

function ocultarErroresModal() {
  el.modalErrores.classList.add('hidden');
  el.modalErrores.innerHTML = '';
}

// ------------------- Eventos globales -------------------

// Filtros de estado (todas / completas / incompletas)
document.querySelectorAll('.filtro-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    estado.filtro = btn.dataset.filtro;

    // Resaltar el botón activo
    document.querySelectorAll('.filtro-btn').forEach(b => {
      const activo = b === btn;
      b.classList.toggle('bg-white/10', activo);
      b.classList.toggle('text-white', activo);
      b.classList.toggle('text-slate-300', !activo);
    });

    cargarTareas();
  });
});

// Botones de "Nueva tarea"
el.btnNueva.addEventListener('click', abrirModalNueva);
document.querySelectorAll('.abrirNueva').forEach(b => b.addEventListener('click', abrirModalNueva));

// Cerrar modal (fondo o botón ✕)
el.modalTarea.addEventListener('click', (e) => {
  if (e.target.hasAttribute('data-cerrar-modal')) cerrarModal();
});
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && !el.modalTarea.classList.contains('hidden')) cerrarModal();
});

// Guardar (crear o editar)
el.formTarea.addEventListener('submit', crearTarea);

// Recargar categorías manualmente
el.btnRecargarCategorias.addEventListener('click', async () => {
  await cargarCategorias();
  mostrarToast('Categorías actualizadas', 'info');
});

// ------------------- Arranque -------------------

(async function iniciar() {
  await cargarCategorias();
  await cargarTareas();
})();
