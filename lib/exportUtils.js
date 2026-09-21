// Exportar a CSV/Excel — misma lógica que ya usa Panel.jsx para "Fichas completadas" (xlsx
// dinámico, con fallback a CSV si falla), generalizada para poder exportar cualquier tabla de
// Reportes sin duplicar el código de armar el archivo y disparar la descarga.
export function descargar(nombre, contenido, tipo) {
  const blob = new Blob([contenido], { type: tipo });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = nombre;
  a.click();
}

// cols: [[key, etiqueta], ...]  data: [{key: valor, ...}, ...]
export function exportarCSV(nombreArchivo, cols, data) {
  const body = data.map((o) => cols.map(([k]) => {
    const v = ('' + (o[k] ?? '')).replace(/"/g, '""');
    return /[",\n]/.test(v) ? `"${v}"` : v;
  }).join(',')).join('\n');
  descargar(nombreArchivo, '﻿' + cols.map(([, l]) => l).join(',') + '\n' + body, 'text/csv;charset=utf-8');
}

export async function exportarXLSX(nombreArchivo, hoja, cols, data) {
  try {
    const XLSX = await import('xlsx');
    const filas = data.map((o) => { const r = {}; cols.forEach(([k, l]) => r[l] = o[k] ?? ''); return r; });
    const ws = XLSX.utils.json_to_sheet(filas, { header: cols.map(([, l]) => l) });
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, hoja);
    XLSX.writeFile(wb, nombreArchivo);
  } catch {
    exportarCSV(nombreArchivo.replace(/\.xlsx$/, '.csv'), cols, data);
  }
}
