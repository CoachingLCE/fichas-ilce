import { NextResponse } from 'next/server';
import { readSheet } from '../../../lib/sheets';
import { TABS } from '../../../lib/constants';
import { findUsuario, tienePermisoInscripciones, tienePermisoActividades, tienePermisoFormularios } from '../../../lib/auth';

export const dynamic = 'force-dynamic';

const norm = (s) => (s || '').toString().toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
const LIMITE = 24;

// Buscador transversal: busca "fichas, actividades, etc." (pedido de Diego) mirando en simultáneo
// Inscripciones (alumnos que completaron una ficha), Fichas (definiciones), Actividades y
// Formularios. Cada sección solo se busca si la persona tiene permiso para verla.
export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const usuario = await findUsuario(searchParams.get('solicitanteEmail'));
  if (!usuario || !usuario.activo) return NextResponse.json({ ok: false, error: 'No autorizado' }, { status: 403 });
  const q = norm(searchParams.get('q') || '');
  if (q.length < 2) return NextResponse.json({ ok: true, resultados: [] });

  const resultados = [];

  async function buscarInscripciones() {
    if (!tienePermisoInscripciones(usuario)) return;
    try {
      const filas = await readSheet(TABS.INSCRIPCIONES);
      for (const f of filas) {
        if (!f.ID) continue;
        const bolsa = norm([f.Nombre, f.Apellido, f.Email, f.Curso, f['Edición'], f.WhatsApp, f.Documento, f.Localidad].filter(Boolean).join(' '));
        if (!bolsa.includes(q)) continue;
        resultados.push({
          tipo: 'Inscripción', tab: 'inscripciones', id: f.ID,
          titulo: `${f.Nombre || ''} ${f.Apellido || ''}`.trim() || f.Email,
          sub: [f.Curso, f['Edición'] ? `Edición ${f['Edición']}` : null].filter(Boolean).join(' · '),
          extra: f.Email, estado: f.Estado || '', q: `${f.Nombre || ''} ${f.Apellido || ''}`.trim() || f.Email
        });
        if (resultados.filter((r) => r.tipo === 'Inscripción').length >= LIMITE) break;
      }
    } catch { /* pestaña no disponible, no rompe la búsqueda */ }
  }

  async function buscarFichas() {
    try {
      const filas = await readSheet(TABS.FICHAS);
      for (const f of filas) {
        if (!f.Slug) continue;
        const bolsa = norm([f['Título'], f.Curso, f.Slug].filter(Boolean).join(' '));
        if (!bolsa.includes(q)) continue;
        resultados.push({ tipo: 'Ficha', tab: 'fichas', id: f.Slug, titulo: f['Título'] || f.Slug, sub: f.Curso || '', estado: f.Estado || '' });
      }
    } catch { /* */ }
  }

  async function buscarActividades() {
    if (!tienePermisoActividades(usuario)) return;
    try {
      const filas = await readSheet(TABS.ACTIVIDADES);
      for (const f of filas) {
        if (!f.Slug) continue;
        const bolsa = norm([f['Título'], f.Curso, f.Slug].filter(Boolean).join(' '));
        if (!bolsa.includes(q)) continue;
        resultados.push({ tipo: 'Actividad', tab: 'actividades', id: f.Slug, titulo: f['Título'] || f.Slug, sub: f.Curso || '', estado: f.Estado || '' });
      }
    } catch { /* */ }
  }

  async function buscarFormularios() {
    if (!tienePermisoFormularios(usuario)) return;
    try {
      const filas = await readSheet(TABS.FORMULARIOS);
      for (const f of filas) {
        if (!f.Slug) continue;
        const bolsa = norm([f['Título'], f.Slug].filter(Boolean).join(' '));
        if (!bolsa.includes(q)) continue;
        resultados.push({ tipo: 'Formulario', tab: 'formularios', id: f.Slug, titulo: f['Título'] || f.Slug, sub: f.Tipo || '', estado: f.Estado || '' });
      }
    } catch { /* */ }
  }

  await Promise.all([buscarInscripciones(), buscarFichas(), buscarActividades(), buscarFormularios()]);
  return NextResponse.json({ ok: true, resultados });
}
