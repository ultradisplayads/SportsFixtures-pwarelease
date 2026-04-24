// components/debug/asset-audit-table.tsx
// Section 08 — Dev-only table showing asset audit results per entity.
//
// Renders a compact table of NormalizedAssetSet audits so developers can
// see at a glance which entities have missing URLs or fallback-label gaps.
// Never renders in production unless showInProd is explicitly set.

interface AssetAuditRow {
  kind: string;
  primaryPresent: boolean;
  secondaryPresent: boolean;
  tertiaryPresent: boolean;
  candidateCount: number;
  sourceFields: string[];
  sanityChecked?: boolean;
}

interface AssetAuditTableProps {
  rows: AssetAuditRow[];
  entityLabel?: string;
  showInProd?: boolean;
}

export function AssetAuditTable({ rows, entityLabel, showInProd }: AssetAuditTableProps) {
  const isDev = process.env.NODE_ENV === "development";
  if (!isDev && !showInProd) return null;
  if (!rows.length) return null;

  return (
    <div className="my-2 overflow-x-auto rounded-2xl border border-white/10 bg-white/5">
      {entityLabel && (
        <div className="border-b border-white/10 px-3 py-1.5 text-xs font-mono text-white/50">
          asset audit — {entityLabel}
        </div>
      )}
      <table className="min-w-full text-xs font-mono">
        <thead className="text-white/40">
          <tr>
            <th className="px-3 py-2 text-left">Kind</th>
            <th className="px-3 py-2 text-left">Primary</th>
            <th className="px-3 py-2 text-left">Secondary</th>
            <th className="px-3 py-2 text-left">Tertiary</th>
            <th className="px-3 py-2 text-left">Candidates</th>
            <th className="px-3 py-2 text-left">Checked</th>
            <th className="px-3 py-2 text-left">Source Fields</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, idx) => (
            <tr key={idx} className="border-t border-white/5 text-white/70">
              <td className="px-3 py-1.5">{row.kind}</td>
              <td className="px-3 py-1.5">
                <span className={row.primaryPresent ? "text-green-400" : "text-red-400"}>
                  {row.primaryPresent ? "Yes" : "No"}
                </span>
              </td>
              <td className="px-3 py-1.5">
                <span className={row.secondaryPresent ? "text-green-400" : "text-white/30"}>
                  {row.secondaryPresent ? "Yes" : "No"}
                </span>
              </td>
              <td className="px-3 py-1.5">
                <span className={row.tertiaryPresent ? "text-green-400" : "text-white/30"}>
                  {row.tertiaryPresent ? "Yes" : "No"}
                </span>
              </td>
              <td className="px-3 py-1.5">{row.candidateCount}</td>
              <td className="px-3 py-1.5">
                {row.sanityChecked !== undefined ? (
                  <span className={row.sanityChecked ? "text-green-400" : "text-yellow-400"}>
                    {row.sanityChecked ? "Yes" : "No"}
                  </span>
                ) : (
                  <span className="text-white/25">—</span>
                )}
              </td>
              <td className="px-3 py-1.5 text-white/40">
                {row.sourceFields.join(", ") || "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
