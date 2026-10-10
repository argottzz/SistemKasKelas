// Dump inspeksi Excel (read-only): struktur + nilai mentah + formula.
// Usage: node scripts/dumpExcel.js [path]
const ExcelJS = require('exceljs');

async function main() {
  const path = process.argv[2] || process.env.EXCEL_PATH;
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(path);
  console.log('[dump] sheets:', wb.worksheets.map((w) => w.name).join(' | '));
  for (const ws of wb.worksheets) {
    console.log(`\n[dump] === ${ws.name} dim=${ws.dimensions} rows=${ws.rowCount} cols=${ws.columnCount} ===`);
    for (let r = 1; r <= Math.min(ws.rowCount, 60); r++) {
      const row = ws.getRow(r);
      const vals = [];
      for (let c = 1; c <= Math.min(ws.columnCount, 15); c++) {
        const cell = row.getCell(c);
        let v = cell.value;
        if (v && typeof v === 'object') {
          if (v.formula) v = `F(${v.formula})=>${v.result}`;
          else if (v instanceof Date) v = v.toISOString().slice(0, 10);
          else v = JSON.stringify(v);
        }
        vals.push(v === null || v === undefined ? '' : String(v));
      }
      if (vals.some((x) => x !== '')) console.log(`R${r}:`, JSON.stringify(vals));
    }
  }
}

main().catch((e) => { console.error('[dump] gagal:', e.message); process.exit(1); });
