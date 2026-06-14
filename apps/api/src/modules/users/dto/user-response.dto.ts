import { ApiProperty } from "@nestjs/swagger";

export class UserResponseDto {
    @ApiProperty() id!: string;
    @ApiProperty() email!: string;
    @ApiProperty({nullable: true}) username?: string | null;
    @ApiProperty({nullable: true}) display_name?: string | null;
    @ApiProperty({nullable: true}) avatar_url?: string | null;
    @ApiProperty() role!: string;
    @ApiProperty() is_active!: boolean;
    @ApiProperty({nullable: true}) email_verified_at?: Date | null;
    @ApiProperty({nullable: true}) last_login_at?: Date | null;
    @ApiProperty() created_at!: Date;
    @ApiProperty() updated_at!: Date;
}