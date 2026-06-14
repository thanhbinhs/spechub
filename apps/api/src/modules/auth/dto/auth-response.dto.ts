import { ApiProperty } from '@nestjs/swagger'

export class AuthUserResponseDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  id!: string

  @ApiProperty({ example: 'admin@spechub.io' })
  email!: string

  @ApiProperty({ example: 'admin', required: false })
  username?: string

  @ApiProperty({ example: 'Admin User', required: false })
  display_name?: string

  @ApiProperty({ example: 'admin', enum: ['reader', 'contributor', 'editor', 'moderator', 'admin'] })
  role!: string
}

export class AuthTokensDto {
  @ApiProperty({
    description: 'JWT access token (TTL 7 ngày)',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  access_token!: string

  @ApiProperty({
    description: 'Refresh token (TTL 30 ngày)',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  refresh_token!: string

  @ApiProperty({ example: 604800, description: 'Access token expires in (seconds)' })
  expires_in!: number
}

export class AuthResponseDto {
  @ApiProperty({ type: AuthUserResponseDto })
  user!: AuthUserResponseDto

  @ApiProperty({ type: AuthTokensDto })
  tokens!: AuthTokensDto
}