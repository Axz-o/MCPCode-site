/**
 * MCP Code Design System - Shared Motion System
 * Inspired by desktop Liquid UI 2.0 & HorizonX physical spring choreography
 */

export const motionTiming = {
  quick: 0.16,
  standard: 0.28,
  reveal: 0.45,
  heroText: 0.7,
} as const

export const motionEase = [0.16, 1, 0.3, 1] as const // HorizonX / Apple style exponential decel

export const springs = {
  snappy: { type: "spring" as const, stiffness: 420, damping: 35, mass: 0.8 },
  gentle: { type: "spring" as const, stiffness: 280, damping: 32, mass: 0.9 },
  smooth: { type: "spring" as const, stiffness: 200, damping: 28, mass: 1 },
  pill: { type: "spring" as const, stiffness: 500, damping: 38, mass: 0.7 },
}

export const staggerContainer = (staggerChildren = 0.08, delayChildren = 0) => ({
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren,
      delayChildren,
    },
  },
})

export const fadeUpVariant = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: motionTiming.reveal,
      ease: motionEase,
    },
  },
}
