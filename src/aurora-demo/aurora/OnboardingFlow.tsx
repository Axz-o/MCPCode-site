import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { Liquid } from 'liquid-gooey'
import { ThinkingOrb } from 'thinking-orbs'
import { MicoAvatar } from '../MicoAvatar'
import { PROFILE_COLORS, profileInitials, type LocalProfile } from './profile'
import { withBasePath } from '@/lib/site'

type OnboardingStep = 'meet' | 'profile'

const EASE_OUT = [0.23, 1, 0.32, 1] as const

export function OnboardingFlow({
  initialProfile,
  reduced,
  onComplete,
  onSkip,
}: {
  initialProfile: LocalProfile
  reduced: boolean
  onComplete: (profile: LocalProfile) => void
  onSkip: () => void
}) {
  const [step, setStep] = useState<OnboardingStep>('meet')
  const [micoEmerged, setMicoEmerged] = useState(reduced)
  const [name, setName] = useState(
    initialProfile.name === 'Developer' ? '' : initialProfile.name
  )
  const [color, setColor] = useState(initialProfile.color || PROFILE_COLORS[0])
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (reduced || step !== 'meet') {
      setMicoEmerged(true)
      return
    }
    setMicoEmerged(false)
    const timer = window.setTimeout(() => setMicoEmerged(true), 520)
    return () => window.clearTimeout(timer)
  }, [reduced, step])

  useEffect(() => {
    if (step !== 'profile') return
    const timer = window.setTimeout(() => inputRef.current?.focus(), 60)
    return () => window.clearTimeout(timer)
  }, [step])

  const previewName = name.trim() || 'Developer'
  const initials = profileInitials(previewName)

  function handleSubmitProfile() {
    onComplete({
      name: previewName,
      color,
    })
  }

  return (
    <motion.div
      className="aurora-onboarding"
      role="dialog"
      aria-modal="true"
      aria-label="MCP Code introduction"
      initial={reduced ? { opacity: 0 } : { opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={reduced ? { opacity: 0 } : { opacity: 0 }}
      transition={{ duration: reduced ? 0.16 : 0.24, ease: EASE_OUT }}
    >
      <div className="aurora-onboarding-brand">
        <img src={withBasePath('/interface-logo.png')} alt="MCP Code" />
        <span>MCP Code</span>
      </div>

      <div className="aurora-onboarding-card">
        <AnimatePresence mode="wait" initial={false}>
          {step === 'meet' ? (
            <motion.div
              key="step-meet"
              className="aurora-onboarding-step"
              initial={reduced ? { opacity: 0 } : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduced ? { opacity: 0 } : { opacity: 0, y: -8 }}
              transition={{ duration: reduced ? 0.14 : 0.22, ease: EASE_OUT }}
            >
              <div className="aurora-onboarding-stage" aria-hidden="true">
                {!reduced ? (
                  <Liquid
                    blur={10}
                    contrast={18}
                    fill="rgba(255, 255, 255, 0.055)"
                    className="aurora-onboarding-liquid"
                  >
                    <Liquid.Item
                      effect="morph"
                      morph={{ shape: true, speed: 1.1, bounce: 0.2 }}
                      className="aurora-onboarding-liquid-blob"
                    >
                      <div className="aurora-onboarding-orb-wrap">
                        <AnimatePresence mode="wait" initial={false}>
                          {!micoEmerged ? (
                            <motion.div
                              key="orb"
                              className="aurora-onboarding-orb"
                              initial={{ opacity: 0, scale: 0.9 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{ opacity: 0, scale: 0.92 }}
                              transition={{ duration: 0.26, ease: EASE_OUT }}
                            >
                              <ThinkingOrb size={64} state="breathing" theme="dark" />
                            </motion.div>
                          ) : (
                            <motion.div
                              key="mico"
                              className="aurora-onboarding-mico"
                              initial={{ opacity: 0, scale: 0.92 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ duration: 0.34, ease: EASE_OUT }}
                            >
                              <MicoAvatar size={72} state="default" label="Mico" />
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </Liquid.Item>
                  </Liquid>
                ) : (
                  <div className="aurora-onboarding-orb-wrap">
                    <MicoAvatar size={68} state="default" label="Mico" />
                  </div>
                )}
              </div>

              <h1 className="aurora-onboarding-title">Meet Mico</h1>
              <p className="aurora-onboarding-copy">
                Connect your AI to local projects and review changes before they’re applied.
              </p>

              <div className="aurora-onboarding-actions">
                <button
                  type="button"
                  className="aurora-onboarding-primary"
                  onClick={() => setStep('profile')}
                >
                  Get started
                </button>
                <button
                  type="button"
                  className="aurora-onboarding-skip"
                  onClick={onSkip}
                >
                  Skip for now
                </button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="step-profile"
              className="aurora-onboarding-step"
              initial={reduced ? { opacity: 0 } : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduced ? { opacity: 0 } : { opacity: 0, y: -8 }}
              transition={{ duration: reduced ? 0.14 : 0.22, ease: EASE_OUT }}
            >
              <div className="aurora-onboarding-avatar-stage">
                <motion.div
                  layoutId={reduced ? undefined : 'onboarding-profile-avatar'}
                  className="aurora-onboarding-avatar"
                  style={{ background: color }}
                  transition={
                    reduced
                      ? { duration: 0.15 }
                      : { type: 'spring', duration: 0.55, bounce: 0.16 }
                  }
                >
                  <span>{initials}</span>
                </motion.div>
              </div>

              <h1 className="aurora-onboarding-title">Name your profile</h1>
              <p className="aurora-onboarding-copy">
                Saved locally on this device. Leave blank to use Developer.
              </p>

              <form
                className="aurora-onboarding-form"
                onSubmit={(e) => {
                  e.preventDefault()
                  handleSubmitProfile()
                }}
              >
                <input
                  ref={inputRef}
                  type="text"
                  className="aurora-onboarding-input"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Developer"
                  maxLength={40}
                  aria-label="Profile name"
                />

                <div className="aurora-onboarding-swatches" role="radiogroup" aria-label="Profile color">
                  {PROFILE_COLORS.map((swatch) => (
                    <button
                      key={swatch}
                      type="button"
                      className={`aurora-onboarding-swatch ${color === swatch ? 'is-active' : ''}`}
                      style={{ background: swatch }}
                      aria-label={`Select color ${swatch}`}
                      aria-checked={color === swatch}
                      role="radio"
                      onClick={() => setColor(swatch)}
                    />
                  ))}
                </div>

                <div className="aurora-onboarding-actions">
                  <button type="submit" className="aurora-onboarding-primary">
                    Continue
                  </button>
                  <button
                    type="button"
                    className="aurora-onboarding-skip"
                    onClick={onSkip}
                  >
                    Skip for now
                  </button>
                </div>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  )
}
