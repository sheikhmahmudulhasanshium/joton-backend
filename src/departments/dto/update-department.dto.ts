import { PartialType, ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, MinLength } from 'class-validator';
import { CreateDepartmentDto } from './create-department.dto';

export class UpdateDepartmentDto extends PartialType(CreateDepartmentDto) {
  // --- THIS IS THE FIX ---
  // We explicitly add the optional 'slug' property here so that
  // our service can receive it and TypeScript knows it exists.
  @ApiProperty({
    required: false,
    description:
      "The department's unique URL identifier (e.g., 'cardiology'). Changing this will change the URL.",
    example: 'cardiology',
  })
  @IsString()
  @MinLength(3)
  @IsOptional()
  slug?: string;
}
