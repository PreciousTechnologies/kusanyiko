// Client-side export helpers (replaces Django openpyxl/reportlab endpoints).
// CSV is native. Excel/PDF use `xlsx` + `jspdf` (added to package.json).
// If those libs aren't installed yet, we gracefully fall back to CSV so exports never crash.

export type ExportFormat = 'csv' | 'excel' | 'pdf';

function toCsv(rows: Record<string, any>[], headers: string[]): string {
  const esc = (v: any) => {
    const s = v === null || v === undefined ? '' : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return [headers.join(','), ...rows.map((r) => headers.map((h) => esc(r[h])).join(','))].join('\n');
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

// Returns a Blob for the requested format. Callers wrap it as { data, headers }
// so existing ExportData.tsx code keeps working unchanged.
export async function buildExportBlob(
  baseName: string,
  headers: string[],
  rows: Record<string, any>[],
  format: ExportFormat
): Promise<{ blob: Blob; filename: string; contentType: string }> {
  const stamp = new Date().toISOString().split('T')[0];

  if (format === 'csv') {
    return {
      blob: new Blob([toCsv(rows, headers)], { type: 'text/csv;charset=utf-8' }),
      filename: `${baseName}-${stamp}.csv`,
      contentType: 'text/csv',
    };
  }

  if (format === 'excel') {
    try {
      const XLSX: any = await import(
        /* webpackChunkName: "xlsx" */ 'xlsx'
      );
      const ws = XLSX.utils.json_to_sheet(rows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Report');
      const out = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      return {
        blob: new Blob([out], {
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        }),
        filename: `${baseName}-${stamp}.xlsx`,
        contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      };
    } catch {
      console.warn('xlsx not installed — falling back to CSV. Run: npm install xlsx');
      return {
        blob: new Blob([toCsv(rows, headers)], { type: 'text/csv;charset=utf-8' }),
        filename: `${baseName}-${stamp}.csv`,
        contentType: 'text/csv',
      };
    }
  }

  // pdf
  try {
    const { jsPDF }: any = await import(/* webpackChunkName: "jspdf" */ 'jspdf');
    await import(/* webpackChunkName: "jspdf-autotable" */ 'jspdf-autotable');
    const doc = new jsPDF({ orientation: 'landscape' });
    doc.setFontSize(14);
    doc.text(baseName.replace(/-/g, ' ').toUpperCase(), 14, 14);
    doc.setFontSize(9);
    doc.text(`Generated: ${new Date().toLocaleString()}  •  Records: ${rows.length}`, 14, 21);
    (doc as any).autoTable({
      startY: 26,
      head: [headers],
      body: rows.map((r) => headers.map((h) => (r[h] === null || r[h] === undefined ? '' : String(r[h])))),
      styles: { fontSize: 7 },
      headStyles: { fillColor: [31, 78, 120] },
    });
    const out = doc.output('blob');
    return { blob: out, filename: `${baseName}-${stamp}.pdf`, contentType: 'application/pdf' };
  } catch {
    console.warn('jspdf not installed — falling back to CSV. Run: npm install jspdf jspdf-autotable');
    return {
      blob: new Blob([toCsv(rows, headers)], { type: 'text/csv;charset=utf-8' }),
      filename: `${baseName}-${stamp}.csv`,
      contentType: 'text/csv',
    };
  }
}

// Shape the axios-like response ExportData.tsx expects:
// { data: Blob, headers: { 'content-type': ..., 'content-disposition': ... } }
export function asAxiosBlobResponse(blob: Blob, filename: string, contentType: string) {
  return {
    data: blob,
    headers: {
      'content-type': contentType,
      'content-disposition': `attachment; filename="${filename}"`,
    },
  };
}
