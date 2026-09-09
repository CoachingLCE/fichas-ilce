import './globals.css';
import { ThemeProvider } from '../lib/ThemeContext';
import ErrorBoundary from '../components/ErrorBoundary';
import RecuperadorDeChunks from '../components/RecuperadorDeChunks';

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
        <link href="https://fonts.googleapis.com/css2?family=Dosis:wght@400;500;600;700;800&family=Jost:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body>
        <ThemeProvider>
          <RecuperadorDeChunks />
          <ErrorBoundary>{children}</ErrorBoundary>
        </ThemeProvider>
      </body>
    </html>
  );
}
