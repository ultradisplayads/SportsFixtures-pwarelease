"use client"

import { useEffect, useRef } from "react"

interface Props {
  trigger: boolean
  type?: "confetti" | "goal" | "fireworks"
}

export function CelebrationFX({ trigger, type = "confetti" }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const rafRef = useRef<number>(0)

  useEffect(() => {
    if (!trigger) return
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    canvas.width = window.innerWidth
    canvas.height = window.innerHeight

    const colors = type === "goal"
      ? ["#5cb827", "#ffffff", "#f59e0b"]
      : type === "fireworks"
      ? ["#ef4444", "#f59e0b", "#3b82f6", "#8b5cf6", "#ec4899"]
      : ["#5cb827", "#f59e0b", "#ef4444", "#3b82f6", "#ffffff"]

    const particles = Array.from({ length: 120 }, () => ({
      x: Math.random() * canvas.width,
      y: -10 - Math.random() * 100,
      r: 4 + Math.random() * 6,
      d: 2 + Math.random() * 4,
      color: colors[Math.floor(Math.random() * colors.length)],
      tilt: Math.random() * 10 - 5,
      tiltAngle: 0,
      tiltAngleInc: 0.07 + Math.random() * 0.05,
      opacity: 1,
    }))

    let frame = 0
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      frame++
      particles.forEach((p) => {
        p.tiltAngle += p.tiltAngleInc
        p.y += p.d + Math.cos(frame / 10) * 0.5
        p.x += Math.sin(frame / 10) * 0.8
        p.tilt = Math.sin(p.tiltAngle) * 15
        p.opacity -= 0.008
        if (p.opacity <= 0) {
          p.y = -10
          p.x = Math.random() * canvas.width
          p.opacity = 1
        }
        ctx.globalAlpha = Math.max(0, p.opacity)
        ctx.fillStyle = p.color
        ctx.beginPath()
        ctx.ellipse(p.x, p.y, p.r, p.r / 2, p.tilt * (Math.PI / 180), 0, 2 * Math.PI)
        ctx.fill()
      })
      if (frame < 200) {
        rafRef.current = requestAnimationFrame(animate)
      } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height)
      }
    }
    rafRef.current = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(rafRef.current)
  }, [trigger, type])

  if (!trigger) return null

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none fixed inset-0 z-[9999]"
      aria-hidden="true"
    />
  )
}
