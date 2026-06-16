/**
 * Re-export commonly used types
 */
export type { AuthUser } from '../decorators/current-user.decorator'
export type { UserRole } from '../constants'
export type { PaginationMeta } from '../dto/pagination.dto'
export type { ApiResponse } from '../interceptors/transform.interceptor'

/**
 * Helper: Make all fields optional
 */
export type Optional<T> = { [K in keyof T]?: T[K] }

/**
 * Helper: Pick specific fields and make them required
 */
export type Required<T, K extends keyof T> = T & { [P in K]-?: T[P] }
