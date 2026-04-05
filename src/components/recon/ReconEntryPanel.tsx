import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Plus, Edit2, Trash2, ChevronDown, ChevronUp, Check } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useWorkspace } from '@/contexts/WorkspaceContext'
import {
  addReconEntry,
  updateReconEntry,
  deleteReconEntry,
} from '@/services/firestore'
import type { ReconEntry, AllianceColor } from '@/types'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import Textarea from '@/components/ui/Textarea'
import Badge from '@/components/ui/Badge'
import Modal from '@/components/ui/Modal'

interface Props {
  entries: ReconEntry[]
  seasonYear: number
  eventCode: string
  matchId: number
  matchLabel: string
}

const emptyEntry = (): Omit<ReconEntry, 'id' | 'createdAt' | 'updatedAt' | 'scouterUid' | 'scouterName' | 'season' | 'eventCode' | 'matchId' | 'matchLabel'> => ({
  teamNumber: 0,
  allianceColor: 'Red',
  autoLeftStartLine: false,
  autoStartPosition: null,
  autoScored: 0,
  autoDropped: 0,
  autoPatternCount: 0,
  teleopNearScored: 0,
  teleopFarScored: 0,
  teleopDropped: 0,
  teleopPatternCount: 0,
  parkPoints: 0,
  penaltyCount: 0,
  penaltyNotes: '',
  notes: '',
})

interface EntryFormState {
  teamNumber: string
  allianceColor: AllianceColor
  autoLeftStartLine: boolean
  autoStartPosition: 'near' | 'far' | ''
  autoScored: string
  autoDropped: string
  autoPatternCount: string
  teleopNearScored: string
  teleopFarScored: string
  teleopDropped: string
  teleopPatternCount: string
  parkPoints: '0' | '5' | '10'
  penaltyCount: string
  penaltyNotes: string
  notes: string
}

function formStateToEntry(fs: EntryFormState): ReturnType<typeof emptyEntry> {
  return {
    teamNumber: parseInt(fs.teamNumber) || 0,
    allianceColor: fs.allianceColor,
    autoLeftStartLine: fs.autoLeftStartLine,
    autoStartPosition: fs.autoStartPosition === '' ? null : fs.autoStartPosition,
    autoScored: parseInt(fs.autoScored) || 0,
    autoDropped: parseInt(fs.autoDropped) || 0,
    autoPatternCount: parseInt(fs.autoPatternCount) || 0,
    teleopNearScored: parseInt(fs.teleopNearScored) || 0,
    teleopFarScored: parseInt(fs.teleopFarScored) || 0,
    teleopDropped: parseInt(fs.teleopDropped) || 0,
    teleopPatternCount: parseInt(fs.teleopPatternCount) || 0,
    parkPoints: (parseInt(fs.parkPoints) as 0 | 5 | 10) || 0,
    penaltyCount: parseInt(fs.penaltyCount) || 0,
    penaltyNotes: fs.penaltyNotes,
    notes: fs.notes,
  }
}

function entryToFormState(e: Partial<ReconEntry>): EntryFormState {
  return {
    teamNumber: String(e.teamNumber ?? ''),
    allianceColor: e.allianceColor ?? 'Red',
    autoLeftStartLine: e.autoLeftStartLine ?? false,
    autoStartPosition: e.autoStartPosition ?? '',
    autoScored: String(e.autoScored ?? 0),
    autoDropped: String(e.autoDropped ?? 0),
    autoPatternCount: String(e.autoPatternCount ?? 0),
    teleopNearScored: String(e.teleopNearScored ?? 0),
    teleopFarScored: String(e.teleopFarScored ?? 0),
    teleopDropped: String(e.teleopDropped ?? 0),
    teleopPatternCount: String(e.teleopPatternCount ?? 0),
    parkPoints: String(e.parkPoints ?? 0) as '0' | '5' | '10',
    penaltyCount: String(e.penaltyCount ?? 0),
    penaltyNotes: e.penaltyNotes ?? '',
    notes: e.notes ?? '',
  }
}

