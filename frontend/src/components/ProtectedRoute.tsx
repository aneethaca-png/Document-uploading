import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Center, Spinner } from '@chakra-ui/react'

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth()

  if (isLoading) {
    return (
      <Center minH="100vh">
        <Spinner size="xl" color="purple.500" />
      </Center>
    )
  }

  if (!user) return <Navigate to="/login" replace />
  return <>{children}</>
}
