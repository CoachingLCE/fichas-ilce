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

// Exportar a PDF (pedido nuevo de Diego para Reportes: "Excel, CSV y PDF"). Tabla simple con
// título + subtítulo (para mostrar los filtros activos, así el PDF tiene memoria de con qué
// filtros se generó) + la tabla de datos, usando jspdf-autotable. Si por lo que sea el import
// dinámico falla (navegador viejo, bloqueo de red, etc.), cae a CSV en vez de romper el botón
// de exportar — mismo criterio que ya usa exportarXLSX de arriba.
export async function exportarPDF(nombreArchivo, titulo, subtitulo, cols, data) {
  try {
    const { jsPDF } = await import('jspdf');
    const autoTable = (await import('jspdf-autotable')).default;
    const doc = new jsPDF({ orientation: cols.length > 5 ? 'landscape' : 'portrait' });
    doc.setFontSize(14);
    doc.text(titulo, 14, 16);
    let y = 16;
    if (subtitulo) {
      doc.setFontSize(9);
      doc.setTextColor(110);
      const lineas = doc.splitTextToSize(subtitulo, doc.internal.pageSize.getWidth() - 28);
      doc.text(lineas, 14, 23);
      y = 23 + lineas.length * 4;
    }
    autoTable(doc, {
      startY: y + 4,
      head: [cols.map(([, l]) => l)],
      body: data.map((o) => cols.map(([k]) => (o[k] ?? '').toString())),
      styles: { fontSize: 8, cellPadding: 2.5 },
      headStyles: { fillColor: [6, 95, 116] },
      alternateRowStyles: { fillColor: [245, 247, 250] }
    });
    doc.save(nombreArchivo);
  } catch {
    exportarCSV(nombreArchivo.replace(/\.pdf$/, '.csv'), cols, data);
  }
}
