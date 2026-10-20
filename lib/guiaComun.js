// Buscador fijo y "¿Qué necesitás hacer?" (estilo del Manual académico). Lógica común, sin dependencias: se usa igual en todas las apps de ILCE.
export const norm = (s) => String(s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

/** Tareas que esta persona puede hacer (cada tarea trae su permiso en `ok`; sin `ok` la puede hacer cualquiera). */
export const tareasPermitidas = (tareas, usuario) => tareas.filter((t) => !t.ok || t.ok(usuario));

/**
 * Busca por palabras (todas tienen que aparecer, sin importar tildes ni mayúsculas) entre las tareas y las pantallas que la persona puede usar.
 * Devuelve hasta 9 resultados: { clave, grupo: 'Tarea' | 'Pantalla', icono, texto, sub, destino }.
 */
export function buscarEnGuia(consulta, tareas, pantallas, usuario) {
  const ws = norm(consulta).split(/\s+/).filter((w) => w.length >= 2);
  if (!ws.length) return [];
  const coincide = (txt) => ws.every((w) => norm(txt).includes(w));
  const out = [];
  for (const t of tareasPermitidas(tareas, usuario)) if (coincide(`${t.titulo} ${t.sub} ${t.palabras || ''}`)) out.push({ clave: 't-' + t.id, grupo: 'Tarea', icono: t.icono, texto: t.titulo, sub: t.sub, destino: t.destino });
  for (const p of pantallas) if ((!p.ok || p.ok(usuario)) && coincide(`${p.label} ${p.palabras || ''}`)) out.push({ clave: 'p-' + p.ruta, grupo: 'Pantalla', icono: 'flecha', texto: p.label, sub: 'Abrir la pantalla', destino: { ruta: p.ruta } });
  return out.slice(0, 9);
}
