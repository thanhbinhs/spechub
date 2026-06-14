import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { IsEmail, IsString, MinLength, MaxLength, IsOptional, Matches } from 'class-validator'

export class RegisterDto {
  @ApiProperty({
    description: 'Email đăng ký',
    example: 'user@example.com',
  })
  @IsEmail({}, { message: 'Email không hợp lệ' })
  email!: string

  @ApiProperty({
    description: 'Mật khẩu (tối thiểu 8 ký tự, có chữ và số)',
    example: 'Password123',
    minLength: 8,
  })
  @IsString()
  @MinLength(8, { message: 'Mật khẩu phải ít nhất 8 ký tự' })
  @MaxLength(100)
  @Matches(/^(?=.*[A-Za-z])(?=.*\d)/, {
    message: 'Mật khẩu phải có cả chữ và số',
  })
  password!: string

  @ApiPropertyOptional({
    description: 'Username (tùy chọn, dùng để hiển thị)',
    example: 'johndoe',
  })
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(60)
  @Matches(/^[a-z0-9_-]+$/i, {
    message: 'Username chỉ chứa chữ, số, dấu - và _',
  })
  username?: string

  @ApiPropertyOptional({
    description: 'Tên hiển thị',
    example: 'John Doe',
  })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  display_name?: string
}