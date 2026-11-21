export type LocalProfile = {
  name: string
  color: string
}

export const PROFILE_COLORS = [
  '#3b82f6',
  '#10a37f',
  '#8b5cf6',
  '#f59e0b',
  '#ec4899',
  '#06b6d4',
] as const

const PROFILE_KEY = 'mcp-code.aurora.profile.v1'
const ONBOARDING_KEY = 'mcp-code.aurora.onboarding.v1'

const DEFAULT_PROFILE: LocalProfile = {
  name: 'Developer',
  color: PROFILE_COLORS[0],
}

export type OnboardingState = {
  completed: boolean
  skipped: boolean
  completedAt: string
}

export function hasSavedProfile(): boolean {
  try {
    return Boolean(localStorage.getItem(PROFILE_KEY))
  } catch {
    return false
  }
}

export function loadOnboardingState(): OnboardingState | null {
  try {
    const raw = localStorage.getItem(ONBOARDING_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (!parsed || typeof parsed !== 'object') return null
    return {
      completed: Boolean((parsed as { completed?: unknown }).completed),
      skipped: Boolean((parsed as { skipped?: unknown }).skipped),
      completedAt: String((parsed as { completedAt?: unknown }).completedAt ?? ''),
    }
  } catch {
    return null
  }
}

export function saveOnboardingState(skipped: boolean): OnboardingState {
  const next: OnboardingState = {
    completed: true,
    skipped,
    completedAt: new Date().toISOString(),
  }
  try {
    localStorage.setItem(ONBOARDING_KEY, JSON.stringify(next))
  } catch {
    // Ignore storage quota issues
  }
  return next
}

export function shouldShowInitialOnboarding(hasExistingWorkspaceData: boolean): boolean {
  const recorded = loadOnboardingState()
  if (recorded?.completed) return false
  if (hasSavedProfile() || hasExistingWorkspaceData) {
    saveOnboardingState(false)
    return false
  }
  return true
}

export function loadLocalProfile(): LocalProfile {
  try {
    const raw = localStorage.getItem(PROFILE_KEY)
    if (!raw) return DEFAULT_PROFILE
    const parsed = JSON.parse(raw)
    if (!parsed || Array.isArray(parsed)) return DEFAULT_PROFILE
    const map = new Map(Object.entries(parsed))
    const rawName = map.get('name')
    const rawColor = map.get('color')
    const name = String(rawName ?? '').trim() || DEFAULT_PROFILE.name
    const colorCandidate = String(rawColor ?? '')
    const color = new Set<string>(PROFILE_COLORS).has(colorCandidate)
      ? colorCandidate
      : DEFAULT_PROFILE.color
    return { name, color }
  } catch {
    return DEFAULT_PROFILE
  }
}

export function saveLocalProfile(profile: LocalProfile): LocalProfile {
  const normalized: LocalProfile = {
    name: profile.name.trim() || DEFAULT_PROFILE.name,
    color: new Set<string>(PROFILE_COLORS).has(profile.color)
      ? profile.color
      : DEFAULT_PROFILE.color,
  }
  try {
    localStorage.setItem(PROFILE_KEY, JSON.stringify(normalized))
  } catch {
    // Ignore storage quota issues
  }
  return normalized
}

export function profileInitials(name: string): string {
  const parts = name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
  if (parts.length === 0) return 'D'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return `${parts[0][0] ?? ''}${parts[parts.length - 1][0] ?? ''}`.toUpperCase()
}
