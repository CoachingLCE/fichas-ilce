import { NextResponse } from 'next/server';
import { appendRow } from '../../../lib/sheets';
import { TABS } from '../../../lib/constants';
import { getFormulario } from '../../../lib/formularios';
import { validarEmail } from '../../../lib/validacion';

export const dynamic = 'force-dynamic';

export async function POST(req) {
  let body;
  try { body = await req.json(); } catch { return NextResponse.json({ ok: false, error: 'JSON inválido' }, { status: 400 }); }
  const { slug, respuestas } = body || {};
  const form = await getFormulario(slug);
  if (!form) return NextResponse.json({ ok: false, error: 'Formulario no encontrado' }, { status: 404 });
  if (form.estado !== 'Publicada') return NextResponse.json({ ok: false, error: 'El formulario no está disponible' }, { status: 403 });

  const r = respuestas || {};
  if (!validarEmail(r.email)) return NextResponse.json({ ok: false, error: 'Email inválido' }, { status: 400 });
  // Validar obligatorios definidos
  for (const c of form.campos) {
    if (c.required && (r[c.key] == null || String(r[c.key]).trim() === '')) {
      return NextResponse.json({ ok: false, error: `Falta: ${c.label}` }, { status: 400 });
    }
  }
  const id = 'FR' + Date.now().toString(36).toUpperCase();
  try {
    await appendRow(TABS.RESPUESTAS_FORM, [
      id, new Date().toISOString(), form.titulo, r.curso || '', r.email || '', r.nombre || '', r.edicion || '', JSON.stringify(r)
    ]);
  } catch (e) {
    return NextResponse.json({ ok: false, error: 'No se pudo guardar' }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
