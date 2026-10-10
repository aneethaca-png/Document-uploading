import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { lazy, Suspense } from 'react'
import { Center, Spinner } from '@chakra-ui/react'
import { AuthProvider } from './context/AuthContext'
import { ProtectedRoute } from './components/ProtectedRoute'

const LoginPage = lazy(() => import('./pages/Login'))
const DashboardPage = lazy(() => import('./pages/Dashboard'))
const TemplatesPage = lazy(() => import('./pages/Templates'))
const NewTemplatePage = lazy(() => import('./pages/NewTemplate'))
const TemplateDetailPage = lazy(() => import('./pages/TemplateDetail'))
const EditTemplatePage = lazy(() => import('./pages/EditTemplate'))
const FilesPage = lazy(() => import('./pages/Files'))
const ProfilePage = lazy(() => import('./pages/Profile'))
const SettingsPage = lazy(() => import('./pages/Settings'))

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 1000 * 60 * 5, retry: 1 },
  },
})

function PageLoading() {
  return (
    <Center minH="100vh">
      <Spinner size="xl" color="purple.500" />
    </Center>
  )
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Suspense fallback={<PageLoading />}>
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
              <Route path="/templates" element={<ProtectedRoute><TemplatesPage /></ProtectedRoute>} />
              <Route path="/templates/new" element={<ProtectedRoute><NewTemplatePage /></ProtectedRoute>} />
              <Route path="/templates/:id" element={<ProtectedRoute><TemplateDetailPage /></ProtectedRoute>} />
              <Route path="/templates/:id/edit" element={<ProtectedRoute><EditTemplatePage /></ProtectedRoute>} />
              <Route path="/files" element={<ProtectedRoute><FilesPage /></ProtectedRoute>} />
              <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
              <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  )
}
