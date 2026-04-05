import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Crosshair, Lock } from 'lucide-react'
import { useWorkspace } from '@/contexts/WorkspaceContext'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import type { SupportedLanguage } from '@/types'

export default function OnboardingPage() {
  const { t } = useTranslation()
  const { createNewWorkspace, loading } = useWorkspace()
  const navigate = useNavigate()

  const [teamNumber, setTeamNumber] = useState('')
  const [teamName, setTeamName] = useState('')
  const [language, setLanguage] = useState<SupportedLanguage>('en')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [apiError, setApiError] = useState('')

  const validate = () => {
    const errs: Record<string, string> = {}
    const num = parseInt(teamNumber)
    if (!teamNumber || isNaN(num) || num <= 0) {
      errs.teamNumber = t('onboarding.errors.invalidTeamNumber')
    }
    if (!teamName.trim()) {
      errs.teamName = t('onboarding.errors.teamNameRequired')
    }
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSubmit = async () => {
    if (!validate()) return
    setApiError('')
    try {
      await createNewWorkspace({
        teamNumber: parseInt(teamNumber),
        teamName: teamName.trim(),
        language,
      })
      navigate('/app/recon')
    } catch (err) {
      const msg = err instanceof Error ? err.message : ''
      if (msg.includes('team-number-exists')) {
        setApiError(t('onboarding.errors.teamNumberExists'))
      } else {
        setApiError(t('auth.errors.generic'))
      }
    }
  }

  return (
    <div className="min-h-screen bg-surface-base grid-bg flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-accent-muted border border-accent/20">
            <Crosshair size={18} className="text-accent-bright" strokeWidth={2.5} />
          </div>
          <span className="text-xl font-bold text-ink tracking-tight">Matchops</span>
        </div>

        <div className="card p-8">
          <h1 className="text-xl font-bold text-ink mb-1">{t('onboarding.title')}</h1>
          <p className="text-sm text-ink-secondary mb-6">{t('onboarding.subtitle')}</p>

          <div className="space-y-4">
            <Input
              label={t('onboarding.teamNumber')}
              type="number"
              value={teamNumber}
              onChange={(e) => setTeamNumber(e.target.value)}
              placeholder={t('onboarding.teamNumberPlaceholder')}
              error={errors.teamNumber}
            />

            <Input
              label={t('onboarding.teamName')}
              type="text"
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              placeholder={t('onboarding.teamNamePlaceholder')}
              error={errors.teamName}
            />

            <Select
              label={t('onboarding.language')}
              value={language}
              onChange={(e) => setLanguage(e.target.value as SupportedLanguage)}
              options={[
                { value: 'en', label: t('onboarding.languageEn') },
                { value: 'zh', label: t('onboarding.languageZh') },
              ]}
            />

            {/* Immutable notice */}
            <div className="flex items-start gap-2.5 px-3 py-2.5 rounded-lg bg-surface-3 border border-surface-border">
              <Lock size={13} className="text-ink-muted mt-0.5 shrink-0" />
              <p className="text-xs text-ink-secondary">{t('onboarding.immutableNotice')}</p>
            </div>

            {apiError && (
              <p className="text-xs text-status-danger bg-status-danger-dim border border-status-danger/20 px-3 py-2 rounded-lg">
                {apiError}
              </p>
            )}

            <Button
              className="w-full"
              onClick={handleSubmit}
              loading={loading}
            >
              {loading ? t('onboarding.creating') : t('onboarding.create')}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
