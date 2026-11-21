import { useEffect, useMemo, useRef, useState } from 'react'
import { invoke, open as openDialog, openUrl } from '../tauri-shim'
import { AnimatePresence, motion } from 'motion/react'
import {
  ArrowLeft, BookOpen, Bot, Cable, Check, ChevronDown, ChevronsUpDown, Code2, Copy,
  ExternalLink, Folder, Globe, Layers3, Palette, Plus, RefreshCw, Search,
  Server, ShieldCheck, Terminal, X
} from 'lucide-react'
import type { AppUpdateInfo, Snapshot, TunnelConfig, TunnelDiagnoseResult, TunnelStatus } from '../api'
import { MicoAvatar } from '../MicoAvatar'
import { DiffReviewList } from './DiffReview'
import type {
  AIProviderInfo, AuroraChange, AuroraMessage, AuroraProject,
  AuroraWorkspaceMeta, ChatStatus, EffortLevel, ProviderId
} from './data'
import {
  loadLocalProfile, PROFILE_COLORS, profileInitials, saveLocalProfile,
  type LocalProfile
} from './profile'

const REPO_URL = 'https://github.com/Axz-o/MCPCode'
const GUIDES_URL = 'https://axz-o.github.io/MCPCode-site/guides/'
const CONNECT_CHATGPT_GUIDE_URL = 'https://axz-o.github.io/MCPCode-site/guides/connect-chatgpt/'
const CHATGPT_PLUGINS_URL = 'https://chatgpt.com/plugins'
const TUNNEL_GUIDE_URL = 'https://developers.openai.com/api/docs/guides/secure-mcp-tunnels'
const TUNNEL_RUNTIME_KEYS_URL = 'https://platform.openai.com/settings/organization/tunnels'

async function openExternal(url: string) {
  try {
    await invoke('open_external_url', { url })
    return
  } catch {
    // Fallback for non-Tauri browser preview or older binary
  }
  try {
    await openUrl(url)
  } catch {
    window.open(url, '_blank', 'noopener,noreferrer')
  }
}

const isMac = /Mac/.test(navigator.platform)

export function ProjectIcon({ project, size = 16 }: { project: AuroraProject; size?: number }) {
  const Icon = project.icon === 'code' ? Code2 : project.icon === 'terminal' ? Terminal
    : project.icon === 'book' ? BookOpen : project.icon === 'layers' ? Layers3 : Folder
  return (
    <span
      className="aurora-project-glyph"
      style={{
        color: project.color,
        backgroundColor: `color-mix(in srgb, ${project.color} 14%, transparent)`,
      }}
    >
      <Icon size={size} strokeWidth={1.8} />
    </span>
  )
}

export function WorkspaceSidebar({
  open,
  reduced,
  project,
  projects,
  messages,
  chatStatus,
  meta,
  query,
  onQuery,
  onProjectOpen,
  onProjectSelect,
  onProjectContextMenu,
  onSearchShortcut,
  onAddProject,
}: {
  open: boolean
  reduced: boolean
  project: AuroraProject | null
  projects: AuroraProject[]
  messages: AuroraMessage[]
  chatStatus: ChatStatus | null
  meta: AuroraWorkspaceMeta
  query: string
  onQuery: (value: string) => void
  onProjectOpen: () => void
  onProjectSelect: (id: number) => void
  onProjectContextMenu?: (projectId: number, x: number, y: number) => void
  onSearchShortcut: () => void
  onAddProject: () => void
}) {
  const search = useRef<HTMLInputElement>(null)
  useEffect(() => {
    const shortcut = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        onSearchShortcut()
        window.setTimeout(() => search.current?.focus(), 0)
      }
    }
    document.addEventListener('keydown', shortcut)
    return () => document.removeEventListener('keydown', shortcut)
  }, [onSearchShortcut])

  const latest = messages.at(-1)
  const anyConnected = Boolean(chatStatus?.configured || meta.serverState === 'running')

  return (
    <aside className="aurora-sidebar" aria-label="Workspace" aria-hidden={!open} inert={!open}>
      <div className="aurora-sidebar-top">
        <button
          type="button"
          className="aurora-project-switcher"
          aria-label="Choose project"
          aria-haspopup="dialog"
          title={project ? `${project.name} — ${project.path}` : 'Choose a local project'}
          onClick={onProjectOpen}
        >
          {project ? <ProjectIcon project={project} size={16} /> : <span className="aurora-project-glyph"><Folder size={16} /></span>}
          <span className="aurora-project-switcher-name">{project?.name ?? 'Choose project'}</span>
          <ChevronsUpDown size={14} />
        </button>
      </div>

      <div className="aurora-sidebar-search-row">
        <div className="aurora-sidebar-search">
          <Search size={15} />
          <input
            ref={search}
            aria-label="Search local projects"
            placeholder="Search projects"
            value={query}
            onChange={event => onQuery(event.target.value)}
          />
          {query ? (
            <button
              type="button"
              className="aurora-search-clear"
              aria-label="Clear search"
              onClick={() => {
                onQuery('')
                search.current?.focus()
              }}
            >
              <X size={13} />
            </button>
          ) : (
            <span className="aurora-search-shortcut" aria-hidden="true">
              {isMac ? '⌘K' : 'Ctrl K'}
            </span>
          )}
        </div>
        <button
          type="button"
          className="aurora-sidebar-new"
          aria-label="Add project folder"
          title="Add project folder"
          onClick={onAddProject}
        >
          <Plus size={16} />
        </button>
      </div>

      <div className="aurora-sidebar-scroll">
        {latest && project && (
          <div className="aurora-conversation-list">
            <div className="aurora-conversation-row" aria-current="true">
              <motion.span
                layoutId="aurora-conversation-selection"
                className="aurora-conversation-selection"
                transition={reduced ? { duration: 0 } : { type: 'spring', stiffness: 440, damping: 38 }}
              />
              <span className="aurora-conversation-row-main">
                <strong>{project.name}</strong>
                <span>{latest.text}</span>
              </span>
            </div>
          </div>
        )}

        <div className="aurora-sidebar-section-heading">
          <h2>Projects</h2>
          <span>{projects.length}</span>
        </div>
        <div className="aurora-folder-list">
          {projects.length === 0 && <p className="aurora-list-empty">No matching projects</p>}
          {projects.map(item => {
            const active = item.id === project?.id
            return (
              <button
                type="button"
                key={item.id}
                className="aurora-folder-row"
                aria-current={active ? 'true' : undefined}
                title={item.path}
                onClick={() => onProjectSelect(item.id)}
                onContextMenu={event => {
                  if (!onProjectContextMenu) return
                  event.preventDefault()
                  event.stopPropagation()
                  onProjectContextMenu(item.id, event.clientX, event.clientY)
                }}
              >
                {active && (
                  <motion.span
                    layoutId="aurora-project-selection"
                    className="aurora-folder-selection"
                    transition={reduced ? { duration: 0 } : { type: 'spring', stiffness: 420, damping: 32, mass: 0.85 }}
                  />
                )}
                <ProjectIcon project={item} size={16} />
                <span className="aurora-folder-name">{item.name}</span>
                {item.pendingCount > 0 && <em className="aurora-folder-badge">{item.pendingCount}</em>}
                {active && (
                  <motion.span
                    className="aurora-folder-check"
                    initial={reduced ? false : { opacity: 0, scale: 0.7 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: reduced ? 0 : 0.2, ease: [0.22, 1, 0.36, 1] }}
                  >
                    <Check size={14} />
                  </motion.span>
                )}
              </button>
            )
          })}
        </div>
      </div>

      <div className="aurora-sidebar-footer">
        <div className="aurora-agent-row">
          <MicoAvatar state="default" size={28} reducedMotion={reduced} label="Mico avatar" />
          <span className="aurora-agent-name">Mico</span>
          <span className="aurora-agent-status">
            <i data-online={anyConnected ? 'true' : 'false'} />
            {chatStatus?.configured ? chatStatus.model : meta.serverState === 'running' ? 'MCP on' : 'Offline'}
          </span>
        </div>
      </div>
    </aside>
  )
}

export function WorkspaceInspector({
  open,
  project,
  meta,
  chatStatus,
  tunnel,
  onClose,
  onOpenSettings,
}: {
  open: boolean
  project: AuroraProject | null
  meta: AuroraWorkspaceMeta
  chatStatus: ChatStatus | null
  tunnel: TunnelStatus | null
  onClose: () => void
  onOpenSettings: (tab?: 'appearance' | 'connections' | 'permissions') => void
}) {
  if (!open) return null
  const activePerms = project
    ? [
        project.permissions.read && 'Read',
        project.permissions.edit && 'Edit',
        project.permissions.delete && 'Delete',
        project.permissions.build && 'Build',
      ].filter((item): item is string => Boolean(item))
    : []

  return (
    <aside className="aurora-inspector" aria-label="Workspace inspector">
      <div className="aurora-inspector-head">
        <strong>Inspector</strong>
        <button type="button" aria-label="Close inspector" onClick={onClose}>
          <X size={15} />
        </button>
      </div>

      <div className="aurora-inspector-body">
        <section className="aurora-inspector-group">
          <span className="aurora-inspector-label">Project</span>
          {project ? (
            <>
              <div className="aurora-inspector-project">
                <ProjectIcon project={project} size={16} />
                <strong>{project.name}</strong>
              </div>
              <code className="aurora-inspector-path">{project.path}</code>
              <div className="aurora-inspector-tags">
                {activePerms.length > 0 ? activePerms.map(tag => <span key={tag}>{tag}</span>) : <span>No permissions</span>}
              </div>
            </>
          ) : (
            <p className="aurora-inspector-muted">No project selected</p>
          )}
        </section>

        <section className="aurora-inspector-group">
          <span className="aurora-inspector-label">Connections</span>
          <div className="aurora-inspector-kv">
            <span>Built-in chat</span>
            <strong>{chatStatus?.configured ? chatStatus.model : 'API key needed'}</strong>
          </div>
          <div className="aurora-inspector-kv">
            <span>Local MCP</span>
            <strong data-state={meta.serverState}>{meta.serverState}</strong>
          </div>
          {meta.serverState === 'running' && (
            <div className="aurora-inspector-kv">
              <span>MCP client</span>
              <strong>{meta.clientSeen ? 'Request seen' : 'Waiting'}</strong>
            </div>
          )}
          <div className="aurora-inspector-kv">
            <span>Secure Tunnel</span>
            <strong>
              {tunnel?.state === 'connected'
                ? 'Connected'
                : tunnel?.state === 'starting'
                  ? 'Connecting…'
                  : 'Stopped'}
            </strong>
          </div>
          {meta.endpoint && (
            <div className="aurora-inspector-kv">
              <span>Endpoint</span>
              <code>{meta.endpoint}</code>
            </div>
          )}
          <div className="aurora-inspector-kv">
            <span>Pending approvals</span>
            <strong>{project ? project.pendingCount : meta.pendingChanges + meta.pendingTasks}</strong>
          </div>
        </section>

        <div className="aurora-inspector-actions">
          <button type="button" className="aurora-panel-link" onClick={() => onOpenSettings('connections')}>
            Connections
          </button>
          <button type="button" className="aurora-panel-link" onClick={() => onOpenSettings('permissions')}>
            Approvals & Perms
          </button>
        </div>
      </div>
    </aside>
  )
}

