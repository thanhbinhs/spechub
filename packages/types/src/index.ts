// Shared TypeScript types across SpecHub apps
export type ID = string

export type ApiResponse<T> = {
  data: T
  meta?: {
    total?: number
    page?: number
    pageSize?: number
  }
}

export type PaginationParams = {
  page?: number
  pageSize?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}
