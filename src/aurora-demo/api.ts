import type { ChatMessageRecord, ChatStatus, MicoBridgeStatus, ProviderId } from './aurora/data'

export interface Project {
  id: number
  name: string
  root: string
  active: number
  can_read: number
  can_edit: number
  can_delete: number
  can_build: number
  python_interpreter: string | null
}

export interface Change {
  id: number
  project_id: number
  kind: string
  path: string
  destination: string | null
  status: string
  command_id?: string | null
  added_lines?: number
  removed_lines?: number
  created_at: string
  decided_at: string | null
}

export interface Task {
  id: number
  project_id: number
  task_key: string
  status: string
  output: string
  exit_code: number | null
  created_at: string
  decided_at: string | null
}

export interface Event {
  id: number
  project_id: number | null
  kind: string
  detail: string
  created_at: string
}

export interface ServerStatus {
  state: 'stopped' | 'starting' | 'running' | 'error'
  port: number | null
  endpoint: string | null
  client_seen: boolean
  error: string | null
}

export interface Snapshot {
  version: string
  server: ServerStatus
  projects: Project[]
  changes: Change[]
  tasks: Task[]
  events: Event[]
  summary?: {
    projects: number
    completed_tasks: number
    pending_tasks: number
    applied_changes: number
    pending_changes: number
    messages_sent?: number
    active_days?: number
    activity_days: { date: string; count: number }[]
    calendar_days?: { date: string; count: number }[]
  }
}

export interface TunnelConfig {
  executable: string
  profile: string
  auto_start_mcp: boolean
  auto_start_tunnel: boolean
  reconnect: boolean
  mcp_port: number
}

export interface TunnelStatus {
  config: TunnelConfig
  state: 'stopped' | 'starting' | 'connected' | 'process_running' | 'error'
  ready: boolean
  credential_present: boolean
  credential_source?: 'environment' | 'secure_store' | 'none'
  executable_found: boolean
  detected_executable: string | null
  profile_found: boolean
  profile_mcp_url: string | null
  profile_url_matches_mcp: boolean | null
  profile_issue: string | null
  error: string | null
  logs: string[]
}

export type TunnelDiagnoseCategory =
  | 'ok'
  | 'missing_executable'
  | 'profile_issue'
  | 'auth_error'
  | 'local_mcp_unavailable'
  | 'timeout'
  | 'error'

export interface TunnelDiagnoseResult {
  ok: boolean
  category: TunnelDiagnoseCategory
  summary: string
  next_step: string
  details: string
  exit_code: number | null
}

export interface AppUpdateInfo {
  checked: boolean
  update_available: boolean
  current_version: string
  latest_version: string | null
  download_url: string | null
  release_url: string
  prerelease: boolean
  error: string | null
}

export type BackendValue =
  | string
  | number
  | boolean
  | null
  | readonly BackendValue[]
  | { readonly [key: string]: BackendValue }
export type BackendParams = { readonly [key: string]: BackendValue }

export function addedProjectId(value: unknown): number | null {
  if (value === null || typeof value !== 'object' || !('id' in value)) return null
  const id = (value as { id: unknown }).id
  return typeof id === 'number' && Number.isSafeInteger(id) && id > 0 ? id : null
}

// ─── Stateful browser demo state ───────────────────────────────────────────────

const nowIso = () => new Date().toISOString()

