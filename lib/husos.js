// Convierte un horario en hora de Argentina (UTC-3, sin horario de verano) a los
// husos de los países donde cursa ILCE. Usa Intl, así que respeta automáticamente
// el horario de verano de cada país según la FECHA (Chile y España lo tienen).
// Devuelve un string tipo: "AR 10:00-12:00 | BO 09:00-11:00 | COPEEC 08:00-10:00 | ..."

const ZONAS = [
  { code: 'AR', tz: 'America/Argentina/Buenos_Aires' },
  { code: 'UY', tz: 'America/Montevideo' },
  { code: 'BR', tz: 'America/Sao_Paulo' },
  { code: 'CL', tz: 'America/Santiago' },
  { code: 'BO', tz: 'America/La_Paz' },
  { code: 'CO', tz: 'America/Bogota' },
  { code: 'PE', tz: 'America/Lima' },
  { code: 'EC', tz: 'America/Guayaquil' },
  { code: 'MX', tz: 'America/Mexico_City' },
  { code: 'ES', tz: 'Europe/Madrid' }
];

function hhmm(instant, tz) {
  return new Intl.DateTimeFormat('es-AR', { timeZone: tz, hour: '2-digit', minute: '2-digit', hour12: false }).format(instant);
}
function ymd(instant, tz) {
  const p = new Intl.DateTimeFormat('en-CA', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(instant);
  const g = (t) => p.find((x) => x.type === t).value;
  return `${g('year')}-${g('month')}-${g('day')}`;
}
function diaSemana(instant, tz) {
  return new Intl.DateTimeFormat('es-AR', { timeZone: tz, weekday: 'long' }).format(instant);
}

// fecha: 'YYYY-MM-DD' · horaIni/horaFin: 'HH:MM' (hora de Argentina)
export function generarHorarios(fecha, horaIni, horaFin) {
  if (!fecha || !horaIni || !horaFin) return '';
  const inicio = new Date(`${fecha}T${horaIni}:00-03:00`);
  const fin = new Date(`${fecha}T${horaFin}:00-03:00`);
  if (isNaN(inicio.getTime()) || isNaN(fin.getTime())) return '';

  const fechaAR = ymd(inicio, 'America/Argentina/Buenos_Aires');
  const grupos = [];
  for (const z of ZONAS) {
    const fz = ymd(inicio, z.tz);
    const nota = fz !== fechaAR ? ` (${diaSemana(inicio, z.tz)})` : '';
    const texto = `${hhmm(inicio, z.tz)}-${hhmm(fin, z.tz)}${nota}`;
    const g = grupos.find((x) => x.texto === texto);
    if (g) g.codes.push(z.code);
    else grupos.push({ texto, codes: [z.code] });
  }
  return grupos.map((g) => `${g.codes.join('')} ${g.texto}`).join(' | ');
}
