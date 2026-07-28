import * as XLSX from 'xlsx';
import toast from 'react-hot-toast';

export function exportXLSX(data: any[], filename: string, columns: { key: string; label: string }[]) {
  const rows = data.map(row => {
    const obj: Record<string, any> = {};
    columns.forEach(col => {
      obj[col.label] = row[col.key] ?? '';
    });
    return obj;
  });

  const ws = XLSX.utils.json_to_sheet(rows);
  const colWidths = columns.map(col => ({
    wch: Math.max(col.label.length, 12)
  }));
  ws['!cols'] = colWidths;

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, filename.slice(0, 31));
  XLSX.writeFile(wb, `${filename}.xlsx`);
  toast.success(`${filename}.xlsx diunduh`);
}
