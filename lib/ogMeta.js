// Vista previa de enlace (Open Graph) de las páginas PÚBLICAS de Fichas — las que se comparten por WhatsApp, Slack o
// Telegram con las personas que se inscriben: la ficha de inscripción de un curso, un formulario y una actividad.
//
// Solo usa datos que la propia página pública ya muestra (nombre del curso, título del formulario): nunca respuestas,
// personas ni nada interno. La imagen es siempre la misma tarjeta de marca (/og-image.png, 1200×630).
// Son funciones puras (reciben el dato y devuelven los metadatos) para poder probarlas sin acceso a Google Sheets.

const recortar = (t, max) => { const s = String(t == null ? '' : t).replace(/\s+/g, ' ').trim(); return s.length > max ? s.slice(0, max - 1).trimEnd() + '…' : s; };

export function metaCompartible({ titulo, descripcion }) {
  const t = recortar(titulo, 70), d = recortar(descripcion, 160);
  return {
    title: t,
    description: d,
    openGraph: {
      type: 'website', locale: 'es_AR', siteName: 'Instituto ILCE', title: t, description: d,
      images: [{ url: '/og-image.png?v=1', width: 1200, height: 630, alt: t }]
    },
    twitter: { card: 'summary_large_image', title: t, description: d, images: ['/og-image.png?v=1'] }
  };
}

const NO_ENCONTRADA = () => ({ title: 'No encontrado · ILCE', description: 'Este enlace no está disponible.', robots: { index: false, follow: false } });

/** Ficha de inscripción de un curso (/inscripcion/[slug]). `def` es la definición o null. */
export function metaFichaInscripcion(def) {
  if (!def || !def.curso) return NO_ENCONTRADA();
  const curso = recortar(def.curso, 60);
  const cerrada = def.estado === 'Cerrada';
  return metaCompartible({
    titulo: `Ficha de inscripción · ${curso}`,
    descripcion: cerrada ? `La inscripción a ${curso} del Instituto ILCE está cerrada.` : `Completá tu ficha de inscripción a ${curso} del Instituto ILCE.`
  });
}

/** Formulario público (/formulario/[slug]). */
export function metaFormulario(form) {
  if (!form || !form.titulo) return NO_ENCONTRADA();
  return metaCompartible({ titulo: `${recortar(form.titulo, 60)} · ILCE`, descripcion: 'Completá este formulario del Instituto ILCE.' });
}

/** Actividad pública (/actividad/[slug]). */
export function metaActividad(act) {
  if (!act || !act.curso) return NO_ENCONTRADA();
  const curso = recortar(act.curso, 60);
  return metaCompartible({ titulo: `Actividad · ${curso}`, descripcion: `Actividad de ${curso} del Instituto ILCE.` });
}
