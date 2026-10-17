import { NextResponse } from 'next/server';
import { readSheet, appendRow, updateRow } from '../../../lib/sheets';
import { TABS, CURSOS } from '../../../lib/constants';
import { usuarioDeSolicitud, tienePermisoEvaluaciones } from '../../../lib/auth';
import { registrarAccion } from '../../../lib/auditoria';
import { prepararPestanas, normTitulo } from '../../../lib/evaluaciones';
import { parseEvalDef, validarDefEval, parseMails, estadoEfectivoEval, totalPuntos, puntajeMinimo } from '../../../lib/evaluacionesLogica';

export const dynamic = 'force-dynamic';

// Administración de las Evaluaciones finales (listar, crear, editar, eliminar). Las pestañas se crean solas la primera vez.

const slugValido = (s) => /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(String(s || '')) && String(s).length <= 90;

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const usuario = await usuarioDeSolicitud(req, searchParams.get('solicitanteEmail'));
  if (!usuario || !tienePermisoEvaluaciones(usuario)) return NextResponse.json({ ok: false, error: 'No autorizado' }, { status: 403 });
  try {
    await prepararPestanas();
    const filas = await readSheet(TABS.EVALUACIONES, { noCache: true });
    // Intentos por evaluación (una sola lectura, no una por evaluación).
    const cuentas = {};
    try {
      (await readSheet(TABS.INTENTOS_EVAL)).forEach((f) => {
        if (!f.ID) return;
        const k = normTitulo(f['Evaluación']);
        const c = cuentas[k] || (cuentas[k] = { intentos: 0, finalizados: 0, aprobados: 0, personas: new Set() });
        c.intentos++;
        if (f.Estado === 'Finalizado') c.finalizados++;
        if (String(f.Resultado || '').toLowerCase() === 'aprobado') c.aprobados++;
        if (f.Email) c.personas.add(String(f.Email).toLowerCase());
      });
    } catch { /* sin conteos */ }
    const ahora = Date.now();
    const evaluaciones = filas.filter((f) => f.Slug).map((f) => {
      const def = parseEvalDef(f['Definición JSON']);
      const ev = { slug: f.Slug, curso: f.Curso || '', titulo: f['Título'] || '', estado: f.Estado || 'Borrador', actualizado: f.Actualizado || '', creado: f.Creado || '', ...def };
      const c = cuentas[normTitulo(ev.titulo)];
      return {
        ...ev, estadoEfectivo: estadoEfectivoEval(ev, ahora),
        total: totalPuntos(def), minimo: puntajeMinimo(def),
        conteo: c ? { intentos: c.intentos, finalizados: c.finalizados, aprobados: c.aprobados, personas: c.personas.size } : { intentos: 0, finalizados: 0, aprobados: 0, personas: 0 }
      };
    });
    return NextResponse.json({ ok: true, evaluaciones });
  } catch (e) {
    return NextResponse.json({ ok: false, error: e.message || 'No se pudo leer la pestaña Evaluaciones' }, { status: 500 });
  }
}