const state = {
  version: '0.1.0',
  nextProjectId: 3,
  nextMessageId: 100,
  nextCommandId: 2,
  server: {
    state: 'running',
    port: 8765,
    endpoint: 'http://127.0.0.1:8765/mcp',
    client_seen: true,
    error: null,
  } as ServerStatus,
  projects: [
    {
      id: 1,
      name: 'MCPCode',
      root: 'D:\\Pulpit\\MCPCode',
      active: 1,
      can_read: 1,
      can_edit: 1,
      can_delete: 0,
      can_build: 1,
      python_interpreter: null,
    },
    {
      id: 2,
      name: 'next-landing',
      root: 'D:\\Projects\\next-landing',
      active: 0,
      can_read: 1,
      can_edit: 1,
      can_delete: 0,
      can_build: 0,
      python_interpreter: null,
    },
  ] as Project[],
  changes: [
    {
      id: 101,
      project_id: 1,
      kind: 'edit',
      path: 'ui/src/aurora/AuroraTooltip.tsx',
      destination: null,
      status: 'approved',
      command_id: 'cmd-demo-1',
      added_lines: 34,
      removed_lines: 14,
      created_at: '2026-11-16T20:10:00Z',
      decided_at: '2026-11-16T20:11:00Z',
    },
    {
      id: 102,
      project_id: 1,
      kind: 'edit',
      path: 'ui/src/aurora/aurora.css',
      destination: null,
      status: 'pending',
      command_id: 'cmd-demo-1',
      added_lines: 27,
      removed_lines: 6,
      created_at: '2026-11-16T20:10:05Z',
      decided_at: null,
    },
    {
      id: 103,
      project_id: 1,
      kind: 'edit',
      path: 'ui/src/aurora/ConversationView.tsx',
      destination: null,
      status: 'pending',
      command_id: 'cmd-demo-1',
      added_lines: 18,
      removed_lines: 4,
      created_at: '2026-11-16T20:10:10Z',
      decided_at: null,
    },
  ] as Change[],
  diffs: {
    101: [
      '--- a/ui/src/aurora/AuroraTooltip.tsx',
      '+++ b/ui/src/aurora/AuroraTooltip.tsx',
      '@@ -18,7 +18,9 @@ export function AuroraTooltipLayer() {',
      '-  const offset = 6',
      '+  const offset = 10',
      '+  const dismissDelayMs = 120',
      '   return <div className="aurora-tooltip" />',
      ' }',
    ].join('\n'),
    102: [
      '--- a/ui/src/aurora/aurora.css',
      '+++ b/ui/src/aurora/aurora.css',
      '@@ -410,6 +410,11 @@',
      ' .aurora-applied-card {',
      '   border: 1px solid var(--a-line);',
      '   border-radius: 10px;',
      '+  background: var(--a-surface);',
      '+  transition: border-color 180ms ease;',
      ' }',
    ].join('\n'),
    103: [
      '--- a/ui/src/aurora/ConversationView.tsx',
      '+++ b/ui/src/aurora/ConversationView.tsx',
      '@@ -95,4 +95,6 @@',
      '   const scrollToBottom = () => {',
      '+    viewportRef.current?.scrollTo({ top: viewportRef.current.scrollHeight, behavior: "smooth" })',
      '   }',
    ].join('\n'),
  } as Record<number, string>,
  chatByProject: {
    1: [
      {
        id: 1,
        project_id: 1,
        role: 'user',
        content: 'Polish the Aurora tooltip spacing and add the applied changes card under Mico replies.',
        model: null,
        command_id: 'cmd-demo-1',
        created_at: '2026-11-16T20:09:45Z',
      },
      {
        id: 2,
        project_id: 1,
        role: 'assistant',
        content:
          'I updated `AuroraTooltip.tsx` and staged follow-up edits in `aurora.css` and `ConversationView.tsx`. Approve the remaining proposals in **Approvals** to write them to disk.',
        model: 'gpt-5-codex',
        command_id: 'cmd-demo-1',
        created_at: '2026-11-16T20:10:12Z',
      },
    ],
    2: [
      {
        id: 3,
        project_id: 2,
        role: 'user',
        content: 'Check package.json scripts and verify static export readiness.',
        model: null,
        command_id: null,
        created_at: '2026-11-16T19:40:00Z',
      },
      {
        id: 4,
        project_id: 2,
        role: 'assistant',
        content: 'Checked `next-landing`. `next build` produces static output cleanly with no server-only routes.',
        model: 'gpt-5-codex',
        command_id: null,
        created_at: '2026-11-16T19:40:20Z',
      },
    ],
  } as Record<number, ChatMessageRecord[]>,
  chatStatus: {
    provider: 'OpenAI',
    provider_id: 'openai' as ProviderId,
    model: 'gpt-5-codex',
    effort: 'medium',
    configured: true,
    providers: [
      {
        id: 'openai',
        label: 'OpenAI',
        configured: true,
        source: 'secure_store',
        env_var: 'OPENAI_API_KEY',
        available: true,
        models: [
          { id: 'gpt-5-codex', label: 'GPT-5 Codex', efforts: ['low', 'medium', 'high'], default_effort: 'medium' },
          { id: 'gpt-5', label: 'GPT-5', efforts: ['low', 'medium', 'high'], default_effort: 'medium' },
        ],
      },
      {
        id: 'anthropic',
        label: 'Anthropic',
        configured: false,
        source: 'none',
        env_var: 'ANTHROPIC_API_KEY',
        available: true,
        models: [
          { id: 'claude-sonnet-4', label: 'Claude Sonnet 4', efforts: ['low', 'medium', 'high'], default_effort: 'medium' },
        ],
      },
    ],
  } as ChatStatus,
  bridgeByProject: {
    1: {
      pairing: {
        id: 1,
        project_id: 1,
        code: 'MICO-4821',
        status: 'paired',
        conversation_label: 'ChatGPT Web · MCPCode',
        created_at: '2026-11-16T19:55:00Z',
        paired_at: '2026-11-16T19:56:00Z',
        last_seen_at: nowIso(),
      },
      commands: [
        {
          id: 'cmd-demo-1',
          project_id: 1,
          pairing_id: 1,
          text: 'Polish Aurora tooltip spacing and applied changes card',
          status: 'completed',
          widget_detail: '2 pending approvals remaining',
          created_at: '2026-11-16T20:09:45Z',
          dispatched_at: '2026-11-16T20:09:46Z',
          updated_at: '2026-11-16T20:10:12Z',
        },
      ],
    },
    2: {
      pairing: null,
      commands: [],
    },
  } as Record<number, MicoBridgeStatus>,
  tunnel: {
    config: {
      executable: 'tunnel-client.exe',
      profile: 'mcp-code',
      auto_start_mcp: true,
      auto_start_tunnel: false,
      reconnect: true,
      mcp_port: 8765,
    },
    state: 'connected',
    ready: true,
    credential_present: true,
    credential_source: 'secure_store',
    executable_found: true,
    detected_executable: 'C:\\Program Files\\MCP Code\\tunnel-client.exe',
    profile_found: true,
    profile_mcp_url: 'https://mcp-code-demo.tunnel.example.com/mcp',
    profile_url_matches_mcp: true,
    profile_issue: null,
    error: null,
    logs: [
      '[tunnel] loaded profile mcp-code',
      '[tunnel] forwarding https://mcp-code-demo.tunnel.example.com/mcp -> http://127.0.0.1:8765/mcp',
    ],
  } as TunnelStatus,
}

