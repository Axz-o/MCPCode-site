import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'

interface TooltipState {
  text: string
  x: number
  y: number
  placement: 'top' | 'bottom'
}

export function AuroraTooltipLayer({ reduced }: { reduced: boolean }) {
  const [tooltip, setTooltip] = useState<TooltipState | null>(null)
  const [shiftX, setShiftX] = useState(0)
  const showTimerRef = useRef<number | null>(null)
  const lastShownAtRef = useRef(0)
  const activeElRef = useRef<HTMLElement | null>(null)
  const tipRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function clearShowTimer() {
      if (showTimerRef.current !== null) {
        window.clearTimeout(showTimerRef.current)
        showTimerRef.current = null
      }
    }

    function hide() {
      clearShowTimer()
      activeElRef.current = null
      setTooltip(prev => {
        if (prev) lastShownAtRef.current = Date.now()
        return null
      })
      setShiftX(0)
    }

    function positionFor(el: HTMLElement, text: string, pointerX?: number): TooltipState {
      const rect = el.getBoundingClientRect()
      const preferBottom = rect.top < 44
      const placement: 'top' | 'bottom' = preferBottom ? 'bottom' : 'top'
      const centerX =
        rect.width > 160 && typeof pointerX === 'number'
          ? Math.max(rect.left + 20, Math.min(pointerX, rect.right - 20))
          : rect.left + rect.width / 2
      const y = placement === 'bottom' ? rect.bottom + 8 : rect.top - 8
      return { text, x: centerX, y, placement }
    }

    function resolveTarget(node: EventTarget | null): { el: HTMLElement; text: string } | null {
      if (!(node instanceof Element)) return null
      const el = node.closest('[title], [data-tooltip]')
      if (!(el instanceof HTMLElement)) return null
      const nativeTitle = el.getAttribute('title')
      if (nativeTitle) {
        el.setAttribute('data-tooltip', nativeTitle)
        el.removeAttribute('title')
      }
      const text = (el.getAttribute('data-tooltip') || '').trim()
      if (!text) return null
      return { el, text }
    }

    function onPointerOver(event: PointerEvent) {
      const found = resolveTarget(event.target)
      if (!found) return
      if (activeElRef.current === found.el) return
      clearShowTimer()
      activeElRef.current = found.el
      const pointerX = event.clientX
      const warm = Date.now() - lastShownAtRef.current < 350
      const delay = warm ? 40 : 220
      showTimerRef.current = window.setTimeout(() => {
        if (activeElRef.current !== found.el || !found.el.isConnected) return
        setShiftX(0)
        setTooltip(positionFor(found.el, found.text, pointerX))
      }, delay)
    }

    function onPointerOut(event: PointerEvent) {
      const current = activeElRef.current
      if (!current) return
      const related = event.relatedTarget
      if (related instanceof Node && current.contains(related)) return
      hide()
    }

    function onFocusIn(event: FocusEvent) {
      const found = resolveTarget(event.target)
      if (!found) return
      clearShowTimer()
      activeElRef.current = found.el
      setShiftX(0)
      setTooltip(positionFor(found.el, found.text))
    }

    window.addEventListener('pointerover', onPointerOver, true)
    window.addEventListener('pointerout', onPointerOut, true)
    window.addEventListener('pointerdown', hide, true)
    window.addEventListener('focusin', onFocusIn, true)
    window.addEventListener('focusout', hide, true)
    window.addEventListener('scroll', hide, true)
    window.addEventListener('keydown', hide, true)

    return () => {
      clearShowTimer()
      window.removeEventListener('pointerover', onPointerOver, true)
      window.removeEventListener('pointerout', onPointerOut, true)
      window.removeEventListener('pointerdown', hide, true)
      window.removeEventListener('focusin', onFocusIn, true)
      window.removeEventListener('focusout', hide, true)
      window.removeEventListener('scroll', hide, true)
      window.removeEventListener('keydown', hide, true)
    }
  }, [])

  useLayoutEffect(() => {
    if (!tooltip || !tipRef.current) return
    const halfW = tipRef.current.offsetWidth / 2
    const pad = 10
    const leftEdge = tooltip.x - halfW
    const rightEdge = tooltip.x + halfW
    let delta = 0
    if (leftEdge < pad) delta = pad - leftEdge
    else if (rightEdge > window.innerWidth - pad) delta = window.innerWidth - pad - rightEdge
    setShiftX(delta)
  }, [tooltip])

  return (
    <AnimatePresence>
      {tooltip && (
        <div
          ref={tipRef}
          className="aurora-tooltip-anchor"
          data-placement={tooltip.placement}
          style={{ left: tooltip.x + shiftX, top: tooltip.y }}
        >
          <motion.div
            role="tooltip"
            className="aurora-tooltip"
            initial={reduced ? false : { opacity: 0, scale: 0.94, y: tooltip.placement === 'bottom' ? -3 : 3 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={reduced ? undefined : { opacity: 0, scale: 0.96 }}
            transition={reduced ? { duration: 0 } : { type: 'spring', stiffness: 540, damping: 34 }}
          >
            {tooltip.text}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
