import './globals.css';
import { ThemeProvider } from '../lib/ThemeContext';
import ErrorBoundary from '../components/ErrorBoundary';
import RecuperadorDeChunks from '../components/RecuperadorDeChunks';
import { DialogosProvider } from '../components/Dialogos';
import TablasEnTarjetas from '../components/TablasEnTarjetas';

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

export default function RootLayout({ children }) {
  return (
    <html lang="es" data-theme="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body>
        <ThemeProvider>
          <DialogosProvider>
            <RecuperadorDeChunks />
            <TablasEnTarjetas />
            <ErrorBoundary>{children}</ErrorBoundary>
          </DialogosProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