function buildSnapshot(): Snapshot {
  const pendingChanges = state.changes.filter((c) => c.status === 'pending').length
  const appliedChanges = state.changes.filter((c) => c.status === 'approved').length
  return {
    version: state.version,
    server: { ...state.server },
    projects: state.projects.map((p) => ({ ...p })),
    changes: state.changes.map((c) => ({ ...c })),
    tasks: [],
    events: [
      {
        id: 1,
        project_id: 1,
        kind: 'mcp_ready',
        detail: 'Local MCP listening on http://127.0.0.1:8765/mcp',
        created_at: '2026-11-16T20:00:00Z',
      },
    ],
    summary: {
      projects: state.projects.length,
      completed_tasks: 4,
      pending_tasks: 0,
      applied_changes: appliedChanges,
      pending_changes: pendingChanges,
      messages_sent: 12,
      active_days: 5,
      activity_days: [
        { date: '2026-11-12', count: 2 },
        { date: '2026-11-13', count: 4 },
        { date: '2026-11-14', count: 3 },
        { date: '2026-11-15', count: 6 },
        { date: '2026-11-16', count: 5 },
      ],
    },
  }
}

export function getDemoTunnelStatus(): TunnelStatus {
  return { ...state.tunnel, config: { ...state.tunnel.config }, logs: [...state.tunnel.logs] }
}

