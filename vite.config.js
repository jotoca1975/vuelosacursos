import { defineConfig } from 'vite';

// En GitHub Actions se publica en /NOMBRE-DEL-REPOSITORIO/.
// En desarrollo local la aplicación se sirve desde /.
export default defineConfig({
  base: process.env.GITHUB_ACTIONS ? `/${process.env.GITHUB_REPOSITORY.split('/')[1]}/` : '/',
});
