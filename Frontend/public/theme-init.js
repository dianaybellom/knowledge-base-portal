// Aplica el tema antes de que se dibuje la página para evitar un destello del tema equivocado.
// Usa la elección guardada; si no hay, sigue la preferencia del sistema operativo.
// Es un archivo aparte (no un script en línea) para cumplir la política de seguridad de contenido.
(function () {
  var theme = null;
  try {
    theme = localStorage.getItem('kbp_theme');
  } catch (error) {
    // Sin acceso a localStorage se usa la preferencia del sistema.
  }
  if (theme !== 'light' && theme !== 'dark') {
    theme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  document.documentElement.setAttribute('data-theme', theme);
})();
