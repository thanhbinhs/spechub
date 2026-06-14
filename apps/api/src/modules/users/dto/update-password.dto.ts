import { IsString, Matches, MaxLength, MinLength } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class UpdatePasswordDto {
    @ApiProperty()
    @IsString()
    current_password!: string;

    @ApiProperty()
    @IsString()
    @MinLength(8, {message: 'Mật khẩu mới phải có ít nhất 8 ký tự'})
    @MaxLength(72, {message: 'Mật khẩu mới không được vượt quá 48 ký tự'})
    @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]+$/, {
        message: 'Mật khẩu mới phải chứa ít nhất một chữ cái viết hoa, một chữ cái viết thường, một số và một ký tự đặc biệt'
    })
    new_password!: string;
}