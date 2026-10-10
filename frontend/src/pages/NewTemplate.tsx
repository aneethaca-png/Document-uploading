import { Box, Heading, VStack, Select, Textarea, Button, HStack, Text } from '@chakra-ui/react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { PageWrapper } from '../components/layout/PageWrapper'
import { GlassCard } from '../components/ui/GlassCard'
import { GradientButton } from '../components/ui/GradientButton'
import { AnimatedInput } from '../components/ui/AnimatedInput'
import api from '../services/api'
import type { TemplateCategory, Template } from '../types'

export default function NewTemplate() {
  const navigate = useNavigate()
  const qc = useQueryClient()

  const [title, setTitle] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [body, setBody] = useState('')

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: () => api.get<TemplateCategory[]>('/templates/categories').then(r => r.data),
  })

  const { mutate, isPending, error } = useMutation({
    mutationFn: () => api.post<Template>('/templates', { title, category_id: Number(categoryId), body }),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ['templates'] })
      navigate(`/templates/${res.data.id}`)
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title || !categoryId || !body) return
    mutate()
  }

  return (
    <PageWrapper bg="gray.50" p={8}>
      <VStack align="stretch" spacing={6} maxW="800px" mx="auto">
        <Heading size="lg">New Template</Heading>
        <GlassCard as="form" onSubmit={handleSubmit}>
          <VStack spacing={5} align="stretch">
            <AnimatedInput
              label="Template Title"
              placeholder="e.g. Non-Disclosure Agreement"
              value={title}
              onChange={e => setTitle(e.target.value)}
              required
            />
            <Box>
              <Text fontWeight="medium" mb={1} fontSize="sm">Category</Text>
              <Select
                value={categoryId}
                onChange={e => setCategoryId(e.target.value)}
                borderRadius="xl"
                borderWidth={2}
                required
              >
                <option value="">Select a category</option>
                {categories?.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </Select>
            </Box>
            <Box>
              <Text fontWeight="medium" mb={1} fontSize="sm">Body</Text>
              <Text fontSize="xs" color="gray.400" mb={2}>
                Use {'{{variable_name}}'} for placeholder variables, e.g. {'{{client_name}}'}
              </Text>
              <Textarea
                value={body}
                onChange={e => setBody(e.target.value)}
                placeholder="This agreement is between {{client_name}} and {{company_name}}..."
                rows={12}
                borderRadius="xl"
                borderWidth={2}
                fontFamily="mono"
                fontSize="sm"
                required
              />
            </Box>
            {error && <Text color="red.500" fontSize="sm">Failed to create template. Please try again.</Text>}
            <HStack justify="flex-end" spacing={3}>
              <Button variant="ghost" onClick={() => navigate(-1)}>Cancel</Button>
              <GradientButton type="submit" isLoading={isPending}>Create Template</GradientButton>
            </HStack>
          </VStack>
        </GlassCard>
      </VStack>
    </PageWrapper>
  )
}
