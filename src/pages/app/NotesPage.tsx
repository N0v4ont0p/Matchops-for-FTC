import { useState, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { StickyNote, PlusCircle, Pin, XCircle, Tag } from 'lucide-react'
import { useWorkspace } from '@/contexts/WorkspaceContext'
import { subscribeToNotes, addNote, updateNote, deleteNote } from '@/services/firestore'
import type { TeamNote } from '@/types'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import Modal from '@/components/ui/Modal'
import Input from '@/components/ui/Input'
import Textarea from '@/components/ui/Textarea'
import { SkeletonCard } from '@/components/ui/Skeleton'
import { formatRelative } from '@/utils/format'

function NoteModal({
  open,
  onClose,
  onSubmit,
  initial,
}: {
  open: boolean
  onClose: () => void
  onSubmit: (v: { title: string; content: string; tags: string[]; pinned: boolean }) => Promise<void>
  initial?: TeamNote
}) {
  const { t } = useTranslation()
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [tagsRaw, setTagsRaw] = useState('')
  const [pinned, setPinned] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (open && initial) {
      setTitle(initial.title)
      setContent(initial.content)
      setTagsRaw(initial.tags.join(', '))
      setPinned(initial.pinned)
    } else if (open) {
      setTitle('')
      setContent('')
      setTagsRaw('')
      setPinned(false)
    }
  }, [open, initial])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) return
    setSaving(true)
    const tags = tagsRaw.split(',').map((t) => t.trim()).filter(Boolean)
    try { await onSubmit({ title, content, tags, pinned }) } finally { setSaving(false) }
    onClose()
  }

  return (
    <Modal open={open} onClose={onClose} title={initial ? t('notes.editNote') : t('notes.newNote')}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-ink-secondary mb-1">{t('notes.noteTitle')}</label>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder={t('notes.noteTitlePlaceholder')} />
        </div>
        <div>
          <label className="block text-xs font-medium text-ink-secondary mb-1">{t('notes.content')}</label>
          <Textarea value={content} onChange={(e) => setContent(e.target.value)} rows={5} placeholder={t('notes.contentPlaceholder')} />
        </div>
        <div>
          <label className="block text-xs font-medium text-ink-secondary mb-1">{t('notes.tags')}</label>
          <Input value={tagsRaw} onChange={(e) => setTagsRaw(e.target.value)} placeholder={t('notes.tagsPlaceholder')} />
          <p className="text-xs text-ink-muted mt-1">{t('notes.tagsHint')}</p>
        </div>
        <label className="flex items-center gap-2 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={pinned}
            onChange={(e) => setPinned(e.target.checked)}
            className="rounded border-surface-border bg-surface-2"
          />
          <span className="text-sm text-ink-secondary">{t('notes.pinNote')}</span>
        </label>
        <div className="flex gap-3 pt-2">
          <Button type="submit" loading={saving} className="flex-1">{t('common.save')}</Button>
          <Button type="button" variant="ghost" onClick={onClose}>{t('common.cancel')}</Button>
        </div>
      </form>
    </Modal>
  )
}

