import { readSheet } from './sheets';
import { TABS } from './constants';

// "Campos JSON" puede venir en dos formatos:
//  - viejo: un array directo  [ {key,label,tipo,...}, ... ]
//  - nuevo: un objeto { cursoFijo, campos: [ ... ] }  (formularios con el curso fijado)
// Este parser normaliza ambos para que el resto de la app no tenga que saber cuál es.
export function parseCampos(raw) {
  let data;
  try { data = JSON.parse(raw || '[]'); } catch { data = []; }
  if (Array.isArray(data)) return { campos: data, cursoFijo: '', intro: '' };
  return { campos: Array.isArray(data.campos) ? data.campos : [], cursoFijo: data.cursoFijo || '', intro: data.intro || '' };
}

export async function getFormulario(slug) {
  const filas = await readSheet(TABS.FORMULARIOS);
  const f = filas.find((x) => x.Slug === slug);
  if (!f) return null;
  const { campos, cursoFijo, intro } = parseCampos(f['Campos JSON']);
  return {
    slug: f.Slug,
    titulo: f['Título'] || 'Formulario',
    tipo: f.Tipo || '',
    estado: f.Estado || 'Publicada',
    cursoFijo, // curso fijado (formato nuevo) o '' si el formulario deja elegir curso
    intro, // texto introductorio opcional
    campos // [{ key, label, tipo, required, opciones?, help? }]
  };
}
