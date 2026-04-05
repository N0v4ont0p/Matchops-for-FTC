import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from 'react'
import { useAuth } from './AuthContext'
import {
  getWorkspaceForUser,
  createWorkspace,
  linkUserToWorkspace,
  updateWorkspaceLanguage,
} from '@/services/firestore'
import type { WorkspaceTeam, SupportedLanguage } from '@/types'

interface WorkspaceContextValue {
  workspace: WorkspaceTeam | null
  loading: boolean
  error: string | null
  createNewWorkspace: (params: {
    teamNumber: number
    teamName: string
    language: SupportedLanguage
  }) => Promise<void>
  updateLanguage: (lang: SupportedLanguage) => Promise<void>
  refresh: () => Promise<void>
}

const WorkspaceContext = createContext<WorkspaceContextValue | null>(null)

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [workspace, setWorkspace] = useState<WorkspaceTeam | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!user) {
      setWorkspace(null)
      return
    }
    setLoading(true)
    setError(null)
    try {
      const ws = await getWorkspaceForUser(user.uid)
      setWorkspace(ws)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load workspace')
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    load()
  }, [load])

  const createNewWorkspace = async (params: {
    teamNumber: number
    teamName: string
    language: SupportedLanguage
  }) => {
    if (!user) throw new Error('Not authenticated')
    setLoading(true)
    setError(null)
    try {
      const ws = await createWorkspace({ ...params, ownerUid: user.uid })
      await linkUserToWorkspace(user.uid, ws.teamId)
      setWorkspace(ws)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to create workspace'
      setError(msg)
      throw new Error(msg)
    } finally {
      setLoading(false)
    }
  }

  const updateLanguage = async (lang: SupportedLanguage) => {
    if (!workspace) return
    await updateWorkspaceLanguage(workspace.teamId, lang)
    setWorkspace((prev) => (prev ? { ...prev, language: lang } : prev))
  }

  return (
    <WorkspaceContext.Provider
      value={{ workspace, loading, error, createNewWorkspace, updateLanguage, refresh: load }}
    >
      {children}
    </WorkspaceContext.Provider>
  )
}

export function useWorkspace() {
  const ctx = useContext(WorkspaceContext)
  if (!ctx) throw new Error('useWorkspace must be used within WorkspaceProvider')
  return ctx
}
