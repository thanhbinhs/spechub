import { ApiProperty } from '@nestjs/swagger'
import { IsEmail, IsString, MinLength } from 'class-validator'

export class LoginDto {
  @ApiProperty({
    description: 'Email đăng nhập',
    example: 'admin@spechub.io',
  })
  @IsEmail()
  email!: string

  @ApiProperty({
    description: 'Mật khẩu',
    example: 'admin123',
  })
  @IsString()
  @MinLength(1, { message: 'Mật khẩu không được để trống' })
  password!: string
}