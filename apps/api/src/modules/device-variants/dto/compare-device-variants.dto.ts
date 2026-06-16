import { ApiProperty } from '@nestjs/swagger'
import { Transform } from 'class-transformer'
import { ArrayMaxSize, ArrayMinSize, IsArray, IsUUID } from 'class-validator'

export class CompareDeviceVariantsDto {
  @ApiProperty({
    description: 'Comma-separated variant UUIDs, from 2 to 4 IDs',
    example: '550e8400-e29b-41d4-a716-446655440000,550e8400-e29b-41d4-a716-446655440001',
  })
  @Transform(({ value }) =>
    Array.isArray(value)
      ? value
      : String(value ?? '')
          .split(',')
          .map((item) => item.trim())
          .filter(Boolean),
  )
  @IsArray()
  @ArrayMinSize(2)
  @ArrayMaxSize(4)
  @IsUUID('4', { each: true })
  ids!: string[]
}
