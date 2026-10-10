import { Box, Heading, VStack, HStack, Text, Button, Input, useToast } from '@chakra-ui/react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useRef } from 'react'
import { PageWrapper } from '../components/layout/PageWrapper'
import { GlassCard } from '../components/ui/GlassCard'
import { GradientButton } from '../components/ui/GradientButton'
import { AnimatedList } from '../components/ui/AnimatedList'
import api from '../services/api'
import type { UploadedFile } from '../types'

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export default function Files() {
  const qc = useQueryClient()
  const toast = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const { data: files, isLoading } = useQuery({
    queryKey: ['files'],
    queryFn: () => api.get<UploadedFile[]>('/files').then(r => r.data),
  })

  const { mutate: upload, isPending: uploading } = useMutation({
    mutationFn: async (file: File) => {
      const form = new FormData()
      form.append('file', file)
      return api.post<UploadedFile>('/files/upload', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['files'] })
      toast({ title: 'File uploaded', status: 'success', duration: 2000 })
      if (fileInputRef.current) fileInputRef.current.value = ''
    },
    onError: (err: { response?: { data?: { detail?: string } } }) => {
      toast({ title: err.response?.data?.detail ?? 'Upload failed', status: 'error', duration: 3000 })
    },
  })

  const { mutate: deleteFile } = useMutation({
    mutationFn: (id: string) => api.delete(`/files/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['files'] }),
  })

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) upload(file)
  }

  const handleDownload = (file: UploadedFile) => {
    window.open(`${import.meta.env.VITE_API_URL ?? 'http://localhost:8000'}/api/v1/files/${file.id}/download`, '_blank')
  }

  return (
    <PageWrapper bg="gray.50" p={8}>
      <VStack align="stretch" spacing={6} maxW="900px" mx="auto">
        <HStack justify="space-between">
          <Heading size="lg">Document Library</Heading>
          <Box>
            <Input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              display="none"
              onChange={handleFileChange}
            />
            <GradientButton onClick={() => fileInputRef.current?.click()} isLoading={uploading}>
              Upload Document
            </GradientButton>
          </Box>
        </HStack>

        <GlassCard bg="purple.50" border="2px dashed" borderColor="purple.200" textAlign="center" py={6} cursor="pointer" onClick={() => fileInputRef.current?.click()}>
          <Text color="purple.500" fontWeight="medium">Drag & drop or click to upload PDF or DOCX (max 10MB)</Text>
        </GlassCard>

        {isLoading && <Text color="gray.400">Loading files...</Text>}

        {!isLoading && files?.length === 0 && (
          <GlassCard textAlign="center" py={10}>
            <Text color="gray.400">No files uploaded yet. Upload your first document above.</Text>
          </GlassCard>
        )}

        {files && files.length > 0 && (
          <AnimatedList>
            {files.map(f => (
              <GlassCard key={f.id} p={4}>
                <HStack justify="space-between">
                  <Box>
                    <Text fontWeight="semibold" fontSize="sm">{f.filename}</Text>
                    <Text fontSize="xs" color="gray.400">
                      {f.fileType.toUpperCase()} · {formatBytes(f.fileSizeBytes)} · {new Date(f.createdAt).toLocaleDateString()}
                    </Text>
                  </Box>
                  <HStack spacing={2}>
                    <Button size="xs" colorScheme="purple" variant="ghost" onClick={() => handleDownload(f)}>Download</Button>
                    <Button size="xs" colorScheme="red" variant="ghost" onClick={() => deleteFile(f.id)}>Delete</Button>
                  </HStack>
                </HStack>
              </GlassCard>
            ))}
          </AnimatedList>
        )}
      </VStack>
    </PageWrapper>
  )
}
