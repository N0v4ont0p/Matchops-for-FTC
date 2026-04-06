import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  useCallback,
  type ReactNode,
} from 'react'
import { useAuth } from './AuthContext'
import {
  getWorkspaceForUser,
  createWorkspace,
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
  const { user, loading: authLoading } = useAuth()
  const [workspace, setWorkspace] = useState<WorkspaceTeam | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const loadRequestIdRef = useRef(0)
  const creatingRef = useRef(false)

  const load = useCallback(async () => {
    if (authLoading) {
      return
    }

    if (!user) {
      setWorkspace(null)
      setLoading(false)
      return
    }

    const requestId = ++loadRequestIdRef.current
    setLoading(true)
    setError(null)
    try {
      const ws = await getWorkspaceForUser(user.uid)
      // Ignore stale reads (e.g. StrictMode double effects or overlapping requests)
      // and avoid overriding optimistic state during create flow.
      if (requestId !== loadRequestIdRef.current || creatingRef.current) return
      setWorkspace(ws)
    } catch (err) {
      if (requestId !== loadRequestIdRef.current) return
      setError(err instanceof Error ? err.message : 'Failed to load workspace')
    } finally {
      if (requestId !== loadRequestIdRef.current || creatingRef.current) return
      setLoading(false)
    }
  }, [authLoading, user?.uid])

  useEffect(() => {
    load()
  }, [load])

  const createNewWorkspace = async (params: {
    teamNumber: number
    teamName: string
    language: SupportedLanguage
  }) => {
    if (!user) throw new Error('Not authenticated')

    creatingRef.current = true
    // Invalidate any in-flight load() started before creation.
    loadRequestIdRef.current += 1
    setLoading(true)
    setError(null)
    try {
      const ws = await createWorkspace({ ...params, ownerUid: user.uid })
      // Set optimistic local workspace immediately so route guards can proceed.
      setWorkspace(ws)

      // Refresh from Firestore as best effort; do not fail onboarding if this read
      // is temporarily blocked or delayed by rules/propagation.
      try {
        const linkedWorkspace = await getWorkspaceForUser(user.uid)
        if (linkedWorkspace) {
          setWorkspace(linkedWorkspace)
        }
      } catch {
        // Keep optimistic workspace and allow app entry.
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to create workspace'
      setError(msg)
      throw new Error(msg)
    } finally {
      creatingRef.current = false
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
