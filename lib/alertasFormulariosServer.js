// Solo servidor. Lee las pestañas Formularios y Respuestas de formularios y devuelve la lista de alertas ya calculada
// (lib/alertasFormularios.js). La usan la API de la solapa "Alertas" de Reportes y el correo automático de los viernes.
import { readSheet } from './sheets';
import { TABS } from './constants';
import { parseCampos } from './formularios';
import { formulariosSinRespuestas } from './alertasFormularios';

export async function leerAlertasFormularios({ hoy } = {}) {
  const hoyISO = hoy || new Date().toISOString().slice(0, 10);
  const filasForm = await readSheet(TABS.FORMULARIOS, { noCache: true });
  const formularios = filasForm.filter((f) => f.Slug).map((f) => ({
    slug: f.Slug, titulo: f['Título'], estado: f.Estado || 'Publicada', creado: f['Creado'] || '',
    cursoFijo: parseCampos(f['Campos JSON']).cursoFijo || ''
  }));
  const filasResp = await readSheet(TABS.RESPUESTAS_FORM, { noCache: true });
  const respuestas = filasResp.filter((f) => f.ID).map((f) => ({ fecha: f.Fecha, formulario: f.Formulario }));
  return formulariosSinRespuestas({ formularios, respuestas, hoy: hoyISO });
}
