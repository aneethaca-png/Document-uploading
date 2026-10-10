import { Box, Grid, Heading, Text, VStack, HStack, Button, Divider } from '@chakra-ui/react'
import { Link as RouterLink } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { PageWrapper } from '../components/layout/PageWrapper'
import { GlassCard } from '../components/ui/GlassCard'
import { GradientButton } from '../components/ui/GradientButton'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'
import type { TemplateListResponse, UploadedFile } from '../types'

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <GlassCard textAlign="center" py={6}>
      <Text fontSize="3xl" fontWeight="bold" bgGradient="linear(to-r, purple.500, pink.500)" bgClip="text">
        {value}
      </Text>
      <Text color="gray.500" fontSize="sm" mt={1}>{label}</Text>
    </GlassCard>
  )
}

export default function Dashboard() {
  const { user } = useAuth()

  const { data: templates } = useQuery({
    queryKey: ['templates', 'recent'],
    queryFn: () => api.get<TemplateListResponse>('/templates?page=1&page_size=5').then(r => r.data),
  })

  const { data: files } = useQuery({
    queryKey: ['files'],
    queryFn: () => api.get<UploadedFile[]>('/files').then(r => r.data),
  })

  return (
    <PageWrapper bg="gray.50" p={8}>
      <VStack align="stretch" spacing={8} maxW="1200px" mx="auto">
        <Box>
          <Heading size="lg">Welcome back, {user?.fullName?.split(' ')[0] ?? 'there'}</Heading>
          <Text color="gray.500" mt={1}>Here's your DocuLex overview</Text>
        </Box>

        <Grid templateColumns="repeat(3, 1fr)" gap={6}>
          <StatCard label="Templates" value={templates?.total ?? 0} />
          <StatCard label="Uploaded Files" value={files?.length ?? 0} />
          <StatCard label="Categories" value={4} />
        </Grid>

        <HStack spacing={4}>
          <GradientButton as={RouterLink as React.ElementType} to="/templates/new">
            + New Template
          </GradientButton>
          <Button as={RouterLink as React.ElementType} to="/files" variant="outline" colorScheme="purple" borderRadius="full">
            Upload Document
          </Button>
        </HStack>

        <Grid templateColumns="repeat(2, 1fr)" gap={6}>
          <GlassCard>
            <Heading size="sm" mb={4}>Recent Templates</Heading>
            <VStack align="stretch" spacing={3} divider={<Divider />}>
              {templates?.items?.length ? templates.items.map(t => (
                <Box key={t.id} as={RouterLink as React.ElementType} to={`/templates/${t.id}`} _hover={{ color: 'purple.600' }}>
                  <Text fontWeight="medium" fontSize="sm">{t.title}</Text>
                  <Text fontSize="xs" color="gray.400">{t.category.name}</Text>
                </Box>
              )) : (
                <Text color="gray.400" fontSize="sm">No templates yet. Create your first one!</Text>
              )}
            </VStack>
          </GlassCard>

          <GlassCard>
            <Heading size="sm" mb={4}>Recent Files</Heading>
            <VStack align="stretch" spacing={3} divider={<Divider />}>
              {files?.length ? files.slice(0, 5).map(f => (
                <Box key={f.id}>
                  <Text fontWeight="medium" fontSize="sm">{f.filename}</Text>
                  <Text fontSize="xs" color="gray.400">{f.fileType.toUpperCase()} · {Math.round(f.fileSizeBytes / 1024)} KB</Text>
                </Box>
              )) : (
                <Text color="gray.400" fontSize="sm">No files uploaded yet.</Text>
              )}
            </VStack>
          </GlassCard>
        </Grid>
      </VStack>
    </PageWrapper>
  )
}
