import { useState, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { PlusCircle, Wrench, CheckCircle2, Clock, AlertTriangle, XCircle } from 'lucide-react'
import { useWorkspace } from '@/contexts/WorkspaceContext'
import {
  subscribeToPitIssues,
  addPitIssue,
  updatePitIssue,
  deletePitIssue,
} from '@/services/firestore'
import type { PitIssue } from '@/types'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import Modal from '@/components/ui/Modal'
import Input from '@/components/ui/Input'
import Textarea from '@/components/ui/Textarea'
import Select from '@/components/ui/Select'
import { SkeletonCard } from '@/components/ui/Skeleton'

const PRIORITY_OPTIONS = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'critical', label: 'Critical' },
]

const STATUS_OPTIONS = [
  { value: 'open', label: 'Open' },
  { value: 'in-progress', label: 'In Progress' },
  { value: 'resolved', label: 'Resolved' },
]

function priorityVariant(p: PitIssue['priority']): 'danger' | 'warning' | 'red' | 'muted' {
  if (p === 'critical') return 'danger'
  if (p === 'high') return 'red'
  if (p === 'medium') return 'warning'
  return 'muted'
}

function statusIcon(s: PitIssue['status']) {
  if (s === 'resolved') return <CheckCircle2 size={14} className="text-status-ok" />
  if (s === 'in-progress') return <Clock size={14} className="text-status-warn" />
  return <AlertTriangle size={14} className="text-status-error" />
}

interface IssueFormState {
  title: string
  description: string
  priority: PitIssue['priority']
}

function IssueModal({
  open,
  onClose,
  onSubmit,
  initial,
}: {
  open: boolean
  onClose: () => void
  onSubmit: (v: IssueFormState) => Promise<void>
  initial?: IssueFormState
}) {
  const { t } = useTranslation()
  const [form, setForm] = useState<IssueFormState>(initial ?? { title: '', description: '', priority: 'medium' })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (open) setForm(initial ?? { title: '', description: '', priority: 'medium' })
  }, [open, initial])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.title.trim()) return
    setSaving(true)
    try { await onSubmit(form) } finally { setSaving(false) }
    onClose()
  }

  return (
    <Modal open={open} onClose={onClose} title={t('pit.newIssue')}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-ink-secondary mb-1">{t('pit.issueTitle')}</label>
          <Input
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            placeholder={t('pit.issueTitlePlaceholder')}
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-ink-secondary mb-1">{t('pit.issueDescription')}</label>
          <Textarea
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            rows={3}
            placeholder={t('pit.issueDescriptionPlaceholder')}
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-ink-secondary mb-1">{t('pit.priority')}</label>
          <Select
            value={form.priority}
            onChange={(e) => setForm((f) => ({ ...f, priority: e.target.value as PitIssue['priority'] }))}
            options={PRIORITY_OPTIONS}
          />
        </div>
        <div className="flex gap-3 pt-2">
          <Button type="submit" loading={saving} className="flex-1">{t('common.save')}</Button>
          <Button type="button" variant="ghost" onClick={onClose}>{t('common.cancel')}</Button>
        </div>
      </form>
    </Modal>
  )
}

