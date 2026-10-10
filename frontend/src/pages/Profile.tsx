import { Avatar, Box, Heading, VStack, HStack, Text, Button, useToast } from '@chakra-ui/react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { PageWrapper } from '../components/layout/PageWrapper'
import { GlassCard } from '../components/ui/GlassCard'
import { GradientButton } from '../components/ui/GradientButton'
import { AnimatedInput } from '../components/ui/AnimatedInput'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'

export default function Profile() {
  const { user, logout } = useAuth()
  const toast = useToast()
  const [fullName, setFullName] = useState(user?.fullName ?? '')

  const { mutate: updateName, isPending } = useMutation({
    mutationFn: () => api.put('/auth/me', { full_name: fullName }),
    onSuccess: () => toast({ title: 'Name updated', status: 'success', duration: 2000 }),
  })

  return (
    <PageWrapper bg="gray.50" p={8}>
      <VStack align="stretch" spacing={6} maxW="520px" mx="auto">
        <Heading size="lg">Profile</Heading>
        <GlassCard>
          <VStack spacing={5} align="stretch">
            <HStack spacing={4}>
              <Avatar src={user?.avatarUrl ?? undefined} name={user?.fullName} size="lg" />
              <Box>
                <Text fontWeight="semibold">{user?.fullName}</Text>
                <Text fontSize="sm" color="gray.500">{user?.email}</Text>
              </Box>
            </HStack>
            <AnimatedInput
              label="Display Name"
              value={fullName}
              onChange={e => setFullName(e.target.value)}
            />
            <HStack justify="flex-end" spacing={3}>
              <Button colorScheme="red" variant="ghost" onClick={logout} size="sm">Sign Out</Button>
              <GradientButton size="sm" onClick={() => updateName()} isLoading={isPending}>Save</GradientButton>
            </HStack>
          </VStack>
        </GlassCard>
      </VStack>
    </PageWrapper>
  )
}
