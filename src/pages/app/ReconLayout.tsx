import { useEffect } from 'react'
import { Outlet, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import AppShell from '@/components/layout/AppShell'
import ReconTabBar from '@/components/layout/ReconTabBar'
import MatchContextBar from '@/components/recon/MatchContextBar'
import { useWorkspace } from '@/contexts/WorkspaceContext'
import { useEventContext } from '@/contexts/EventContext'
import i18n from '@/i18n'

export default function ReconLayout() {
  const { workspace } = useWorkspace()
  const { loadEventContext } = useEventContext()
  const { t } = useTranslation()

  // Sync workspace language to i18n
  useEffect(() => {
    if (workspace?.language && workspace.language !== i18n.language) {
      i18n.changeLanguage(workspace.language)
    }
  }, [workspace?.language])

  // Auto-detect event context when workspace is ready
  useEffect(() => {
    if (workspace?.teamNumber) {
      loadEventContext(workspace.teamNumber)
    }
  }, [workspace?.teamNumber])

  return (
    <AppShell>
      <div className="flex flex-col h-full min-h-0">
        {/* Recon sub-nav tabs */}
        <ReconTabBar />
        {/* FTCScout match context bar */}
        <MatchContextBar />
        {/* Page content */}
        <div className="flex-1 overflow-y-auto">
          <Outlet />
        </div>
      </div>
    </AppShell>
  )
}
