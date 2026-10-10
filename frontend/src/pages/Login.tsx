import { Box, Heading, Text, VStack, Image } from '@chakra-ui/react'
import { MeshBackground } from '../components/layout/MeshBackground'
import { PageWrapper } from '../components/layout/PageWrapper'
import { GlassCard } from '../components/ui/GlassCard'
import { GradientButton } from '../components/ui/GradientButton'

const GOOGLE_LOGIN_URL = `${import.meta.env.VITE_API_URL ?? 'http://localhost:8000'}/api/v1/auth/google`

export default function Login() {
  return (
    <PageWrapper>
      <MeshBackground />
      <Box minH="100vh" display="flex" alignItems="center" justifyContent="center" p={4}>
        <GlassCard maxW="420px" w="full" textAlign="center">
          <VStack spacing={6}>
            <Heading size="xl" bgGradient="linear(to-r, purple.600, pink.500)" bgClip="text">
              DocuLex
            </Heading>
            <Text color="gray.500" fontSize="md">
              Legal document automation for professionals
            </Text>
            <Box w="full" h="1px" bg="gray.100" />
            <Text color="gray.600" fontSize="sm">
              Sign in to manage your document templates
            </Text>
            <GradientButton
              as="a"
              href={GOOGLE_LOGIN_URL}
              w="full"
              size="lg"
              leftIcon={
                <Image
                  src="https://www.google.com/favicon.ico"
                  w={4}
                  h={4}
                  alt="Google"
                />
              }
            >
              Continue with Google
            </GradientButton>
            <Text fontSize="xs" color="gray.400">
              By signing in, you agree to our Terms of Service
            </Text>
          </VStack>
        </GlassCard>
      </Box>
    </PageWrapper>
  )
}
