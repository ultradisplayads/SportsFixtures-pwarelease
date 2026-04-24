"use client"

import { useDiscoMode, DiscoModeOverlay as DiscoOverlay } from "@/components/disco-mode"

export function DiscoModeOverlay() {
  const { active } = useDiscoMode()
  return <DiscoOverlay active={active} />
}
