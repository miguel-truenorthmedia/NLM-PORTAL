function escapeCsv(value) {
  const str = String(value ?? "");
  if (/[",\n]/.test(str)) return `"${str.replace(/"/g, '""')}"`;
  return str;
}

function sanitizeFilename(value) {
  return String(value || "report").replace(/[<>:"/\\|?*]/g, "").trim();
}

export function downloadSoldCallsCsv({ buyerName, startDate, endDate, calls }) {
  const headerRow = ["Call Date", "Caller ID", "Target", "Revenue"].join(",");
  const dataRows = calls.map((call) =>
    [call.callDt, call.inboundPhoneNumber, call.targetName, Number(call.conversionAmount || 0).toFixed(2)]
      .map(escapeCsv)
      .join(",")
  );

  const totalRevenue = calls.reduce((sum, call) => sum + Number(call.conversionAmount || 0), 0);
  const totalRow = ["", "", "Total", totalRevenue.toFixed(2)].map(escapeCsv).join(",");

  const csv = [escapeCsv(buyerName), "", headerRow, ...dataRows, totalRow].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  const rangeLabel = startDate && endDate ? `${startDate}_to_${endDate}` : "export";
  link.href = url;
  link.download = `${sanitizeFilename(buyerName)} ${rangeLabel}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}
