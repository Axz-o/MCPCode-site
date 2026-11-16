export type VisualStyle = 'native' | 'liquid'
export type ThemePreference = 'system' | 'light' | 'dark'
export type InterfaceDensity = 'comfortable' | 'compact'
export type TypeSize = 'standard' | 'large'
export type MotionIntensity = 'subtle' | 'fluid'
export type AccentColor = 'blue' | 'teal' | 'plum' | 'graphite'
export type ProjectColor = 'slate' | 'blue' | 'teal' | 'amber' | 'rose' | 'violet'
export type ProjectIconName = 'folder' | 'code' | 'terminal' | 'book' | 'layers'

export interface AppearanceSettings {
  style: VisualStyle
  theme: ThemePreference
  density: InterfaceDensity
  typeSize: TypeSize
  motionIntensity: MotionIntensity
  reducedMotion: boolean
  accent: AccentColor
  botAvatar: boolean
  defaultProjectColor: ProjectColor
  defaultProjectIcon: ProjectIconName
}

export const appearanceKey = 'mcp-code.appearance.v1'

export const defaultAppearance: AppearanceSettings = {
  style: 'native', theme: 'system', density: 'comfortable', typeSize: 'standard',
  motionIntensity: 'subtle', reducedMotion: false, accent: 'blue', botAvatar: true,
  defaultProjectColor: 'slate', defaultProjectIcon: 'folder',
}

const options = {
  style: ['native', 'liquid'], theme: ['system', 'light', 'dark'],
  density: ['comfortable', 'compact'], typeSize: ['standard', 'large'],
  motionIntensity: ['subtle', 'fluid'], accent: ['blue', 'teal', 'plum', 'graphite'],
  defaultProjectColor: ['slate', 'blue', 'teal', 'amber', 'rose', 'violet'],
  defaultProjectIcon: ['folder', 'code', 'terminal', 'book', 'layers'],
} as const

export function loadAppearance(storage: Pick<Storage, 'getItem'> = localStorage): AppearanceSettings {
  const legacyTheme = storage.getItem('mcp-code.theme')
  const legacyMotion = storage.getItem('liquid.motionOff') === '1'
  let saved = new Map<string, unknown>()
  try {
    const raw = storage.getItem(appearanceKey)
    if (raw) {
      const parsed: unknown = JSON.parse(raw)
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) saved = new Map(Object.entries(parsed))
    }
  } catch { /* Invalid local preferences fall back to safe defaults. */ }
  const result = { ...defaultAppearance }
  for (const [key, choices] of Object.entries(options)) {
    const candidate = saved.get(key) ?? (key === 'theme' ? legacyTheme : undefined)
    if (typeof candidate === 'string' && new Set<string>(choices).has(candidate)) {
      // Each key is checked against its own finite option list before assignment.
      Object.assign(result, { [key]: candidate })
    }
  }
  const reducedMotion = saved.get('reducedMotion')
  const botAvatar = saved.get('botAvatar')
  result.reducedMotion = typeof reducedMotion === 'boolean' ? reducedMotion : legacyMotion
  result.botAvatar = typeof botAvatar === 'boolean' ? botAvatar : true
  return result
}

export function saveAppearance(settings: AppearanceSettings, storage: Pick<Storage, 'setItem'> = localStorage) {
  storage.setItem(appearanceKey, JSON.stringify(settings))
}
