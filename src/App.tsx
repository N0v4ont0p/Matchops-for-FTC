import { Suspense, lazy } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from '@/contexts/AuthContext'
import { WorkspaceProvider } from '@/contexts/WorkspaceContext'
import { EventContextProvider } from '@/contexts/EventContext'
import ProtectedRoute from '@/router/ProtectedRoute'
import Spinner from '@/components/ui/Spinner'

// --- Lazy pages ---
const LandingPage = lazy(() => import('@/pages/LandingPage'))
const SignInPage = lazy(() => import('@/pages/SignInPage'))
const OnboardingPage = lazy(() => import('@/pages/OnboardingPage'))
const ReconLayout = lazy(() => import('@/pages/app/ReconLayout'))
const ReconDashboard = lazy(() => import('@/pages/app/ReconDashboard'))
const CurrentMatchWorkspace = lazy(() => import('@/pages/app/CurrentMatchWorkspace'))
const MatchHistoryPage = lazy(() => import('@/pages/app/MatchHistoryPage'))
const TeamIntelPage = lazy(() => import('@/pages/app/TeamIntelPage'))
const PitPage = lazy(() => import('@/pages/app/PitPage'))
const BatteriesPage = lazy(() => import('@/pages/app/BatteriesPage'))
const NotesPage = lazy(() => import('@/pages/app/NotesPage'))
const SettingsPage = lazy(() => import('@/pages/app/SettingsPage'))

// --- Layouts for secondary modes ---
import AppShell from '@/components/layout/AppShell'

function SecondaryPage({ children }: { children: React.ReactNode }) {
  return (
    <AppShell>
      {children}
    </AppShell>
  )
}

function PageSpinner() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-surface-1">
      <Spinner size="lg" />
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <WorkspaceProvider>
          <EventContextProvider>
            <Suspense fallback={<PageSpinner />}>
              <Routes>
                {/* Public */}
                <Route path="/" element={<LandingPage />} />
                <Route path="/signin" element={<SignInPage />} />

                {/* Onboarding — protected for authed users without a workspace */}
                <Route
                  path="/onboarding"
                  element={
                    <ProtectedRoute requireNoWorkspace>
                      <OnboardingPage />
                    </ProtectedRoute>
                  }
                />

                {/* App — protected */}
                <Route
                  path="/app"
                  element={
                    <ProtectedRoute>
                      <Navigate to="/app/recon" replace />
                    </ProtectedRoute>
                  }
                />

                {/* Recon — nested tabs */}
                <Route
                  path="/app/recon"
                  element={
                    <ProtectedRoute>
                      <ReconLayout />
                    </ProtectedRoute>
                  }
                >
                  <Route index element={<ReconDashboard />} />
                  <Route path="match" element={<CurrentMatchWorkspace />} />
                  <Route path="history" element={<MatchHistoryPage />} />
                  <Route path="intel" element={<TeamIntelPage />} />
                </Route>

                {/* Secondary modes */}
                <Route
                  path="/app/pit"
                  element={
                    <ProtectedRoute>
                      <SecondaryPage>
                        <PitPage />
                      </SecondaryPage>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/app/batteries"
                  element={
                    <ProtectedRoute>
                      <SecondaryPage>
                        <BatteriesPage />
                      </SecondaryPage>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/app/notes"
                  element={
                    <ProtectedRoute>
                      <SecondaryPage>
                        <NotesPage />
                      </SecondaryPage>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/app/settings"
                  element={
                    <ProtectedRoute>
                      <SecondaryPage>
                        <SettingsPage />
                      </SecondaryPage>
                    </ProtectedRoute>
                  }
                />

                {/* Catch-all */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Suspense>
          </EventContextProvider>
        </WorkspaceProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}
