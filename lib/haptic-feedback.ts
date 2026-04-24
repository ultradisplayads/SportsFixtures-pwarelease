export type HapticStyle = "light" | "medium" | "heavy" | "success" | "warning" | "error" | "selection"

// Check if haptic feedback is available
export function isHapticSupported(): boolean {
  return typeof window !== "undefined" && "vibrate" in navigator
}

// Trigger haptic feedback
export function triggerHaptic(style: HapticStyle = "light") {
  if (!isHapticSupported()) return

  const patterns: Record<HapticStyle, number | number[]> = {
    light: 10,
    medium: 20,
    heavy: 30,
    success: [10, 50, 10],
    warning: [20, 100, 20],
    error: [30, 100, 30, 100, 30],
    selection: 5,
  }

  const pattern = patterns[style]
  if (Array.isArray(pattern)) {
    navigator.vibrate(pattern)
  } else {
    navigator.vibrate(pattern)
  }
}

export const hapticFeedback = triggerHaptic

// React hook for haptic feedback
export function useHaptic() {
  return {
    trigger: triggerHaptic,
    isSupported: isHapticSupported(),
  }
}
