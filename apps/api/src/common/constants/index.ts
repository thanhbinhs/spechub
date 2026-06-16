/**
 * Cache TTL (giây)
 */
export const CACHE_TTL = {
  SHORT: 60,                    // 1 phút
  MEDIUM: 60 * 5,               // 5 phút
  LONG: 60 * 60,                // 1 giờ
  VERY_LONG: 60 * 60 * 24,      // 1 ngày
} as const

/**
 * Pagination defaults
 */
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
} as const

/**
 * JWT config
 */
export const JWT_CONFIG = {
  ACCESS_TOKEN_TTL: '7d',
  REFRESH_TOKEN_TTL: '30d',
} as const

/**
 * Cache keys prefix
 */
export const CACHE_KEYS = {
  ORGANIZATION: (slug: string) => `org:${slug}`,
  DEVICE_MODEL: (slug: string) => `device:${slug}`,
  DEVICE_LIST: (query: string) => `devices:list:${query}`,
  USER: (id: string) => `user:${id}`,
} as const

export const USER_ROLES = {
    READER: 'reader',
    CONTRIBUTOR: 'contributor',
    EDITOR: 'editor',
    MODERATOR: 'moderator',
    ADMIN: 'admin',
} as const

export type UserRole = typeof USER_ROLES[keyof typeof USER_ROLES]

export const ALL_USER_ROLES: UserRole[] = Object.values(USER_ROLES)

export const BCRYPT_ROUNDS = parseInt(process.env.BCRYPT_ROUND ?? '10', 10)
