import './globals.css';
import { ThemeProvider } from '../lib/ThemeContext';
import ErrorBoundary from '../components/ErrorBoundary';
import RecuperadorDeChunks from '../components/RecuperadorDeChunks';
import { DialogosProvider } from '../components/Dialogos';
import TablasEnTarjetas from '../components/TablasEnTarjetas';

export const metadata = {
  title: 'ILCE · Fichas de Inscripción',
  description: 'Gestión de fichas e inscripciones — Instituto ILCE'
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
