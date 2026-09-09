import { readSheet } from './sheets';
import { TABS } from './constants';

export async function getFormulario(slug) {
  const filas = await readSheet(TABS.FORMULARIOS);
  const f = filas.find((x) => x.Slug === slug);
  if (!f) return null;
  let campos = [];
  try { campos = JSON.parse(f['Campos JSON'] || '[]'); } catch { campos = []; }
  return {
    slug: f.Slug,
    titulo: f['Título'] || 'Formulario',
    tipo: f.Tipo || '',
    estado: f.Estado || 'Publicada',
    campos // [{ key, label, tipo, required, opciones?, help? }]
  };
}
