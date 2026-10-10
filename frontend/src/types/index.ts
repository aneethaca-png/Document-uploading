export interface User {
  id: string
  email: string
  fullName: string
  avatarUrl: string | null
  isActive: boolean
  createdAt: string
}

export interface TemplateCategory {
  id: number
  name: string
}

export interface Template {
  id: string
  title: string
  category: TemplateCategory
  body: string
  isDuplicateOf: string | null
  createdAt: string
  updatedAt: string
}

export interface TemplateListResponse {
  items: Template[]
  total: number
  page: number
  pageSize: number
}

export interface UploadedFile {
  id: string
  filename: string
  fileType: 'pdf' | 'docx'
  fileSizeBytes: number
  createdAt: string
}