export function handleDemoTunnelInvoke(cmd: string, args: Record<string, unknown> = {}): unknown {
  switch (cmd) {
    case 'tunnel_status':
      return getDemoTunnelStatus()
    case 'tunnel_start':
      state.tunnel.state = 'connected'
      state.tunnel.ready = true
      state.tunnel.error = null
      return getDemoTunnelStatus()
    case 'tunnel_stop':
      state.tunnel.state = 'stopped'
      state.tunnel.ready = false
      return getDemoTunnelStatus()
    case 'tunnel_save':
      if (args.config && typeof args.config === 'object') {
        state.tunnel.config = { ...state.tunnel.config, ...(args.config as Partial<TunnelConfig>) }
      }
      return getDemoTunnelStatus()
    case 'tunnel_set_key':
      state.tunnel.credential_present = true
      state.tunnel.credential_source = 'secure_store'
      return getDemoTunnelStatus()
    case 'tunnel_clear_key':
      state.tunnel.credential_present = false
      state.tunnel.credential_source = 'none'
      return getDemoTunnelStatus()
    case 'tunnel_diagnose':
      return {
        ok: true,
        category: 'ok',
        summary: 'tunnel-client.exe and profile mcp-code are ready.',
        next_step: 'Start tunnel and paste the /mcp URL into ChatGPT.',
        details: 'Demo mode: all checks passed.',
        exit_code: 0,
      } satisfies TunnelDiagnoseResult
    default:
      return null
  }
}

