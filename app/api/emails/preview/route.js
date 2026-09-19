import { NextResponse } from 'next/server';
import { findUsuario, tienePermisoEmails } from '../../../../lib/auth';
import {
  asuntoConfirmacion, plantillaConfirmacion,
  asuntoAvisoEquipo, plantillaAvisoEquipo,
  plantillaCredenciales,
  asuntoResultadoActividad, plantillaResultadoActividad,
  asuntoAvisoActividadDocente, plantillaAvisoActividadDocente,
  asuntoResumenActividades, plantillaResumenActividades
} from '../../../../lib/mailer';

export const dynamic = 'force-dynamic';

// Datos de ejemplo SOLO para la vista previa. No se envía ningún correo.
const EJEMPLO = {
  nombre: 'María', apellido: 'González', curso: 'Coaching de Equipos',
  edicion: 'Edición 20 — Jueves 29 de octubre de 2026',
  email: 'maria.gonzalez@correo.com', whatsapp: '+54 9 11 5555 1234',
  pais: 'Argentina', medio: 'WhatsApp', origen: 'Instagram',
  fecha: new Date().toISOString().slice(0, 10),
  password: 'Hola123',
  actividad: 'Postwork clase número 2', puntaje: 8, total: 10, slug: 'postwork-deportivo-clase-2',
  docenteNombre: 'Alexander',
  filas: [
    { fecha: new Date().toISOString().slice(0, 10), nombre: 'María González', email: 'maria.gonzalez@correo.com', curso: 'Coaching de Equipos', edicion: '20', actividad: 'Postwork clase número 2', puntaje: 8, total: 10 },
    { fecha: new Date().toISOString().slice(0, 10), nombre: 'Juan Pérez', email: 'juan.perez@correo.com', curso: 'Coaching Deportivo', edicion: '16', actividad: 'Práctica de repaso', puntaje: 4, total: 10 }
  ]
};

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const usuario = await findUsuario(searchParams.get('solicitanteEmail'));
  if (!usuario || !tienePermisoEmails(usuario)) {
    return NextResponse.json({ ok: false, error: 'No autorizado' }, { status: 403 });
  }

  const tipo = searchParams.get('tipo') || '';
  const e = EJEMPLO;
  let asunto = '', html = '';

  if (tipo === 'Confirmación inscripción') {
    asunto = asuntoConfirmacion(e);
    html = plantillaConfirmacion(e);
  } else if (tipo === 'Aviso equipo') {
    asunto = asuntoAvisoEquipo(e);
    html = plantillaAvisoEquipo(e);
  } else if (tipo === 'Credenciales acceso') {
    asunto = 'Tu acceso al panel de ILCE';
    html = plantillaCredenciales(e);
  } else if (tipo === 'Resultado actividad') {
    asunto = asuntoResultadoActividad(e);
    html = plantillaResultadoActividad(e);
  } else if (tipo === 'Aviso actividad docente') {
    asunto = asuntoAvisoActividadDocente({ ...e, estudiante: e.nombre, estudianteEmail: e.email });
    html = plantillaAvisoActividadDocente({ ...e, estudiante: e.nombre, estudianteEmail: e.email });
  } else if (tipo === 'Resumen viernes') {
    asunto = asuntoResumenActividades(e);
    html = plantillaResumenActividades({ desde: e.filas[0].fecha, hasta: e.fecha, filas: e.filas });
  } else {
    return NextResponse.json({ ok: false, error: 'Ese correo todavía no tiene vista previa' }, { status: 400 });
  }

  return NextResponse.json({ ok: true, asunto, html, ejemplo: true });
}
