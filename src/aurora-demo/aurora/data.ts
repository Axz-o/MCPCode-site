import type { Snapshot } from '../api'
import type { AppearanceSettings, ProjectIconName } from '../appearance'
import { getProjectAppearance, type ProjectAppearances } from '../projectAppearance'

export type AuroraProject = {
  id: number
  name: string
  path: string
  active: boolean
  color: string
  icon: ProjectIconName
  permissions: { read: boolean; edit: boolean; delete: boolean; build: boolean }
  pendingCount: number
}
export type AuroraChange = {
  id: number
  projectId: number
  kind: string
  path: string
  destination: string | null
  status: string
  commandId: string | null
  addedLines: number
  removedLines: number
  createdAt: string
}
export type AuroraMessage = {
  id: number
  role: 'user' | 'assistant'
  text: string
  commandId: string | null
  createdAt: string
}
export type ChatMessageRecord = {
  id: number
  project_id: number
  role: 'user' | 'assistant'
  content: string
  model: string | null
  command_id?: string | null
  created_at: string
}
export type MicoPairing = {
  id: number
  project_id: number
  code: string
  status: 'pending' | 'paired' | 'revoked'
  conversation_label: string | null
  created_at: string
  paired_at: string | null
  last_seen_at: string | null
}
export type MicoCommandStatus = 'queued' | 'dispatched' | 'waiting' | 'awaiting_confirmation' | 'completed' | 'failed'
export type MicoCommand = {
  id: string
  project_id: number
  pairing_id: number | null
  text: string
  status: MicoCommandStatus
  widget_detail: string | null
  created_at: string
  dispatched_at: string | null
  updated_at: string
}
export type MicoBridgeStatus = {
  pairing: MicoPairing | null
  commands: MicoCommand[]
}
export type ProviderId = 'openai' | 'anthropic' | 'xai'
export type EffortLevel = 'low' | 'medium' | 'high' | 'xhigh' | 'max'
export type AIModelSpec = {
  id: string
  label: string
  efforts: EffortLevel[]
  default_effort: EffortLevel | null
}
export type AIProviderInfo = {
  id: ProviderId
  label: string
  configured: boolean
  source: 'secure_store' | 'env' | 'none'
  env_var: string
  available: boolean
  models: AIModelSpec[]
}
export type ChatStatus = {
  provider: string
  provider_id?: ProviderId
  model: string
  effort?: EffortLevel | null
  configured: boolean
  providers?: AIProviderInfo[]
}
export type AuroraWorkspaceMeta = {
  version: string
  serverState: 'stopped' | 'starting' | 'running' | 'error'
  endpoint: string | null
  port: number | null
  clientSeen: boolean
  serverError: string | null
  pendingChanges: number
  pendingTasks: number
}

export function readWorkspaceMeta(snapshot: Snapshot): AuroraWorkspaceMeta {
  const pendingChanges = Array.isArray(snapshot.changes)
    ? snapshot.changes.filter(item => item.status === 'pending').length
    : 0
  const pendingTasks = Array.isArray(snapshot.tasks)
    ? snapshot.tasks.filter(item => item.status === 'pending').length
    : 0
  return {
    version: snapshot.version || '0.1.0',
    serverState: snapshot.server?.state ?? 'stopped',
    endpoint: snapshot.server?.endpoint ?? null,
    port: snapshot.server?.port ?? null,
    clientSeen: Boolean(snapshot.server?.client_seen),
    serverError: snapshot.server?.error ?? null,
    pendingChanges,
    pendingTasks,
  }
}

function mapChange(item: Snapshot['changes'][number]): AuroraChange {
  return {
    id: item.id,
    projectId: item.project_id,
    kind: item.kind,
    path: item.path,
    destination: item.destination ?? null,
    status: item.status,
    commandId: item.command_id ?? null,
    addedLines: typeof item.added_lines === 'number' ? item.added_lines : 0,
    removedLines: typeof item.removed_lines === 'number' ? item.removed_lines : 0,
    createdAt: item.created_at,
  }
}

export function readPendingChanges(snapshot: Snapshot, projectId: number | null): AuroraChange[] {
  if (projectId === null || !Array.isArray(snapshot.changes)) return []
  return snapshot.changes
    .filter(item => item.project_id === projectId && item.status === 'pending')
    .map(mapChange)
}

export function readApprovedChanges(snapshot: Snapshot, projectId: number | null): AuroraChange[] {
  if (projectId === null || !Array.isArray(snapshot.changes)) return []
  return snapshot.changes
    .filter(item => item.project_id === projectId && item.status === 'approved' && Boolean(item.command_id))
    .map(mapChange)
}

export function readProjects(snapshot: Snapshot, settings: AppearanceSettings, overrides: ProjectAppearances, theme: 'dark' | 'light'): AuroraProject[] {
  if (!Array.isArray(snapshot.projects)) throw new Error('Invalid project list from the local backend')
  const changes = Array.isArray(snapshot.changes) ? snapshot.changes : []
  const tasks = Array.isArray(snapshot.tasks) ? snapshot.tasks : []
  return snapshot.projects.map(item => {
    if (!Number.isSafeInteger(item.id) || item.id <= 0 || !item.name.trim() || !item.root.trim() || (item.active !== 0 && item.active !== 1)) {
      throw new Error('Invalid project metadata from the local backend')
    }
    const { palette, icon, customAccent } = getProjectAppearance(item, overrides, settings)
    const color = customAccent ?? (theme === 'dark' ? palette.darkInk : palette.lightInk)
    const pendingCount =
      changes.filter(change => change.project_id === item.id && change.status === 'pending').length +
      tasks.filter(task => task.project_id === item.id && task.status === 'pending').length
    return {
      id: item.id,
      name: item.name,
      path: item.root,
      active: item.active === 1,
      color,
      icon,
      permissions: {
        read: item.can_read === 1,
        edit: item.can_edit === 1,
        delete: item.can_delete === 1,
        build: item.can_build === 1,
      },
      pendingCount,
    }
  })
}

export function readMessages(value: ChatMessageRecord[]): AuroraMessage[] {
  if (!Array.isArray(value)) throw new Error('Invalid chat history from the local backend')
  return value.map(item => {
    if (!Number.isSafeInteger(item.id) || item.id <= 0 || (item.role !== 'user' && item.role !== 'assistant')) {
      throw new Error('Invalid message from the local backend')
    }
    return {
      id: item.id,
      role: item.role,
      text: item.content,
      commandId: item.command_id ?? null,
      createdAt: item.created_at,
    }
  })
}
