import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsString, IsOptional, IsInt, Min } from 'class-validator';

export class SearchStaffDto {
  @ApiProperty({
    description:
      'The name (or partial name) of the staff member to search for.',
    example: 'Dr. Smith',
    required: false, // It's good practice to update the Swagger doc too
  })
  @IsString()
  @IsOptional() // --- DEFINITIVE FIX: Changed from @IsNotEmpty() to @IsOptional() ---
  name: string;

  @ApiProperty({
    required: false,
    description: 'The page number for pagination.',
    default: 1,
    example: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiProperty({
    required: false,
    description: 'The number of results per page.',
    default: 10,
    example: 10,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 10;
}
