export const motionTiming = { quick: .16, standard: .24, reveal: .32 } as const
export const motionEase = [0.22, 1, 0.36, 1] satisfies [number, number, number, number]
export const spring = { type: 'spring' as const, stiffness: 420, damping: 35, mass: 0.8 }
export const gentle = { type: 'spring' as const, stiffness: 280, damping: 32, mass: 0.9 }
export const modeSpring = { type: 'spring' as const, stiffness: 360, damping: 36, mass: 0.9 }
export const disclosureSpring = { type: 'spring' as const, stiffness: 300, damping: 36, mass: 0.9 }
export const noMotion = { duration: 0 } as const
export function revealTransition(reduced: boolean, fluid = false) {
  return reduced ? noMotion : fluid ? disclosureSpring : gentle
}
export const pageMotion = {
  initial: { opacity: 0, y: 6 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -4 },
  transition: { duration: motionTiming.standard, ease: motionEase },
}