export default function PitPage() {
  const { t } = useTranslation()
  const { workspace } = useWorkspace()
  const [issues, setIssues] = useState<PitIssue[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingIssue, setEditingIssue] = useState<PitIssue | null>(null)

  useEffect(() => {
    if (!workspace) return
    const unsub = subscribeToPitIssues(workspace.teamId, (data) => {
      setIssues(data)
      setLoading(false)
    })
    return unsub
  }, [workspace])

  const handleCreate = useCallback(
    async (form: IssueFormState) => {
      if (!workspace) return
      await addPitIssue(workspace.teamId, {
        title: form.title,
        description: form.description,
        priority: form.priority,
        status: 'open',
        assignedTo: '',
        createdBy: '',
        createdByUid: '',
      })
    },
    [workspace],
  )

  const handleEdit = useCallback(
    async (form: IssueFormState) => {
      if (!workspace || !editingIssue) return
      await updatePitIssue(workspace.teamId, editingIssue.id!, {
        title: form.title,
        description: form.description,
        priority: form.priority,
        updatedAt: new Date().toISOString(),
      })
    },
    [workspace, editingIssue],
  )

  const toggleStatus = useCallback(
    async (issue: PitIssue) => {
      if (!workspace) return
      const next: PitIssue['status'] =
        issue.status === 'open' ? 'in-progress' : issue.status === 'in-progress' ? 'resolved' : 'open'
      await updatePitIssue(workspace.teamId, issue.id!, { status: next })
    },
    [workspace],
  )

  const handleDelete = useCallback(
    async (id: string) => {
      if (!workspace) return
      await deletePitIssue(workspace.teamId, id)
    },
    [workspace],
  )

  const open = issues.filter((i) => i.status !== 'resolved')
  const resolved = issues.filter((i) => i.status === 'resolved')

  if (loading) {
    return (
      <div className="p-6 space-y-3 max-w-3xl mx-auto">
        {[1, 2, 3].map((i) => <SkeletonCard key={i} />)}
      </div>
    )
  }

  return (
    <div className="p-6 max-w-3xl mx-auto animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Wrench size={20} className="text-accent" />
          <h1 className="text-xl font-bold text-ink">{t('pit.title')}</h1>
          {open.length > 0 && (
            <Badge variant="red">{open.length} {t('pit.open')}</Badge>
          )}
        </div>
        <Button
          size="sm"
          icon={<PlusCircle size={14} />}
          onClick={() => { setEditingIssue(null); setModalOpen(true) }}
        >
          {t('pit.newIssue')}
        </Button>
      </div>

      {open.length === 0 && resolved.length === 0 ? (
        <div className="text-center py-16">
          <Wrench size={32} className="text-ink-muted mx-auto mb-3" />
          <p className="text-sm text-ink-secondary">{t('pit.noIssues')}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {open.map((issue) => (
            <div key={issue.id} className="card hover:border-surface-hover transition-colors">
              <div className="flex items-start gap-3">
                <button
                  onClick={() => toggleStatus(issue)}
                  className="mt-0.5 p-1 rounded hover:bg-surface-3 transition-colors text-ink-muted"
                  title={t('pit.cycleStatus')}
                >
                  {statusIcon(issue.status)}
                </button>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-ink truncate">{issue.title}</span>
                    <Badge variant={priorityVariant(issue.priority)} className="shrink-0">{issue.priority}</Badge>
                  </div>
                  {issue.description && (
                    <p className="text-sm text-ink-secondary">{issue.description}</p>
                  )}
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => { setEditingIssue(issue); setModalOpen(true) }}
                    className="p-1.5 rounded text-ink-muted hover:text-ink hover:bg-surface-3 transition-colors"
                  >
                    <Wrench size={13} />
                  </button>
                  <button
                    onClick={() => handleDelete(issue.id!)}
                    className="p-1.5 rounded text-ink-muted hover:text-status-error hover:bg-surface-3 transition-colors"
                  >
                    <XCircle size={13} />
                  </button>
                </div>
              </div>
            </div>
          ))}

          {resolved.length > 0 && (
            <div className="border-t border-surface-border pt-4 mt-6">
              <p className="text-xs font-semibold text-ink-muted uppercase tracking-wide mb-3">
                {t('pit.resolved')} ({resolved.length})
              </p>
              {resolved.map((issue) => (
                <div key={issue.id} className="card opacity-50 mb-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 size={14} className="text-status-ok shrink-0" />
                    <span className="text-sm text-ink-secondary line-through">{issue.title}</span>
                    <button
                      onClick={() => toggleStatus(issue)}
                      className="ml-auto text-xs text-accent hover:underline"
                    >
                      {t('pit.reopen')}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <IssueModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={editingIssue ? handleEdit : handleCreate}
        initial={editingIssue ? { title: editingIssue.title, description: editingIssue.description, priority: editingIssue.priority } : undefined}
      />
    </div>
  )
}
