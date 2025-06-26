import { initTheme } from '../modules/theme.js';
initTheme();

(async () => {
  await import('../../trips/js/microsoft-auth.js');
  await import('../../trips/js/main.js');
})();
