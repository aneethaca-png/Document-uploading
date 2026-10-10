import { Box, Heading, VStack, Select, Textarea, Button, HStack, Text } from '@chakra-ui/react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState, useEffect } from 'react'
import { PageWrapper } from '../components/layout/PageWrapper'
import { GlassCard } from '../components/ui/GlassCard'
import { GradientButton } from '../components/ui/GradientButton'
import { AnimatedInput } from '../components/ui/AnimatedInput'
import api from '../services/api'
import type { Template, TemplateCategory } from '../types'

export default function EditTemplate() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const qc = useQueryClient()

  const [title, setTitle] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [body, setBody] = useState('')

  const { data: template } = useQuery({
    queryKey: ['template', id],
    queryFn: () => api.get<Template>(`/templates/${id}`).then(r => r.data),
  })

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: () => api.get<TemplateCategory[]>('/templates/categories').then(r => r.data),
  })

  useEffect(() => {
    if (template) {
      setTitle(template.title)
      setCategoryId(String(template.category.id))
      setBody(template.body)
    }
  }, [template])

  const { mutate, isPending, error } = useMutation({
    mutationFn: () => api.put<Template>(`/templates/${id}`, {
      title, category_id: Number(categoryId), body,
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['template', id] })
      qc.invalidateQueries({ queryKey: ['templates'] })
      navigate(`/templates/${id}`)
    },
  })

  return (
    <PageWrapper bg="gray.50" p={8}>
      <VStack align="stretch" spacing={6} maxW="800px" mx="auto">
        <Heading size="lg">Edit Template</Heading>
        <GlassCard as="form" onSubmit={(e: React.FormEvent) => { e.preventDefault(); mutate() }}>
          <VStack spacing={5} align="stretch">
            <AnimatedInput label="Title" value={title} onChange={e => setTitle(e.target.value)} required />
            <Box>
              <Text fontWeight="medium" mb={1} fontSize="sm">Category</Text>
              <Select value={categoryId} onChange={e => setCategoryId(e.target.value)} borderRadius="xl" borderWidth={2} required>
                <option value="">Select a category</option>
                {categories?.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </Select>
            </Box>
            <Box>
              <Text fontWeight="medium" mb={1} fontSize="sm">Body</Text>
              <Textarea value={body} onChange={e => setBody(e.target.value)} rows={12} borderRadius="xl" borderWidth={2} fontFamily="mono" fontSize="sm" required />
            </Box>
            {error && <Text color="red.500" fontSize="sm">Failed to save. Please try again.</Text>}
            <HStack justify="flex-end" spacing={3}>
              <Button variant="ghost" onClick={() => navigate(-1)}>Cancel</Button>
              <GradientButton type="submit" isLoading={isPending}>Save Changes</GradientButton>
            </HStack>
          </VStack>
        </GlassCard>
      </VStack>
    </PageWrapper>
  )
}
