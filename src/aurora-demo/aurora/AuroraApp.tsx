import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { getVersion, invoke, getCurrentWindow, open as openDialog } from '../tauri-shim'
import { withBasePath } from '@/lib/site'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import {
  ArrowLeft, ArrowRight, CircleHelp, FolderKanban, MessageCircle,
  Minus, PanelLeftClose, PanelLeftOpen, PanelRightClose, PanelRightOpen,
  Settings2, Square, UserRound, X
} from 'lucide-react'
import { addedProjectId, call, type Snapshot, type TunnelConfig, type TunnelDiagnoseResult, type TunnelStatus } from '../api'
import { loadAppearance, saveAppearance, type ProjectColor, type ProjectIconName } from '../appearance'
import { getProjectAppearance, loadProjectAppearances, saveProjectAppearances } from '../projectAppearance'
import {
  AccountPage, AuroraSettingsPage, HelpPopover, ModelEffortSelector,
  ProjectPopover, WorkspaceInspector, WorkspaceSidebar
} from './AuroraPanels'
import { ConversationView } from './ConversationView'
import { AuroraTooltipLayer } from './AuroraTooltip'
import { ProjectContextMenu, type ProjectMenuState } from './ProjectContextMenu'
import {
  readApprovedChanges, readMessages, readPendingChanges, readProjects, readWorkspaceMeta,
  type AuroraMessage, type AuroraProject, type AuroraWorkspaceMeta,
  type ChatMessageRecord, type ChatStatus, type EffortLevel, type MicoBridgeStatus, type ProviderId
} from './data'
import './aurora.css'

type RailSection = 'chats' | 'projects' | 'settings' | 'account'
type SettingsTab = 'appearance' | 'connections' | 'permissions'
type NavEntry = { projectId: number | null; rail: RailSection }

const windowHandle = (() => {
  try {
    return '__TAURI_INTERNALS__' in window ? getCurrentWindow() : null
  } catch {
    return null
  }
})()

const topRailItems: { id: 'chats' | 'projects'; label: string; Icon: typeof MessageCircle }[] = [
  { id: 'chats', label: 'Chats', Icon: MessageCircle },
  { id: 'projects', label: 'Projects', Icon: FolderKanban },
]

const bottomRailItems: { id: 'help' | 'settings'; label: string; Icon: typeof Settings2 }[] = [
  { id: 'help', label: 'Help & Version', Icon: CircleHelp },
  { id: 'settings', label: 'Settings', Icon: Settings2 },
]

const defaultMeta: AuroraWorkspaceMeta = {
  version: '0.1.0',
  serverState: 'stopped',
  endpoint: null,
  port: null,
  clientSeen: false,
  serverError: null,
  pendingChanges: 0,
  pendingTasks: 0,
}

