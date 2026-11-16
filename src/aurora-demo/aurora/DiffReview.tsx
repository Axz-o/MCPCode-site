import { useState } from 'react'
import { Check, ChevronDown, ChevronRight, FilePenLine, X } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import type { AuroraChange } from './data'

export interface DiffLine {
  type: 'add' | 'del' | 'ctx' | 'hunk' | 'meta'
  oldNum: number | null
  newNum: number | null
  text: string
}

export function parseUnifiedDiff(raw: string): { lines: DiffLine[]; additions: number; deletions: number } {
  const lines: DiffLine[] = []
  let oldLine = 0
  let newLine = 0
  let additions = 0
  let deletions = 0

  for (const rawLine of raw.split(/\r?\n/)) {
    if (rawLine.startsWith('@@')) {
      const m = rawLine.match(/^@@ -(\d+)(?:,\d+)? \+(\d+)(?:,\d+)? @@/)
      if (m) {
        oldLine = Number.parseInt(m[1], 10)
        newLine = Number.parseInt(m[2], 10)
      }
      lines.push({ type: 'hunk', oldNum: null, newNum: null, text: rawLine })
    } else if (rawLine.startsWith('--- ') || rawLine.startsWith('+++ ') || rawLine.startsWith('diff ') || rawLine.startsWith('index ')) {
      lines.push({ type: 'meta', oldNum: null, newNum: null, text: rawLine })
    } else if (rawLine.startsWith('+')) {
      additions += 1
      lines.push({ type: 'add', oldNum: null, newNum: newLine++, text: rawLine.slice(1) })
    } else if (rawLine.startsWith('-')) {
      deletions += 1
      lines.push({ type: 'del', oldNum: oldLine++, newNum: null, text: rawLine.slice(1) })
    } else if (rawLine.length > 0 || lines.length > 0) {
      const text = rawLine.startsWith(' ') ? rawLine.slice(1) : rawLine
      lines.push({ type: 'ctx', oldNum: oldLine > 0 ? oldLine++ : null, newNum: newLine > 0 ? newLine++ : null, text })
    }
  }

  return { lines, additions, deletions }
}

export function DiffTable({ diffText }: { diffText: string }) {
  const { lines } = parseUnifiedDiff(diffText)
  if (!diffText.trim()) {
    return <div className="aurora-diff-empty">(no text diff)</div>
  }
  return (
    <div className="aurora-diff-table" role="region" aria-label="File diff">
      {lines.map((line, index) => (
        <div key={index} className={`aurora-diff-row is-${line.type}`}>
          <span className="aurora-diff-ln">{line.oldNum ?? ''}</span>
          <span className="aurora-diff-ln">{line.newNum ?? ''}</span>
          <span className="aurora-diff-sign">
            {line.type === 'add' ? '+' : line.type === 'del' ? '-' : ''}
          </span>
          <code className="aurora-diff-code">{line.text || ' '}</code>
        </div>
      ))}
    </div>
  )
}

export function DiffReviewList({
  changes,
  diffs,
  actionBusy,
  reduced,
  onLoadDiff,
  onApprove,
  onReject,
}: {
  changes: AuroraChange[]
  diffs: Record<number, string>
  actionBusy: boolean
  reduced: boolean
  onLoadDiff: (id: number) => void
  onApprove: (id: number) => void
  onReject: (id: number) => void
}) {
  const [collapsed, setCollapsed] = useState<Record<number, boolean>>({})
  const reviewedCount = changes.filter(c => diffs[c.id] !== undefined).length
  const progressPct = changes.length > 0 ? Math.round((reviewedCount / changes.length) * 100) : 0

  return (
    <div className="aurora-diff-review">
      <div className="aurora-diff-review-bar">
        <div className="aurora-diff-review-stats">
          <span>{changes.length} {changes.length === 1 ? 'file' : 'files'} awaiting review</span>
          <span>{reviewedCount} of {changes.length} loaded</span>
        </div>
        <div className="aurora-diff-progress-track" aria-hidden="true">
          <motion.div
            className="aurora-diff-progress-fill"
            initial={false}
            animate={{ width: `${progressPct}%` }}
            transition={reduced ? { duration: 0 } : { type: 'spring', stiffness: 360, damping: 36 }}
          />
        </div>
      </div>

      <AnimatePresence initial={false}>
        {changes.map(change => {
          const diffText = diffs[change.id]
          const isOpen = !collapsed[change.id]
          const stats = diffText !== undefined ? parseUnifiedDiff(diffText) : null
          return (
            <motion.div
              key={change.id}
              layout={!reduced}
              initial={reduced ? false : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduced ? undefined : { opacity: 0, height: 0, marginBottom: 0 }}
              transition={reduced ? { duration: 0 } : { duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
              className="aurora-diff-card"
            >
              <div className="aurora-diff-card-head">
                <button
                  type="button"
                  className="aurora-diff-card-toggle"
                  onClick={() => setCollapsed(prev => ({ ...prev, [change.id]: isOpen }))}
                  aria-expanded={isOpen}
                >
                  {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                  <FilePenLine size={14} />
                  <strong>{change.path}</strong>
                  <span className="aurora-diff-kind">{change.kind}</span>
                </button>
                {stats && (
                  <div className="aurora-diff-counts">
                    <span className="is-add">+{stats.additions}</span>
                    <span className="is-del">-{stats.deletions}</span>
                  </div>
                )}
              </div>

              {isOpen && (
                <div className="aurora-diff-card-body">
                  {diffText !== undefined && <DiffTable diffText={diffText} />}
                  <div className="aurora-diff-card-actions">
                    <button
                      type="button"
                      className="aurora-btn-secondary"
                      disabled={actionBusy}
                      onClick={() => onLoadDiff(change.id)}
                    >
                      {diffText !== undefined ? 'Refresh diff' : 'Review diff'}
                    </button>
                    <button
                      type="button"
                      className="aurora-btn-secondary"
                      disabled={actionBusy}
                      onClick={() => onReject(change.id)}
                    >
                      <X size={13} />
                      <span>Reject</span>
                    </button>
                    <button
                      type="button"
                      className="aurora-btn-primary"
                      disabled={actionBusy || diffText === undefined}
                      title={diffText === undefined ? 'Review diff before approving' : 'Apply change to disk'}
                      onClick={() => onApprove(change.id)}
                    >
                      <Check size={13} />
                      <span>Approve</span>
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          )
        })}
      </AnimatePresence>
    </div>
  )
}
