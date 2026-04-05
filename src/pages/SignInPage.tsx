import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Crosshair, Mail } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import i18n from '@/i18n'

function mapAuthError(code: string, t: (k: string) => string): string {
  if (code.includes('invalid-credential') || code.includes('wrong-password') || code.includes('user-not-found')) {
    return t('auth.errors.invalidCredentials')
  }
  if (code.includes('email-already-in-use')) return t('auth.errors.emailInUse')
  if (code.includes('weak-password')) return t('auth.errors.weakPassword')
  if (code.includes('network')) return t('auth.errors.networkError')
  return t('auth.errors.generic')
}

export default function SignInPage() {
  const { t } = useTranslation()
  const { signInWithGoogle, signInWithEmail, signUpWithEmail } = useAuth()
  const navigate = useNavigate()

  const [tab, setTab] = useState<'signin' | 'signup'>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleGoogle = async () => {
    setLoading(true)
    setError('')
    try {
      await signInWithGoogle()
      navigate('/app/recon')
    } catch (err) {
      setError(mapAuthError((err as { code?: string }).code ?? '', t))
    } finally {
      setLoading(false)
    }
  }

  const handleEmail = async () => {
    setLoading(true)
    setError('')
    try {
      if (tab === 'signin') {
        await signInWithEmail(email, password)
      } else {
        if (!displayName.trim()) {
          setError('Display name is required.')
          setLoading(false)
          return
        }
        await signUpWithEmail(email, password, displayName)
      }
      navigate('/app/recon')
    } catch (err) {
      setError(mapAuthError((err as { code?: string }).code ?? '', t))
    } finally {
      setLoading(false)
    }
  }

  const currentLang = i18n.language
  const toggleLang = () => {
    i18n.changeLanguage(currentLang.startsWith('zh') ? 'en' : 'zh')
  }

  return (
    <div className="min-h-screen bg-surface-base grid-bg flex flex-col">
      {/* Topbar */}
      <header className="p-4 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-accent-muted border border-accent/20">
            <Crosshair size={14} className="text-accent-bright" strokeWidth={2.5} />
          </div>
          <span className="text-sm font-bold text-ink">Matchops</span>
        </Link>
        <button onClick={toggleLang} className="btn-ghost h-8 px-3 text-xs font-semibold uppercase tracking-wide">
          {currentLang.startsWith('zh') ? 'EN' : '中文'}
        </button>
      </header>

      {/* Card */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <div className="card p-8">
            {/* Header */}
            <div className="mb-7 text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-accent-muted border border-accent/20 mb-4">
                <Crosshair size={22} className="text-accent-bright" />
              </div>
              <h1 className="text-xl font-bold text-ink">{t('auth.signIn')}</h1>
              <p className="text-sm text-ink-secondary mt-1">{t('tagline')}</p>
            </div>

            {/* Tabs */}
            <div className="flex bg-surface-3 rounded-lg p-0.5 mb-6">
              {(['signin', 'signup'] as const).map((tab_) => (
                <button
                  key={tab_}
                  onClick={() => { setTab(tab_); setError('') }}
                  className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-all ${
                    tab === tab_
                      ? 'bg-surface-2 text-ink shadow-sm border border-surface-border'
                      : 'text-ink-muted hover:text-ink'
                  }`}
                >
                  {tab_ === 'signin' ? t('auth.signIn') : t('auth.signUp')}
                </button>
              ))}
            </div>

            {/* Google */}
            <Button
              variant="outline"
              className="w-full mb-4"
              icon={
                <svg className="w-4 h-4" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
              }
              onClick={handleGoogle}
              loading={loading}
            >
              {t('auth.signInWithGoogle')}
            </Button>

            {/* Divider */}
            <div className="flex items-center gap-3 mb-4">
              <div className="flex-1 h-px bg-surface-border" />
              <span className="text-xs text-ink-muted">{t('auth.or')}</span>
              <div className="flex-1 h-px bg-surface-border" />
            </div>

            {/* Email form */}
            <div className="space-y-3">
              {tab === 'signup' && (
                <Input
                  label="Display Name"
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Your name"
                />
              )}
              <Input
                label={t('auth.email')}
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t('auth.emailPlaceholder')}
              />
              <Input
                label={t('auth.password')}
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t('auth.passwordPlaceholder')}
              />

              {error && (
                <p className="text-xs text-status-danger bg-status-danger-dim border border-status-danger/20 px-3 py-2 rounded-lg">
                  {error}
                </p>
              )}

              <Button
                className="w-full"
                onClick={handleEmail}
                loading={loading}
                icon={<Mail size={14} />}
              >
                {tab === 'signin' ? t('auth.signIn') : t('auth.signUp')}
              </Button>
            </div>
          </div>

          <p className="text-center text-xs text-ink-muted mt-4">
            {tab === 'signin' ? t('auth.noAccount') : t('auth.hasAccount')}{' '}
            <button
              onClick={() => { setTab(tab === 'signin' ? 'signup' : 'signin'); setError('') }}
              className="text-accent hover:text-accent-bright transition-colors font-medium"
            >
              {tab === 'signin' ? t('auth.signUp') : t('auth.signIn')}
            </button>
          </p>
        </div>
      </div>
    </div>
  )
}
