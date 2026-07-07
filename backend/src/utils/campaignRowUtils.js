export function isEmptyCampaignRow(row) {
  return (
    (row.adSpend || 0) === 0 &&
    (row.revenue || 0) === 0 &&
    (row.calls || 0) === 0 &&
    (row.convertedCalls || 0) === 0
  );
}

export function filterEmptyCampaignRows(rows) {
  return rows.filter((row) => !isEmptyCampaignRow(row));
}
