import { Heading, VStack, Text, Button, Divider, Box } from '@chakra-ui/react'
import { Link as RouterLink } from 'react-router-dom'
import { PageWrapper } from '../components/layout/PageWrapper'
import { GlassCard } from '../components/ui/GlassCard'
import { useAuth } from '../context/AuthContext'

export default function Settings() {
  const { user, logout } = useAuth()

  return (
    <PageWrapper bg="gray.50" p={8}>
      <VStack align="stretch" spacing={6} maxW="520px" mx="auto">
        <Heading size="lg">Settings</Heading>

        <GlassCard>
          <VStack align="stretch" spacing={4}>
            <Box>
              <Text fontWeight="semibold">Account</Text>
              <Text fontSize="sm" color="gray.500">{user?.email}</Text>
            </Box>
            <Divider />
            <Button as={RouterLink as React.ElementType} to="/profile" variant="ghost" colorScheme="purple" justifyContent="flex-start">
              Edit Profile
            </Button>
            <Divider />
            <Button colorScheme="red" variant="ghost" justifyContent="flex-start" onClick={logout}>
              Sign Out
            </Button>
          </VStack>
        </GlassCard>
      </VStack>
    </PageWrapper>
  )
}
