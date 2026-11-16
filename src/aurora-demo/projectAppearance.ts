import { BookOpen, Code2, Folder, Layers3, Terminal } from 'lucide-react'
import type { Project } from './api'
import type { AppearanceSettings, ProjectColor, ProjectIconName } from './appearance'

export interface ProjectAppearanceOverride {
  root: string
  color?: ProjectColor
  icon?: ProjectIconName
  customAccent?: string
}
export type ProjectAppearances = Record<string, ProjectAppearanceOverride>

export const projectAppearanceKey = 'mcp-code.projectAppearance.v1'
export const projectColors: { id: ProjectColor; label: string; light: string; dark: string; lightInk: string; darkInk: string }[] = [
  { id: 'slate', label: 'Slate', light: '#e5e9ef', dark: '#3b414b', lightInk: '#42536b', darkInk: '#d2d9e4' },
  { id: 'blue', label: 'Blue', light: '#dceafc', dark: '#2e496d', lightInk: '#255c9a', darkInk: '#e2efff' },
  { id: 'teal', label: 'Teal', light: '#d7f1ed', dark: '#24544f', lightInk: '#176c62', darkInk: '#dcf7f0' },
  { id: 'amber', label: 'Amber', light: '#f8edce', dark: '#604c27', lightInk: '#795714', darkInk: '#fff1cd' },
  { id: 'rose', label: 'Rose', light: '#f8e4e7', dark: '#623c48', lightInk: '#9b4056', darkInk: '#ffe8ed' },
  { id: 'violet', label: 'Violet', light: '#ece6f9', dark: '#4b4166', lightInk: '#685099', darkInk: '#f0e8ff' },
]
export const projectIcons: { id: ProjectIconName; label: string; component: typeof Folder }[] = [
  { id: 'folder', label: 'Folder', component: Folder },
  { id: 'code', label: 'Code', component: Code2 },
  { id: 'terminal', label: 'Terminal', component: Terminal },
  { id: 'book', label: 'Book', component: BookOpen },
  { id: 'layers', label: 'Layers', component: Layers3 },
]

export function loadProjectAppearances(storage: Pick<Storage, 'getItem'> = localStorage): ProjectAppearances {
  try {
    const raw = storage.getItem(projectAppearanceKey)
    const parsed: unknown = raw ? JSON.parse(raw) : {}
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {}
    const entries: [string, ProjectAppearanceOverride][] = []
    for (const [id, value] of Object.entries(parsed)) {
      if (!value || typeof value !== 'object' || Array.isArray(value)) continue
      const fields = new Map<string, unknown>(Object.entries(value))
      const root = fields.get('root')
      if (typeof root !== 'string') continue
      const color = projectColors.find(item => item.id === fields.get('color'))?.id
      const icon = projectIcons.find(item => item.id === fields.get('icon'))?.id
      const accent = fields.get('customAccent')
      entries.push([id, {
        root,
        ...(color ? { color } : {}),
        ...(icon ? { icon } : {}),
        ...(typeof accent === 'string' ? { customAccent: accent } : {}),
      }])
    }
    return Object.fromEntries(entries)
  } catch { return {} }
}

export function saveProjectAppearances(value: ProjectAppearances, storage: Pick<Storage, 'setItem'> = localStorage) {
  storage.setItem(projectAppearanceKey, JSON.stringify(value))
}

export function getProjectAppearance(project: Project, overrides: ProjectAppearances, defaults: AppearanceSettings) {
  const saved = overrides[String(project.id)]
  const valid = saved?.root === project.root ? saved : undefined
  const palette = projectColors.find(item => item.id === valid?.color) ?? projectColors.find(item => item.id === defaults.defaultProjectColor) ?? projectColors[0]
  const icon = projectIcons.find(item => item.id === valid?.icon)?.id ?? defaults.defaultProjectIcon
  const customAccent = valid?.customAccent && /^#[0-9a-fA-F]{6}$/.test(valid.customAccent) ? valid.customAccent : undefined
  return { palette, icon, customAccent }
}

export function contrastText(hex: string) {
  const channels = [1, 3, 5].map(index => parseInt(hex.slice(index, index + 2), 16) / 255)
  const luminance = channels.map(value => value <= .04045 ? value / 12.92 : ((value + .055) / 1.055) ** 2.4)
  return .2126 * luminance[0] + .7152 * luminance[1] + .0722 * luminance[2] > .179 ? '#202329' : '#ffffff'
}
