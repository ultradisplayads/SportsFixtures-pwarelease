"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export function OnboardingCheck() {
  const router = useRouter()

  useEffect(() => {
    const onboardingComplete = localStorage.getItem("onboardingComplete")
    if (!onboardingComplete) {
      router.push("/onboarding")
    }
  }, [router])

  return null
}