export async function POST(req) {
  let body;
  try { body = await req.json(); } catch { return NextResponse.json({ ok: false, error: 'JSON inválido' }, { status: 400 }); }
  const usuario = await usuarioDeSolicitud(req, body && body.solicitanteEmail);
  if (!usuario || !tienePermisoEvaluaciones(usuario)) return NextResponse.json({ ok: false, error: 'Sin permiso' }, { status: 403 });

  const slug = String(body.slug || '').trim();
  if (!slugValido(slug)) return NextResponse.json({ ok: false, error: 'El enlace solo puede tener minúsculas, números y guiones' }, { status: 400 });
  const falla = validarDefEval(body);
  if (falla) return NextResponse.json({ ok: false, error: falla }, { status: 400 });
  const curso = String(body.curso).trim();
  if (!CURSOS.some((c) => c.nombre === curso)) return NextResponse.json({ ok: false, error: 'El curso no existe' }, { status: 400 });
  const estado = ['Borrador', 'Publicada', 'Archivada'].includes(body.estado) ? body.estado : 'Borrador';
  const titulo = String(body.titulo).trim();

  // Se limpia todo con el mismo parser que lee el examen: solo se guarda lo que el examen realmente usa.
  const def = parseEvalDef(JSON.stringify({ ...body, mailsStaff: parseMails(body.mailsStaff) }));
  await prepararPestanas();
  const filas = await readSheet(TABS.EVALUACIONES, { noCache: true });
  const ex = filas.find((f) => f.Slug === slug);
  const crear = body.crear === true;
  if (crear && ex) return NextResponse.json({ ok: false, error: 'Ya existe una evaluación con ese enlace' }, { status: 409 });
  if (!crear && !ex) return NextResponse.json({ ok: false, error: 'No existe la evaluación que se quiere editar' }, { status: 404 });
  // El título identifica los intentos guardados: no puede repetirse con otra evaluación ni cambiar si ya hay intentos.
  const tituloNorm = normTitulo(titulo);
  if (filas.some((f) => f.Slug && f.Slug !== slug && normTitulo(f['Título']) === tituloNorm)) return NextResponse.json({ ok: false, error: 'Ya hay otra evaluación con ese título' }, { status: 409 });
  if (ex && normTitulo(ex['Título']) !== tituloNorm) {
    const hay = (await readSheet(TABS.INTENTOS_EVAL, { noCache: true })).some((f) => f.ID && normTitulo(f['Evaluación']) === normTitulo(ex['Título']));
    if (hay) return NextResponse.json({ ok: false, error: 'No se puede cambiar el título: la evaluación ya tiene intentos guardados y quedarían separados de ella' }, { status: 409 });
  }
  const ahora = new Date().toISOString();
  const creado = ex ? (ex['Creado'] || '') : ahora;
  const fila = [slug, curso, titulo, estado, JSON.stringify(def), ahora, creado];
  try {
    if (ex) await updateRow(TABS.EVALUACIONES, ex._rowIndex, fila); else await appendRow(TABS.EVALUACIONES, fila);
  } catch (e) {
    return NextResponse.json({ ok: false, error: 'No se pudo guardar en la planilla: ' + (e.message || e) }, { status: 500 });
  }
  try { await registrarAccion(usuario.email, usuario.nombre, crear ? 'Creó una evaluación final' : 'Editó una evaluación final', `${titulo} (/evaluacion/${slug}) · ${curso}`); } catch { /* el registro no debe impedir guardar */ }
  return NextResponse.json({ ok: true, slug });
}

// Baja lógica: se vacía la fila (no hay borrado de filas en lib/sheets.js). Los intentos guardados no se tocan.
export async function DELETE(req) {
  let body;
  try { body = await req.json(); } catch { return NextResponse.json({ ok: false, error: 'JSON inválido' }, { status: 400 }); }
  const usuario = await usuarioDeSolicitud(req, body && body.solicitanteEmail);
  if (!usuario || !tienePermisoEvaluaciones(usuario)) return NextResponse.json({ ok: false, error: 'Sin permiso' }, { status: 403 });
  if (!body.slug) return NextResponse.json({ ok: false, error: 'Falta el enlace' }, { status: 400 });
  await prepararPestanas();
  const filas = await readSheet(TABS.EVALUACIONES, { noCache: true });
  const f = filas.find((x) => x.Slug === body.slug);
  if (!f) return NextResponse.json({ ok: false, error: 'No encontrada' }, { status: 404 });
  await updateRow(TABS.EVALUACIONES, f._rowIndex, ['', '', '', '', '', '', '']);
  try { await registrarAccion(usuario.email, usuario.nombre, 'Eliminó una evaluación final', `${f['Título']} (/evaluacion/${f.Slug})`); } catch { /* */ }
  return NextResponse.json({ ok: true });
}
