"use client"

import { useEffect, useRef } from "react"

// The logo's maroon and red
const COLORS = ["138, 21, 56", "240, 56, 56"]
// Dots closer than this are joined by a faint line
const LINK = 120
// The pointer pushes dots within this distance away, gently
const PUSH = 140

type Dot = { x: number; y: number; vx: number; vy: number; r: number; depth: number; color: string; alpha: number; glow: boolean }

/**
 * A field of small dots in the logo's colours drifting slowly behind the page, some nearer (bigger, brighter, a soft
 * glow) and some farther away; dots that pass near each other are joined by a faint line (people and jobs connecting),
 * and they drift away from the pointer. Scrolling moves them too, at different speeds by depth (parallax), and gives
 * the job icons (the --scroll-kick variable on the parent) a little push that settles back. Drawn on a canvas; stops while the tab is hidden, and stands still for people
 * who prefer less motion.
 */
export function ParticleField() {
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = ref.current
    const ctx = canvas?.getContext("2d")
    if (!canvas || !ctx) return
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    let w = 0
    let h = 0
    const dots: Dot[] = []
    let frame = 0
    const pointer = { x: -9999, y: -9999 }
    // Scrolling not yet passed on to the dots (eased in over a few frames), and the icons' push
    let pending = 0
    let kick = 0
    const lastTop = new WeakMap<EventTarget, number>()
    const host = canvas.parentElement

    const make = (): Dot => {
      const depth = 0.35 + Math.random() * 0.65
      const angle = Math.random() * Math.PI * 2
      const speed = (0.08 + Math.random() * 0.22) * depth
      return {
        x: Math.random() * w,
        y: Math.random() * h,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 0.05 * depth, // a slight drift upwards
        r: 0.6 + depth * 2.2,
        depth,
        color: COLORS[Math.random() < 0.65 ? 0 : 1],
        alpha: 0.2 + depth * 0.5,
        glow: Math.random() < 0.14,
      }
    }

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      w = window.innerWidth
      h = window.innerHeight
      canvas.width = w * dpr
      canvas.height = h * dpr
      canvas.style.width = w + "px"
      canvas.style.height = h + "px"
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      // More dots on bigger screens, within limits
      const count = Math.max(35, Math.min(110, Math.round((w * h) / 13000)))
      while (dots.length < count) dots.push(make())
      dots.length = count
    }

    const draw = () => {
      ctx.clearRect(0, 0, w, h)
      // Lines between dots that are near each other
      for (let i = 0; i < dots.length; i++) {
        const a = dots[i]
        for (let j = i + 1; j < dots.length; j++) {
          const b = dots[j]
          const dx = a.x - b.x
          const dy = a.y - b.y
          const d2 = dx * dx + dy * dy
          if (d2 < LINK * LINK) {
            const d = Math.sqrt(d2)
            ctx.strokeStyle = `rgba(${COLORS[0]}, ${(1 - d / LINK) * 0.14 * Math.min(a.depth, b.depth)})`
            ctx.lineWidth = 1
            ctx.beginPath()
            ctx.moveTo(a.x, a.y)
            ctx.lineTo(b.x, b.y)
            ctx.stroke()
          }
        }
      }
      // The dots, the near ones with a soft glow
      for (const d of dots) {
        if (d.glow) {
          ctx.shadowColor = `rgba(${d.color}, 0.6)`
          ctx.shadowBlur = 12
        }
        ctx.fillStyle = `rgba(${d.color}, ${d.alpha})`
        ctx.beginPath()
        ctx.arc(d.x, d.y, d.glow ? d.r * 1.6 : d.r, 0, Math.PI * 2)
        ctx.fill()
        if (d.glow) ctx.shadowBlur = 0
      }
    }

    const step = () => {
      // Pass on part of the scroll each frame, so the dots glide rather than jump
      const shift = pending * 0.18
      pending -= shift
      if (Math.abs(pending) < 0.05) pending = 0
      kick *= 0.9
      if (Math.abs(kick) < 0.1) kick = 0
      host?.style.setProperty("--scroll-kick", `${kick.toFixed(1)}px`)
      for (const d of dots) {
        // Parallax: the nearer the dot, the more it moves with the scroll
        d.y -= shift * (0.2 + d.depth * 0.7)
        // Away from the pointer, then back to a calm speed
        const dx = d.x - pointer.x
        const dy = d.y - pointer.y
        const dist = Math.hypot(dx, dy)
        if (dist < PUSH && dist > 0) {
          const f = ((PUSH - dist) / PUSH) * 0.6 * d.depth
          d.x += (dx / dist) * f
          d.y += (dy / dist) * f
        }
        d.x += d.vx
        d.y += d.vy
        // Off one edge, back in at the other
        if (d.x < -10) d.x = w + 10
        else if (d.x > w + 10) d.x = -10
        if (d.y < -10) d.y = h + 10
        else if (d.y > h + 10) d.y = -10
      }
      draw()
      frame = requestAnimationFrame(step)
    }

    const onPointer = (e: PointerEvent) => {
      pointer.x = e.clientX
      pointer.y = e.clientY
    }
    const onLeave = () => {
      pointer.x = -9999
      pointer.y = -9999
    }
    // Any scroll on the page (the window or a panel that scrolls on its own, like Jobs' list)
    const onScroll = (e: Event) => {
      const t = e.target === document ? document.documentElement : (e.target as HTMLElement)
      const top = t.scrollTop
      const delta = top - (lastTop.get(t) ?? 0)
      lastTop.set(t, top)
      if (Math.abs(delta) > 400) return // a jump (new page, anchor), not a scroll
      pending += delta
      kick = Math.max(-40, Math.min(40, kick - delta * 0.35))
    }
    const onVisible = () => {
      cancelAnimationFrame(frame)
      if (!document.hidden && !still) frame = requestAnimationFrame(step)
    }

    resize()
    draw()
    window.addEventListener("resize", resize)
    if (!still) {
      window.addEventListener("pointermove", onPointer, { passive: true })
      document.addEventListener("pointerleave", onLeave)
      document.addEventListener("visibilitychange", onVisible)
      document.addEventListener("scroll", onScroll, { capture: true, passive: true })
      frame = requestAnimationFrame(step)
    }
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener("resize", resize)
      window.removeEventListener("pointermove", onPointer)
      document.removeEventListener("pointerleave", onLeave)
      document.removeEventListener("visibilitychange", onVisible)
      document.removeEventListener("scroll", onScroll, { capture: true })
    }
  }, [])

  return <canvas ref={ref} aria-hidden className="absolute inset-0" />
}