export function ProjectPopover({
  projects,
  currentId,
  reduced,
  onSelect,
  onClose,
  onAddProject,
}: {
  projects: AuroraProject[]
  currentId: number | null
  reduced: boolean
  onSelect: (id: number) => void
  onClose: () => void
  onAddProject: () => void
}) {
  const [filter, setFilter] = useState('')
  const [index, setIndex] = useState(0)
  const input = useRef<HTMLInputElement>(null)
  const matches = useMemo(
    () => projects.filter(item => `${item.name} ${item.path}`.toLowerCase().includes(filter.toLowerCase())),
    [projects, filter]
  )
  useEffect(() => { input.current?.focus() }, [])
  useEffect(() => {
    const onEscape = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose() }
    document.addEventListener('keydown', onEscape)
    return () => document.removeEventListener('keydown', onEscape)
  }, [onClose])

  function keyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setIndex(value => (matches.length ? (value + 1) % matches.length : 0))
    }
    if (event.key === 'ArrowUp') {
      event.preventDefault()
      setIndex(value => (matches.length ? (value - 1 + matches.length) % matches.length : 0))
    }
    if (event.key === 'Enter' && matches[index]) {
      event.preventDefault()
      onSelect(matches[index].id)
    }
  }

  return (
    <>
      <button type="button" className="aurora-popover-scrim" aria-label="Close project picker" onClick={onClose} />
      <motion.section
        className="aurora-project-popover"
        role="dialog"
        aria-label="Switch project"
        initial={reduced ? false : { opacity: 0, y: -6, scale: 0.985 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -4, scale: 0.985 }}
        transition={{ duration: reduced ? 0 : 0.14, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="aurora-popover-search">
          <Search size={15} />
          <input
            ref={input}
            value={filter}
            onChange={event => {
              setFilter(event.target.value)
              setIndex(0)
            }}
            onKeyDown={keyDown}
            placeholder="Find a project…"
            aria-label="Find a project"
          />
          {filter && (
            <button type="button" className="aurora-search-clear" aria-label="Clear filter" onClick={() => setFilter('')}>
              <X size={13} />
            </button>
          )}
        </div>
        <div className="aurora-popover-list">
          {matches.length === 0 && <p className="aurora-list-empty">No matching projects</p>}
          {matches.map((item, row) => (
            <button
              type="button"
              key={item.id}
              className="aurora-popover-row"
              data-keyboard-active={row === index}
              onMouseEnter={() => setIndex(row)}
              onClick={() => onSelect(item.id)}
            >
              <ProjectIcon project={item} size={16} />
              <span className="aurora-popover-row-copy">
                <strong>{item.name}</strong>
                <small>{item.path}</small>
              </span>
              {item.id === currentId && <Check size={15} />}
            </button>
          ))}
        </div>
        <div className="aurora-popover-foot">
          <button type="button" className="aurora-popover-action" onClick={onAddProject}>
            <span className="aurora-popover-add-mark"><Plus size={12} /></span>
            <span>Add project folder…</span>
          </button>
        </div>
      </motion.section>
    </>
  )
}

export function ModelEffortSelector({
  chatStatus,
  meta,
  reduced,
  chatTransport,
  onChatTransport,
  onSelect,
  onOpenProviders,
}: {
  chatStatus: ChatStatus | null
  meta: AuroraWorkspaceMeta
  reduced: boolean
  chatTransport: 'mcp' | 'api'
  onChatTransport: (mode: 'mcp' | 'api') => void
  onSelect: (provider: ProviderId, model: string, effort: EffortLevel | null) => Promise<void>
  onOpenProviders: () => void
}) {
  const [open, setOpen] = useState(false)
  const wrapRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onOutside = (event: MouseEvent) => {
      if (wrapRef.current && event.target instanceof Node && !wrapRef.current.contains(event.target)) {
        setOpen(false)
      }
    }
    const onEscape = (event: KeyboardEvent) => { if (event.key === 'Escape') setOpen(false) }
    document.addEventListener('mousedown', onOutside)
    document.addEventListener('keydown', onEscape)
    return () => {
      document.removeEventListener('mousedown', onOutside)
      document.removeEventListener('keydown', onEscape)
    }
  }, [open])

  const providers = chatStatus?.providers ?? []
  const configuredProviders = providers.filter(item => item.configured)
  const activeProviderId: ProviderId = chatStatus?.provider_id ?? 'openai'
  const activeProvider = providers.find(item => item.id === activeProviderId)
  const activeModelSpec = activeProvider?.models.find(item => item.id === chatStatus?.model)
  const modelLabel = activeModelSpec?.label ?? chatStatus?.model ?? 'Model'
  const effortLabel = activeModelSpec && activeModelSpec.efforts.length > 0 && chatStatus?.effort
    ? `${chatStatus.effort.charAt(0).toUpperCase()}${chatStatus.effort.slice(1)}`
    : null

  return (
    <div className="aurora-header-meta" ref={wrapRef}>
      {meta.serverState === 'running' && (
        <span
          className="aurora-mcp-badge"
          title={
            meta.clientSeen
              ? 'External MCP client connected (model is chosen by the external client)'
              : 'Local MCP server listening (external client chooses its own model)'
          }
        >
          <i data-online="true" />
          <span>{meta.clientSeen ? 'MCP client active' : `MCP :${meta.port ?? 8765}`}</span>
        </span>
      )}

      <div className="aurora-transport-switch" role="tablist" aria-label="Chat mode">
        <button
          type="button"
          role="tab"
          aria-selected={chatTransport === 'mcp'}
          className="aurora-transport-btn"
          data-active={chatTransport === 'mcp' ? 'true' : 'false'}
          title="Use local MCP & ChatGPT widget bridge"
          onClick={() => onChatTransport('mcp')}
        >
          {chatTransport === 'mcp' && (
            <motion.span
              layoutId="aurora-transport-pill"
              className="aurora-transport-pill"
              transition={reduced ? { duration: 0 } : { type: 'spring', stiffness: 440, damping: 30 }}
            />
          )}
          <Cable size={13} className="aurora-transport-icon" />
          <span className="aurora-transport-label">MCP</span>
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={chatTransport === 'api'}
          className="aurora-transport-btn"
          data-active={chatTransport === 'api' ? 'true' : 'false'}
          title="Use external AI provider API key"
          onClick={() => onChatTransport('api')}
        >
          {chatTransport === 'api' && (
            <motion.span
              layoutId="aurora-transport-pill"
              className="aurora-transport-pill"
              transition={reduced ? { duration: 0 } : { type: 'spring', stiffness: 440, damping: 30 }}
            />
          )}
          <Globe size={13} className="aurora-transport-icon" />
          <span className="aurora-transport-label">API</span>
        </button>
      </div>

      <AnimatePresence mode="popLayout" initial={false}>
        {chatTransport === 'api' && (chatStatus?.configured || configuredProviders.length > 0) && (
          <motion.div
            key="api-picker"
            className="aurora-model-picker-wrap"
            initial={reduced ? false : { opacity: 0, x: 6, scale: 0.96 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={reduced ? undefined : { opacity: 0, x: 4, scale: 0.96 }}
            transition={reduced ? { duration: 0 } : { type: 'spring', stiffness: 460, damping: 34 }}
          >
            <button
              type="button"
              className="aurora-model-trigger"
              aria-expanded={open}
              aria-haspopup="dialog"
              onClick={() => setOpen(value => !value)}
            >
              <i data-online={chatStatus?.configured ? 'true' : 'false'} />
              <span>{effortLabel ? `${modelLabel} · ${effortLabel}` : modelLabel}</span>
              <ChevronDown size={13} />
            </button>

            <AnimatePresence>
              {open && (
                <motion.section
                className="aurora-model-popover"
                role="dialog"
                aria-label="Model and reasoning effort"
                initial={reduced ? false : { opacity: 0, y: -5, scale: 0.985 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -4, scale: 0.985 }}
                transition={{ duration: reduced ? 0 : 0.14, ease: [0.22, 1, 0.36, 1] }}
              >
                {providers.map(provider => (
                  <div key={provider.id} className="aurora-model-group">
                    <div className="aurora-model-group-head">
                      <strong>{provider.label}</strong>
                      {!provider.configured && (
                        <button
                          type="button"
                          className="aurora-inline-link"
                          onClick={() => {
                            setOpen(false)
                            onOpenProviders()
                          }}
                        >
                          Connect
                        </button>
                      )}
                    </div>
                    {provider.models.map(spec => {
                      const selected = activeProviderId === provider.id && chatStatus?.model === spec.id
                      return (
                        <button
                          type="button"
                          key={spec.id}
                          className="aurora-model-row"
                          disabled={!provider.configured}
                          aria-current={selected ? 'true' : undefined}
                          onClick={() => {
                            void onSelect(provider.id, spec.id, spec.default_effort)
                            if (spec.efforts.length === 0) setOpen(false)
                          }}
                        >
                          <span>{spec.label}</span>
                          {selected && <Check size={14} />}
                        </button>
                      )
                    })}
                  </div>
                ))}

                {activeModelSpec && activeModelSpec.efforts.length > 0 && (
                  <div className="aurora-effort-section">
                    <span>Effort</span>
                    <div className="aurora-effort-pills">
                      {activeModelSpec.efforts.map(level => (
                        <button
                          type="button"
                          key={level}
                          aria-pressed={chatStatus?.effort === level}
                          onClick={() => {
                            void onSelect(activeProviderId, activeModelSpec.id, level)
                            setOpen(false)
                          }}
                        >
                          {level}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="aurora-model-popover-foot">
                  <button
                    type="button"
                    className="aurora-popover-action"
                    onClick={() => {
                      setOpen(false)
                      onOpenProviders()
                    }}
                  >
                    <span>Manage AI Providers…</span>
                  </button>
                </div>
              </motion.section>
            )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export function HelpPopover({
  version,
  reduced,
  updateInfo,
  checkingUpdate,
  onCheckUpdate,
  onReplayIntro,
  onClose,
}: {
  version: string
  reduced: boolean
  updateInfo: AppUpdateInfo | null
  checkingUpdate: boolean
  onCheckUpdate: () => void
  onReplayIntro: () => void
  onClose: () => void
}) {
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    const onEscape = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose() }
    document.addEventListener('keydown', onEscape)
    return () => document.removeEventListener('keydown', onEscape)
  }, [onClose])

  function copyVersion() {
    void navigator.clipboard?.writeText(`MCP Code v${version}`).then(() => {
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1600)
    }).catch(() => {})
  }

  return (
    <>
      <button type="button" className="aurora-popover-scrim" aria-label="Close help" onClick={onClose} />
      <motion.section
        className="aurora-rail-sheet"
        role="dialog"
        aria-label="Help and version"
        initial={reduced ? false : { opacity: 0, x: -6, scale: 0.985 }}
        animate={{ opacity: 1, x: 0, scale: 1 }}
        exit={{ opacity: 0, x: -4, scale: 0.985 }}
        transition={{ duration: reduced ? 0 : 0.15, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="aurora-rail-sheet-head">
          <strong>MCP Code</strong>
          <span>v{version}</span>
        </div>

        {updateInfo?.update_available ? (
          <div className="aurora-update-card">
            <div className="aurora-update-card-head">
              <span className="aurora-update-dot" />
              <strong>Update available: {updateInfo.latest_version}</strong>
            </div>
            <button
              type="button"
              className="aurora-update-download-btn"
              onClick={() => void openExternal(updateInfo.download_url || updateInfo.release_url)}
            >
              <span>Download update</span>
              <ExternalLink size={12} />
            </button>
          </div>
        ) : (
          <div className="aurora-rail-sheet-foot">
            <button
              type="button"
              className="aurora-popover-action"
              disabled={checkingUpdate}
              onClick={onCheckUpdate}
            >
              <RefreshCw size={14} className={checkingUpdate ? 'aurora-spin' : undefined} />
              <span>
                {checkingUpdate
                  ? 'Checking for updates…'
                  : updateInfo?.checked
                    ? `Up to date (v${version})`
                    : updateInfo?.error
                      ? 'Update check unavailable'
                      : 'Check for updates'}
              </span>
            </button>
          </div>
        )}

        <div className="aurora-rail-sheet-foot">
          <button
            type="button"
            className="aurora-popover-action"
            onClick={() => {
              onClose()
              onReplayIntro()
            }}
          >
            <RefreshCw size={14} />
            <span>Replay introduction</span>
          </button>
          <button type="button" className="aurora-popover-action" onClick={copyVersion}>
            {copied ? <Check size={14} /> : <Copy size={14} />}
            <span>{copied ? `Copied v${version}` : 'Copy version'}</span>
          </button>
          <button type="button" className="aurora-popover-action" onClick={() => void openExternal(GUIDES_URL)}>
            <BookOpen size={14} />
            <span>Guides</span>
            <ExternalLink size={12} className="aurora-ext-icon" />
          </button>
          <button type="button" className="aurora-popover-action" onClick={() => void openExternal(TUNNEL_GUIDE_URL)}>
            <ShieldCheck size={14} />
            <span>Secure MCP Tunnel guide</span>
            <ExternalLink size={12} className="aurora-ext-icon" />
          </button>
          <button type="button" className="aurora-popover-action" onClick={() => void openExternal(REPO_URL)}>
            <Code2 size={14} />
            <span>Source repository</span>
            <ExternalLink size={12} className="aurora-ext-icon" />
          </button>
        </div>

        <div className="aurora-shortcut-list">
          <div><span>Search projects</span><kbd>{isMac ? '⌘K' : 'Ctrl K'}</kbd></div>
          <div><span>Navigate history</span><kbd>Alt ← / →</kbd></div>
          <div><span>Send message</span><kbd>Enter</kbd></div>
          <div><span>New line</span><kbd>Shift Enter</kbd></div>
          <div><span>Close dialog</span><kbd>Esc</kbd></div>
        </div>
      </motion.section>
    </>
  )
}

function buildFallbackCalendarDays(): { date: string; count: number }[] {
  const today = new Date()
  const weekday = (today.getDay() + 6) % 7
  const start = new Date(today)
  start.setDate(today.getDate() - weekday - 52 * 7)
  const result: { date: string; count: number }[] = []
  const cursor = new Date(start)
  while (cursor <= today) {
    const year = cursor.getFullYear()
    const month = String(cursor.getMonth() + 1).padStart(2, '0')
    const day = String(cursor.getDate()).padStart(2, '0')
    result.push({ date: `${year}-${month}-${day}`, count: 0 })
    cursor.setDate(cursor.getDate() + 1)
  }
  return result
}

const MONTH_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

function activityLevel(count: number): 0 | 1 | 2 | 3 | 4 {
  if (count <= 0) return 0
  if (count === 1) return 1
  if (count <= 3) return 2
  if (count <= 6) return 3
  return 4
}

export function AccountPage({
  version,
  reduced,
  summary,
  onBack,
}: {
  version: string
  reduced: boolean
  summary: Snapshot['summary'] | null
  onBack: () => void
}) {
  const [profile, setProfile] = useState<LocalProfile>(() => loadLocalProfile())
  const [editing, setEditing] = useState(false)
  const [nameDraft, setNameDraft] = useState(profile.name)
  const [colorDraft, setColorDraft] = useState(profile.color)
  const [hoveredDay, setHoveredDay] = useState<{ date: string; count: number } | null>(null)

  const calendarDays = useMemo(() => {
    const source = summary?.calendar_days
    return Array.isArray(source) && source.length > 0 ? source : buildFallbackCalendarDays()
  }, [summary?.calendar_days])

  const weeks = useMemo(() => {
    const cols: { date: string; count: number }[][] = []
    for (let i = 0; i < calendarDays.length; i += 7) {
      cols.push(calendarDays.slice(i, i + 7))
    }
    return cols
  }, [calendarDays])

  const monthLabels = useMemo(() => {
    let lastMonth = -1
    return weeks.map((week, idx) => {
      const firstDate = week[0]?.date
      if (!firstDate) return ''
      const month = Number.parseInt(firstDate.slice(5, 7), 10) - 1
      if (Number.isNaN(month) || month === lastMonth) return ''
      lastMonth = month
      if (idx === 0 && weeks.length > 50) return ''
      return MONTH_SHORT[month] ?? ''
    })
  }, [weeks])

  const totalEvents = useMemo(
    () => calendarDays.reduce((acc, day) => acc + day.count, 0),
    [calendarDays]
  )

  const messagesSent = summary?.messages_sent ?? 0
  const approvedChanges = summary?.applied_changes ?? 0
  const activeDays = summary?.active_days ?? 0

  const statCards = [
    { label: 'Messages sent', value: messagesSent, range: 'All time' },
    { label: 'Approved changes', value: approvedChanges, range: 'All time' },
    { label: 'Active days', value: activeDays, range: 'Last 12 months' },
  ]

  function openEditor() {
    setNameDraft(profile.name)
    setColorDraft(profile.color)
    setEditing(true)
  }

  function submitProfile(event: React.FormEvent) {
    event.preventDefault()
    const saved = saveLocalProfile({ name: nameDraft, color: colorDraft })
    setProfile(saved)
    setEditing(false)
  }

  return (
    <div className="aurora-profile-page">
      <div className="aurora-profile-scroll">
        <div className="aurora-profile-container">
          <div className="aurora-profile-topbar">
            <h3>Profile</h3>
            <button
              type="button"
              className="aurora-topbar-btn"
              aria-label="Close profile"
              title="Back to chat (Esc)"
              onClick={onBack}
            >
              <X size={16} />
            </button>
          </div>

          <div className="aurora-profile-identity-bar">
            <div className="aurora-profile-identity">
              <span
                className="aurora-profile-avatar"
                style={{ backgroundColor: editing ? colorDraft : profile.color }}
                aria-hidden="true"
              >
                {profileInitials(editing ? nameDraft : profile.name)}
              </span>
              <div className="aurora-profile-meta">
                <h4>{profile.name}</h4>
                <span>Local profile · MCP Code v{version}</span>
              </div>
            </div>
            <button
              type="button"
              className="aurora-btn-secondary"
              onClick={() => (editing ? setEditing(false) : openEditor())}
            >
              {editing ? 'Cancel' : 'Edit profile'}
            </button>
          </div>

          <AnimatePresence initial={false}>
            {editing && (
              <motion.form
                className="aurora-profile-edit-card"
                onSubmit={submitProfile}
                initial={reduced ? false : { opacity: 0, height: 0, y: -6 }}
                animate={{ opacity: 1, height: 'auto', y: 0 }}
                exit={reduced ? undefined : { opacity: 0, height: 0, y: -4 }}
                transition={{ duration: reduced ? 0 : 0.26, ease: [0.22, 1, 0.36, 1] }}
              >
                <div className="aurora-profile-edit-inner">
                  <label className="aurora-field-label">
                    <span>Display name</span>
                    <input
                      type="text"
                      value={nameDraft}
                      maxLength={40}
                      placeholder="Your local name"
                      onChange={event => setNameDraft(event.target.value)}
                    />
                  </label>

                  <div className="aurora-field-label">
                    <span>Avatar color</span>
                    <div className="aurora-profile-colors">
                      {PROFILE_COLORS.map(swatch => (
                        <button
                          key={swatch}
                          type="button"
                          aria-pressed={colorDraft === swatch}
                          aria-label={`Color ${swatch}`}
                          className="aurora-color-swatch"
                          style={{ backgroundColor: swatch }}
                          onClick={() => setColorDraft(swatch)}
                        >
                          {colorDraft === swatch && <Check size={13} strokeWidth={2.6} />}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="aurora-settings-actions">
                    <button type="submit" className="aurora-btn-primary">Save profile</button>
                    <button type="button" className="aurora-btn-secondary" onClick={() => setEditing(false)}>Cancel</button>
                  </div>
                </div>
              </motion.form>
            )}
          </AnimatePresence>

          <section className="aurora-profile-stats" aria-label="Activity summary">
            {statCards.map((card, idx) => (
              <motion.div
                key={card.label}
                className="aurora-stat-card"
                initial={reduced ? false : { opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={
                  reduced
                    ? { duration: 0 }
                    : { delay: idx * 0.055, duration: 0.28, ease: [0.22, 1, 0.36, 1] }
                }
              >
                <span className="aurora-stat-label">{card.label}</span>
                <strong>{card.value}</strong>
                <small className="aurora-stat-range">{card.range}</small>
              </motion.div>
            ))}
          </section>

          <section className="aurora-activity-section">
            <div className="aurora-activity-head">
              <div>
                <h4>Activity on this computer</h4>
                <p className="aurora-activity-caption">
                  {hoveredDay
                    ? `${hoveredDay.date} · ${hoveredDay.count} ${hoveredDay.count === 1 ? 'event' : 'events'}`
                    : totalEvents === 0
                      ? 'Activity will appear here as you send messages and approve changes.'
                      : `${activeDays} active ${activeDays === 1 ? 'day' : 'days'} · ${totalEvents} events in the last 12 months`}
                </p>
              </div>
            </div>

            <div className="aurora-activity-surface">
              <div className="aurora-calendar-scroll">
                <div
                  className="aurora-calendar-months"
                  style={{ gridTemplateColumns: `repeat(${weeks.length}, minmax(11px, 1fr))` }}
                >
                  {monthLabels.map((label, idx) => (
                    <span key={weeks[idx]?.[0]?.date ?? idx}>{label}</span>
                  ))}
                </div>

                <div
                  className="aurora-calendar-grid"
                  style={{ gridTemplateColumns: `repeat(${weeks.length}, minmax(11px, 1fr))` }}
                >
                  {weeks.map((week, weekIdx) => (
                    <motion.div
                      key={week[0]?.date ?? weekIdx}
                      className="aurora-calendar-week"
                      initial={reduced ? false : { opacity: 0, scale: 0.88 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={
                        reduced
                          ? { duration: 0 }
                          : { delay: 0.14 + weekIdx * 0.008, duration: 0.22, ease: [0.22, 1, 0.36, 1] }
                      }
                    >
                      {week.map(day => {
                        const level = activityLevel(day.count)
                        const label = `${day.date}: ${day.count} ${day.count === 1 ? 'event' : 'events'}`
                        return (
                          <button
                            key={day.date}
                            type="button"
                            className="aurora-calendar-cell"
                            data-level={level}
                            aria-label={label}
                            title={label}
                            onMouseEnter={() => setHoveredDay(day)}
                            onMouseLeave={() => setHoveredDay(null)}
                            onFocus={() => setHoveredDay(day)}
                            onBlur={() => setHoveredDay(null)}
                          />
                        )
                      })}
                    </motion.div>
                  ))}
                </div>
              </div>

              <div className="aurora-activity-foot">
                <div className="aurora-activity-legend" aria-hidden="true">
                  <span>Less</span>
                  {[0, 1, 2, 3, 4].map(lvl => (
                    <i key={lvl} data-level={lvl} />
                  ))}
                  <span>More</span>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}

type SettingsTab = 'appearance' | 'connections' | 'permissions'
type PermissionField = 'can_read' | 'can_edit' | 'can_delete' | 'can_build'

function SelectedProviderForm({
  provider,
  actionBusy,
  onSaveAndVerify,
  onVerifyExisting,
  onRemove,
}: {
  provider: AIProviderInfo
  actionBusy: boolean
  onSaveAndVerify: (provider: ProviderId, key: string) => Promise<boolean>
  onVerifyExisting: (provider: ProviderId) => Promise<void>
  onRemove: (provider: ProviderId) => Promise<void>
}) {
  const [draft, setDraft] = useState('')

  async function submit(event: React.FormEvent) {
    event.preventDefault()
    if (!draft.trim() || actionBusy) return
    const ok = await onSaveAndVerify(provider.id, draft.trim())
    if (ok) setDraft('')
  }

  return (
    <form className="aurora-key-form aurora-provider-form" onSubmit={event => void submit(event)}>
      <div className="aurora-provider-form-meta">
        <span>
          {!provider.available
            ? 'Unavailable'
            : provider.configured
              ? provider.source === 'env'
                ? `Configured via ${provider.env_var}`
                : 'Saved locally (DPAPI)'
              : 'Not configured'}
        </span>
        <small>Models: {provider.models.map(item => item.label).join(', ')}</small>
      </div>
      <input
        type="password"
        value={draft}
        onChange={event => setDraft(event.target.value)}
        placeholder={provider.configured ? `Replace ${provider.label} API key…` : `Enter ${provider.label} API key…`}
        aria-label={`${provider.label} API key`}
      />
      <div className="aurora-settings-actions">
        <button type="submit" className="aurora-btn-primary" disabled={!draft.trim() || actionBusy}>
          Save & Verify
        </button>
        <button
          type="button"
          className="aurora-btn-secondary"
          disabled={!provider.configured || actionBusy}
          onClick={() => void onVerifyExisting(provider.id)}
        >
          Verify
        </button>
        <button
          type="button"
          className="aurora-btn-secondary"
          disabled={provider.source !== 'secure_store' || actionBusy}
          onClick={() => void onRemove(provider.id)}
        >
          Remove
        </button>
      </div>
    </form>
  )
}

function ThemePreviewCard({
  mode,
  active,
  reduced,
  onSelect,
}: {
  mode: 'dark' | 'light'
  active: boolean
  reduced: boolean
  onSelect: () => void
}) {
  const label = mode === 'dark' ? 'Dark' : 'Light'
  return (
    <button
      type="button"
      aria-pressed={active}
      className={`aurora-theme-card${active ? ' is-selected' : ''}`}
      onClick={onSelect}
    >
      {active && (
        <motion.span
          layoutId="aurora-theme-selection-ring"
          className="aurora-theme-card-ring"
          transition={reduced ? { duration: 0 } : { type: 'spring', stiffness: 360, damping: 30 }}
        />
      )}
      <div className="aurora-theme-preview" data-preview-theme={mode} aria-hidden="true">
        <div className="aurora-theme-preview-rail">
          <span className="is-active" />
          <span />
          <span />
        </div>
        <div className="aurora-theme-preview-sidebar">
          <i className="aurora-preview-line is-short" />
          <i className="aurora-preview-pill is-active" />
          <i className="aurora-preview-pill" />
          <i className="aurora-preview-pill" />
        </div>
        <div className="aurora-theme-preview-main">
          <div className="aurora-theme-preview-msgs">
            <div className="aurora-preview-user" />
            <div className="aurora-preview-assistant">
              <span />
              <span className="is-short" />
            </div>
          </div>
          <div className="aurora-theme-preview-composer">
            <span />
          </div>
        </div>
      </div>
      <div className="aurora-theme-card-foot">
        <span>{label}</span>
        <span className={`aurora-theme-check${active ? ' is-active' : ''}`} aria-hidden="true">
          {active && <Check size={12} strokeWidth={2.8} />}
        </span>
      </div>
    </button>
  )
}

const SETTINGS_SEARCH_INDEX: { id: string; tab: SettingsTab; section: string; label: string; keywords: string }[] = [
  { id: 'theme', tab: 'appearance', section: 'Appearance', label: 'Theme (Dark / Light)', keywords: 'theme dark light color mode appearance' },
  { id: 'motion', tab: 'appearance', section: 'Appearance', label: 'Reduce motion', keywords: 'reduce motion animation transitions accessibility' },
  { id: 'language', tab: 'appearance', section: 'Appearance', label: 'Language', keywords: 'language english polish locale' },
  { id: 'mcp', tab: 'connections', section: 'Connections', label: 'Local MCP Server', keywords: 'mcp local loopback port token start stop client' },
  { id: 'tunnel', tab: 'connections', section: 'Connections', label: 'Secure Tunnel (tunnel-client)', keywords: 'tunnel cloudflare openai executable profile control_plane_api_key diagnose' },
  { id: 'openai', tab: 'connections', section: 'Connections', label: 'OpenAI API key', keywords: 'openai gpt api key ai provider dpapi' },
  { id: 'anthropic', tab: 'connections', section: 'Connections', label: 'Anthropic (Claude) API key', keywords: 'anthropic claude opus sonnet api key ai provider' },
  { id: 'xai', tab: 'connections', section: 'Connections', label: 'xAI (Grok) API key', keywords: 'xai grok api key ai provider' },
  { id: 'changes', tab: 'permissions', section: 'Approvals', label: 'Pending File Changes', keywords: 'pending file changes diff approve reject' },
  { id: 'perms', tab: 'permissions', section: 'Approvals', label: 'Project Permissions', keywords: 'permissions read edit delete build test tasks' },
]

export function AuroraSettingsPage({
  tab,
  onTab,
  theme,
  reduced,
  reducedMotion,
  project,
  meta,
  chatStatus,
  tunnel,
  tunnelDiagnosis,
  tunnelDiagnosing,
  pendingChanges,
  diffs,
  actionBusy,
  actionNotice,
  onTheme,
  onReducedMotion,
  onSaveProviderKey,
  onVerifyProviderKey,
  onRemoveProviderKey,
  onToggleMcp,
  onTunnelSave,
  onTunnelSetKey,
  onTunnelClearKey,
  onTunnelToggle,
  onTunnelDiagnose,
  onRefreshConnections,
  onLoadDiff,
  onApproveChange,
  onRejectChange,
  onTogglePermission,
  onBack,
}: {
  tab: SettingsTab
  onTab: (tab: SettingsTab) => void
  theme: 'dark' | 'light'
  reduced: boolean
  reducedMotion: boolean
  project: AuroraProject | null
  meta: AuroraWorkspaceMeta
  chatStatus: ChatStatus | null
  tunnel: TunnelStatus | null
  tunnelDiagnosis: TunnelDiagnoseResult | null
  tunnelDiagnosing: boolean
  pendingChanges: AuroraChange[]
  diffs: Record<number, string>
  actionBusy: boolean
  actionNotice: string | null
  onTheme: (value: 'dark' | 'light') => void
  onReducedMotion: (value: boolean) => void
  onSaveProviderKey: (provider: ProviderId, key: string) => Promise<boolean>
  onVerifyProviderKey: (provider: ProviderId) => Promise<void>
  onRemoveProviderKey: (provider: ProviderId) => Promise<void>
  onToggleMcp: (port: number) => void
  onTunnelSave: (config: TunnelConfig) => Promise<boolean>
  onTunnelSetKey: (key: string) => Promise<boolean>
  onTunnelClearKey: () => Promise<void>
  onTunnelToggle: () => void
  onTunnelDiagnose: () => void
  onRefreshConnections: () => void
  onLoadDiff: (changeId: number) => void
  onApproveChange: (changeId: number) => void
  onRejectChange: (changeId: number) => void
  onTogglePermission: (projectId: number, field: PermissionField, value: boolean) => void
  onBack: () => void
}) {
  const [executableDraft, setExecutableDraft] = useState(tunnel?.config.executable ?? '')
  const [profileDraft, setProfileDraft] = useState(tunnel?.config.profile ?? 'mcp-code')
  const [portDraft, setPortDraft] = useState(String(tunnel?.config.mcp_port ?? 8765))
  const [tunnelKeyDraft, setTunnelKeyDraft] = useState('')
  const [settingsQuery, setSettingsQuery] = useState('')
  const [mcpDetailsOpen, setMcpDetailsOpen] = useState(false)
  const [mcpCopied, setMcpCopied] = useState(false)
  const [tunnelSetupOpen, setTunnelSetupOpen] = useState(false)
  const [tunnelAdvancedOpen, setTunnelAdvancedOpen] = useState(false)
  const [tunnelDiagDetailsOpen, setTunnelDiagDetailsOpen] = useState(false)
  const [guidedSetupOpen, setGuidedSetupOpen] = useState(() => !meta.clientSeen)
  const [languageMenuOpen, setLanguageMenuOpen] = useState(false)
  const [providerPanelOpen, setProviderPanelOpen] = useState(false)
  const [selectedProviderId, setSelectedProviderId] = useState<ProviderId | null>(null)
  const [tabDirection, setTabDirection] = useState(1)
  const [prevTab, setPrevTab] = useState<SettingsTab>(tab)

  const navItems: { id: SettingsTab; label: string; Icon: typeof Palette }[] = [
    { id: 'appearance', label: 'Appearance', Icon: Palette },
    { id: 'connections', label: 'Connections', Icon: Cable },
    { id: 'permissions', label: 'Approvals', Icon: ShieldCheck },
  ]

  function switchTab(nextTab: SettingsTab) {
    if (nextTab !== tab) {
      const currentIdx = navItems.findIndex(item => item.id === tab)
      const nextIdx = navItems.findIndex(item => item.id === nextTab)
      setTabDirection(nextIdx >= currentIdx ? 1 : -1)
      setPrevTab(tab)
    }
    onTab(nextTab)
  }

  const effectiveDirection = prevTab === tab ? tabDirection : tabDirection
  const tabPanelVariants = {
    enter: (dir: number) => (reduced ? { opacity: 1 } : { opacity: 0, x: dir * 36 }),
    center: { opacity: 1, x: 0 },
    exit: (dir: number) => (reduced ? { opacity: 0 } : { opacity: 0, x: -dir * 26 }),
  }
  const tabTransition = { duration: reduced ? 0 : 0.28, ease: [0.22, 1, 0.36, 1] as const }

  const searchHits = useMemo(() => {
    const q = settingsQuery.trim().toLowerCase()
    if (!q) return []
    return SETTINGS_SEARCH_INDEX.filter(
      item =>
        item.label.toLowerCase().includes(q) ||
        item.section.toLowerCase().includes(q) ||
        item.keywords.toLowerCase().includes(q)
    )
  }, [settingsQuery])

  const mcpRunning = meta.serverState === 'running'
  const mcpEndpoint = meta.endpoint ?? `http://127.0.0.1:${meta.port}/mcp`
  const tunnelConnected = tunnel?.state === 'connected'
  const tunnelStarting = tunnel?.state === 'starting'
  const tunnelRunning = tunnelConnected || tunnelStarting
  const credential = Boolean(tunnel?.credential_present)
  const parsedPort = Number.parseInt(portDraft, 10)
  const effectivePort = Number.isInteger(parsedPort) && parsedPort >= 1024 && parsedPort <= 65535 ? parsedPort : 8765
  const tunnelExeOk = Boolean(tunnel?.executable_found)
  const tunnelProfileOk = Boolean(tunnel?.profile_found) && tunnel?.profile_url_matches_mcp !== false
  const tunnelMissingExecutable = !tunnelExeOk || Boolean(
    tunnel?.error && /tunnel-client|executable|not found|cannot find|path|nie mozna|nie znaleziono/i.test(tunnel.error)
  )
  const tunnelStage = !mcpRunning
    ? 1
    : !tunnelExeOk || !tunnelProfileOk
      ? 2
      : !credential
        ? 3
        : 4
  const providers = chatStatus?.providers ?? []
  const configuredProviders = providers.filter(item => item.configured)
  const activeProvider = providers.find(item => item.id === selectedProviderId) ?? null

  const expandTransition = reduced
    ? { duration: 0 }
    : { duration: 0.24, ease: [0.22, 1, 0.36, 1] as const }

  function copyMcpEndpoint() {
    void navigator.clipboard?.writeText(mcpEndpoint).then(() => {
      setMcpCopied(true)
      window.setTimeout(() => setMcpCopied(false), 1600)
    }).catch(() => {})
  }

  function openProviderPicker(providerId?: ProviderId) {
    if (providerId) {
      setSelectedProviderId(providerId)
      setProviderPanelOpen(true)
      return
    }
    setProviderPanelOpen(open => {
      const next = !open
      if (next && !selectedProviderId) {
        setSelectedProviderId(configuredProviders[0]?.id ?? providers[0]?.id ?? 'openai')
      }
      return next
    })
  }

  const permissionRows: { field: PermissionField; label: string; enabled: boolean }[] = project
    ? [
        { field: 'can_read', label: 'Read files', enabled: project.permissions.read },
        { field: 'can_edit', label: 'Edit & propose files', enabled: project.permissions.edit },
        { field: 'can_delete', label: 'Delete files', enabled: project.permissions.delete },
        { field: 'can_build', label: 'Run fixed build/test tasks', enabled: project.permissions.build },
      ]
    : []

  async function browseTunnelExecutable() {
    try {
      const picked = await openDialog({
        multiple: false,
        title: 'Wybierz plik tunnel-client.exe',
        filters: [{ name: 'Executable', extensions: ['exe'] }],
      })
      if (picked && !Array.isArray(picked)) {
        setExecutableDraft(picked)
        await onTunnelSave({
          executable: picked,
          profile: profileDraft.trim() || 'mcp-code',
          auto_start_mcp: tunnel?.config.auto_start_mcp ?? false,
          auto_start_tunnel: tunnel?.config.auto_start_tunnel ?? false,
          reconnect: tunnel?.config.reconnect ?? false,
          mcp_port: effectivePort,
        })
      }
    } catch {
      // Ignore outside Tauri
    }
  }

  async function submitTunnelConfig(event: React.FormEvent) {
    event.preventDefault()
    if (actionBusy) return
    await onTunnelSave({
      executable: executableDraft.trim(),
      profile: profileDraft.trim() || 'mcp-code',
      auto_start_mcp: tunnel?.config.auto_start_mcp ?? false,
      auto_start_tunnel: tunnel?.config.auto_start_tunnel ?? false,
      reconnect: tunnel?.config.reconnect ?? false,
      mcp_port: effectivePort,
    })
  }

  async function submitTunnelKey(event: React.FormEvent) {
    event.preventDefault()
    if (!tunnelKeyDraft.trim() || actionBusy) return
    const ok = await onTunnelSetKey(tunnelKeyDraft.trim())
    if (ok) setTunnelKeyDraft('')
  }

  return (
    <div className="aurora-settings-page">
      <div className="aurora-settings-page-nav">
        <div className="aurora-settings-page-head">
          <button type="button" className="aurora-back-btn" onClick={onBack}>
            <ArrowLeft size={15} />
            <span>Back to chat</span>
          </button>
          <h2>Settings</h2>
        </div>

        <div className="aurora-settings-search">
          <Search size={14} />
          <input
            type="search"
            value={settingsQuery}
            onChange={event => setSettingsQuery(event.target.value)}
            placeholder="Search settings…"
            aria-label="Search settings"
          />
          {settingsQuery && (
            <button
              type="button"
              className="aurora-search-clear"
              aria-label="Clear settings search"
              onClick={() => setSettingsQuery('')}
            >
              <X size={12} />
            </button>
          )}
        </div>

        {settingsQuery.trim() ? (
          <div className="aurora-settings-search-results" role="listbox" aria-label="Matching settings">
            {searchHits.length === 0 ? (
              <p className="aurora-list-empty">No matching settings</p>
            ) : (
              searchHits.map(hit => (
                <button
                  key={hit.id}
                  type="button"
                  className="aurora-settings-search-hit"
                  onClick={() => {
                    switchTab(hit.tab)
                    setSettingsQuery('')
                  }}
                >
                  <strong>{hit.label}</strong>
                  <span>{hit.section}</span>
                </button>
              ))
            )}
          </div>
        ) : null}

        <nav className="aurora-settings-menu" aria-label="Settings sections">
          {navItems.map(({ id, label, Icon }) => (
            <button
              type="button"
              key={id}
              className="aurora-settings-menu-item"
              aria-current={tab === id ? 'page' : undefined}
              onClick={() => switchTab(id)}
            >
              {tab === id && (
                <motion.span
                  layoutId="aurora-settings-tab-selection"
                  className="aurora-settings-menu-selection"
                  transition={reduced ? { duration: 0 } : { type: 'spring', stiffness: 420, damping: 30, mass: 0.85 }}
                />
              )}
              <Icon size={16} />
              <span>{label}</span>
              {id === 'permissions' && pendingChanges.length > 0 && (
                <em className="aurora-folder-badge">{pendingChanges.length}</em>
              )}
            </button>
          ))}
        </nav>
      </div>

      <div className="aurora-settings-page-content">
        <div className="aurora-settings-page-topbar">
          <div className="aurora-settings-title-slot">
            <AnimatePresence mode="popLayout" initial={false} custom={effectiveDirection}>
              <motion.h3
                key={tab}
                custom={effectiveDirection}
                initial={reduced ? false : { opacity: 0, x: effectiveDirection * 14 }}
                animate={{ opacity: 1, x: 0 }}
                exit={reduced ? undefined : { opacity: 0, x: -effectiveDirection * 10 }}
                transition={{ duration: reduced ? 0 : 0.24, ease: [0.22, 1, 0.36, 1] }}
              >
                {navItems.find(item => item.id === tab)?.label}
              </motion.h3>
            </AnimatePresence>
          </div>
          <button type="button" className="aurora-topbar-btn" aria-label="Close settings" title="Back to chat (Esc)" onClick={onBack}>
            <X size={16} />
          </button>
        </div>

        <div className="aurora-settings-page-body">
          {actionNotice && <p className="aurora-settings-notice" role="status">{actionNotice}</p>}
          <AnimatePresence mode="popLayout" initial={false} custom={effectiveDirection}>
            {tab === 'appearance' && (
              <motion.div
                key="appearance"
                custom={effectiveDirection}
                className="aurora-settings-stack aurora-appearance-column"
                variants={tabPanelVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={tabTransition}
              >
                <motion.section
                  className="aurora-appearance-group"
                  initial={reduced ? false : { opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: reduced ? 0 : 0.24, ease: [0.22, 1, 0.36, 1] }}
                >
                  <div className="aurora-settings-group-header">
                    <h4>Theme</h4>
                  </div>
                  <div className="aurora-theme-grid">
                    <ThemePreviewCard
                      mode="dark"
                      active={theme === 'dark'}
                      reduced={reduced}
                      onSelect={() => onTheme('dark')}
                    />
                    <ThemePreviewCard
                      mode="light"
                      active={theme === 'light'}
                      reduced={reduced}
                      onSelect={() => onTheme('light')}
                    />
                  </div>
                </motion.section>

                <motion.section
                  className="aurora-appearance-group"
                  initial={reduced ? false : { opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    duration: reduced ? 0 : 0.24,
                    delay: reduced ? 0 : 0.08,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                >
                  <div className="aurora-settings-group-header">
                    <h4>Motion</h4>
                  </div>
                  <div className="aurora-settings-card">
                    <div className="aurora-setting-row">
                      <div className="aurora-setting-copy">
                        <span className="aurora-setting-label">Reduce motion</span>
                        <small>Minimize view transitions and animated effects.</small>
                      </div>
                      <button
                        type="button"
                        className="aurora-switch"
                        role="switch"
                        aria-checked={reducedMotion}
                        aria-label="Reduce motion"
                        onClick={() => onReducedMotion(!reducedMotion)}
                      >
                        <span />
                      </button>
                    </div>
                  </div>
                </motion.section>

                <motion.section
                  className="aurora-appearance-group"
                  initial={reduced ? false : { opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    duration: reduced ? 0 : 0.24,
                    delay: reduced ? 0 : 0.14,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                >
                  <div className="aurora-settings-group-header">
                    <h4>Language</h4>
                  </div>
                  <div className="aurora-settings-card">
                    <div className="aurora-setting-row">
                      <div className="aurora-setting-copy">
                        <span className="aurora-setting-label">Interface language</span>
                        <small>Additional languages (including Polish) will be available soon.</small>
                      </div>
                      <div className="aurora-language-picker">
                        <button
                          type="button"
                          className="aurora-language-trigger"
                          aria-label="Interface language"
                          aria-expanded={languageMenuOpen}
                          onClick={() => setLanguageMenuOpen(open => !open)}
                        >
                          <span>English</span>
                          <ChevronDown size={14} />
                        </button>
                        <AnimatePresence>
                          {languageMenuOpen && (
                            <motion.div
                              role="listbox"
                              aria-label="Interface language options"
                              className="aurora-language-menu"
                              initial={reduced ? false : { opacity: 0, y: -4, scale: 0.97 }}
                              animate={{ opacity: 1, y: 0, scale: 1 }}
                              exit={reduced ? undefined : { opacity: 0, y: -3, scale: 0.97 }}
                              transition={reduced ? { duration: 0 } : { type: 'spring', stiffness: 460, damping: 34 }}
                            >
                              <button
                                type="button"
                                role="option"
                                aria-selected="true"
                                className="aurora-language-option is-active"
                                onClick={() => setLanguageMenuOpen(false)}
                              >
                                <span>English</span>
                                <Check size={13} />
                              </button>
                              <button
                                type="button"
                                role="option"
                                aria-selected="false"
                                aria-disabled="true"
                                disabled
                                className="aurora-language-option is-disabled"
                              >
                                <span>Polski</span>
                                <small>Coming soon</small>
                              </button>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>
                  </div>
                </motion.section>
              </motion.div>
            )}

            {tab === 'connections' && (
              <motion.div
                key="connections"
                custom={effectiveDirection}
                className="aurora-settings-stack aurora-connections-column"
                variants={tabPanelVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={tabTransition}
              >
                <div className="aurora-settings-group-header">
                  <h4>Services & Keys</h4>
                  <button
                    type="button"
                    className="aurora-icon-btn"
                    aria-label="Refresh connection status"
                    title="Refresh connection status"
                    onClick={onRefreshConnections}
                    disabled={actionBusy}
                  >
                    <RefreshCw size={13} />
                  </button>
                </div>

                {/* Guided Setup Tutorial Card */}
                <section className="aurora-settings-card aurora-guided-card">
                  <div className="aurora-guided-head">
                    <div className="aurora-guided-head-copy">
                      <div className="aurora-guided-title-row">
                        <strong>Quick Setup: Connect ChatGPT</strong>
                        <span className="aurora-guided-badge" data-ready={mcpRunning && tunnelConnected ? 'true' : 'false'}>
                          {mcpRunning && tunnelConnected ? 'Ready to pair' : `${(mcpRunning ? 1 : 0) + (tunnelConnected ? 1 : 0)}/2 local ready`}
                        </span>
                      </div>
                      <small>Follow these steps or open the full illustrated guide in your browser.</small>
                    </div>
                    <div className="aurora-guided-head-actions">
                      <button
                        type="button"
                        className="aurora-btn-secondary"
                        onClick={() => void openExternal(CONNECT_CHATGPT_GUIDE_URL)}
                      >
                        <BookOpen size={13} />
                        <span>Full guide</span>
                        <ExternalLink size={11} />
                      </button>
                      <button
                        type="button"
                        className="aurora-btn-ghost"
                        aria-expanded={guidedSetupOpen}
                        onClick={() => setGuidedSetupOpen(v => !v)}
                      >
                        {guidedSetupOpen ? 'Hide' : 'Show'}
                      </button>
                    </div>
                  </div>

                  {guidedSetupOpen && (
                    <div className="aurora-guided-steps">
                      <div className="aurora-guided-step" data-done={mcpRunning ? 'true' : 'false'}>
                        <span className="aurora-guided-num">{mcpRunning ? <Check size={12} /> : '1'}</span>
                        <div className="aurora-guided-step-body">
                          <strong>Start Local MCP</strong>
                          <small>{mcpRunning ? `Running on ${mcpEndpoint}` : 'Starts the local MCP server on port 8765.'}</small>
                        </div>
                        {!mcpRunning && (
                          <button
                            type="button"
                            className="aurora-btn-primary"
                            disabled={actionBusy}
                            onClick={() => onToggleMcp(parsedPort)}
                          >
                            Start MCP
                          </button>
                        )}
                      </div>

                      <div className="aurora-guided-step" data-done={tunnelConnected ? 'true' : 'false'}>
                        <span className="aurora-guided-num">{tunnelConnected ? <Check size={12} /> : '2'}</span>
                        <div className="aurora-guided-step-body">
                          <strong>Connect Secure Tunnel</strong>
                          <small>
                            {tunnelConnected
                              ? 'Tunnel is connected and forwarding to Local MCP.'
                              : 'Create a tunnel in OpenAI Platform, paste your Tunnel Runtime API Key below, then Start tunnel.'}
                          </small>
                        </div>
                        <div className="aurora-guided-step-actions">
                          <button
                            type="button"
                            className="aurora-btn-secondary"
                            onClick={() => void openExternal(TUNNEL_RUNTIME_KEYS_URL)}
                          >
                            <span>OpenAI Tunnels</span>
                            <ExternalLink size={11} />
                          </button>
                          {!tunnelConnected && (
                            <button
                              type="button"
                              className="aurora-btn-ghost"
                              onClick={() => setTunnelSetupOpen(true)}
                            >
                              Configure
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="aurora-guided-step" data-done={meta.clientSeen ? 'true' : 'false'}>
                        <span className="aurora-guided-num">{meta.clientSeen ? <Check size={12} /> : '3'}</span>
                        <div className="aurora-guided-step-body">
                          <strong>Add MCP Code in ChatGPT Web</strong>
                          <small>Open ChatGPT Connectors, choose Tunnel, and connect with No authentication.</small>
                        </div>
                        <button
                          type="button"
                          className="aurora-btn-secondary"
                          onClick={() => void openExternal(CHATGPT_PLUGINS_URL)}
                        >
                          <span>Open ChatGPT</span>
                          <ExternalLink size={11} />
                        </button>
                      </div>

                      <div className="aurora-guided-step" data-done="false">
                        <span className="aurora-guided-num">4</span>
                        <div className="aurora-guided-step-body">
                          <strong>Pair Mico & send your first task</strong>
                          <small>Go back to Chat, click Connect ChatGPT, and enter the pairing code in the Mico widget.</small>
                        </div>
                        <button
                          type="button"
                          className="aurora-btn-primary"
                          onClick={onBack}
                        >
                          Go to Chat
                        </button>
                      </div>
                    </div>
                  )}
                </section>

                <section className="aurora-settings-card aurora-connections-card">
                  {/* 1. Local MCP */}
                  <div className="aurora-conn-block">
                    <div className="aurora-conn-row">
                      <div className="aurora-conn-icon" aria-hidden="true">
                        <Server size={17} />
                      </div>
                      <div className="aurora-conn-copy">
                        <div className="aurora-conn-title-line">
                          <strong>Local MCP</strong>
                          <span className="aurora-conn-status" data-online={mcpRunning ? 'true' : 'false'}>
                            {mcpRunning ? `Running :${meta.port}` : meta.serverState}
                          </span>
                        </div>
                        <small>
                          {mcpRunning
                            ? `Listening on ${mcpEndpoint}`
                            : 'Local loopback server for external MCP clients.'}
                        </small>
                      </div>
                      <div className="aurora-conn-actions">
                        {mcpRunning && (
                          <button type="button" className="aurora-btn-secondary" onClick={copyMcpEndpoint}>
                            {mcpCopied ? <Check size={13} /> : <Copy size={13} />}
                            <span>{mcpCopied ? 'Copied' : 'Copy'}</span>
                          </button>
                        )}
                        <button
                          type="button"
                          className="aurora-btn-ghost"
                          aria-expanded={mcpDetailsOpen}
                          onClick={() => setMcpDetailsOpen(open => !open)}
                        >
                          Details
                        </button>
                        <button
                          type="button"
                          className={mcpRunning ? 'aurora-btn-secondary' : 'aurora-btn-primary'}
                          disabled={actionBusy || meta.serverState === 'starting'}
                          onClick={() => onToggleMcp(effectivePort)}
                        >
                          {mcpRunning ? 'Stop' : 'Start'}
                        </button>
                      </div>
                    </div>

                    {meta.serverError && <p className="aurora-settings-error">{meta.serverError}</p>}

                    <AnimatePresence initial={false}>
                      {mcpDetailsOpen && (
                        <motion.div
                          className="aurora-conn-drawer"
                          initial={reduced ? false : { opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={reduced ? undefined : { opacity: 0, height: 0 }}
                          transition={expandTransition}
                        >
                          <div className="aurora-conn-drawer-inner">
                            <div className="aurora-inspector-kv">
                              <span>Endpoint</span>
                              <code>{mcpEndpoint}</code>
                            </div>
                            <div className="aurora-inspector-kv">
                              <span>External client</span>
                              <strong>
                                {mcpRunning
                                  ? meta.clientSeen
                                    ? 'Client request observed'
                                    : 'No client requests yet'
                                  : 'Server stopped'}
                              </strong>
                            </div>
                            <div className="aurora-inspector-kv">
                              <span>MCP access token</span>
                              <code>%LOCALAPPDATA%\MCP Code\mcp-token.txt</code>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* 2. Secure Tunnel */}
                  <div className="aurora-conn-block">
                    <div className="aurora-conn-row">
                      <div className="aurora-conn-icon" aria-hidden="true">
                        <Globe size={17} />
                      </div>
                      <div className="aurora-conn-copy">
                        <div className="aurora-conn-title-line">
                          <strong>Secure Tunnel</strong>
                          <span className="aurora-conn-status" data-online={tunnelConnected ? 'true' : 'false'}>
                            {tunnelConnected
                              ? 'Connected'
                              : tunnelStarting
                                ? 'Connecting…'
                                : tunnel?.state === 'error'
                                  ? 'Error'
                                  : tunnelDiagnosis?.ok
                                    ? 'Ready'
                                    : credential
                                      ? 'Key saved'
                                      : 'Setup required'}
                          </span>
                        </div>
                        <small>
                          {tunnelConnected
                            ? `Connected via profile ${tunnel?.config.profile ?? 'mcp-code'}.`
                            : tunnelStarting
                              ? 'Starting tunnel and checking readiness…'
                              : tunnelDiagnosis?.ok
                                ? 'Configuration verified. You can start the tunnel.'
                                : `Step ${tunnelStage} of 4 · ${
                                    tunnelStage === 1
                                      ? 'Start Local MCP'
                                      : tunnelStage === 2
                                        ? 'Configure tunnel-client and profile'
                                        : tunnelStage === 3
                                          ? 'Add Tunnel Runtime API Key'
                                          : 'Check configuration and start tunnel'
                                  }`}
                        </small>
                      </div>
                      <div className="aurora-conn-actions">
                        <button
                          type="button"
                          className={tunnelSetupOpen ? 'aurora-btn-ghost' : tunnelDiagnosis?.ok || tunnelRunning ? 'aurora-btn-ghost' : 'aurora-btn-primary'}
                          aria-expanded={tunnelSetupOpen}
                          onClick={() => setTunnelSetupOpen(open => !open)}
                        >
                          {tunnelSetupOpen ? 'Hide' : credential || tunnelRunning ? 'Configure' : 'Set up'}
                        </button>
                        {(tunnelDiagnosis?.ok || tunnelRunning) && (
                          <button
                            type="button"
                            className={tunnelRunning ? 'aurora-btn-secondary' : 'aurora-btn-primary'}
                            disabled={actionBusy}
                            onClick={onTunnelToggle}
                          >
                            {tunnelRunning ? 'Stop' : 'Start tunnel'}
                          </button>
                        )}
                      </div>
                    </div>

                    {tunnel?.error && (
                      <div className="aurora-conn-inline-error">
                        <p className="aurora-settings-error">{tunnel.error}</p>
                        {tunnelMissingExecutable && (
                          <button type="button" className="aurora-btn-secondary" onClick={() => void browseTunnelExecutable()}>
                            Choose file
                          </button>
                        )}
                      </div>
                    )}

                    <AnimatePresence initial={false}>
                      {tunnelSetupOpen && (
                        <motion.div
                          className="aurora-conn-drawer"
                          initial={reduced ? false : { opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={reduced ? undefined : { opacity: 0, height: 0 }}
                          transition={expandTransition}
                        >
                          <div className="aurora-conn-drawer-inner">
                            <div className="aurora-tunnel-steps">
                              {/* Step 1: Local MCP */}
                              <div className="aurora-tunnel-step" data-done={mcpRunning ? 'true' : 'false'} data-active={tunnelStage === 1 ? 'true' : 'false'}>
                                <div className="aurora-tunnel-step-head">
                                  <span className="aurora-tunnel-step-num">{mcpRunning ? <Check size={12} /> : '1'}</span>
                                  <div className="aurora-tunnel-step-copy">
                                    <strong>1. Local MCP</strong>
                                    <small>
                                      {mcpRunning
                                        ? `Ready · detected port ${meta.port}`
                                        : `Server is stopped (target port ${effectivePort}).`}
                                    </small>
                                  </div>
                                  <div className="aurora-tunnel-step-action">
                                    {mcpRunning ? (
                                      <span className="aurora-tunnel-badge" data-tone="ok">Ready</span>
                                    ) : (
                                      <button
                                        type="button"
                                        className={tunnelStage === 1 ? 'aurora-btn-primary' : 'aurora-btn-secondary'}
                                        disabled={actionBusy}
                                        onClick={() => onToggleMcp(effectivePort)}
                                      >
                                        Start Local MCP
                                      </button>
                                    )}
                                  </div>
                                </div>
                              </div>

                              {/* Step 2: Client & tunnel profile */}
                              <div className="aurora-tunnel-step" data-done={tunnelExeOk && tunnelProfileOk ? 'true' : 'false'} data-active={tunnelStage === 2 ? 'true' : 'false'}>
                                <div className="aurora-tunnel-step-head">
                                  <span className="aurora-tunnel-step-num">{tunnelExeOk && tunnelProfileOk ? <Check size={12} /> : '2'}</span>
                                  <div className="aurora-tunnel-step-copy">
                                    <strong>2. Tunnel client & profile</strong>
                                    <small>
                                      {!tunnelExeOk
                                        ? 'tunnel-client.exe was not found in PATH or standard folders.'
                                        : !tunnelProfileOk
                                          ? (tunnel?.profile_issue ?? `Missing valid profile "${tunnel?.config.profile ?? 'mcp-code'}".`)
                                          : `Detected client and profile "${tunnel?.config.profile ?? 'mcp-code'}"${tunnel?.profile_mcp_url ? ` (${tunnel.profile_mcp_url})` : ''}.`}
                                    </small>
                                  </div>
                                  <div className="aurora-tunnel-step-action">
                                    {!tunnelExeOk ? (
                                      <button
                                        type="button"
                                        className={tunnelStage === 2 ? 'aurora-btn-primary' : 'aurora-btn-secondary'}
                                        disabled={actionBusy}
                                        onClick={() => void browseTunnelExecutable()}
                                      >
                                        Choose file
                                      </button>
                                    ) : tunnelProfileOk ? (
                                      <span className="aurora-tunnel-badge" data-tone="ok">Ready</span>
                                    ) : (
                                      <button
                                        type="button"
                                        className="aurora-btn-secondary"
                                        onClick={() => setTunnelAdvancedOpen(true)}
                                      >
                                        Fix in Advanced
                                      </button>
                                    )}
                                  </div>
                                </div>
                              </div>

                              {/* Step 3: Tunnel key */}
                              <div className="aurora-tunnel-step" data-done={credential ? 'true' : 'false'} data-active={tunnelStage === 3 ? 'true' : 'false'}>
                                <div className="aurora-tunnel-step-head">
                                  <span className="aurora-tunnel-step-num">{credential ? <Check size={12} /> : '3'}</span>
                                  <div className="aurora-tunnel-step-copy">
                                    <div className="aurora-tunnel-label-row">
                                      <strong>3. Tunnel key (Tunnel Runtime API Key)</strong>
                                      <button
                                        type="button"
                                        className="aurora-link-inline"
                                        onClick={() => void openExternal(TUNNEL_RUNTIME_KEYS_URL)}
                                      >
                                        <span>Runtime API Keys</span>
                                        <ExternalLink size={12} />
                                      </button>
                                    </div>
                                    <small>
                                      {credential
                                        ? tunnelDiagnosis?.ok
                                          ? 'Key saved and verified.'
                                          : 'Key saved. Run configuration check in step 4.'
                                        : 'Paste your Runtime API Key from OpenAI Platform.'}
                                    </small>
                                  </div>
                                  <div className="aurora-tunnel-step-action">
                                    {credential && (
                                      <span className="aurora-tunnel-badge" data-tone={tunnelDiagnosis?.ok ? 'ok' : 'neutral'}>
                                        {tunnelDiagnosis?.ok ? 'Key verified' : 'Key saved'}
                                      </span>
                                    )}
                                  </div>
                                </div>
                                <form className="aurora-key-form aurora-tunnel-key-form" onSubmit={event => void submitTunnelKey(event)}>
                                  <input
                                    type="password"
                                    value={tunnelKeyDraft}
                                    onChange={event => setTunnelKeyDraft(event.target.value)}
                                    placeholder={credential ? 'Replace saved Tunnel Runtime API Key…' : 'Paste Tunnel Runtime API Key…'}
                                    aria-label="Tunnel Runtime API Key"
                                  />
                                  <div className="aurora-settings-actions">
                                    {tunnel?.credential_source === 'secure_store' && (
                                      <button
                                        type="button"
                                        className="aurora-btn-secondary"
                                        disabled={actionBusy || tunnelDiagnosing}
                                        onClick={() => void onTunnelClearKey()}
                                      >
                                        Clear key
                                      </button>
                                    )}
                                    <button
                                      type="submit"
                                      className={tunnelStage === 3 && tunnelKeyDraft.trim() ? 'aurora-btn-primary' : 'aurora-btn-secondary'}
                                      disabled={!tunnelKeyDraft.trim() || actionBusy || tunnelDiagnosing}
                                    >
                                      Save key
                                    </button>
                                  </div>
                                </form>
                              </div>

                              {/* Step 4: Diagnostics & start */}
                              <div className="aurora-tunnel-step" data-done={tunnelDiagnosis?.ok || tunnelConnected ? 'true' : 'false'} data-active={tunnelStage === 4 ? 'true' : 'false'}>
                                <div className="aurora-tunnel-step-head">
                                  <span className="aurora-tunnel-step-num">{tunnelDiagnosis?.ok || tunnelConnected ? <Check size={12} /> : '4'}</span>
                                  <div className="aurora-tunnel-step-copy">
                                    <strong>4. Diagnostics & start</strong>
                                    <small>
                                      {tunnelDiagnosing
                                        ? 'Checking… verifying client, profile, local MCP, and key.'
                                        : tunnelConnected
                                          ? 'Connected — tunnel is active and ready.'
                                          : tunnelStarting
                                            ? 'Tunnel started, waiting for readiness confirmation…'
                                            : tunnelDiagnosis?.ok
                                              ? 'All checks passed.'
                                              : 'Check configuration before starting the tunnel.'}
                                    </small>
                                  </div>
                                  <div className="aurora-tunnel-step-action">
                                    {credential && (
                                      <button
                                        type="button"
                                        className={!tunnelDiagnosis?.ok && tunnelStage === 4 ? 'aurora-btn-primary' : 'aurora-btn-secondary'}
                                        disabled={tunnelDiagnosing || actionBusy}
                                        onClick={onTunnelDiagnose}
                                      >
                                        {tunnelDiagnosing ? 'Checking…' : 'Check configuration'}
                                      </button>
                                    )}
                                    {(tunnelDiagnosis?.ok || tunnelRunning) && (
                                      <button
                                        type="button"
                                        className={tunnelRunning ? 'aurora-btn-secondary' : 'aurora-btn-primary'}
                                        disabled={actionBusy || tunnelDiagnosing}
                                        onClick={onTunnelToggle}
                                      >
                                        {tunnelRunning ? 'Stop tunnel' : 'Start tunnel'}
                                      </button>
                                    )}
                                  </div>
                                </div>

                                {(tunnelDiagnosing || tunnelDiagnosis) && (
                                  <div
                                    className="aurora-tunnel-diag-box"
                                    data-tone={tunnelDiagnosing ? 'busy' : tunnelDiagnosis?.ok ? 'ok' : 'error'}
                                  >
                                    {tunnelDiagnosing ? (
                                      <p className="aurora-tunnel-diag-summary">Checking…</p>
                                    ) : tunnelDiagnosis ? (
                                      <>
                                        <p className="aurora-tunnel-diag-summary">{tunnelDiagnosis.summary}</p>
                                        <p className="aurora-tunnel-diag-next">{tunnelDiagnosis.next_step}</p>
                                        <div className="aurora-tunnel-diag-actions">
                                          {tunnelDiagnosis.category === 'missing_executable' && (
                                            <button type="button" className="aurora-btn-secondary" onClick={() => void browseTunnelExecutable()}>
                                              Choose file
                                            </button>
                                          )}
                                          {tunnelDiagnosis.category === 'local_mcp_unavailable' && !mcpRunning && (
                                            <button type="button" className="aurora-btn-secondary" onClick={() => onToggleMcp(effectivePort)}>
                                              Start Local MCP
                                            </button>
                                          )}
                                          {tunnelDiagnosis.category === 'profile_issue' && (
                                            <button type="button" className="aurora-btn-secondary" onClick={() => setTunnelAdvancedOpen(true)}>
                                              Open Advanced
                                            </button>
                                          )}
                                          {tunnelDiagnosis.details && (
                                            <button
                                              type="button"
                                              className="aurora-btn-ghost"
                                              aria-expanded={tunnelDiagDetailsOpen}
                                              onClick={() => setTunnelDiagDetailsOpen(open => !open)}
                                            >
                                              {tunnelDiagDetailsOpen ? 'Hide technical details' : 'Technical details'}
                                            </button>
                                          )}
                                        </div>
                                        {tunnelDiagDetailsOpen && tunnelDiagnosis.details && (
                                          <pre className="aurora-diff">{tunnelDiagnosis.details}</pre>
                                        )}
                                      </>
                                    ) : null}
                                  </div>
                                )}
                              </div>
                            </div>

                            <div className="aurora-settings-actions">
                              <button
                                type="button"
                                className="aurora-btn-ghost"
                                aria-expanded={tunnelAdvancedOpen}
                                onClick={() => setTunnelAdvancedOpen(open => !open)}
                              >
                                {tunnelAdvancedOpen ? 'Hide Advanced' : 'Advanced'}
                              </button>
                            </div>

                            <AnimatePresence initial={false}>
                              {tunnelAdvancedOpen && (
                                <motion.div
                                  className="aurora-conn-advanced"
                                  initial={reduced ? false : { opacity: 0, height: 0 }}
                                  animate={{ opacity: 1, height: 'auto' }}
                                  exit={reduced ? undefined : { opacity: 0, height: 0 }}
                                  transition={expandTransition}
                                >
                                  <form className="aurora-key-form aurora-conn-advanced-inner" onSubmit={event => void submitTunnelConfig(event)}>
                                    <label className="aurora-field-label">
                                      <span>Path to tunnel-client.exe</span>
                                      <div className="aurora-field-row">
                                        <input
                                          type="text"
                                          value={executableDraft}
                                          onChange={event => setExecutableDraft(event.target.value)}
                                          placeholder={tunnel?.detected_executable ?? 'Auto-detect from PATH or choose file'}
                                        />
                                        <button type="button" className="aurora-btn-secondary" onClick={() => void browseTunnelExecutable()}>
                                          Choose file
                                        </button>
                                      </div>
                                    </label>
                                    <div className="aurora-field-grid">
                                      <label className="aurora-field-label">
                                        <span>Tunnel profile</span>
                                        <input
                                          type="text"
                                          value={profileDraft}
                                          onChange={event => setProfileDraft(event.target.value)}
                                          placeholder="mcp-code"
                                        />
                                      </label>
                                      <label className="aurora-field-label">
                                        <span>Local MCP port</span>
                                        <input
                                          type="number"
                                          min={1024}
                                          max={65535}
                                          value={portDraft}
                                          onChange={event => setPortDraft(event.target.value)}
                                        />
                                      </label>
                                    </div>
                                    <div className="aurora-settings-actions">
                                      <button
                                        type="button"
                                        className="aurora-btn-secondary"
                                        disabled={tunnelDiagnosing || actionBusy || !credential}
                                        onClick={onTunnelDiagnose}
                                      >
                                        {tunnelDiagnosing ? 'Checking…' : 'Diagnose'}
                                      </button>
                                      <button type="submit" className="aurora-btn-secondary" disabled={actionBusy}>
                                        Save configuration
                                      </button>
                                    </div>
                                    {tunnel?.logs?.length ? <pre className="aurora-diff">{tunnel.logs.join('\n')}</pre> : null}
                                  </form>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* 3. AI Providers */}
                  <div className="aurora-conn-block">
                    <div className="aurora-conn-row">
                      <div className="aurora-conn-icon" aria-hidden="true">
                        <Bot size={17} />
                      </div>
                      <div className="aurora-conn-copy">
                        <div className="aurora-conn-title-line">
                          <strong>AI Providers</strong>
                          <span className="aurora-conn-status" data-online={configuredProviders.length > 0 ? 'true' : 'false'}>
                            {configuredProviders.length > 0 ? `${configuredProviders.length} connected` : 'None'}
                          </span>
                        </div>
                        <small>
                          {configuredProviders.length > 0
                            ? `Configured: ${configuredProviders.map(item => item.label).join(', ')}`
                            : 'Connect an API key for built-in Mico chat.'}
                        </small>
                      </div>
                      <div className="aurora-conn-actions">
                        <button
                          type="button"
                          className={configuredProviders.length > 0 ? 'aurora-btn-secondary' : 'aurora-btn-primary'}
                          aria-expanded={providerPanelOpen}
                          onClick={() => openProviderPicker()}
                        >
                          {providerPanelOpen ? 'Close' : configuredProviders.length > 0 ? 'Manage' : 'Add provider'}
                        </button>
                      </div>
                    </div>

                    <AnimatePresence initial={false}>
                      {providerPanelOpen && (
                        <motion.div
                          className="aurora-conn-drawer"
                          initial={reduced ? false : { opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={reduced ? undefined : { opacity: 0, height: 0 }}
                          transition={expandTransition}
                        >
                          <div className="aurora-conn-drawer-inner">
                            <div className="aurora-provider-pills">
                              {providers.map(provider => (
                                <button
                                  key={provider.id}
                                  type="button"
                                  aria-pressed={activeProvider?.id === provider.id}
                                  className={`aurora-provider-pill${activeProvider?.id === provider.id ? ' is-selected' : ''}`}
                                  onClick={() => openProviderPicker(provider.id)}
                                >
                                  <span>{provider.label}</span>
                                  {provider.configured && <Check size={12} strokeWidth={2.5} />}
                                </button>
                              ))}
                            </div>

                            {activeProvider && (
                              <SelectedProviderForm
                                key={activeProvider.id}
                                provider={activeProvider}
                                actionBusy={actionBusy}
                                onSaveAndVerify={onSaveProviderKey}
                                onVerifyExisting={onVerifyProviderKey}
                                onRemove={onRemoveProviderKey}
                              />
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </section>
              </motion.div>
            )}

            {tab === 'permissions' && (
              <motion.div
                key="permissions"
                custom={effectiveDirection}
                className="aurora-settings-stack"
                variants={tabPanelVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={tabTransition}
              >
                <section className="aurora-settings-card">
                  <div className="aurora-settings-card-head">
                    <h3>Pending File Changes</h3>
                    <span className="aurora-status-tag" data-online={pendingChanges.length > 0 ? 'true' : 'false'}>
                      {pendingChanges.length}
                    </span>
                  </div>
                  {!project ? (
                    <p>Select a project to review proposed changes.</p>
                  ) : pendingChanges.length === 0 ? (
                    <p>No pending file changes for {project.name}.</p>
                  ) : (
                    <DiffReviewList
                      changes={pendingChanges}
                      diffs={diffs}
                      actionBusy={actionBusy}
                      reduced={reduced}
                      onLoadDiff={onLoadDiff}
                      onApprove={onApproveChange}
                      onReject={onRejectChange}
                    />
                  )}
                </section>

                <section className="aurora-settings-card">
                  <div className="aurora-settings-card-head">
                    <h3>Project Permissions</h3>
                    {project && <span className="aurora-setting-card-meta">{project.name}</span>}
                  </div>
                  {!project ? (
                    <p>Select a project first.</p>
                  ) : (
                    <div className="aurora-permission-list">
                      {permissionRows.map(row => (
                        <div className="aurora-setting-row" key={row.field}>
                          <span className="aurora-setting-label">{row.label}</span>
                          <button
                            type="button"
                            className="aurora-switch"
                            role="switch"
                            aria-checked={row.enabled}
                            aria-label={row.label}
                            disabled={actionBusy}
                            onClick={() => onTogglePermission(project.id, row.field, !row.enabled)}
                          >
                            <span />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </section>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