export async function call<T>(method: string, params: BackendParams = {}): Promise<T> {
  switch (method) {
    case 'check_app_update':
      return {
        checked: true,
        update_available: false,
        current_version: state.version,
        latest_version: `v${state.version}-alpha`,
        download_url: null,
        release_url: 'https://github.com/Axz-o/MCPCode/releases',
        prerelease: false,
        error: null,
      } satisfies AppUpdateInfo as T
    case 'snapshot':
      return buildSnapshot() as T
    case 'start_mcp':
      state.server.state = 'running'
      state.server.port = typeof params.port === 'number' ? params.port : 8765
      state.server.endpoint = `http://127.0.0.1:${state.server.port}/mcp`
      return buildSnapshot() as T
    case 'stop_mcp':
      state.server.state = 'stopped'
      state.server.endpoint = null
      return buildSnapshot() as T
    case 'set_active': {
      const pid = Number(params.project_id)
      state.projects = state.projects.map((p) => ({ ...p, active: p.id === pid ? 1 : 0 }))
      return buildSnapshot() as T
    }
    case 'add_project': {
      const root = String(params.root || 'D:\\Projects\\new-project')
      const name = root.split(/[\\/]/).filter(Boolean).pop() || 'project'
      const id = state.nextProjectId++
      state.projects.forEach((p) => { p.active = 0 })
      state.projects.push({
        id,
        name,
        root,
        active: 1,
        can_read: 1,
        can_edit: 1,
        can_delete: 0,
        can_build: 1,
        python_interpreter: null,
      })
      state.chatByProject[id] = []
      state.bridgeByProject[id] = { pairing: null, commands: [] }
      return { id } as T
    }
    case 'rename_project': {
      const pid = Number(params.project_id)
      const name = String(params.name || '')
      const target = state.projects.find((p) => p.id === pid)
      if (target && name.trim()) target.name = name.trim()
      return buildSnapshot() as T
    }
    case 'set_permissions': {
      const pid = Number(params.project_id)
      const perms = (params.permissions || {}) as Record<string, boolean>
      const target = state.projects.find((p) => p.id === pid)
      if (target) {
        if ('read' in perms) target.can_read = perms.read ? 1 : 0
        if ('edit' in perms) target.can_edit = perms.edit ? 1 : 0
        if ('delete' in perms) target.can_delete = perms.delete ? 1 : 0
        if ('build' in perms) target.can_build = perms.build ? 1 : 0
      }
      return buildSnapshot() as T
    }
    case 'get_change_diff': {
      const cid = Number(params.change_id)
      return { diff: state.diffs[cid] || '@@ -1,1 +1,1 @@\n-old\n+new' } as T
    }
    case 'approve_change': {
      const cid = Number(params.change_id)
      const ch = state.changes.find((c) => c.id === cid)
      if (ch) {
        ch.status = 'approved'
        ch.decided_at = nowIso()
      }
      return buildSnapshot() as T
    }
    case 'reject_change': {
      const cid = Number(params.change_id)
      const ch = state.changes.find((c) => c.id === cid)
      if (ch) {
        ch.status = 'rejected'
        ch.decided_at = nowIso()
      }
      return buildSnapshot() as T
    }
    case 'chat_status':
      return { ...state.chatStatus } as T
    case 'chat_set_selection': {
      const prov = (params.provider as ProviderId) || state.chatStatus.provider_id || 'openai'
      state.chatStatus.provider_id = prov
      state.chatStatus.provider = prov === 'anthropic' ? 'Anthropic' : 'OpenAI'
      state.chatStatus.model = String(params.model || state.chatStatus.model)
      state.chatStatus.effort = String(params.effort || state.chatStatus.effort) as ChatStatus['effort']
      return { ...state.chatStatus } as T
    }
    case 'chat_set_key': {
      const prov = (params.provider as ProviderId) || 'openai'
      const entry = state.chatStatus.providers?.find((p) => p.id === prov)
      if (entry) {
        entry.configured = true
        entry.source = 'secure_store'
      }
      state.chatStatus.configured = true
      return { ...state.chatStatus } as T
    }
    case 'chat_verify_key':
      return { ...state.chatStatus } as T
    case 'chat_clear_key': {
      const prov = (params.provider as ProviderId) || 'openai'
      const entry = state.chatStatus.providers?.find((p) => p.id === prov)
      if (entry) {
        entry.configured = false
        entry.source = 'none'
      }
      return { ...state.chatStatus } as T
    }
    case 'chat_history': {
      const pid = Number(params.project_id)
      return [...(state.chatByProject[pid] || [])] as T
    }
    case 'chat_send': {
      const pid = Number(params.project_id)
      const text = String(params.text || '').trim()
      const list = (state.chatByProject[pid] ||= [])
      const userMsg: ChatMessageRecord = {
        id: state.nextMessageId++,
        project_id: pid,
        role: 'user',
        content: text,
        model: null,
        command_id: null,
        created_at: nowIso(),
      }
      const assistantMsg: ChatMessageRecord = {
        id: state.nextMessageId++,
        project_id: pid,
        role: 'assistant',
        content: `Demo preview response for: "${text}". In the desktop app, Mico inspects your project files via MCP and stages any proposed edits in Approvals.`,
        model: state.chatStatus.model,
        command_id: null,
        created_at: nowIso(),
      }
      list.push(userMsg, assistantMsg)
      return [userMsg, assistantMsg] as T
    }
    case 'mico_bridge_status': {
      const pid = Number(params.project_id)
      return (state.bridgeByProject[pid] ||= { pairing: null, commands: [] }) as T
    }
    case 'mico_create_pairing': {
      const pid = Number(params.project_id)
      const bridge = (state.bridgeByProject[pid] ||= { pairing: null, commands: [] })
      bridge.pairing = {
        id: Date.now(),
        project_id: pid,
        code: `MICO-${Math.floor(1000 + Math.random() * 9000)}`,
        status: 'paired',
        conversation_label: 'ChatGPT Web',
        created_at: nowIso(),
        paired_at: nowIso(),
        last_seen_at: nowIso(),
      }
      return bridge as T
    }
    case 'mico_revoke_pairing': {
      const pid = Number(params.project_id)
      const bridge = (state.bridgeByProject[pid] ||= { pairing: null, commands: [] })
      bridge.pairing = null
      return bridge as T
    }
    case 'mico_enqueue_command': {
      const pid = Number(params.project_id)
      const text = String(params.text || '').trim()
      const bridge = (state.bridgeByProject[pid] ||= { pairing: null, commands: [] })
      const cmdId = `cmd-demo-${state.nextCommandId++}`
      const cmd = {
        id: cmdId,
        project_id: pid,
        pairing_id: bridge.pairing?.id ?? null,
        text,
        status: 'completed' as const,
        widget_detail: 'Completed in interactive web preview',
        created_at: nowIso(),
        dispatched_at: nowIso(),
        updated_at: nowIso(),
      }
      bridge.commands.push(cmd)
      const list = (state.chatByProject[pid] ||= [])
      const msg: ChatMessageRecord = {
        id: state.nextMessageId++,
        project_id: pid,
        role: 'user',
        content: text,
        model: null,
        command_id: cmdId,
        created_at: nowIso(),
      }
      const reply: ChatMessageRecord = {
        id: state.nextMessageId++,
        project_id: pid,
        role: 'assistant',
        content: `Received via MCP bridge: "${text}". Check Approvals to review or apply staged changes.`,
        model: 'chatgpt-mcp',
        command_id: cmdId,
        created_at: nowIso(),
      }
      list.push(msg, reply)
      return { command: cmd, message: msg } as T
    }
    default:
      return null as T
  }
}