export default function AuroraApp() {
  const [appearance, setAppearance] = useState(loadAppearance)
  const [projectAppearances, setProjectAppearances] = useState(loadProjectAppearances)
  const [projectMenu, setProjectMenu] = useState<ProjectMenuState | null>(null)
  const [systemDark, setSystemDark] = useState(window.matchMedia('(prefers-color-scheme: dark)').matches)
  const systemReduced = useReducedMotion()
  const theme = appearance.theme === 'system' ? (systemDark ? 'dark' : 'light') : appearance.theme
  const reduced = appearance.reducedMotion || Boolean(systemReduced)
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null)
  const [projectId, setProjectId] = useState<number | null>(null)
  const [messages, setMessages] = useState<AuroraMessage[]>([])
  const [historyLoading, setHistoryLoading] = useState(false)
  const [chatStatus, setChatStatus] = useState<ChatStatus | null>(null)
  const [chatTransport, setChatTransport] = useState<'mcp' | 'api'>(() => {
    try {
      return window.localStorage.getItem('mcp_code_chat_transport') === 'api' ? 'api' : 'mcp'
    } catch {
      return 'mcp'
    }
  })
  const [tunnel, setTunnel] = useState<TunnelStatus | null>(null)
  const [micoBridge, setMicoBridge] = useState<MicoBridgeStatus | null>(null)
  const [tunnelDiagnosis, setTunnelDiagnosis] = useState<TunnelDiagnoseResult | null>(null)
  const [tunnelDiagnosing, setTunnelDiagnosing] = useState(false)
  const [diffs, setDiffs] = useState<Record<number, string>>({})
  const [actionBusy, setActionBusy] = useState(false)
  const [actionNotice, setActionNotice] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [historyError, setHistoryError] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [rail, setRail] = useState<RailSection>('chats')
  const [projectOpen, setProjectOpen] = useState(false)
  const [helpOpen, setHelpOpen] = useState(false)
  const [settingsTab, setSettingsTab] = useState<SettingsTab>('appearance')
  const [appVersion, setAppVersion] = useState('0.1.0')
  const [drafts, setDrafts] = useState<Record<number, string>>({})
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [inspectorOpen, setInspectorOpen] = useState(false)
  const [navHistory, setNavHistory] = useState<{ entries: NavEntry[]; index: number }>({
    entries: [{ projectId: null, rail: 'chats' }],
    index: 0,
  })

  const activeProjectIdRef = useRef<number | null>(null)
  const refreshSeqRef = useRef(0)
  const selectSeqRef = useRef(0)
  const setActiveQueueRef = useRef<Promise<void>>(Promise.resolve())
  const historyCacheRef = useRef<Map<number, AuroraMessage[]>>(new Map())
  const scrollPositionsRef = useRef<Map<number, number>>(new Map())

  const projects = useMemo(
    () => (snapshot ? readProjects(snapshot, appearance, projectAppearances, theme) : []),
    [snapshot, appearance, projectAppearances, theme]
  )
  const meta = useMemo(() => (snapshot ? readWorkspaceMeta(snapshot) : defaultMeta), [snapshot])
  const pendingChanges = useMemo(
    () => (snapshot ? readPendingChanges(snapshot, projectId) : []),
    [snapshot, projectId]
  )
  const approvedChanges = useMemo(
    () => (snapshot ? readApprovedChanges(snapshot, projectId) : []),
    [snapshot, projectId]
  )

  useEffect(() => {
    for (const change of pendingChanges) {
      if (change.commandId && diffs[change.id] === undefined) {
        void loadDiff(change.id)
      }
    }
  }, [pendingChanges, diffs])
  const project = projects.find(item => item.id === projectId) ?? null
  const activeMessages = projectId === null ? [] : messages
  const visibleProjects = useMemo(
    () => projects.filter(item => `${item.name} ${item.path}`.toLowerCase().includes(query.toLowerCase())),
    [projects, query]
  )
  const canGoBack = navHistory.index > 0
  const canGoForward = navHistory.index < navHistory.entries.length - 1

  const pushNav = useCallback((nextProjectId: number | null, nextRail: RailSection) => {
    setNavHistory(current => {
      const head = current.entries[current.index]
      if (head && head.projectId === nextProjectId && head.rail === nextRail) return current
      const sliced = current.entries.slice(0, current.index + 1)
      return {
        entries: [...sliced, { projectId: nextProjectId, rail: nextRail }],
        index: sliced.length,
      }
    })
  }, [])

  const refresh = useCallback(async () => {
    const seq = ++refreshSeqRef.current
    try {
      const [nextSnapshot, status, nextTunnel] = await Promise.all([
        call<Snapshot>('snapshot'),
        call<ChatStatus>('chat_status').catch(() => null),
        invoke<TunnelStatus>('tunnel_status').catch(() => null),
      ])
      if (seq !== refreshSeqRef.current) return
      const currentTarget = activeProjectIdRef.current
      const list = Array.isArray(nextSnapshot.projects) ? nextSnapshot.projects : []
      const resolvedId =
        currentTarget !== null && list.some(item => item.id === currentTarget)
          ? currentTarget
          : list.find(item => item.active === 1)?.id ?? list[0]?.id ?? null

      activeProjectIdRef.current = resolvedId
      setSnapshot(nextSnapshot)
      if (status) setChatStatus(status)
      if (nextTunnel) setTunnel(nextTunnel)
      if (resolvedId !== null) {
        const [bridge, history] = await Promise.all([
          call<MicoBridgeStatus>('mico_bridge_status', { project_id: resolvedId }).catch(() => null),
          call<ChatMessageRecord[]>('chat_history', { project_id: resolvedId }).catch(() => null),
        ])
        if (seq === refreshSeqRef.current) {
          setMicoBridge(bridge)
          if (history && activeProjectIdRef.current === resolvedId) {
            const parsed = readMessages(history)
            historyCacheRef.current.set(resolvedId, parsed)
            setMessages(parsed)
          }
        }
      } else {
        setMicoBridge(null)
      }
      setProjectId(resolvedId)
      setNavHistory(current => {
        if (current.entries.length === 1 && current.entries[0]?.projectId === null && resolvedId !== null) {
          return { entries: [{ projectId: resolvedId, rail: current.entries[0].rail }], index: 0 }
        }
        return current
      })
      setError(null)
    } catch (cause) {
      if (seq !== refreshSeqRef.current) return
      setError(`Local backend unavailable: ${String(cause)}`)
      setSnapshot(null)
      activeProjectIdRef.current = null
      setProjectId(null)
    } finally {
      if (seq === refreshSeqRef.current) setLoading(false)
    }
  }, [])

  const queueSetActive = useCallback((id: number, seq: number) => {
    setActiveQueueRef.current = setActiveQueueRef.current
      .catch(() => {})
      .then(async () => {
        if (selectSeqRef.current !== seq) return
        await call<unknown>('set_active', { project_id: id })
        if (selectSeqRef.current !== seq) return
        void refresh()
      })
  }, [refresh])

  const switchProjectImmediate = useCallback((id: number) => {
    const seq = ++selectSeqRef.current
    activeProjectIdRef.current = id
    setProjectId(id)
    setHistoryError(null)
    const cached = historyCacheRef.current.get(id)
    setMessages(cached ?? [])
    setHistoryLoading(!cached)
    queueSetActive(id, seq)
  }, [queueSetActive])

  const applyNavEntry = useCallback((entry: NavEntry) => {
    setRail(entry.rail)
    setProjectOpen(entry.rail === 'projects')
    setHelpOpen(false)
    if (entry.projectId !== null && entry.projectId !== activeProjectIdRef.current) {
      switchProjectImmediate(entry.projectId)
    }
  }, [switchProjectImmediate])

  const goBack = useCallback(() => {
    if (navHistory.index <= 0) return
    const nextIndex = navHistory.index - 1
    const target = navHistory.entries[nextIndex]
    setNavHistory(current => ({ ...current, index: nextIndex }))
    if (target) applyNavEntry(target)
  }, [applyNavEntry, navHistory])

  const goForward = useCallback(() => {
    if (navHistory.index >= navHistory.entries.length - 1) return
    const nextIndex = navHistory.index + 1
    const target = navHistory.entries[nextIndex]
    setNavHistory(current => ({ ...current, index: nextIndex }))
    if (target) applyNavEntry(target)
  }, [applyNavEntry, navHistory])

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.altKey && event.key === 'ArrowLeft') {
        event.preventDefault()
        goBack()
      } else if (event.altKey && event.key === 'ArrowRight') {
        event.preventDefault()
        goForward()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [goBack, goForward])

  useEffect(() => {
    void refresh()
    const timer = window.setInterval(() => void refresh(), 3500)
    return () => window.clearInterval(timer)
  }, [refresh])

  useEffect(() => {
    if ('__TAURI_INTERNALS__' in window) {
      void getVersion().then(setAppVersion).catch(() => {})
    }
  }, [])

  useEffect(() => { saveAppearance(appearance) }, [appearance])
  useEffect(() => {
    try {
      window.localStorage.setItem('mcp_code_chat_transport', chatTransport)
    } catch {}
  }, [chatTransport])
  useEffect(() => {
    const suppressContextMenu = (event: MouseEvent) => {
      event.preventDefault()
    }
    window.addEventListener('contextmenu', suppressContextMenu)
    return () => window.removeEventListener('contextmenu', suppressContextMenu)
  }, [])
  const hasActiveBridgeCommand = Boolean(
    projectId !== null &&
      micoBridge?.commands.some(
        c => c.status === 'queued' || c.status === 'dispatched' || c.status === 'waiting' || c.status === 'awaiting_confirmation'
      )
  )
  useEffect(() => {
    if (!hasActiveBridgeCommand || projectId === null) return
    let active = true
    const targetId = projectId
    const timer = window.setInterval(() => {
      void Promise.all([
        call<MicoBridgeStatus>('mico_bridge_status', { project_id: targetId }).catch(() => null),
        call<ChatMessageRecord[]>('chat_history', { project_id: targetId }).catch(() => null),
      ]).then(([bridge, history]) => {
        if (!active || activeProjectIdRef.current !== targetId) return
        if (bridge) setMicoBridge(bridge)
        if (history) {
          const parsed = readMessages(history)
          historyCacheRef.current.set(targetId, parsed)
          setMessages(parsed)
        }
      })
    }, 500)
    return () => {
      active = false
      window.clearInterval(timer)
    }
  }, [hasActiveBridgeCommand, projectId])
  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)')
    const listener = (event: MediaQueryListEvent) => setSystemDark(event.matches)
    media.addEventListener('change', listener)
    return () => media.removeEventListener('change', listener)
  }, [])
  useEffect(() => {
    if (projectId === null) return
    let active = true
    const targetId = projectId
    void call<ChatMessageRecord[]>('chat_history', { project_id: targetId })
      .then(value => {
        if (!active || activeProjectIdRef.current !== targetId) return
        const parsed = readMessages(value)
        historyCacheRef.current.set(targetId, parsed)
        setMessages(parsed)
        setHistoryError(null)
      })
      .catch(cause => {
        if (!active || activeProjectIdRef.current !== targetId) return
        setMessages([])
        setHistoryError(`Could not load chat history: ${String(cause)}`)
      })
      .finally(() => {
        if (active && activeProjectIdRef.current === targetId) setHistoryLoading(false)
      })
    return () => { active = false }
  }, [projectId])

  function selectProject(id: number) {
    if (!projects.some(item => item.id === id)) return
    switchProjectImmediate(id)
    setProjectOpen(false)
    setHelpOpen(false)
    setRail('chats')
    pushNav(id, 'chats')
  }

  async function addProject() {
    try {
      const root = await openDialog({ directory: true, multiple: false, title: 'Choose a project folder' })
      if (!root || Array.isArray(root)) return
      const result = await call<unknown>('add_project', { root })
      const id = addedProjectId(result)
      if (id === null) throw new Error('Invalid project response')
      const seq = ++selectSeqRef.current
      activeProjectIdRef.current = id
      setProjectId(id)
      setMessages([])
      setProjectOpen(false)
      setHelpOpen(false)
      setRail('chats')
      pushNav(id, 'chats')
      await call<unknown>('set_active', { project_id: id })
      if (selectSeqRef.current === seq) void refresh()
    } catch (cause) {
      setError(`Could not add project: ${String(cause)}`)
    }
  }

  async function createMicoPairing(): Promise<void> {
    if (projectId === null) return
    setActionBusy(true)
    try {
      await call('mico_create_pairing', { project_id: projectId })
      const bridge = await call<MicoBridgeStatus>('mico_bridge_status', { project_id: projectId })
      setMicoBridge(bridge)
    } catch (cause) {
      setHistoryError(`Failed to generate pairing code: ${String(cause)}`)
    } finally {
      setActionBusy(false)
    }
  }

  async function revokeMicoPairing(): Promise<void> {
    if (projectId === null) return
    setActionBusy(true)
    try {
      await call('mico_revoke_pairing', { project_id: projectId })
      const bridge = await call<MicoBridgeStatus>('mico_bridge_status', { project_id: projectId })
      setMicoBridge(bridge)
    } catch (cause) {
      setHistoryError(`Failed to disconnect widget: ${String(cause)}`)
    } finally {
      setActionBusy(false)
    }
  }

  async function renameProject(targetProjectId: number, name: string): Promise<void> {
    await call('rename_project', { project_id: targetProjectId, name })
    await refresh()
  }

  function updateProjectColor(target: AuroraProject, color: ProjectColor) {
    setProjectAppearances(prev => {
      const existing = prev[String(target.id)]
      const next = {
        ...prev,
        [String(target.id)]: { ...existing, root: target.path, color },
      }
      saveProjectAppearances(next)
      return next
    })
  }

  function updateProjectIcon(target: AuroraProject, icon: ProjectIconName) {
    setProjectAppearances(prev => {
      const existing = prev[String(target.id)]
      const next = {
        ...prev,
        [String(target.id)]: { ...existing, root: target.path, icon },
      }
      saveProjectAppearances(next)
      return next
    })
  }

  async function sendMessage(text: string): Promise<boolean> {
    const bridgePaired = micoBridge?.pairing?.status === 'paired'
    if (projectId === null || busy) return false
    if (chatTransport === 'mcp' ? !bridgePaired : !chatStatus?.configured) return false
    const targetId = projectId
    setBusy(true)
    setHistoryError(null)
    try {
      if (chatTransport === 'mcp') {
        const queued = await call<{ command: MicoBridgeStatus['commands'][number]; message: ChatMessageRecord }>('mico_enqueue_command', {
          project_id: targetId,
          text,
        })
        const added = readMessages([queued.message])
        const next = [...(historyCacheRef.current.get(targetId) ?? []), ...added]
        historyCacheRef.current.set(targetId, next)
        if (activeProjectIdRef.current === targetId) {
          setMessages(next)
          setMicoBridge(current => ({
            pairing: current?.pairing ?? null,
            commands: [queued.command, ...(current?.commands ?? []).filter(c => c.id !== queued.command.id)],
          }))
        }
        return true
      }
      const exchange = await call<ChatMessageRecord[]>('chat_send', { project_id: targetId, text })
      const added = readMessages(exchange)
      const next = [...(historyCacheRef.current.get(targetId) ?? []), ...added]
      historyCacheRef.current.set(targetId, next)
      if (activeProjectIdRef.current === targetId) {
        setMessages(next)
      }
      return true
    } catch (cause) {
      if (activeProjectIdRef.current === targetId) {
        setHistoryError(`Could not send message: ${String(cause)}`)
      }
      return false
    } finally {
      setBusy(false)
    }
  }

  async function saveProviderKey(provider: ProviderId, key: string): Promise<boolean> {
    setActionBusy(true)
    setActionNotice(null)
    try {
      const next = await call<ChatStatus>('chat_set_key', { provider, key })
      setChatStatus(next)
      const info = (next.providers ?? []).find(item => item.id === provider)
      setActionNotice(
        info?.configured
          ? `${info.label} key verified and saved with Windows DPAPI.`
          : `${info?.label ?? provider} key saved.`
      )
      return true
    } catch (cause) {
      setActionNotice(String(cause))
      return false
    } finally {
      setActionBusy(false)
    }
  }

  async function verifyProviderKey(provider: ProviderId): Promise<void> {
    setActionBusy(true)
    setActionNotice(null)
    try {
      const next = await call<ChatStatus>('chat_verify_key', { provider })
      setChatStatus(next)
      const info = (next.providers ?? []).find(item => item.id === provider)
      setActionNotice(
        info?.configured
          ? `${info.label} API key verified.`
          : `${info?.label ?? provider} is not configured.`
      )
    } catch (cause) {
      setActionNotice(String(cause))
    } finally {
      setActionBusy(false)
    }
  }

  async function removeProviderKey(provider: ProviderId): Promise<void> {
    setActionBusy(true)
    setActionNotice(null)
    try {
      const next = await call<ChatStatus>('chat_clear_key', { provider })
      setChatStatus(next)
      setActionNotice(`Removed ${provider} API key.`)
    } catch (cause) {
      setActionNotice(String(cause))
    } finally {
      setActionBusy(false)
    }
  }

  async function selectModelEffort(provider: ProviderId, model: string, effort: EffortLevel | null): Promise<void> {
    setActionBusy(true)
    setActionNotice(null)
    try {
      const next = await call<ChatStatus>('chat_set_selection', { provider, model, effort })
      setChatStatus(next)
    } catch (cause) {
      setActionNotice(String(cause))
    } finally {
      setActionBusy(false)
    }
  }

  async function toggleMcp(port?: number) {
    setActionBusy(true)
    setActionNotice(null)
    try {
      const running = meta.serverState === 'running'
      const targetPort = port ?? meta.port ?? 8765
      await call(running ? 'stop_mcp' : 'start_mcp', running ? {} : { port: targetPort })
      await refresh()
      setActionNotice(running ? 'Local MCP server stopped.' : `Local MCP server started on 127.0.0.1:${targetPort}.`)
    } catch (cause) {
      setActionNotice(String(cause))
    } finally {
      setActionBusy(false)
    }
  }

  async function saveTunnelConfig(config: TunnelConfig): Promise<boolean> {
    setActionBusy(true)
    setActionNotice(null)
    try {
      const next = await invoke<TunnelStatus>('tunnel_save', { config })
      setTunnel(next)
      setTunnelDiagnosis(null)
      setActionNotice('Tunnel configuration saved.')
      return true
    } catch (cause) {
      setActionNotice(String(cause))
      return false
    } finally {
      setActionBusy(false)
    }
  }

  async function setTunnelKey(key: string): Promise<boolean> {
    setActionBusy(true)
    setActionNotice(null)
    try {
      const next = await invoke<TunnelStatus>('tunnel_set_key', { key })
      setTunnel(next)
      setTunnelDiagnosis(null)
      setActionNotice('Tunnel runtime API key saved with Windows DPAPI.')
      return true
    } catch (cause) {
      setActionNotice(String(cause))
      return false
    } finally {
      setActionBusy(false)
    }
  }

  async function clearTunnelKey(): Promise<void> {
    setActionBusy(true)
    setActionNotice(null)
    try {
      const next = await invoke<TunnelStatus>('tunnel_clear_key')
      setTunnel(next)
      setTunnelDiagnosis(null)
      setActionNotice('Saved tunnel runtime API key removed.')
    } catch (cause) {
      setActionNotice(String(cause))
    } finally {
      setActionBusy(false)
    }
  }

  async function toggleTunnel() {
    setActionBusy(true)
    setActionNotice(null)
    try {
      const running = tunnel?.state === 'connected' || tunnel?.state === 'starting'
      const next = await invoke<TunnelStatus>(running ? 'tunnel_stop' : 'tunnel_start')
      setTunnel(next)
    } catch (cause) {
      setActionNotice(String(cause))
    } finally {
      setActionBusy(false)
    }
  }

  async function diagnoseTunnel() {
    setTunnelDiagnosing(true)
    setActionNotice(null)
    try {
      const [result, nextStatus] = await Promise.all([
        invoke<TunnelDiagnoseResult>('tunnel_diagnose'),
        invoke<TunnelStatus>('tunnel_status').catch(() => null),
      ])
      if (nextStatus) setTunnel(nextStatus)
      setTunnelDiagnosis(result)
    } catch (cause) {
      setTunnelDiagnosis({
        ok: false,
        category: 'error',
        summary: 'Failed to run tunnel diagnostics.',
        next_step: 'Check the details below and try again.',
        details: String(cause),
        exit_code: null,
      })
    } finally {
      setTunnelDiagnosing(false)
    }
  }

  async function loadDiff(changeId: number) {
    setActionBusy(true)
    setActionNotice(null)
    try {
      const result = await call<{ diff: string }>('get_change_diff', { change_id: changeId })
      setDiffs(current => ({ ...current, [changeId]: result.diff }))
    } catch (cause) {
      setActionNotice(String(cause))
    } finally {
      setActionBusy(false)
    }
  }

  async function approveChange(changeId: number) {
    setActionBusy(true)
    setActionNotice(null)
    try {
      await call('approve_change', { change_id: changeId })
      setDiffs(current => {
        const next = { ...current }
        delete next[changeId]
        return next
      })
      await refresh()
      setActionNotice('Change approved and applied to disk.')
    } catch (cause) {
      setActionNotice(String(cause))
    } finally {
      setActionBusy(false)
    }
  }

  async function rejectChange(changeId: number) {
    setActionBusy(true)
    setActionNotice(null)
    try {
      await call('reject_change', { change_id: changeId })
      setDiffs(current => {
        const next = { ...current }
        delete next[changeId]
        return next
      })
      await refresh()
      setActionNotice('Change rejected.')
    } catch (cause) {
      setActionNotice(String(cause))
    } finally {
      setActionBusy(false)
    }
  }

  async function togglePermission(targetProjectId: number, field: 'can_read' | 'can_edit' | 'can_delete' | 'can_build', value: boolean) {
    setActionBusy(true)
    setActionNotice(null)
    try {
      await call('set_permissions', { project_id: targetProjectId, permissions: { [field]: value } })
      await refresh()
    } catch (cause) {
      setActionNotice(String(cause))
    } finally {
      setActionBusy(false)
    }
  }

  function openSettings(tab: SettingsTab = 'appearance') {
    setSettingsTab(tab)
    setActionNotice(null)
    setRail('settings')
    setProjectOpen(false)
    setHelpOpen(false)
    pushNav(projectId, 'settings')
  }

  function selectRail(next: RailSection | 'help') {
    if (next === 'help') {
      setProjectOpen(false)
      setHelpOpen(current => !current)
      return
    }
    setHelpOpen(false)
    if (next === 'projects') {
      setProjectOpen(current => !current)
      return
    }
    setProjectOpen(false)
    setRail(next)
    pushNav(projectId, next)
  }

  const workspaceClass = [
    'aurora-workspace',
    !sidebarOpen ? 'aurora-workspace-no-sidebar' : '',
    inspectorOpen ? 'aurora-workspace-with-inspector' : '',
  ].filter(Boolean).join(' ')

  return (
    <div className="aurora" data-theme={theme} data-reduced={reduced ? 'true' : 'false'}>
      <div className="aurora-chrome">
        <div className="aurora-chrome-left">
          <div className="aurora-chrome-brand">
            <img src={withBasePath('/interface-logo.png')} alt="" />
            <strong>MCP Code</strong>
          </div>
          <div className="aurora-chrome-nav" role="toolbar" aria-label="Workspace navigation">
            <button
              type="button"
              className="aurora-topbar-btn"
              aria-label={sidebarOpen ? 'Hide sidebar' : 'Show sidebar'}
              title={sidebarOpen ? 'Hide sidebar' : 'Show sidebar'}
              aria-pressed={sidebarOpen}
              onClick={() => setSidebarOpen(value => !value)}
            >
              {sidebarOpen ? <PanelLeftClose size={15} /> : <PanelLeftOpen size={15} />}
            </button>
            <button
              type="button"
              className="aurora-topbar-btn"
              aria-label="Navigate back"
              title="Back (Alt+←)"
              disabled={!canGoBack}
              onClick={goBack}
            >
              <ArrowLeft size={15} />
            </button>
            <button
              type="button"
              className="aurora-topbar-btn"
              aria-label="Navigate forward"
              title="Forward (Alt+→)"
              disabled={!canGoForward}
              onClick={goForward}
            >
              <ArrowRight size={15} />
            </button>
          </div>
        </div>

        <div
          className="aurora-chrome-drag"
          aria-hidden="true"
          onMouseDown={event => {
            if (!windowHandle || event.buttons !== 1) return
            if (event.detail === 2) void windowHandle.toggleMaximize().catch(() => {})
            else void windowHandle.startDragging().catch(() => {})
          }}
        />

        <div className="aurora-chrome-right">
          <button
            type="button"
            className="aurora-topbar-btn"
            aria-label={inspectorOpen ? 'Hide inspector panel' : 'Show inspector panel'}
            title={inspectorOpen ? 'Hide inspector' : 'Show inspector'}
            aria-pressed={inspectorOpen}
            onClick={() => setInspectorOpen(value => !value)}
          >
            {inspectorOpen ? <PanelRightClose size={15} /> : <PanelRightOpen size={15} />}
          </button>
          <div className="aurora-window-actions">
            <button type="button" aria-label="Minimize window" title="Minimize" onClick={() => void windowHandle?.minimize()}>
              <Minus size={14} />
            </button>
            <button type="button" aria-label="Maximize window" title="Maximize" onClick={() => void windowHandle?.toggleMaximize()}>
              <Square size={11} />
            </button>
            <button type="button" aria-label="Close window" title="Close" onClick={() => void windowHandle?.close()}>
              <X size={16} />
            </button>
          </div>
        </div>
      </div>

      <div className={`aurora-frame ${sidebarOpen ? '' : 'aurora-frame-collapsed'}`}>
        <nav className="aurora-rail" aria-label="Navigation">
          <div className="aurora-rail-main">
            {topRailItems.map(({ id, label, Icon }) => (
              <button
                key={id}
                type="button"
                className="aurora-rail-button"
                aria-label={label}
                title={label}
                aria-current={rail === id && !helpOpen && !projectOpen ? 'page' : undefined}
                onClick={() => selectRail(id)}
              >
                {rail === id && !helpOpen && !projectOpen && (
                  <motion.span
                    layoutId="aurora-rail-selection"
                    className="aurora-rail-selection"
                    transition={reduced ? { duration: 0 } : { type: 'spring', stiffness: 420, damping: 34 }}
                  />
                )}
                <Icon size={19} strokeWidth={1.75} />
              </button>
            ))}
          </div>

          <div className="aurora-rail-end">
            <div className="aurora-rail-group">
              {bottomRailItems.map(({ id, label, Icon }) => {
                const active = id === 'help' ? helpOpen : rail === id
                return (
                  <button
                    key={id}
                    type="button"
                    className="aurora-rail-button"
                    aria-label={label}
                    title={label}
                    aria-current={active ? 'page' : undefined}
                    onClick={() => selectRail(id)}
                  >
                    {active && id !== 'help' && (
                      <motion.span
                        layoutId="aurora-rail-selection"
                        className="aurora-rail-selection"
                        transition={reduced ? { duration: 0 } : { type: 'spring', stiffness: 420, damping: 34 }}
                      />
                    )}
                    <Icon size={19} strokeWidth={1.75} />
                  </button>
                )
              })}
            </div>
            <div className="aurora-rail-account-slot">
              <button
                type="button"
                className="aurora-rail-button aurora-rail-account"
                aria-label="Account and local profile"
                title="Local profile"
                aria-current={rail === 'account' ? 'page' : undefined}
                onClick={() => selectRail('account')}
              >
                {rail === 'account' && (
                  <motion.span
                    layoutId="aurora-rail-selection"
                    className="aurora-rail-selection"
                    transition={reduced ? { duration: 0 } : { type: 'spring', stiffness: 420, damping: 34 }}
                  />
                )}
                <UserRound size={19} strokeWidth={1.75} />
                <span className="aurora-rail-status-dot" data-online={chatStatus?.configured || meta.serverState === 'running' ? 'true' : 'false'} />
              </button>
            </div>
          </div>
        </nav>

        <AnimatePresence mode="wait" initial={false}>
          {rail === 'settings' ? (
            <motion.div
              key="settings-page"
              className="aurora-frame-view"
              initial={reduced ? false : { opacity: 0, y: 12, scale: 0.992 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={reduced ? undefined : { opacity: 0, y: -6, scale: 0.996 }}
              transition={reduced ? { duration: 0 } : { duration: 0.26, ease: [0.22, 1, 0.36, 1] }}
            >
              <AuroraSettingsPage
                tab={settingsTab}
                onTab={setSettingsTab}
                theme={theme}
                reduced={reduced}
                reducedMotion={appearance.reducedMotion}
                project={project}
                meta={meta}
                chatStatus={chatStatus}
                tunnel={tunnel}
                tunnelDiagnosis={tunnelDiagnosis}
                tunnelDiagnosing={tunnelDiagnosing}
                pendingChanges={pendingChanges}
                diffs={diffs}
                actionBusy={actionBusy}
                actionNotice={actionNotice}
                onTheme={value => setAppearance(current => ({ ...current, theme: value }))}
                onReducedMotion={value => setAppearance(current => ({ ...current, reducedMotion: value }))}
                onSaveProviderKey={saveProviderKey}
                onVerifyProviderKey={verifyProviderKey}
                onRemoveProviderKey={removeProviderKey}
                onToggleMcp={port => void toggleMcp(port)}
                onTunnelSave={saveTunnelConfig}
                onTunnelSetKey={setTunnelKey}
                onTunnelClearKey={clearTunnelKey}
                onTunnelToggle={() => void toggleTunnel()}
                onTunnelDiagnose={() => void diagnoseTunnel()}
                onRefreshConnections={() => void refresh()}
                onLoadDiff={id => void loadDiff(id)}
                onApproveChange={id => void approveChange(id)}
                onRejectChange={id => void rejectChange(id)}
                onTogglePermission={(targetProjectId, field, value) => void togglePermission(targetProjectId, field, value)}
                onBack={() => {
                  setRail('chats')
                  pushNav(projectId, 'chats')
                }}
              />
            </motion.div>
          ) : rail === 'account' ? (
            <motion.div
              key="account-page"
              className="aurora-frame-view"
              initial={reduced ? false : { opacity: 0, y: 12, scale: 0.992 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={reduced ? undefined : { opacity: 0, y: -6, scale: 0.996 }}
              transition={reduced ? { duration: 0 } : { duration: 0.26, ease: [0.22, 1, 0.36, 1] }}
            >
              <AccountPage
                version={appVersion}
                reduced={reduced}
                summary={snapshot?.summary ?? null}
                onBack={() => {
                  setRail('chats')
                  pushNav(projectId, 'chats')
                }}
              />
            </motion.div>
          ) : (
            <motion.div
              key="workspace-view"
              className={workspaceClass}
              initial={reduced ? false : { opacity: 0, y: 10, scale: 0.994 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={reduced ? undefined : { opacity: 0, y: -6, scale: 0.996 }}
              transition={reduced ? { duration: 0 } : { duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            >
              <WorkspaceSidebar
                open={sidebarOpen}
                reduced={reduced}
                project={project}
                projects={visibleProjects}
                messages={activeMessages}
                chatStatus={chatStatus}
                meta={meta}
                query={query}
                onQuery={setQuery}
                onProjectOpen={() => selectRail('projects')}
                onProjectSelect={selectProject}
                onProjectContextMenu={(id, x, y) => setProjectMenu({ projectId: id, x, y })}
                onSearchShortcut={() => setSidebarOpen(true)}
                onAddProject={() => void addProject()}
              />
              <main className="aurora-main">
                <header className="aurora-conversation-header">
                  {!sidebarOpen && (
                    <button
                      type="button"
                      className="aurora-header-sidebar"
                      aria-label="Show sidebar"
                      title="Show sidebar"
                      onClick={() => setSidebarOpen(true)}
                    >
                      <PanelLeftOpen size={16} />
                    </button>
                  )}
                  <div className="aurora-conversation-heading">
                    <h1>{project ? project.name : 'Workspace'}</h1>
                    {project && project.pendingCount > 0 && (
                      <button type="button" className="aurora-header-pill" onClick={() => openSettings('permissions')}>
                        {project.pendingCount} pending
                      </button>
                    )}
                  </div>
                  <ModelEffortSelector
                    chatStatus={chatStatus}
                    meta={meta}
                    reduced={reduced}
                    chatTransport={chatTransport}
                    onChatTransport={setChatTransport}
                    onSelect={selectModelEffort}
                    onOpenProviders={() => openSettings('connections')}
                  />
                </header>
                <ConversationView
                  project={project}
                  messages={activeMessages}
                  chatStatus={chatStatus}
                  chatTransport={chatTransport}
                  micoBridge={micoBridge}
                  pendingChanges={pendingChanges}
                  approvedChanges={approvedChanges}
                  diffs={diffs}
                  actionBusy={actionBusy}
                  busy={busy}
                  loading={loading}
                  historyLoading={projectId !== null && historyLoading}
                  error={error ?? historyError}
                  reduced={reduced}
                  theme={theme}
                  draft={projectId !== null ? (drafts[projectId] ?? '') : ''}
                  savedScrollTop={projectId !== null ? (scrollPositionsRef.current.get(projectId) ?? null) : null}
                  onSaveScrollTop={(targetId, scrollTop, nearBottom) => {
                    if (nearBottom) scrollPositionsRef.current.delete(targetId)
                    else scrollPositionsRef.current.set(targetId, scrollTop)
                  }}
                  onDraft={nextDraft => {
                    if (projectId !== null) setDrafts(current => ({ ...current, [projectId]: nextDraft }))
                  }}
                  onSend={sendMessage}
                  onCreateMicoPairing={() => void createMicoPairing()}
                  onRevokeMicoPairing={() => void revokeMicoPairing()}
                  onOpenProviders={() => openSettings('connections')}
                  onLoadDiff={id => void loadDiff(id)}
                  onApproveChange={id => void approveChange(id)}
                  onRejectChange={id => void rejectChange(id)}
                  onRetry={() => void refresh()}
                  onProjectOpen={() => selectRail('projects')}
                  onAddProject={() => void addProject()}
                />
              </main>
              <WorkspaceInspector
                open={inspectorOpen}
                project={project}
                meta={meta}
                chatStatus={chatStatus}
                tunnel={tunnel}
                onClose={() => setInspectorOpen(false)}
                onOpenSettings={openSettings}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {projectOpen && (
          <ProjectPopover
            key="projects"
            projects={projects}
            currentId={projectId}
            reduced={reduced}
            onSelect={selectProject}
            onClose={() => setProjectOpen(false)}
            onAddProject={() => void addProject()}
          />
        )}
        {helpOpen && (
          <HelpPopover
            key="help"
            version={appVersion}
            reduced={reduced}
            onClose={() => setHelpOpen(false)}
          />
        )}
        {(() => {
          const menuProject = projectMenu ? projects.find(p => p.id === projectMenu.projectId) ?? null : null
          if (!projectMenu || !menuProject) return null
          const resolved = getProjectAppearance(
            {
              id: menuProject.id,
              name: menuProject.name,
              root: menuProject.path,
              active: menuProject.active ? 1 : 0,
              can_read: 0,
              can_edit: 0,
              can_delete: 0,
              can_build: 0,
              python_interpreter: null,
            },
            projectAppearances,
            appearance
          )
          return (
            <ProjectContextMenu
              key={`ctx-${menuProject.id}`}
              project={menuProject}
              x={projectMenu.x}
              y={projectMenu.y}
              theme={theme}
              reduced={reduced}
              currentColor={resolved.palette.id}
              currentIcon={resolved.icon}
              onRename={renameProject}
              onSetColor={updateProjectColor}
              onSetIcon={updateProjectIcon}
              onClose={() => setProjectMenu(null)}
            />
          )
        })()}
      </AnimatePresence>
      <AuroraTooltipLayer reduced={reduced} />
    </div>
  )
}