export default function ReconEntryPanel({ entries, seasonYear, eventCode, matchId, matchLabel }: Props) {
  const { t } = useTranslation()
  const { user } = useAuth()
  const { workspace } = useWorkspace()

  const [modalOpen, setModalOpen] = useState(false)
  const [editingEntry, setEditingEntry] = useState<ReconEntry | null>(null)
  const [saving, setSaving] = useState(false)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const defaultForm: EntryFormState = {
    teamNumber: '',
    allianceColor: 'Red',
    autoLeftStartLine: false,
    autoStartPosition: '',
    autoScored: '0',
    autoDropped: '0',
    autoPatternCount: '0',
    teleopNearScored: '0',
    teleopFarScored: '0',
    teleopDropped: '0',
    teleopPatternCount: '0',
    parkPoints: '0',
    penaltyCount: '0',
    penaltyNotes: '',
    notes: '',
  }

  const [form, setForm] = useState<EntryFormState>(defaultForm)

  const openNew = () => {
    setEditingEntry(null)
    setForm(defaultForm)
    setModalOpen(true)
  }

  const openEdit = (entry: ReconEntry) => {
    setEditingEntry(entry)
    setForm(entryToFormState(entry))
    setModalOpen(true)
  }

  const handleSave = async () => {
    if (!workspace || !user || !form.teamNumber) return
    setSaving(true)
    try {
      const payload = formStateToEntry(form)
      if (editingEntry?.id) {
        await updateReconEntry(
          workspace.teamId,
          seasonYear,
          eventCode,
          matchId,
          editingEntry.id,
          payload,
        )
      } else {
        await addReconEntry(workspace.teamId, {
          ...payload,
          matchLabel,
          matchId,
          eventCode,
          season: seasonYear,
          scouterName: user.displayName ?? user.email ?? 'Scout',
          scouterUid: user.uid,
        })
      }
      setModalOpen(false)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (entry: ReconEntry) => {
    if (!workspace || !entry.id) return
    await deleteReconEntry(workspace.teamId, seasonYear, eventCode, matchId, entry.id)
  }

  const setField = (key: keyof EntryFormState, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  const NumberField = ({
    field,
    label,
  }: {
    field: keyof EntryFormState
    label: string
  }) => (
    <div className="flex flex-col gap-1">
      <label className="label">{label}</label>
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() =>
            setField(field, String(Math.max(0, parseInt(String(form[field])) - 1)))
          }
          className="w-8 h-8 rounded-lg bg-surface-4 hover:bg-surface-border text-ink font-bold text-lg flex items-center justify-center transition-colors"
        >
          −
        </button>
        <input
          type="number"
          min={0}
          value={form[field] as string}
          onChange={(e) => setField(field, e.target.value)}
          className="input-field text-center w-14 font-mono"
        />
        <button
          type="button"
          onClick={() => setField(field, String(parseInt(String(form[field])) + 1))}
          className="w-8 h-8 rounded-lg bg-surface-4 hover:bg-surface-border text-ink font-bold text-lg flex items-center justify-center transition-colors"
        >
          +
        </button>
      </div>
    </div>
  )

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-ink">{t('recon.entries')}</h3>
        <Button variant="outline" size="sm" onClick={openNew} icon={<Plus size={13} />}>
          {t('recon.newEntry')}
        </Button>
      </div>

      {/* Entry list */}
      {entries.length === 0 ? (
        <div className="border border-dashed border-surface-border rounded-xl p-6 text-center">
          <p className="text-sm text-ink-muted">{t('recon.noEntries')}</p>
          <button
            onClick={openNew}
            className="mt-2 text-sm text-accent hover:text-accent-bright transition-colors"
          >
            {t('recon.addFirst')}
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {entries.map((entry) => {
            const isExpanded = expandedId === entry.id
            const totalAuto = (entry.autoScored ?? 0) + (entry.autoPatternCount ?? 0)
            const totalTeleop = (entry.teleopNearScored ?? 0) + (entry.teleopFarScored ?? 0)

            return (
              <div
                key={entry.id}
                className="card border border-surface-border rounded-xl overflow-hidden"
              >
                {/* Entry header row */}
                <div
                  className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-surface-3 transition-colors"
                  onClick={() => setExpandedId(isExpanded ? null : entry.id ?? null)}
                >
                  <Badge variant={entry.allianceColor === 'Red' ? 'red' : 'blue'}>
                    {entry.allianceColor}
                  </Badge>
                  <span className="font-mono text-sm font-semibold text-ink">
                    #{entry.teamNumber}
                  </span>
                  <div className="flex items-center gap-3 ml-2 text-xs text-ink-secondary">
                    <span>Auto: <span className="text-ink font-medium">{totalAuto}</span></span>
                    <span>DC: <span className="text-ink font-medium">{totalTeleop}</span></span>
                    <span>Park: <span className="text-ink font-medium">{entry.parkPoints}</span></span>
                  </div>
                  <div className="ml-auto flex items-center gap-1">
                    <span className="text-xs text-ink-muted">{entry.scouterName}</span>
                    {isExpanded ? (
                      <ChevronUp size={14} className="text-ink-muted" />
                    ) : (
                      <ChevronDown size={14} className="text-ink-muted" />
                    )}
                  </div>
                </div>

                {/* Expanded detail */}
                {isExpanded && (
                  <div className="px-4 pb-4 pt-1 border-t border-surface-border bg-surface-1/50">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs mb-3">
                      <DataCell label={t('reconFields.autoLeftStartLine')} value={entry.autoLeftStartLine ? '✓ Yes' : '✗ No'} />
                      <DataCell label={t('reconFields.autoStartPosition')} value={entry.autoStartPosition ?? '—'} />
                      <DataCell label={t('reconFields.autoScored')} value={entry.autoScored} />
                      <DataCell label={t('reconFields.autoDropped')} value={entry.autoDropped} />
                      <DataCell label={t('reconFields.autoPatternCount')} value={entry.autoPatternCount} />
                      <DataCell label={t('reconFields.teleopNearScored')} value={entry.teleopNearScored} />
                      <DataCell label={t('reconFields.teleopFarScored')} value={entry.teleopFarScored} />
                      <DataCell label={t('reconFields.teleopDropped')} value={entry.teleopDropped} />
                      <DataCell label={t('reconFields.teleopPatternCount')} value={entry.teleopPatternCount} />
                      <DataCell label={t('reconFields.parkPoints')} value={entry.parkPoints} />
                      <DataCell label={t('reconFields.penaltyCount')} value={entry.penaltyCount} />
                    </div>
                    {entry.penaltyNotes && (
                      <p className="text-xs text-ink-secondary mb-1">
                        <span className="text-ink-muted">{t('reconFields.penaltyNotes')}: </span>
                        {entry.penaltyNotes}
                      </p>
                    )}
                    {entry.notes && (
                      <p className="text-xs text-ink-secondary mb-3">
                        <span className="text-ink-muted">{t('reconFields.notes')}: </span>
                        {entry.notes}
                      </p>
                    )}
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" onClick={() => openEdit(entry)} icon={<Edit2 size={12} />}>
                        {t('reconFields.edit')}
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(entry)} icon={<Trash2 size={12} />} className="text-status-danger hover:text-red-400">
                        {t('reconFields.delete')}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Entry Modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingEntry ? t('reconFields.edit') : t('recon.newEntry')}
        size="lg"
        footer={
          <>
            <Button variant="ghost" onClick={() => setModalOpen(false)}>
              {t('reconFields.cancel')}
            </Button>
            <Button onClick={handleSave} loading={saving} icon={<Check size={14} />}>
              {t('reconFields.save')}
            </Button>
          </>
        }
      >
        <div className="space-y-5">
          {/* Base */}
          <section>
            <p className="section-header">{t('common.team')}</p>
            <div className="grid grid-cols-2 gap-3">
              <Input
                label={t('reconFields.teamNumber')}
                type="number"
                value={form.teamNumber}
                onChange={(e) => setField('teamNumber', e.target.value)}
                placeholder="e.g. 19859"
              />
              <Select
                label={t('reconFields.allianceColor')}
                value={form.allianceColor}
                onChange={(e) => setField('allianceColor', e.target.value)}
                options={[
                  { value: 'Red', label: 'Red' },
                  { value: 'Blue', label: 'Blue' },
                ]}
              />
            </div>
          </section>

          {/* Auto */}
          <section>
            <p className="section-header">{t('reconFields.autoSection')}</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
              {/* Left Start Line toggle */}
              <div>
                <label className="label">{t('reconFields.autoLeftStartLine')}</label>
                <button
                  type="button"
                  onClick={() => setField('autoLeftStartLine', !form.autoLeftStartLine)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-all text-sm font-medium ${
                    form.autoLeftStartLine
                      ? 'border-status-success/40 bg-status-success-dim text-status-success'
                      : 'border-surface-border text-ink-muted hover:border-surface-4'
                  }`}
                >
                  <div className={`w-4 h-4 rounded-sm border flex items-center justify-center ${
                    form.autoLeftStartLine ? 'bg-status-success border-status-success' : 'border-surface-4'
                  }`}>
                    {form.autoLeftStartLine && <Check size={10} className="text-white" />}
                  </div>
                  {form.autoLeftStartLine ? t('common.yes') : t('common.no')}
                </button>
              </div>

              {/* Start position */}
              <Select
                label={t('reconFields.autoStartPosition')}
                value={form.autoStartPosition}
                onChange={(e) => setField('autoStartPosition', e.target.value)}
                options={[
                  { value: '', label: '—' },
                  { value: 'near', label: t('reconFields.autoStartNear') },
                  { value: 'far', label: t('reconFields.autoStartFar') },
                ]}
              />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <NumberField field="autoScored" label={t('reconFields.autoScored')} />
              <NumberField field="autoDropped" label={t('reconFields.autoDropped')} />
              <NumberField field="autoPatternCount" label={t('reconFields.autoPatternCount')} />
            </div>
          </section>

          {/* Teleop */}
          <section>
            <p className="section-header">{t('reconFields.teleopSection')}</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <NumberField field="teleopNearScored" label={t('reconFields.teleopNearScored')} />
              <NumberField field="teleopFarScored" label={t('reconFields.teleopFarScored')} />
              <NumberField field="teleopDropped" label={t('reconFields.teleopDropped')} />
              <NumberField field="teleopPatternCount" label={t('reconFields.teleopPatternCount')} />
            </div>
          </section>

          {/* Other */}
          <section>
            <p className="section-header">{t('reconFields.otherSection')}</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-3">
              <Select
                label={t('reconFields.parkPoints')}
                value={form.parkPoints}
                onChange={(e) => setField('parkPoints', e.target.value)}
                options={[
                  { value: '0', label: t('reconFields.parkNone') },
                  { value: '5', label: t('reconFields.parkPartial') },
                  { value: '10', label: t('reconFields.parkFull') },
                ]}
              />
              <NumberField field="penaltyCount" label={t('reconFields.penaltyCount')} />
            </div>
            <Textarea
              label={t('reconFields.penaltyNotes')}
              value={form.penaltyNotes}
              onChange={(e) => setField('penaltyNotes', e.target.value)}
              placeholder="Describe...`"
              rows={2}
              wrapperClassName="mb-3"
            />
            <Textarea
              label={t('reconFields.notes')}
              value={form.notes}
              onChange={(e) => setField('notes', e.target.value)}
              placeholder="Notes..."
              rows={3}
            />
          </section>
        </div>
      </Modal>
    </div>
  )
}

function DataCell({ label, value }: { label: string; value: string | number | boolean }) {
  return (
    <div>
      <p className="text-ink-muted mb-0.5">{label}</p>
      <p className="text-ink font-medium">{String(value)}</p>
    </div>
  )
}
