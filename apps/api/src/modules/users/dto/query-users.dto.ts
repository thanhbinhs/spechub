import { IsBoolean, IsIn, IsOptional, IsString } from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { PaginationQueryDto } from "@/common/dto/pagination.dto";
import { ALL_USER_ROLES } from "@/common/constants";
import { UserRole } from "@/common/types";
import { Transform } from "class-transformer";

export class QueryUsersDto extends PaginationQueryDto {
    @ApiPropertyOptional({description: 'Tìm kiếm theo email hoặc username'})
    @IsString()
    @IsOptional()
    q?: string;

    @ApiPropertyOptional({enum: ALL_USER_ROLES})
    @IsOptional()
    @IsIn(ALL_USER_ROLES)
    role?: UserRole;

    @ApiPropertyOptional()
    @IsOptional()
    @Transform(({ value }) => value === 'true' || value === true)
    @IsBoolean()
    is_active?: boolean;
}