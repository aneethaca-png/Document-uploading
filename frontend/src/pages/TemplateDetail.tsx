import { Box, Heading, Text, VStack, HStack, Button, Badge, Wrap, WrapItem, Divider, useToast } from '@chakra-ui/react'
import { useParams, useNavigate, Link as RouterLink } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { PageWrapper } from '../components/layout/PageWrapper'
import { GlassCard } from '../components/ui/GlassCard'
import { GradientButton } from '../components/ui/GradientButton'
import api from '../services/api'
import type { Template } from '../types'

export default function TemplateDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const toast = useToast()

  const { data: template, isLoading } = useQuery({
    queryKey: ['template', id],
    queryFn: () => api.get<Template>(`/templates/${id}`).then(r => r.data),
  })

  const { data: variables } = useQuery({
    queryKey: ['template-variables', id],
    queryFn: () => api.get<string[]>(`/templates/${id}/variables`).then(r => r.data),
    enabled: !!id,
  })

  const { mutate: duplicate, isPending: duplicating } = useMutation({
    mutationFn: () => api.post<Template>(`/templates/${id}/duplicate`),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ['templates'] })
      toast({ title: 'Template duplicated', status: 'success', duration: 2000 })
      navigate(`/templates/${res.data.id}`)
    },
  })

  const { mutate: deleteTemplate, isPending: deleting } = useMutation({
    mutationFn: () => api.delete(`/templates/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['templates'] })
      navigate('/templates')
    },
  })

  if (isLoading) return <PageWrapper p={8}><Text>Loading...</Text></PageWrapper>
  if (!template) return <PageWrapper p={8}><Text>Template not found.</Text></PageWrapper>

  return (
    <PageWrapper bg="gray.50" p={8}>
      <VStack align="stretch" spacing={6} maxW="900px" mx="auto">
        <HStack justify="space-between" flexWrap="wrap" gap={3}>
          <Box>
            <Heading size="lg">{template.title}</Heading>
            <Badge colorScheme="purple" mt={1}>{template.category.name}</Badge>
          </Box>
          <HStack spacing={3}>
            <GradientButton as={RouterLink as React.ElementType} to={`/templates/${id}/edit`} size="sm">Edit</GradientButton>
            <Button size="sm" variant="outline" colorScheme="purple" onClick={() => duplicate()} isLoading={duplicating}>Duplicate</Button>
            <Button size="sm" variant="ghost" colorScheme="red" onClick={() => deleteTemplate()} isLoading={deleting}>Delete</Button>
          </HStack>
        </HStack>

        {variables && variables.length > 0 && (
          <GlassCard>
            <Heading size="sm" mb={3}>Variables ({variables.length})</Heading>
            <Wrap spacing={2}>
              {variables.map(v => (
                <WrapItem key={v}>
                  <Badge colorScheme="pink" fontSize="sm" px={3} py={1} borderRadius="full">
                    {`{{${v}}}`}
                  </Badge>
                </WrapItem>
              ))}
            </Wrap>
          </GlassCard>
        )}

        <GlassCard>
          <Heading size="sm" mb={4}>Template Body</Heading>
          <Divider mb={4} />
          <Text fontFamily="mono" fontSize="sm" whiteSpace="pre-wrap" color="gray.700">
            {template.body}
          </Text>
        </GlassCard>

        <Text fontSize="xs" color="gray.400">
          Last updated: {new Date(template.updatedAt ?? template.createdAt).toLocaleString()}
        </Text>
      </VStack>
    </PageWrapper>
  )
}
