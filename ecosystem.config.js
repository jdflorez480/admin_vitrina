/**
 * Configuración de PM2 para el panel de administración.
 *
 * Arranque en el servidor:
 *   npm ci --omit=dev
 *   pm2 start ecosystem.config.js
 *   pm2 save
 *
 * El build (`next build`) se hace ANTES, en la máquina de desarrollo o en el
 * servidor; PM2 sólo levanta `next start` sobre el `.next/` ya generado.
 *
 * Las variables se leen en runtime (no quedan inlineadas en el build), así que
 * al cambiarlas basta con `pm2 restart panel-vitrina --update-env`.
 */
module.exports = {
  apps: [
    {
      name: 'panel-vitrina',
      script: 'node_modules/next/dist/bin/next',
      args: 'start -p 3000',
      cwd: __dirname,

      // Next.js no es cluster-safe por sí solo en todos los casos y una sola
      // instancia sobra para un panel interno. Si hace falta escalar:
      // exec_mode: 'cluster', instances: 'max'.
      instances: 1,
      exec_mode: 'fork',

      autorestart: true,
      max_memory_restart: '512M',

      env: {
        NODE_ENV: 'production',
        PORT: 3000,

        // API externa de Vitrina Raíz (la consume el servidor de Next).
        VITRINA_API_URL: 'https://vitrinaraiz.com/api/external',

        // App pública a la que se redirige al impersonar.
        VITRINA_APP_URL: 'https://vitrinaraiz.com',

        // Dominio padre de la cookie de impersonación.
        //
        // Sin esto el botón "Ir a la cuenta" queda oculto y /api/impersonate
        // responde 501. Requiere que el panel se sirva desde un subdominio de
        // vitrinaraiz.com (p. ej. admin.vitrinaraiz.com).
        VITRINA_COOKIE_DOMAIN: '.vitrinaraiz.com',
      },
    },
  ],
}
