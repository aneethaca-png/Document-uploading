import { Box, Grid, Heading, Text, VStack, HStack, Input, Select, Button } from '@chakra-ui/react'
import { Link as RouterLink } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { PageWrapper } from '../components/layout/PageWrapper'
import { GlassCard } from '../components/ui/GlassCard'
import { GradientButton } from '../components/ui/GradientButton'
import { AnimatedList } from '../components/ui/AnimatedList'
import api from '../services/api'
import type { TemplateListResponse, TemplateCategory } from '../types'

export default function Templates() {
  const [search, setSearch] = useState('')
  const [categoryId, setCategoryId] = useState<string>('')

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: () => api.get<TemplateCategory[]>('/templates/categories').then(r => r.data),
  })

  const { data, isLoading } = useQuery({
    queryKey: ['templates', search, categoryId],
    queryFn: () => {
      const params = new URLSearchParams({ page: '1', page_size: '50' })
      if (search) params.set('search', search)
      if (categoryId) params.set('category_id', categoryId)
      return api.get<TemplateListResponse>(`/templates?${params}`).then(r => r.data)
    },
  })

  return (
    <PageWrapper bg="gray.50" p={8}>
      <VStack align="stretch" spacing={6} maxW="1200px" mx="auto">
        <HStack justify="space-between">
          <Heading size="lg">Template Library</Heading>
          <GradientButton as={RouterLink as React.ElementType} to="/templates/new">+ New Template</GradientButton>
        </HStack>

        <HStack spacing={3}>
          <Input
            placeholder="Search templates..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            borderRadius="xl"
            bg="white"
            maxW="320px"
          />
          <Select
            value={categoryId}
            onChange={e => setCategoryId(e.target.value)}
            borderRadius="xl"
            bg="white"
            maxW="200px"
          >
            <option value="">All categories</option>
            {categories?.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </Select>
        </HStack>

        {isLoading && <Text color="gray.400">Loading templates...</Text>}

        {data?.items?.length === 0 && (
          <GlassCard textAlign="center" py={12}>
            <Text color="gray.400" mb={4}>No templates found.</Text>
            <GradientButton as={RouterLink as React.ElementType} to="/templates/new">Create your first template</GradientButton>
          </GlassCard>
        )}

        {data?.items && data.items.length > 0 && (
          <AnimatedList>
            {data.items.map(t => (
              <GlassCard key={t.id} p={4} as={RouterLink as React.ElementType} to={`/templates/${t.id}`} display="block">
                <HStack justify="space-between">
                  <Box>
                    <Text fontWeight="semibold">{t.title}</Text>
                    <Text fontSize="sm" color="gray.500">{t.category.name}</Text>
                  </Box>
                  <Text fontSize="xs" color="gray.400">
                    {new Date(t.updatedAt ?? t.createdAt).toLocaleDateString()}
                  </Text>
                </HStack>
              </GlassCard>
            ))}
          </AnimatedList>
        )}
      </VStack>
    </PageWrapper>
  )
}
