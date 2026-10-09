import { NextResponse } from 'next/server';
import { readSheet, updateRow } from '../../../../lib/sheets';
import { TABS } from '../../../../lib/constants';
import { findUsuario, tienePermisoVerRespuestasFormularios, tienePermisoEliminarRespuestas } from '../../../../lib/auth';
import { registrarAccion } from '../../../../lib/auditoria';
import { parseCampos } from '../../../../lib/formularios';
import { esActividadEspecial, normTitulo } from '../../../../lib/formularioConstructor';

export const dynamic = 'force-dynamic';

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const usuario = await findUsuario(searchParams.get('solicitanteEmail'));
  if (!usuario || !tienePermisoVerRespuestasFormularios(usuario)) return NextResponse.json({ ok: false, error: 'No autorizado' }, { status: 403 });
  try {
    // Qué formularios son actividades especiales (laboratorio, masterclass…): se lee la definición para marcar cada respuesta.
    // Si esa lectura falla, las respuestas igual se devuelven (solo quedan sin marcar).
    const especiales = new Set(); const tipos = {};
    try {
      (await readSheet(TABS.FORMULARIOS)).filter((f) => f.Slug).forEach((f) => {
        const { especial } = parseCampos(f['Campos JSON']);
        const k = normTitulo(f['Título']); tipos[k] = f.Tipo || '';
        if (esActividadEspecial({ especial, tipo: f.Tipo })) especiales.add(k);
      });
    } catch {}
    const respuestas = (await readSheet(TABS.RESPUESTAS_FORM)).filter((f) => f.ID).map((f) => {
      let r = {}; try { r = JSON.parse(f['Respuestas JSON'] || '{}'); } catch {}
      const k = normTitulo(f.Formulario);
      return { id: f.ID, fecha: f.Fecha, formulario: f.Formulario, curso: f.Curso, email: f.Email, nombre: f.Nombre, edicion: f['Edición'], especial: especiales.has(k), tipo: tipos[k] || '', r };
    }).reverse();
    return NextResponse.json({ ok: true, respuestas });
  } catch (e) {
    // Mismo criterio que en /api/formularios: mostrar el error real en vez de ocultarlo
    // detrás de un "no hay respuestas" que confunde cuando en realidad falló la lectura.
    return NextResponse.json({ ok: false, error: e.message || 'No se pudo leer la pestaña RespuestasFormularios' }, { status: 500 });
  }
}

// Pedido de Diego ("agregar eliminar acá"): mismo criterio que ya usa el DELETE de
// /api/actividades/respuestas — baja lógica (se vacía la fila, no existe borrado real de fila
// en lib/sheets.js) y mismo permiso (tienePermisoEliminarRespuestas, hoy equivale a Admin).
export async function DELETE(req) {
  const body = await req.json();
  const usuario = await findUsuario(body.solicitanteEmail);
  if (!usuario || !tienePermisoEliminarRespuestas(usuario)) return NextResponse.json({ ok: false, error: 'Sin permiso' }, { status: 403 });
  const { id } = body || {};
  if (!id) return NextResponse.json({ ok: false, error: 'Falta el id' }, { status: 400 });
  const filas = await readSheet(TABS.RESPUESTAS_FORM, { noCache: true });
  const f = filas.find((x) => x.ID === id);
  if (!f) return NextResponse.json({ ok: false, error: 'No encontrada' }, { status: 404 });
  // Columnas de RESPUESTAS_FORM (ver lib/constants.js → HEADERS): ID, Fecha, Formulario, Curso,
  // Email, Nombre, Edición, Respuestas JSON.
  await updateRow(TABS.RESPUESTAS_FORM, f._rowIndex, ['', '', '', '', '', '', '', '']);
  await registrarAccion(usuario.email, usuario.nombre, 'Eliminó respuesta de formulario', `${f.Nombre || f.Email || ''} — ${f.Formulario || ''}${f.Curso ? ' · ' + f.Curso : ''}`);
  return NextResponse.json({ ok: true });
}
