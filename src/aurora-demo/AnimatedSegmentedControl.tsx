import { useId, useRef } from 'react'
import type { KeyboardEvent } from 'react'
import type { LucideIcon } from 'lucide-react'
import { LayoutGroup, motion, useReducedMotion } from 'motion/react'
import { modeSpring, noMotion } from './motion'

export interface SegmentOption<T extends string> {
  value: T
  label: string
  icon?: LucideIcon
}

interface Props<T extends string> {
  label: string
  options: readonly SegmentOption<T>[]
  value: T
  onChange: (value: T) => void
  reducedMotion?: boolean
  className?: string
}

export function AnimatedSegmentedControl<T extends string>({ label, options, value, onChange, reducedMotion = false, className = '' }: Props<T>) {
  const id = useId()
  const refs = useRef<(HTMLButtonElement | null)[]>([])
  const systemReduced = useReducedMotion()
  const motionOff = reducedMotion || !!systemReduced

  function onKeyDown(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    const direction = event.key === 'ArrowRight' || event.key === 'ArrowDown' ? 1
      : event.key === 'ArrowLeft' || event.key === 'ArrowUp' ? -1 : 0
    const next = event.key === 'Home' ? 0 : event.key === 'End' ? options.length - 1
      : direction ? (index + direction + options.length) % options.length : -1
    if (next < 0) return
    event.preventDefault()
    onChange(options[next].value)
    refs.current[next]?.focus()
  }

  return <LayoutGroup id={`segment-${id}`}><div className={`animated-segmented ${className}`.trim()} role="group" aria-label={label}>
    {options.map((option, index) => {
      const Icon = option.icon
      return <button key={option.value} ref={node => { refs.current[index] = node }} type="button" aria-pressed={value === option.value} onClick={() => onChange(option.value)} onKeyDown={event => onKeyDown(event, index)}>
        {value === option.value && <motion.span layoutId="selected" className="animated-segmented-thumb" transition={motionOff ? noMotion : modeSpring} aria-hidden="true" />}
        <span className="animated-segmented-label">{Icon && <Icon size={15} strokeWidth={1.8} aria-hidden="true" />}{option.label}</span>
      </button>
    })}
  </div></LayoutGroup>
}
