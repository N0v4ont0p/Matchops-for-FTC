import { Navigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { useWorkspace } from '@/contexts/WorkspaceContext'
import Spinner from '@/components/ui/Spinner'

interface Props {
  children: React.ReactNode
  requireNoWorkspace?: boolean
}

export default function ProtectedRoute({ children, requireNoWorkspace }: Props) {
  const { user, loading: authLoading } = useAuth()
  const { workspace, loading: wsLoading } = useWorkspace()

  if (authLoading || wsLoading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-surface-base">
        <Spinner size="lg" className="text-accent" />
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/signin" replace />
  }

  if (requireNoWorkspace) {
    // Onboarding route: only for authed users without a workspace
    if (workspace) return <Navigate to="/app/recon" replace />
    return <>{children}</>
  }

  if (!workspace) {
    return <Navigate to="/onboarding" replace />
  }

  return <>{children}</>
}
