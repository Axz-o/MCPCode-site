import { Folder } from 'lucide-react'
import type { Project } from './api'
import type { AppearanceSettings } from './appearance'
import { contrastText, getProjectAppearance, projectIcons, type ProjectAppearances } from './projectAppearance'
import { glyphStyle } from './projectStyle'

export function ProjectGlyph({ project, overrides, defaults, theme, size = 20 }: {
  project: Project; overrides: ProjectAppearances; defaults: AppearanceSettings; theme: 'light' | 'dark'; size?: number
}) {
  const appearance = getProjectAppearance(project, overrides, defaults)
  const Icon = projectIcons.find(item => item.id === appearance.icon)?.component ?? Folder
  const background = appearance.customAccent ?? (theme === 'light' ? appearance.palette.light : appearance.palette.dark)
  const foreground = appearance.customAccent ? contrastText(appearance.customAccent) : (theme === 'light' ? appearance.palette.lightInk : appearance.palette.darkInk)
  return <span className="project-identity-glyph" style={glyphStyle(background, foreground)} aria-hidden="true"><Icon size={size} strokeWidth={1.75} /></span>
}
