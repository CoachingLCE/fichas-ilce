// Convierte un horario en hora de Argentina (UTC-3, sin horario de verano) a los
// husos de los países donde cursa ILCE. Usa Intl, así que respeta automáticamente
// el horario de verano de cada país según la FECHA (Chile y España lo tienen).
// Devuelve un string tipo: "🇦🇷🇺🇾🇧🇷🇨🇱 10:00-12:00 | 🇧🇴 09:00-11:00 | 🇨🇴🇵🇪🇪🇨 08:00-10:00 | 🇲🇽 07:00-09:00 | 🇪🇸 14:00-16:00"
// (banderas, como se ven en las ediciones cargadas a mano). Antes devolvía códigos de país ("ARUYBRCL 10:00-12:00 | BO …"), y por eso las ediciones
// creadas con "Generar horarios" se veían distinto a las demás. Los países con el mismo horario se agrupan.

const ZONAS = [
  { code: 'AR', flag: '🇦🇷', tz: 'America/Argentina/Buenos_Aires' },
  { code: 'UY', flag: '🇺🇾', tz: 'America/Montevideo' },
  { code: 'BR', flag: '🇧🇷', tz: 'America/Sao_Paulo' },
  { code: 'CL', flag: '🇨🇱', tz: 'America/Santiago' },
  { code: 'BO', flag: '🇧🇴', tz: 'America/La_Paz' },
  { code: 'CO', flag: '🇨🇴', tz: 'America/Bogota' },
  { code: 'PE', flag: '🇵🇪', tz: 'America/Lima' },
  { code: 'EC', flag: '🇪🇨', tz: 'America/Guayaquil' },
  { code: 'MX', flag: '🇲🇽', tz: 'America/Mexico_City' },
  { code: 'ES', flag: '🇪🇸', tz: 'Europe/Madrid' }
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
    if (g) g.banderas.push(z.flag);
    else grupos.push({ texto, banderas: [z.flag] });
  }
  return grupos.map((g) => `${g.banderas.join('')} ${g.texto}`).join(' | ');
}

const BANDERA_DE = Object.fromEntries(ZONAS.map((z) => [z.code, z.flag]));

// Muestra con banderas un horario que quedó guardado con códigos de país ("ARUYBRCL 10:00-12:00 | BO 09:00-11:00 | …"), que es lo que escribía el
// generador antes. No toca los textos que ya tienen banderas ni ningún otro texto: solo reemplaza grupos de códigos que están justo antes de una hora.
export function horariosConBanderas(texto) {
  if (!texto) return '';
  return String(texto).replace(/(^|[\s|])((?:AR|UY|BR|CL|BO|CO|PE|EC|MX|ES)+)(?=\s+\d{1,2}:\d{2})/g,
    (m, antes, codigos) => antes + codigos.match(/../g).map((c) => BANDERA_DE[c]).join(''));
}

// Lo que se muestra de una edición (ficha pública y constructor). Si la edición tiene fecha de la primera clase y hora de inicio y fin (hora de
// Argentina), el horario por país se CALCULA siempre: así sale completo y correcto, incluido el cambio de horario de verano de cada país (un horario
// tipeado a mano puede quedar desactualizado o mal). Si no tiene esos datos, se muestra lo guardado, pasando los códigos de país a banderas.
export function horariosDeEdicion(ed) {
  if (!ed) return '';
  if (ed.fecha && ed.horaIni && ed.horaFin) {
    const calculado = generarHorarios(ed.fecha, ed.horaIni, ed.horaFin);
    if (calculado) return calculado;
  }
  return horariosConBanderas(ed.horarios || '');
}
