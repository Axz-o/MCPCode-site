import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { ArrowDown, ArrowUp, Check, ChevronDown, Copy, File, FileCode2, FileJson, FileText, Folder, KeyRound, Link2 } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { Liquid } from 'liquid-gooey'
import { ThinkingOrb } from 'thinking-orbs'
import { MicoAvatar } from '../MicoAvatar'
import { DiffTable } from './DiffReview'
import type {
  AuroraChange, AuroraMessage, AuroraProject, ChatStatus, MicoBridgeStatus, MicoCommand
} from './data'

function formatTime(value: string) {
  const date = new Date(`${value.replace(' ', 'T')}Z`)
  return Number.isNaN(date.getTime()) ? '' : date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

function commandStatusLabel(status: MicoCommand['status']): { label: string; tone: 'neutral' | 'ok' | 'warn' | 'err' } {
  switch (status) {
    case 'queued':
      return { label: 'Sending…', tone: 'neutral' }
    case 'dispatched':
    case 'waiting':
      return { label: 'Sent', tone: 'neutral' }
    case 'awaiting_confirmation':
      return { label: 'Confirmation required', tone: 'warn' }
    case 'completed':
      return { label: 'Replied', tone: 'ok' }
    case 'failed':
      return { label: 'Delivery failed', tone: 'err' }
  }
}

function renderRichMessageText(text: string) {
  const parts = text.split(/(```[\s\S]*?```)/g)
  return parts.map((part, idx) => {
    if (part.startsWith('```') && part.endsWith('```') && part.length >= 6) {
      const inner = part.slice(3, -3).replace(/^[a-zA-Z0-9_-]+\r?\n/, '')
      return (
        <pre key={idx} className="aurora-code-block">
          <code>{inner}</code>
        </pre>
      )
    }
    if (!part) return null
    return (
      <p key={idx} className="aurora-message-paragraph">
        {part}
      </p>
    )
  })
}

function AssistantBubble({
  text,
  animateReveal,
  reduced,
  theme,
}: {
  text: string
  animateReveal: boolean
  reduced: boolean
  theme: 'dark' | 'light'
}) {
  const shouldAnimate = animateReveal && !reduced && text.length > 0
  const [visibleCount, setVisibleCount] = useState(() => (shouldAnimate ? Math.min(6, text.length) : text.length))

  useEffect(() => {
    if (!shouldAnimate) {
      setVisibleCount(text.length)
      return
    }
    if (visibleCount >= text.length) return
    const step = Math.max(2, Math.ceil(text.length / 65))
    const timer = window.setInterval(() => {
      setVisibleCount(prev => {
        const next = Math.min(text.length, prev + step)
        if (next >= text.length) window.clearInterval(timer)
        return next
      })
    }, 18)
    return () => window.clearInterval(timer)
  }, [shouldAnimate, text, visibleCount])

  const shownText = visibleCount >= text.length ? text : text.slice(0, visibleCount)
  const bubbleFill = theme === 'dark' ? 'rgba(255, 255, 255, 0.055)' : 'rgba(15, 23, 42, 0.045)'

  return (
    <Liquid fill={bubbleFill} blur={5} contrast={16} className="aurora-liquid-wrap">
      <Liquid.Item
        effect="morph"
        morph={reduced || !animateReveal ? { shape: false } : { shape: true, speed: 1.4, bounce: 0.25, contentBlur: 0 }}
        observe={animateReveal && !reduced}
        radius={16}
        className="aurora-liquid-bubble"
      >
        <div
          className="aurora-assistant-bubble"
          onClick={() => {
            if (visibleCount < text.length) setVisibleCount(text.length)
          }}
          title={visibleCount < text.length ? 'Click to reveal full message' : undefined}
        >
          {renderRichMessageText(shownText)}
        </div>
      </Liquid.Item>
    </Liquid>
  )
}

function isBridgeWaitTimedOut(command: MicoCommand | null, nowMs: number): boolean {
  if (!command || command.pairing_id === null) return false
  if (command.status !== 'waiting' && command.status !== 'dispatched') return false
  const ts = Date.parse(`${(command.updated_at || command.created_at).replace(' ', 'T')}Z`)
  return Number.isFinite(ts) && nowMs - ts >= 30_000
}

function fileIconFor(path: string) {
  const ext = path.split('.').pop()?.toLowerCase() ?? ''
  if (['ts', 'tsx', 'js', 'jsx', 'py', 'rs', 'css', 'html', 'sh'].includes(ext)) return FileCode2
  if (['json', 'yaml', 'yml', 'toml'].includes(ext)) return FileJson
  if (['md', 'txt'].includes(ext)) return FileText
  return File
}

function splitPathParts(fullPath: string): { name: string; dir: string } {
  const norm = fullPath.replace(/\\/g, '/')
  const idx = norm.lastIndexOf('/')
  if (idx < 0) return { name: norm, dir: '' }
  return { name: norm.slice(idx + 1), dir: norm.slice(0, idx) }
}

function AppliedChangesCard({
  changes,
  reduced,
}: {
  changes: AuroraChange[]
  reduced: boolean
}) {
  const [expanded, setExpanded] = useState(true)
  if (changes.length === 0) return null

  // Aggregate by path in chronological order using immutable snapshot stats from backend.
  const byPath = new Map<string, { path: string; added: number; removed: number }>()
  for (const ch of [...changes].reverse()) {
    const prev = byPath.get(ch.path)
    if (prev) {
      prev.added += ch.addedLines
      prev.removed += ch.removedLines
    } else {
      byPath.set(ch.path, { path: ch.path, added: ch.addedLines, removed: ch.removedLines })
    }
  }
  const rows = Array.from(byPath.values())
  const totalAdded = rows.reduce((sum, r) => sum + r.added, 0)
  const totalRemoved = rows.reduce((sum, r) => sum + r.removed, 0)

  return (
    <div className="aurora-applied-card">
      <button
        type="button"
        className="aurora-applied-head"
        aria-expanded={expanded}
        onClick={() => setExpanded(v => !v)}
      >
        <strong className="aurora-applied-title">
          {rows.length} {rows.length === 1 ? 'changed file' : 'changed files'}
        </strong>
        <span className="aurora-applied-stats">
          <span className="is-add">+{totalAdded}</span>
          <span className="is-del">&minus;{totalRemoved}</span>
        </span>
        <ChevronDown
          size={14}
          className="aurora-applied-chevron"
          data-open={expanded ? 'true' : 'false'}
        />
      </button>
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            className="aurora-applied-list"
            initial={reduced ? false : { opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={reduced ? undefined : { opacity: 0, height: 0 }}
            transition={{ duration: reduced ? 0 : 0.2, ease: [0.22, 1, 0.36, 1] }}
          >
            {rows.map(row => {
              const Icon = fileIconFor(row.path)
              const { name, dir } = splitPathParts(row.path)
              return (
                <div key={row.path} className="aurora-applied-row">
                  <Icon size={14} className="aurora-applied-icon" />
                  <span className="aurora-applied-file">{name}</span>
                  {dir && <span className="aurora-applied-dir">{dir}</span>}
                  <span className="aurora-applied-stats aurora-applied-row-stats">
                    <span className="is-add">+{row.added}</span>
                    <span className="is-del">&minus;{row.removed}</span>
                  </span>
                </div>
              )
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function Message({
  item,
  reduced,
  theme,
  animateReveal,
  command,
  nowMs,
  linkedChanges,
  appliedChanges,
  diffs,
  actionBusy,
  onLoadDiff,
  onApproveChange,
  onRejectChange,
}: {
  item: AuroraMessage
  reduced: boolean
  theme: 'dark' | 'light'
  animateReveal: boolean
  command: MicoCommand | null
  nowMs: number
  linkedChanges: AuroraChange[]
  appliedChanges: AuroraChange[]
  diffs: Record<number, string>
  actionBusy: boolean
  onLoadDiff: (changeId: number) => void
  onApproveChange: (changeId: number) => void
  onRejectChange: (changeId: number) => void
}) {
  if (item.role === 'user') {
    const timedOut = isBridgeWaitTimedOut(command, nowMs)
    const statusInfo = command
      ? timedOut
        ? { label: 'Timed out', tone: 'warn' as const }
        : commandStatusLabel(command.status)
      : null
    const detailText = timedOut
      ? 'Timed out (30s) — chatgpt.com did not invoke submit_mico_reply automatically in this turn. Select @MCPCode from the @ menu in chat to pull the reply.'
      : command?.widget_detail
    return (
      <article className="aurora-message aurora-message-user">
        <div className="aurora-message-content">
          <p>{item.text}</p>
          <div className="aurora-message-meta">
            <time>{formatTime(item.createdAt)}</time>
            {statusInfo && (
              <span className="aurora-command-status-text" data-tone={statusInfo.tone} title={detailText ?? undefined}>
                {statusInfo.label}
              </span>
            )}
          </div>
          {detailText && (timedOut || command?.status === 'awaiting_confirmation' || command?.status === 'failed') && (
            <div className="aurora-command-detail">{detailText}</div>
          )}
          {linkedChanges.map(change => (
            <div key={change.id} className="aurora-inline-approval">
              <div className="aurora-inline-approval-head">
                <strong>Proposed change · {change.path}</strong>
                <span>{change.kind}</span>
              </div>
              {diffs[change.id] !== undefined ? (
                <DiffTable diffText={diffs[change.id]} />
              ) : (
                <button type="button" className="aurora-btn-ghost" onClick={() => onLoadDiff(change.id)}>
                  Review diff
                </button>
              )}
              <div className="aurora-inline-approval-actions">
                <button
                  type="button"
                  className="aurora-btn-secondary"
                  disabled={actionBusy}
                  onClick={() => onRejectChange(change.id)}
                >
                  Reject
                </button>
                <button
                  type="button"
                  className="aurora-btn-primary"
                  disabled={actionBusy}
                  onClick={() => onApproveChange(change.id)}
                >
                  Approve
                </button>
              </div>
            </div>
          ))}
        </div>
      </article>
    )
  }
  return (
    <article className="aurora-message aurora-message-assistant">
      <span className="aurora-mico-avatar">
        <MicoAvatar state="default" size={32} reducedMotion={reduced} label="Assistant avatar" />
      </span>
      <div className="aurora-message-content">
        <strong>Mico</strong>
        <AssistantBubble text={item.text} animateReveal={animateReveal} reduced={reduced} theme={theme} />
        <AppliedChangesCard changes={appliedChanges} reduced={reduced} />
        <time>{formatTime(item.createdAt)}</time>
      </div>
    </article>
  )
}

function MessageComposer({
  project,
  chatStatus,
  chatTransport,
  bridgePaired,
  busy,
  draft,
  onDraft,
  onSend,
  onProjectOpen,
}: {
  project: AuroraProject | null
  chatStatus: ChatStatus | null
  chatTransport: 'mcp' | 'api'
  bridgePaired: boolean
  busy: boolean
  draft: string
  onDraft: (value: string) => void
  onSend: (text: string) => Promise<boolean>
  onProjectOpen: () => void
}) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const modeReady = chatTransport === 'mcp' ? bridgePaired : Boolean(chatStatus?.configured)
  const canSend = Boolean(project && modeReady && draft.trim() && !busy)
  const expanded = draft.includes('\n') || draft.length > 72

  useEffect(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = '24px'
    if (draft) el.style.height = `${Math.min(el.scrollHeight, 144)}px`
  }, [draft])

  async function submit() {
    const text = draft.trim()
    if (!project || !modeReady || !text || busy) return
    const ok = await onSend(text)
    if (ok) {
      onDraft('')
      if (textareaRef.current) textareaRef.current.style.height = '24px'
    }
  }

  return (
    <div className="aurora-composer-wrap">
      <div className="aurora-composer" data-expanded={expanded ? 'true' : 'false'}>
        <button
          type="button"
          className="aurora-composer-project"
          aria-label="Choose project"
          title={project ? `Project: ${project.name}` : 'Choose project'}
          onClick={onProjectOpen}
        >
          <Folder size={15} />
        </button>
        <textarea
          ref={textareaRef}
          rows={1}
          maxLength={6000}
          value={draft}
          disabled={busy}
          aria-label="Message to Mico"
          placeholder={project ? 'Message Mico…' : 'Select a project to start…'}
          onChange={event => onDraft(event.target.value)}
          onKeyDown={event => {
            if (event.key === 'Enter' && !event.shiftKey) {
              event.preventDefault()
              if (canSend) void submit()
            }
          }}
        />
        <button
          type="button"
          className="aurora-composer-send"
          aria-label={canSend ? 'Send message' : (chatTransport === 'mcp' ? 'Connect ChatGPT widget to send' : 'Configure an AI provider key in Settings')}
          title={canSend ? 'Send message' : (chatTransport === 'mcp' ? 'Connect ChatGPT widget to send' : 'Configure an AI provider key in Settings')}
          disabled={!canSend}
          onClick={() => void submit()}
        >
          <ArrowUp size={16} strokeWidth={2.2} />
        </button>
      </div>
    </div>
  )
}

export function ConversationView({
  project,
  messages,
  chatStatus,
  chatTransport,
  micoBridge,
  pendingChanges,
  approvedChanges,
  diffs,
  actionBusy,
  busy,
  loading,
  historyLoading,
  error,
  reduced,
  theme,
  draft,
  savedScrollTop,
  onSaveScrollTop,
  onDraft,
  onSend,
  onCreateMicoPairing,
  onRevokeMicoPairing,
  onOpenProviders,
  onLoadDiff,
  onApproveChange,
  onRejectChange,
  onRetry,
  onProjectOpen,
  onAddProject,
}: {
  project: AuroraProject | null
  messages: AuroraMessage[]
  chatStatus: ChatStatus | null
  chatTransport: 'mcp' | 'api'
  micoBridge: MicoBridgeStatus | null
  pendingChanges: AuroraChange[]
  approvedChanges: AuroraChange[]
  diffs: Record<number, string>
  actionBusy: boolean
  busy: boolean
  loading: boolean
  historyLoading: boolean
  error: string | null
  reduced: boolean
  theme: 'dark' | 'light'
  draft: string
  savedScrollTop: number | null
  onSaveScrollTop: (projectId: number, scrollTop: number, nearBottom: boolean) => void
  onDraft: (value: string) => void
  onSend: (text: string) => Promise<boolean>
  onCreateMicoPairing: () => void
  onRevokeMicoPairing: () => void
  onOpenProviders: () => void
  onLoadDiff: (changeId: number) => void
  onApproveChange: (changeId: number) => void
  onRejectChange: (changeId: number) => void
  onRetry: () => void
  onProjectOpen: () => void
  onAddProject: () => void
}) {
  const scroller = useRef<HTMLElement>(null)
  const end = useRef<HTMLDivElement>(null)
  const prevCountRef = useRef(messages.length)
  const prevProjectIdRef = useRef<number | null>(project?.id ?? null)
  const pendingInitialScrollRef = useRef<number | null>(null)
  const isNearBottomRef = useRef(true)
  const [showScrollBtn, setShowScrollBtn] = useState(false)
  const historyAssistantIdsRef = useRef<Set<number>>(new Set())
  const historyInitializedForRef = useRef<number | null>(null)
  const [codeCopied, setCodeCopied] = useState(false)
  const [nowMs, setNowMs] = useState(() => Date.now())
  const pairing = micoBridge?.pairing ?? null
  const bridgePaired = pairing?.status === 'paired'
  const commandById = new Map((micoBridge?.commands ?? []).map(cmd => [cmd.id, cmd]))
  const hasWaitingBridge = (micoBridge?.commands ?? []).some(
    cmd => cmd.pairing_id !== null && (cmd.status === 'waiting' || cmd.status === 'dispatched')
  )
  useEffect(() => {
    if (!hasWaitingBridge) return
    setNowMs(Date.now())
    const timer = window.setInterval(() => setNowMs(Date.now()), 2000)
    return () => window.clearInterval(timer)
  }, [hasWaitingBridge])

  const pid = project?.id ?? null
  if (pid !== historyInitializedForRef.current) {
    if (!historyLoading) {
      historyInitializedForRef.current = pid
      historyAssistantIdsRef.current = new Set(
        messages.filter(m => m.role === 'assistant').map(m => m.id)
      )
    }
  }

  const answeredCommandIds = new Set(
    messages.filter(m => m.role === 'assistant' && m.commandId).map(m => m.commandId!)
  )
  const activeWorkingCommand =
    (micoBridge?.commands ?? []).find(
      cmd =>
        (cmd.status === 'queued' || cmd.status === 'dispatched' || cmd.status === 'waiting') &&
        !answeredCommandIds.has(cmd.id) &&
        !isBridgeWaitTimedOut(cmd, nowMs)
    ) ?? null

  function copyPairingCode(code: string) {
    void navigator.clipboard?.writeText(code).then(() => {
      setCodeCopied(true)
      window.setTimeout(() => setCodeCopied(false), 1600)
    }).catch(() => {})
  }

  useLayoutEffect(() => {
    const el = scroller.current
    if (!el) return
    const scrollToEndNow = () => {
      el.scrollTop = el.scrollHeight
      isNearBottomRef.current = true
      setShowScrollBtn(false)
    }

    if (pid !== prevProjectIdRef.current) {
      prevProjectIdRef.current = pid
      prevCountRef.current = messages.length
      if (savedScrollTop !== null) {
        pendingInitialScrollRef.current = null
        el.scrollTop = savedScrollTop
        const near = el.scrollHeight - el.scrollTop - el.clientHeight < 96
        isNearBottomRef.current = near
        setShowScrollBtn(!near && el.scrollHeight - el.clientHeight > 120)
      } else if (messages.length > 0) {
        pendingInitialScrollRef.current = null
        scrollToEndNow()
        requestAnimationFrame(scrollToEndNow)
      } else {
        pendingInitialScrollRef.current = pid
      }
      return
    }

    if (pendingInitialScrollRef.current !== null && pendingInitialScrollRef.current === pid && messages.length > 0) {
      pendingInitialScrollRef.current = null
      scrollToEndNow()
      requestAnimationFrame(scrollToEndNow)
      prevCountRef.current = messages.length
      return
    }

    if (messages.length > prevCountRef.current && isNearBottomRef.current) {
      scrollToEndNow()
      requestAnimationFrame(scrollToEndNow)
    }
    prevCountRef.current = messages.length
  }, [messages.length, pid, savedScrollTop])

  // Also ensure on initial mount when messages are already cached, we land immediately at bottom.
  useLayoutEffect(() => {
    const el = scroller.current
    if (!el || savedScrollTop !== null || messages.length === 0) return
    el.scrollTop = el.scrollHeight
    isNearBottomRef.current = true
    setShowScrollBtn(false)
    const raf = requestAnimationFrame(() => {
      if (scroller.current && savedScrollTop === null) {
        scroller.current.scrollTop = scroller.current.scrollHeight
      }
    })
    return () => cancelAnimationFrame(raf)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function scrollToBottom() {
    const el = scroller.current
    isNearBottomRef.current = true
    setShowScrollBtn(false)
    if (project) onSaveScrollTop(project.id, 0, true)
    if (el) {
      el.scrollTo({ top: el.scrollHeight, behavior: reduced ? 'instant' : 'smooth' })
    }
  }

  return (
    <div className="aurora-conversation-view" data-theme={theme}>
      <section
        ref={scroller}
        className="aurora-thread-scroll"
        aria-label="Project chat history"
        onScroll={event => {
          const el = event.currentTarget
          const distFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight
          const near = distFromBottom < 96
          isNearBottomRef.current = near
          setShowScrollBtn(distFromBottom > 120 && messages.length > 0)
          if (project) onSaveScrollTop(project.id, el.scrollTop, near)
        }}
      >
        {error ? (
          <div className="aurora-empty" role="alert">
            <h2>Local data unavailable</h2>
            <p>{error}</p>
            <button type="button" className="aurora-panel-link" onClick={onRetry}>
              Retry
            </button>
          </div>
        ) : loading ? (
          <div className="aurora-empty">
            <p>Loading workspace…</p>
          </div>
        ) : !project ? (
          <div className="aurora-empty">
            <MicoAvatar state="default" size={98} reducedMotion={reduced} label="Mico avatar" />
            <h2>Choose a project</h2>
            <p>Select a local repository from the sidebar or add a project folder.</p>
            <button type="button" className="aurora-panel-link" onClick={onAddProject}>
              Add project folder
            </button>
          </div>
        ) : historyLoading && messages.length === 0 ? (
          <div className="aurora-empty">
            <p>Loading conversation…</p>
          </div>
        ) : messages.length === 0 ? (
          <div className="aurora-empty aurora-empty-welcome">
            <MicoAvatar state={busy ? 'working' : 'default'} size={98} reducedMotion={reduced} label="Mico avatar" />
            <h2>Hi, I’m Mico</h2>
          </div>
        ) : (
          <div className="aurora-thread">
            {messages.map(item => (
              <Message
                key={item.id}
                item={item}
                reduced={reduced}
                theme={theme}
                animateReveal={
                  item.role === 'assistant' &&
                  historyInitializedForRef.current === pid &&
                  !historyAssistantIdsRef.current.has(item.id)
                }
                command={item.commandId ? (commandById.get(item.commandId) ?? null) : null}
                nowMs={nowMs}
                linkedChanges={item.commandId ? pendingChanges.filter(c => c.commandId === item.commandId) : []}
                appliedChanges={item.role === 'assistant' && item.commandId ? approvedChanges.filter(c => c.commandId === item.commandId) : []}
                diffs={diffs}
                actionBusy={actionBusy}
                onLoadDiff={onLoadDiff}
                onApproveChange={onApproveChange}
                onRejectChange={onRejectChange}
              />
            ))}
            {activeWorkingCommand && (
              <article className="aurora-message aurora-message-assistant aurora-message-working" aria-live="polite">
                <span className="aurora-mico-avatar">
                  <MicoAvatar state="working" size={32} reducedMotion={reduced} label="Mico working" />
                </span>
                <div className="aurora-message-content">
                  <strong>Mico</strong>
                  <div className="aurora-working-indicator">
                    <ThinkingOrb
                      state="working"
                      size={20}
                      theme={theme}
                      speed={reduced ? 0 : 0.9}
                      paused={reduced}
                      color={theme === 'dark' ? '#93c5fd' : '#2563eb'}
                      aria-label="Mico is working"
                    />
                    <span>Mico is working…</span>
                  </div>
                </div>
              </article>
            )}
            <div ref={end} />
          </div>
        )}
      </section>
      <AnimatePresence>
        {showScrollBtn && (
          <motion.button
            type="button"
            className="aurora-scroll-bottom-btn"
            aria-label="Scroll to bottom"
            title="Scroll to bottom"
            onClick={scrollToBottom}
            initial={reduced ? false : { opacity: 0, y: 8, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduced ? undefined : { opacity: 0, y: 6, scale: 0.9 }}
            transition={reduced ? { duration: 0 } : { type: 'spring', stiffness: 460, damping: 32 }}
          >
            <ArrowDown size={16} />
          </motion.button>
        )}
      </AnimatePresence>
      {project && (
        <div className="aurora-bridge-bar">
          <AnimatePresence mode="wait" initial={false}>
            {chatTransport === 'mcp' ? (
              <motion.div
                key="bridge-mcp"
                className="aurora-bridge-inner"
                initial={reduced ? false : { opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={reduced ? undefined : { opacity: 0, y: -4 }}
                transition={{ duration: reduced ? 0 : 0.16, ease: [0.22, 1, 0.36, 1] }}
              >
                <div className="aurora-bridge-copy">
                  <Link2 size={14} />
                  {bridgePaired ? (
                    <span>
                      Connected to <strong>chatgpt.com</strong> · project <strong>{project.name}</strong>
                    </span>
                  ) : pairing?.status === 'pending' ? (
                    <span>
                      Pairing code: <code className="aurora-bridge-code">{pairing.code}</code> · enter in the &ldquo;Connect to Mico&rdquo; widget on chatgpt.com
                    </span>
                  ) : (
                    <span>Connect a regular chatgpt.com chat via the &ldquo;Connect to Mico&rdquo; widget</span>
                  )}
                </div>
                <div className="aurora-bridge-actions">
                  {pairing?.status === 'pending' && (
                    <button
                      type="button"
                      className="aurora-btn-ghost"
                      onClick={() => copyPairingCode(pairing.code)}
                    >
                      {codeCopied ? <Check size={13} /> : <Copy size={13} />}
                      <span>{codeCopied ? 'Copied' : 'Copy code'}</span>
                    </button>
                  )}
                  <button
                    type="button"
                    className="aurora-btn-secondary"
                    disabled={actionBusy}
                    onClick={onCreateMicoPairing}
                  >
                    {bridgePaired || pairing?.status === 'pending' ? 'New code' : 'Connect ChatGPT'}
                  </button>
                  {(bridgePaired || pairing?.status === 'pending') && (
                    <button
                      type="button"
                      className="aurora-btn-ghost"
                      disabled={actionBusy}
                      onClick={onRevokeMicoPairing}
                    >
                      Disconnect
                    </button>
                  )}
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="bridge-api"
                className="aurora-bridge-inner"
                initial={reduced ? false : { opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={reduced ? undefined : { opacity: 0, y: -4 }}
                transition={{ duration: reduced ? 0 : 0.16, ease: [0.22, 1, 0.36, 1] }}
              >
                <div className="aurora-bridge-copy">
                  <KeyRound size={14} />
                  {chatStatus?.configured ? (
                    <span>
                      External API · <strong>{chatStatus.provider}</strong> ({chatStatus.model})
                    </span>
                  ) : (
                    <span>External API mode · add an OpenAI, Anthropic, or xAI key to chat directly</span>
                  )}
                </div>
                <div className="aurora-bridge-actions">
                  <button
                    type="button"
                    className={chatStatus?.configured ? 'aurora-btn-ghost' : 'aurora-btn-secondary'}
                    onClick={onOpenProviders}
                  >
                    {chatStatus?.configured ? 'Manage keys' : 'Set up API key'}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
      <MessageComposer
        project={project}
        chatStatus={chatStatus}
        chatTransport={chatTransport}
        bridgePaired={bridgePaired}
        busy={busy}
        draft={draft}
        onDraft={onDraft}
        onSend={onSend}
        onProjectOpen={onProjectOpen}
      />
    </div>
  )
}
