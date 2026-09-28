/* ============================================================
   js/app.config.js - Configuración opcional del frontend
   ============================================================
   Permite cambiar la URL de la API sin tocar app.js.
   - Por defecto: http://localhost:9000/api (backend MVC local)
   - Si el frontend se sirve desde el MISMO dominio que el
     backend, puedes dejar null y se usará la ruta relativa /api.
   ============================================================ */

window.APP_CONFIG = {
  API_URL: 'http://localhost:9000/api'
};
