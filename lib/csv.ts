// Escape delimiters and neutralize spreadsheet formulas in user-controlled values.
export function toCsv(rows: unknown[][]) {
  return rows
    .map((row) =>
      row
        .map((value) => {
          let text = String(value ?? '');
          if (/^[\s]*[=+@-]|^[\t\r\n]/.test(text)) text = `'${text}`;
          return `"${text.replaceAll('"', '""')}"`;
        })
        .join(','),
    )
    .join('\r\n');
}
