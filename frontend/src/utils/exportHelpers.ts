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
      const title = baseName.replace(/-/g, ' ').toUpperCase();
      const generated = new Date().toLocaleString();
      const body = rows.map((r) => headers.map((h) => r[h] ?? ''));
      const aoa = [
        [title],
        [`Generated: ${generated} • Records: ${rows.length}`],
        [],
        headers,
        ...body,
      ];
      const ws = XLSX.utils.aoa_to_sheet(aoa);
      ws['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: Math.max(headers.length - 1, 0) } }, { s: { r: 1, c: 0 }, e: { r: 1, c: Math.max(headers.length - 1, 0) } }];
      ws['!autofilter'] = { ref: XLSX.utils.encode_range({ s: { r: 3, c: 0 }, e: { r: Math.max(3, rows.length + 3), c: Math.max(headers.length - 1, 0) } }) };
      ws['!freeze'] = { xSplit: 0, ySplit: 4 };
      ws['!cols'] = headers.map((h) => {
        const maxInColumn = Math.max(
          h.length,
          ...rows.map((r) => String(r[h] ?? '').length)
        );
        return { wch: Math.min(44, Math.max(12, maxInColumn + 2)) };
      });
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
    const title = baseName.replace(/-/g, ' ').toUpperCase();
    const pageWidth = doc.internal.pageSize.getWidth();
    doc.setFillColor(31, 78, 120);
    doc.rect(0, 0, pageWidth, 24, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(13);
    doc.text(title, 14, 14);
    doc.setTextColor(85, 85, 85);
    doc.setFontSize(9);
    doc.text(`Generated: ${new Date().toLocaleString()}  •  Records: ${rows.length}`, 14, 30);
    (doc as any).autoTable({
      startY: 35,
      head: [headers],
      body: rows.map((r) => headers.map((h) => (r[h] === null || r[h] === undefined ? '' : String(r[h])))),
      styles: { fontSize: 7, cellPadding: 2 },
      headStyles: { fillColor: [31, 78, 120], textColor: [255, 255, 255], fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [246, 249, 252] },
      margin: { left: 10, right: 10, bottom: 16 },
      didDrawPage: (data: any) => {
        const pageSize = doc.internal.pageSize;
        const h = pageSize.getHeight();
        doc.setFontSize(8);
        doc.setTextColor(120, 120, 120);
        doc.text(`Page ${doc.getCurrentPageInfo().pageNumber}`, pageWidth - 24, h - 8);
        doc.text(title, 10, h - 8);
      },
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
