import { IsOptional, IsString, IsUrl, MaxLength } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class UpdateUserDto {
    @ApiProperty({required: false})
    @IsOptional()
    @IsString()
    @MaxLength(120, {message: 'Username không được vượt quá 30 ký tự'})
    display_name?: string;

    @ApiProperty({required: false})
    @IsOptional()
    @IsUrl()
    @MaxLength(2000)
    avatar_url?: string;

    // KHÔNG cho update email, password, role ở đây.
  // Mỗi cái có endpoint/DTO riêng để dễ audit + thêm verify step.
}