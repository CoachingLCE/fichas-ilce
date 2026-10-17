import './globals.css';
import { ThemeProvider } from '../lib/ThemeContext';
import ErrorBoundary from '../components/ErrorBoundary';
import RecuperadorDeChunks from '../components/RecuperadorDeChunks';
import { DialogosProvider } from '../components/Dialogos';
import TablasEnTarjetas from '../components/TablasEnTarjetas';
import TonosContenedores from '../components/TonosContenedores';
import InstalarSesion from '../components/InstalarSesion';
import CambioPasswordGlobal from '../components/CambioPasswordGlobal';

export const metadata = {
  // Dominio de producción: hace que la imagen y el enlace de la vista previa sean absolutos (WhatsApp/Slack/Telegram lo exigen).
  metadataBase: new URL('https://fichas-ilce.vercel.app'),
  icons: {
    icon: [
      { url: '/favicon.ico?v=2', sizes: 'any' },
      { url: '/icon-32.png?v=2', sizes: '32x32', type: 'image/png' },
      { url: '/icon-192.png?v=2', sizes: '192x192', type: 'image/png' }
    ],
    apple: '/apple-touch-icon.png?v=2'
  },
  title: 'ILCE · Fichas de Inscripción',
  description: 'Gestión de fichas e inscripciones — Instituto ILCE',
  openGraph: {
    type: 'website',
    locale: 'es_AR',
    siteName: 'Instituto ILCE',
    title: 'ILCE · Fichas de Inscripción',
    description: 'Gestión de fichas e inscripciones — Instituto ILCE',
    url: '/',
    images: [{ url: '/og-image.png?v=1', width: 1200, height: 630, alt: 'Fichas de inscripción — Instituto ILCE' }]
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ILCE · Fichas de Inscripción',
    description: 'Gestión de fichas e inscripciones — Instituto ILCE',
    images: ['/og-image.png?v=1']
  }
};

// Se ejecuta en el <head> antes de que se pinte la página (ver el comentario de abajo).
const GUION_LETRA = String.raw`(function(){try{if(/^\/(inscripcion|actividad|formulario)(\/|$)/.test(location.pathname)){document.documentElement.classList.add('escala-publica');var m={'grande':1.12,'muy-grande':1.25},g=localStorage.getItem('ilce-fichas-letra');if(m[g])document.documentElement.style.setProperty('--escala-letra',m[g])}}catch(e){}})();`;

export default function RootLayout({ children }) {
  return (
    <html lang="es" data-theme="dark">
      <head>
        {/* Tamaño de letra del estudiante: se aplica ANTES de pintar para que no se vea un salto de tamaño al cargar. Solo en las direcciones públicas. */}
        <script dangerouslySetInnerHTML={{ __html: GUION_LETRA }} />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body>
        <ThemeProvider>
          <DialogosProvider>
            <RecuperadorDeChunks />
            <InstalarSesion />
            <CambioPasswordGlobal />
            <TablasEnTarjetas />
            <TonosContenedores />
            <ErrorBoundary>{children}</ErrorBoundary>
          </DialogosProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
