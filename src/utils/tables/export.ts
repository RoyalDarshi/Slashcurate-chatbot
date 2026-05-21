import { formatTableValue } from "./formatting";
import type { SmartTableColumn, SmartTableRow, SmartTableSummary } from "./types";

const escapeCsv = (value: string): string => {
  if (/[",\n\r]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
};

const downloadBlob = (blob: Blob, fileName: string) => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export const buildCsv = (
  rows: SmartTableRow[],
  columns: SmartTableColumn[],
  summaries: SmartTableSummary[] = []
): string => {
  const headerLine = columns.map((column) => escapeCsv(column.label)).join(",");
  const bodyLines = rows.map((row) =>
    columns
      .map((column) => escapeCsv(formatTableValue(row[column.key], column)))
      .join(",")
  );
  const summaryLines = summaries.length
    ? [
        "",
        "Summaries",
        ...summaries.map((summary) =>
          [summary.label, summary.value].map(escapeCsv).join(",")
        ),
      ]
    : [];
  return [headerLine, ...bodyLines, ...summaryLines].join("\n");
};

export const downloadSmartCsv = (
  rows: SmartTableRow[],
  columns: SmartTableColumn[],
  summaries: SmartTableSummary[],
  fileBaseName: string
) => {
  const csv = buildCsv(rows, columns, summaries);
  downloadBlob(
    new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" }),
    `${fileBaseName}.csv`
  );
};

export const downloadSmartExcel = (
  rows: SmartTableRow[],
  columns: SmartTableColumn[],
  summaries: SmartTableSummary[],
  fileBaseName: string
) => {
  const headerCells = columns
    .map(
      (column) =>
        `<th style="width:${column.width}px;text-align:${column.alignment};">${column.label}</th>`
    )
    .join("");
  const bodyRows = rows
    .map(
      (row) =>
        `<tr>${columns
          .map(
            (column) =>
              `<td style="text-align:${column.alignment};">${formatTableValue(row[column.key], column)}</td>`
          )
          .join("")}</tr>`
    )
    .join("");
  const summaryRows = summaries
    .map(
      (summary) =>
        `<tr><td>${summary.label}</td><td>${summary.value}</td></tr>`
    )
    .join("");
  const html = `
    <html>
      <head><meta charset="utf-8" /></head>
      <body>
        <table border="1">
          <thead><tr>${headerCells}</tr></thead>
          <tbody>${bodyRows}</tbody>
        </table>
        ${summaries.length ? `<br/><table border="1">${summaryRows}</table>` : ""}
      </body>
    </html>
  `;

  downloadBlob(
    new Blob([html], { type: "application/vnd.ms-excel;charset=utf-8;" }),
    `${fileBaseName}.xls`
  );
};

export const exportSmartPdf = (
  rows: SmartTableRow[],
  columns: SmartTableColumn[],
  summaries: SmartTableSummary[],
  title: string
) => {
  const printWindow = window.open("", "_blank", "noopener,noreferrer,width=1200,height=800");
  if (!printWindow) return;

  const tableRows = rows
    .slice(0, 1000)
    .map(
      (row) =>
        `<tr>${columns
          .map(
            (column) =>
              `<td style="text-align:${column.alignment};">${formatTableValue(row[column.key], column)}</td>`
          )
          .join("")}</tr>`
    )
    .join("");
  const summaryHtml = summaries
    .map((summary) => `<span><strong>${summary.label}</strong>: ${summary.value}</span>`)
    .join("");

  printWindow.document.write(`
    <html>
      <head>
        <title>${title}</title>
        <style>
          body { font-family: Inter, Arial, sans-serif; padding: 24px; color: #111827; }
          h1 { font-size: 20px; margin: 0 0 12px; }
          .summary { display: flex; flex-wrap: wrap; gap: 12px; margin-bottom: 16px; font-size: 12px; }
          table { border-collapse: collapse; width: 100%; font-size: 11px; }
          th { background: #EEF2FF; color: #111827; text-align: left; }
          th, td { border: 1px solid #E5E7EB; padding: 6px 8px; max-width: 220px; overflow-wrap: anywhere; }
        </style>
      </head>
      <body>
        <h1>${title}</h1>
        <div class="summary">${summaryHtml}</div>
        <table>
          <thead><tr>${columns.map((column) => `<th>${column.label}</th>`).join("")}</tr></thead>
          <tbody>${tableRows}</tbody>
        </table>
        ${rows.length > 1000 ? "<p>PDF export limited to first 1,000 visible rows for browser performance.</p>" : ""}
        <script>window.onload = () => { window.print(); };</script>
      </body>
    </html>
  `);
  printWindow.document.close();
};
