/**
 * Server component: injects one or more JSON-LD blocks into <head>.
 * Pass null values — they are filtered out so optional schemas (e.g. faqSchema)
 * can return null when there are no items without breaking the caller.
 */
export default function JsonLd({
  data,
}: {
  data: (object | null | undefined)[]
}) {
  const valid = data.filter(Boolean) as object[]
  if (!valid.length) return null

  return (
    <>
      {valid.map((schema, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
      ))}
    </>
  )
}
