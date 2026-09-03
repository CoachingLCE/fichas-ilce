/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [
      {
        // Evita que el navegador quede pegado con una versión vieja tras un deploy nuevo.
        source: '/((?!_next/static|_next/image|favicon.ico).*)',
        headers: [{ key: 'Cache-Control', value: 'no-cache, no-store, must-revalidate' }]
      }
    ];
  }
};
module.exports = nextConfig;
