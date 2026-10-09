import { NextResponse } from 'next/server';
import { readSheet, appendRow, updateRow } from '../../../lib/sheets';
import { TABS, CURSOS } from '../../../lib/constants';
import { findUsuario, tienePermisoFormularios } from '../../../lib/auth';
import { parseCampos } from '../../../lib/formularios';
import { validarPayloadServidor, serializarCampos } from '../../../lib/formularioConstructor';
import { registrarAccion } from '../../../lib/auditoria';

export const dynamic = 'force-dynamic';

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const usuario = await findUsuario(searchParams.get('solicitanteEmail'));
  if (!usuario || !tienePermisoFormularios(usuario)) return NextResponse.json({ ok: false, error: 'No autorizado' }, { status: 403 });
  try {
    const filas = await readSheet(TABS.FORMULARIOS);
    const formularios = filas.filter((f) => f.Slug).map((f) => {
      const { campos, cursoFijo, intro, especial } = parseCampos(f['Campos JSON']);
      return { slug: f.Slug, titulo: f['Título'], tipo: f.Tipo, estado: f.Estado || 'Publicada', campos, cursoFijo, intro, especial, actualizado: f.Actualizado, creado: f['Creado'] || '' };
    });
    return NextResponse.json({ ok: true, formularios });
  } catch (e) {
    // Antes esto devolvía { ok:true, formularios:[] } para "no romper" — pero eso hacía
    // que un error real (timeout, cuota de Google, etc.) se viera igual que la pestaña
    // vacía ("Pegá las definiciones..."), que confunde cuando SÍ hay filas cargadas.
    // Mejor mostrar el motivo real.
    return NextResponse.json({ ok: false, error: e.message || 'No se pudo leer la pestaña Formularios' }, { status: 500 });
  }
}

export async function POST(req) {
  let body;
  try { body = await req.json(); } catch { return NextResponse.json({ ok: false, error: 'JSON inválido' }, { status: 400 }); }
  const usuario = await findUsuario(body && body.solicitanteEmail);
  if (!usuario || !tienePermisoFormularios(usuario)) return NextResponse.json({ ok: false, error: 'Sin permiso' }, { status: 403 });
  // El servidor valida y LIMPIA todo (no se confía en lo que manda el navegador): solo pasan las propiedades que el formulario
  // público realmente lee, y el curso fijo tiene que existir. Un formulario puede no tener curso (cursoFijo vacío).
  const v = validarPayloadServidor(body, { cursosValidos: CURSOS.map((c) => c.nombre) });
  if (!v.ok) return NextResponse.json({ ok: false, error: v.error }, { status: 400 });
  const { slug, titulo, tipo, estado, cursoFijo, intro, especial, campos } = v.limpio;
  const crear = body.crear === true;
  const filas = await readSheet(TABS.FORMULARIOS, { noCache: true });
  const ex = filas.find((f) => f.Slug === slug);
  // Crear nunca pisa un formulario que ya existe (antes este endpoint hacía "crear o pisar" sin avisar).
  if (crear && ex) return NextResponse.json({ ok: false, error: 'Ya existe un formulario con ese enlace' }, { status: 409 });
  if (!crear && !ex) return NextResponse.json({ ok: false, error: 'No existe el formulario que se quiere editar' }, { status: 404 });
  // "Creado" se escribe una sola vez: se conserva si ya existía, se marca ahora si es nuevo.
  const creado = ex ? (ex['Creado'] || '') : new Date().toISOString();
  const fila = [slug, titulo, tipo, estado, serializarCampos({ campos, cursoFijo, intro, especial }), new Date().toISOString(), creado];
  try {
    if (ex) await updateRow(TABS.FORMULARIOS, ex._rowIndex, fila); else await appendRow(TABS.FORMULARIOS, fila);
  } catch (e) {
    return NextResponse.json({ ok: false, error: 'No se pudo guardar en la planilla: ' + (e.message || e) }, { status: 500 });
  }
  try { await registrarAccion(usuario.email, usuario.nombre, crear ? 'Creó un formulario' : 'Editó un formulario', `${titulo} (/formulario/${slug})${cursoFijo ? ` · ${cursoFijo}` : ' · sin curso fijo'}`); } catch { /* el registro no debe impedir guardar */ }
  return NextResponse.json({ ok: true, slug });
}