export default function NotesPage() {
  const { t } = useTranslation()
  const { workspace } = useWorkspace()
  const [notes, setNotes] = useState<TeamNote[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingNote, setEditingNote] = useState<TeamNote | null>(null)
  const [tagFilter, setTagFilter] = useState<string | null>(null)

  useEffect(() => {
    if (!workspace) return
    const unsub = subscribeToNotes(workspace.teamId, (data) => {
      setNotes(data)
      setLoading(false)
    })
    return unsub
  }, [workspace])

  const allTags = Array.from(new Set(notes.flatMap((n) => n.tags)))

  const filtered = notes
    .filter((n) => !tagFilter || n.tags.includes(tagFilter))
    .sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0))

  const handleCreate = useCallback(
    async (v: { title: string; content: string; tags: string[]; pinned: boolean }) => {
      if (!workspace) return
      await addNote(workspace.teamId, { ...v, category: 'general', authorName: '', authorUid: '' })
    },
    [workspace],
  )

  const handleEdit = useCallback(
    async (v: { title: string; content: string; tags: string[]; pinned: boolean }) => {
      if (!workspace || !editingNote) return
      await updateNote(workspace.teamId, editingNote.id!, { ...v })
    },
    [workspace, editingNote],
  )

  const handleTogglePin = useCallback(
    async (note: TeamNote) => {
      if (!workspace) return
      await updateNote(workspace.teamId, note.id!, { pinned: !note.pinned })
    },
    [workspace],
  )

  const handleDelete = useCallback(
    async (id: string) => {
      if (!workspace) return
      await deleteNote(workspace.teamId, id)
    },
    [workspace],
  )

  if (loading) {
    return (
      <div className="p-6 space-y-3 max-w-3xl mx-auto">
        {[1, 2, 3].map((i) => <SkeletonCard key={i} />)}
      </div>
    )
  }

  return (
    <div className="p-6 max-w-3xl mx-auto animate-fade-in">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <StickyNote size={20} className="text-accent" />
          <h1 className="text-xl font-bold text-ink">{t('notes.title')}</h1>
        </div>
        <Button
          size="sm"
          icon={<PlusCircle size={14} />}
          onClick={() => { setEditingNote(null); setModalOpen(true) }}
        >
          {t('notes.newNote')}
        </Button>
      </div>

      {allTags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-5">
          <button
            onClick={() => setTagFilter(null)}
            className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
              !tagFilter
                ? 'bg-accent text-white border-accent'
                : 'border-surface-border text-ink-secondary hover:border-accent hover:text-accent'
            }`}
          >
            {t('notes.allTags')}
          </button>
          {allTags.map((tag) => (
            <button
              key={tag}
              onClick={() => setTagFilter(tag === tagFilter ? null : tag)}
              className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                tagFilter === tag
                  ? 'bg-accent text-white border-accent'
                  : 'border-surface-border text-ink-secondary hover:border-accent hover:text-accent'
              }`}
            >
              {tag}
            </button>
          ))}
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="text-center py-16">
          <StickyNote size={32} className="text-ink-muted mx-auto mb-3" />
          <p className="text-sm text-ink-secondary">{t('notes.noNotes')}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((note) => (
            <div
              key={note.id}
              className="card hover:border-surface-hover transition-colors cursor-pointer"
              onClick={() => { setEditingNote(note); setModalOpen(true) }}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  {note.pinned && <Pin size={13} className="text-accent shrink-0" />}
                  <span className="font-semibold text-ink">{note.title}</span>
                </div>
                <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={() => handleTogglePin(note)}
                    className={`p-1.5 rounded transition-colors ${note.pinned ? 'text-accent' : 'text-ink-muted hover:text-accent'} hover:bg-surface-3`}
                  >
                    <Pin size={13} />
                  </button>
                  <button
                    onClick={() => handleDelete(note.id!)}
                    className="p-1.5 rounded text-ink-muted hover:text-status-error hover:bg-surface-3 transition-colors"
                  >
                    <XCircle size={13} />
                  </button>
                </div>
              </div>

              {note.content && (
                <p className="text-sm text-ink-secondary line-clamp-3 mb-3">{note.content}</p>
              )}

              <div className="flex items-center justify-between">
                {note.tags.length > 0 ? (
                  <div className="flex flex-wrap gap-1">
                    {note.tags.map((tag) => (
                      <span key={tag} className="inline-flex items-center gap-1 text-xs text-ink-muted">
                        <Tag size={10} /> {tag}
                      </span>
                    ))}
                  </div>
                ) : <span />}
                <span className="text-xs text-ink-muted">{formatRelative(note.updatedAt)}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      <NoteModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={editingNote ? handleEdit : handleCreate}
        initial={editingNote ?? undefined}
      />
    </div>
  )
}
