import { ApiProperty } from '@nestjs/swagger'
import { IsJWT, IsString } from 'class-validator'

export class RefreshTokenDto {
  @ApiProperty({
    description: 'Refresh token đã nhận lúc login',
  })
  @IsString()
  @IsJWT({ message: 'Token không hợp lệ' })
  refresh_token!: string
}