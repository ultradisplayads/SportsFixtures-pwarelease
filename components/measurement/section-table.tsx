import React from "react"

export default function SectionTable({
  title,
  headers,
  rows,
}: {
  title: string
  headers: string[]
  rows: Array<Array<React.ReactNode>>
}) {
  return (
    <section className="rounded-2xl border border-border bg-card p-4">
      <h2 className="text-base font-semibold">{title}</h2>
      <div className="mt-4 overflow-x-auto">
        <table className="min-w-full border-collapse text-sm">
          <thead>
            <tr>
              {headers.map((header) => (
                <th
                  key={header}
                  className="border-b border-border px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground"
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, rowIndex) => (
              <tr key={rowIndex} className="hover:bg-muted/30 transition-colors">
                {row.map((cell, cellIndex) => (
                  <td key={cellIndex} className="border-b border-border px-3 py-2 align-top">
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}
