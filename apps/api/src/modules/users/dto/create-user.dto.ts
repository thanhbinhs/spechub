import {IsEmail, IsOptional, IsString, Matches, MaxLength, MinLength} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateUserDto {
    @ApiProperty({example: 'user@gmail.com'})
        @IsEmail({}, {message: 'Email không hợp lệ'})
        @MaxLength(255, {message: 'Email không được vượt quá 255 ký tự'})
        email!: string;

    @ApiProperty({example: 'StrongPass123!', minLength: 8})
        @IsString()
        @MinLength(8, {message: 'Mật khẩu phải có ít nhất 8 ký tự'})
        @MaxLength(72, {message: 'Mật khẩu không được vượt quá 48 ký tự'})
        @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]+$/, {
            message: 'Mật khẩu phải chứa ít nhất một chữ hoa, một chữ thường, một số và một ký tự đặc biệt',
        })
        password!: string;

    @ApiProperty({required: false, example: 'joedoe'})
        @IsOptional()
        @IsString()
        @MinLength(3, {message: 'Username phải có ít nhất 3 ký tự'})
        @MaxLength(30, {message: 'Username không được vượt quá 30 ký tự'})
        @Matches(/^[a-zA-Z0-9_]+$/, {
            message: 'Username chỉ được chứa chữ cái, số và dấu gạch dưới',
        })
        username?: string;

    @ApiProperty({required: false, example: 'Joe Doe'})
        @IsOptional()
        @IsString()
        @MinLength(2, {message: 'Họ tên phải có ít nhất 2 ký tự'})
        @MaxLength(100, {message: 'Họ tên không được vượt quá 100 ký tự'})
        display_name?: string;
}
