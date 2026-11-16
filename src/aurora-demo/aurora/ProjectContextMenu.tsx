import { useEffect, useRef, useState } from 'react'
import { Check } from 'lucide-react'
import { motion } from 'motion/react'
import type { ProjectColor, ProjectIconName } from '../appearance'
import { projectColors, projectIcons } from '../projectAppearance'
import type { AuroraProject } from './data'

export interface ProjectMenuState {
  projectId: number
  x: number
  y: number
}

export function ProjectContextMenu({
  project,
  x,
  y,
  theme,
  reduced,
  currentColor,
  currentIcon,
  onRename,
  onSetColor,
  onSetIcon,
  onClose,
}: {
  project: AuroraProject
  x: number
  y: number
  theme: 'dark' | 'light'
  reduced: boolean
  currentColor: ProjectColor
  currentIcon: ProjectIconName
  onRename: (projectId: number, name: string) => Promise<void>
  onSetColor: (project: AuroraProject, color: ProjectColor) => void
  onSetIcon: (project: AuroraProject, icon: ProjectIconName) => void
  onClose: () => void
}) {
  const menuRef = useRef<HTMLDivElement>(null)
  const [nameDraft, setNameDraft] = useState(project.name)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    setNameDraft(project.name)
  }, [project.id, project.name])

  useEffect(() => {
    function onPointerDown(event: PointerEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose()
      }
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.preventDefault()
        onClose()
      }
    }
    window.addEventListener('pointerdown', onPointerDown)
    window.addEventListener('keydown', onKeyDown)
    return () => {
      window.removeEventListener('pointerdown', onPointerDown)
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [onClose])

  const clampedX = Math.max(12, Math.min(x, window.innerWidth - 256))
  const clampedY = Math.max(12, Math.min(y, window.innerHeight - 250))

  async function submitRename() {
    const clean = nameDraft.trim()
    if (!clean || clean === project.name || saving) return
    setSaving(true)
    try {
      await onRename(project.id, clean)
      onClose()
    } finally {
      setSaving(false)
    }
  }

  return (
    <motion.div
      ref={menuRef}
      role="dialog"
      aria-label={`Customize ${project.name}`}
      className="aurora-project-menu"
      style={{ left: clampedX, top: clampedY }}
      initial={reduced ? false : { opacity: 0, scale: 0.95, y: -4 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={reduced ? undefined : { opacity: 0, scale: 0.96, y: -3 }}
      transition={reduced ? { duration: 0 } : { type: 'spring', stiffness: 460, damping: 34 }}
      onContextMenu={e => e.preventDefault()}
    >
      <div className="aurora-project-menu-section">
        <label className="aurora-project-menu-label" htmlFor="aurora-rename-input">
          Project name
        </label>
        <div className="aurora-project-menu-rename">
          <input
            id="aurora-rename-input"
            type="text"
            value={nameDraft}
            maxLength={80}
            onChange={e => setNameDraft(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') {
                e.preventDefault()
                void submitRename()
              }
            }}
          />
          <button
            type="button"
            className="aurora-project-menu-save"
            disabled={saving || !nameDraft.trim() || nameDraft.trim() === project.name}
            aria-label="Save name"
            title="Save name"
            onClick={() => void submitRename()}
          >
            <Check size={13} />
          </button>
        </div>
      </div>

      <div className="aurora-project-menu-section">
        <span className="aurora-project-menu-label">Color</span>
        <div className="aurora-project-menu-swatches">
          {projectColors.map(c => {
            const selected = c.id === currentColor
            const swatch = theme === 'dark' ? c.darkInk : c.lightInk
            return (
              <button
                key={c.id}
                type="button"
                className="aurora-project-swatch"
                data-selected={selected ? 'true' : 'false'}
                style={{ backgroundColor: swatch }}
                aria-label={c.label}
                title={c.label}
                onClick={() => onSetColor(project, c.id)}
              />
            )
          })}
        </div>
      </div>

      <div className="aurora-project-menu-section">
        <span className="aurora-project-menu-label">Icon</span>
        <div className="aurora-project-menu-icons">
          {projectIcons.map(({ id, label, component: Icon }) => {
            const selected = id === currentIcon
            return (
              <button
                key={id}
                type="button"
                className="aurora-project-icon-btn"
                data-selected={selected ? 'true' : 'false'}
                aria-label={label}
                title={label}
                onClick={() => onSetIcon(project, id)}
              >
                <Icon size={15} />
              </button>
            )
          })}
        </div>
      </div>
    </motion.div>
  )
}
