import { useState, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { Battery, PlusCircle, XCircle, BatteryFull, BatteryLow, BatteryMedium, BatteryWarning } from 'lucide-react'
import { useWorkspace } from '@/contexts/WorkspaceContext'
import { subscribeToBatteries, addBattery, updateBattery, deleteBattery } from '@/services/firestore'
import type { Battery as BatteryType } from '@/types'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import Modal from '@/components/ui/Modal'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import { SkeletonCard } from '@/components/ui/Skeleton'

const STATUS_OPTIONS = [
  { value: 'ready', label: 'Ready' },
  { value: 'charging', label: 'Charging' },
  { value: 'low', label: 'Low' },
  { value: 'damaged', label: 'Damaged' },
]

function batteryIcon(status: BatteryType['status']) {
  if (status === 'ready') return <BatteryFull size={16} className="text-status-ok" />
  if (status === 'charging') return <BatteryMedium size={16} className="text-status-warn" />
  if (status === 'low') return <BatteryLow size={16} className="text-status-error" />
  return <BatteryWarning size={16} className="text-status-error" />
}

function statusVariant(s: BatteryType['status']): 'green' | 'yellow' | 'red' | 'error' {
  if (s === 'ready') return 'green'
  if (s === 'charging') return 'yellow'
  return 'red'
}

function BatteryModal({
  open,
  onClose,
  onSubmit,
}: {
  open: boolean
  onClose: () => void
  onSubmit: (label: string, voltage: string) => Promise<void>
}) {
  const { t } = useTranslation()
  const [label, setLabel] = useState('')
  const [voltage, setVoltage] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => { if (open) { setLabel(''); setVoltage('') } }, [open])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!label.trim()) return
    setSaving(true)
    try { await onSubmit(label, voltage) } finally { setSaving(false) }
    onClose()
  }

  return (
    <Modal open={open} onClose={onClose} title={t('batteries.addBattery')}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-ink-secondary mb-1">{t('batteries.label')}</label>
          <Input
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder={t('batteries.labelPlaceholder')}
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-ink-secondary mb-1">{t('batteries.voltage')}</label>
          <Input
            type="number"
            step="0.01"
            min="0"
            max="15"
            value={voltage}
            onChange={(e) => setVoltage(e.target.value)}
            placeholder="12.50"
          />
        </div>
        <div className="flex gap-3 pt-2">
          <Button type="submit" loading={saving} className="flex-1">{t('common.add')}</Button>
          <Button type="button" variant="ghost" onClick={onClose}>{t('common.cancel')}</Button>
        </div>
      </form>
    </Modal>
  )
}

export default function BatteriesPage() {
  const { t } = useTranslation()
  const { workspace } = useWorkspace()
  const [batteries, setBatteries] = useState<BatteryType[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)

  useEffect(() => {
    if (!workspace) return
    const unsub = subscribeToBatteries(workspace.teamId, (data) => {
      setBatteries(data)
      setLoading(false)
    })
    return unsub
  }, [workspace])

  const handleAdd = useCallback(
    async (label: string, voltage: string) => {
      if (!workspace) return
      await addBattery(workspace.teamId, {
        label,
        status: 'ready',
        voltage: voltage ? parseFloat(voltage) : undefined,
        notes: '',
      })
    },
    [workspace],
  )

  const handleStatusChange = useCallback(
    async (battery: BatteryType, newStatus: string) => {
      if (!workspace) return
      await updateBattery(workspace.teamId, battery.id!, { status: newStatus as BatteryType['status'] })
    },
    [workspace],
  )

  const handleDelete = useCallback(
    async (id: string) => {
      if (!workspace) return
      await deleteBattery(workspace.teamId, id)
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

  const readyCount = batteries.filter((b) => b.status === 'ready').length

  return (
    <div className="p-6 max-w-3xl mx-auto animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Battery size={20} className="text-accent" />
          <h1 className="text-xl font-bold text-ink">{t('batteries.title')}</h1>
          <Badge variant="success">{readyCount} {t('batteries.ready')}</Badge>
        </div>
        <Button size="sm" icon={<PlusCircle size={14} />} onClick={() => setModalOpen(true)}>
          {t('batteries.addBattery')}
        </Button>
      </div>

      {batteries.length === 0 ? (
        <div className="text-center py-16">
          <Battery size={32} className="text-ink-muted mx-auto mb-3" />
          <p className="text-sm text-ink-secondary">{t('batteries.noBatteries')}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {batteries.map((b) => (
            <div key={b.id} className="card hover:border-surface-hover transition-colors">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  {batteryIcon(b.status)}
                  <span className="font-semibold text-ink">{b.label}</span>
                </div>
                <button
                  onClick={() => handleDelete(b.id!)}
                  className="p-1 rounded text-ink-muted hover:text-status-error hover:bg-surface-3 transition-colors"
                >
                  <XCircle size={13} />
                </button>
              </div>

              {b.voltage != null && (
                <p className="text-xs font-mono text-ink-secondary mb-3">{b.voltage.toFixed(2)}V</p>
              )}

              {b.lastUsedMatchLabel && (
                <p className="text-xs text-ink-muted mb-3">{t('batteries.lastUsed')}: {b.lastUsedMatchLabel}</p>
              )}

              <Select
                value={b.status}
                onChange={(e) => handleStatusChange(b, e.target.value)}
                options={STATUS_OPTIONS}
                className="mt-auto"
              />
            </div>
          ))}
        </div>
      )}

      <BatteryModal open={modalOpen} onClose={() => setModalOpen(false)} onSubmit={handleAdd} />
    </div>
  )
}
