// app/tv-guide/page.tsx
// Section 07.C — Canonical /tv-guide route.
// Redirects to the live TV schedule page (/tv) so no dead CTA ever results
// in a 404. Any surface that links to /tv-guide will land here first.

import { redirect } from "next/navigation"

export default function TvGuidePage() {
  redirect("/tv")
}
