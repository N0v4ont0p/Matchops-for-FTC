import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  Crosshair,
  Zap,
  Users,
  Globe,
  Server,
  Battery,
  ArrowRight,
  CheckCircle2,
} from 'lucide-react'
import Button from '@/components/ui/Button'
import i18n from '@/i18n'

const features = [
  { iconKey: Crosshair, titleKey: 'landing.feature1Title', descKey: 'landing.feature1Desc', accent: true },
  { iconKey: Zap, titleKey: 'landing.feature2Title', descKey: 'landing.feature2Desc' },
  { iconKey: Battery, titleKey: 'landing.feature3Title', descKey: 'landing.feature3Desc' },
  { iconKey: Users, titleKey: 'landing.feature4Title', descKey: 'landing.feature4Desc' },
  { iconKey: Globe, titleKey: 'landing.feature5Title', descKey: 'landing.feature5Desc' },
  { iconKey: Server, titleKey: 'landing.feature6Title', descKey: 'landing.feature6Desc' },
]

export default function LandingPage() {
  const { t } = useTranslation()
  const currentLang = i18n.language

  const toggleLang = () => {
    const next = currentLang.startsWith('zh') ? 'en' : 'zh'
    i18n.changeLanguage(next)
  }

  return (
    <div className="min-h-screen bg-surface-base grid-bg">
      {/* ── Topbar ───────────────────────────────────── */}
      <header className="fixed top-0 left-0 right-0 z-10 bg-surface-base/80 backdrop-blur-md border-b border-surface-border">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-accent-muted border border-accent/20">
              <Crosshair size={14} className="text-accent-bright" strokeWidth={2.5} />
            </div>
            <span className="text-base font-bold text-ink tracking-tight">Matchops</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={toggleLang}
              className="btn-ghost h-8 px-3 text-xs font-semibold uppercase tracking-wide"
            >
              {currentLang.startsWith('zh') ? 'EN' : '中文'}
            </button>
            <Link to="/signin">
              <Button variant="outline" size="sm">{t('auth.signIn')}</Button>
            </Link>
            <Link to="/signin">
              <Button size="sm">{t('landing.ctaGetStarted')}</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* ── Hero ─────────────────────────────────────── */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          {/* Pre-badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent-muted border border-accent/20 mb-8">
            <div className="w-1.5 h-1.5 rounded-full bg-accent-bright animate-pulse-soft" />
            <span className="text-xs font-semibold text-accent-bright tracking-wide uppercase">
              FTC Competition Operations
            </span>
          </div>

          <h1 className="text-5xl sm:text-6xl font-extrabold text-ink tracking-tight leading-[1.08] mb-6 text-balance">
            {t('landing.heroTitle')}
          </h1>

          <p className="text-lg text-ink-secondary max-w-2xl mx-auto mb-10 text-balance leading-relaxed">
            {t('landing.heroSubtitle')}
          </p>

          <div className="flex items-center justify-center gap-4 flex-wrap">
            <Link to="/signin">
              <Button size="lg" iconRight={<ArrowRight size={16} />}>
                {t('landing.ctaGetStarted')}
              </Button>
            </Link>
            <Link to="/signin">
              <Button variant="outline" size="lg">
                {t('landing.ctaSignIn')}
              </Button>
            </Link>
          </div>

          {/* Made for */}
          <div className="mt-12 flex items-center justify-center gap-2 flex-wrap">
            <span className="text-xs text-ink-muted">{t('landing.madeFor')}</span>
            {(t('landing.madeForItems', { returnObjects: true }) as string[]).map((item) => (
              <span key={item} className="flex items-center gap-1 text-xs text-ink-secondary">
                <CheckCircle2 size={12} className="text-accent" />
                {item}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ─────────────────────────────────── */}
      <section className="pb-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {features.map(({ iconKey: Icon, titleKey, descKey, accent }) => (
              <div
                key={titleKey}
                className={`card p-6 transition-all duration-200 hover:border-accent/20 hover:shadow-card-hover ${
                  accent ? 'border-accent/20 bg-surface-2' : ''
                }`}
              >
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center mb-4 ${
                  accent ? 'bg-accent-muted border border-accent/20' : 'bg-surface-3 border border-surface-border'
                }`}>
                  <Icon size={17} className={accent ? 'text-accent-bright' : 'text-ink-secondary'} />
                </div>
                <h3 className="text-sm font-semibold text-ink mb-1.5">{t(titleKey)}</h3>
                <p className="text-sm text-ink-secondary leading-relaxed">{t(descKey)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA band ─────────────────────────────────── */}
      <section className="pb-24 px-6">
        <div className="max-w-2xl mx-auto card p-10 text-center border-accent/20">
          <h2 className="text-2xl font-bold text-ink mb-3">{t('landing.ctaGetStarted')}</h2>
          <p className="text-sm text-ink-secondary mb-6">{t('landing.heroSubtitle')}</p>
          <Link to="/signin">
            <Button size="lg" iconRight={<ArrowRight size={16} />}>
              {t('landing.ctaSignIn')} / {t('landing.ctaGetStarted')}
            </Button>
          </Link>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────── */}
      <footer className="border-t border-surface-border py-8 px-6">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-ink-muted">
          <div className="flex items-center gap-2">
            <Crosshair size={13} className="text-accent" />
            <span className="font-semibold text-ink">Matchops</span>
            <span className="text-ink-disabled">· {t('tagline')}</span>
          </div>
          <div className="flex items-center gap-4">
            <span>Event data sourced from FTCScout</span>
          </div>
        </div>
      </footer>
    </div>
  )
}
