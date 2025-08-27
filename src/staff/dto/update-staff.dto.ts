import { ApiProperty, PartialType } from '@nestjs/swagger';
import { CreateStaffDto } from './create-staff.dto';
import { IsOptional, IsString, IsNumber, Min, IsEnum } from 'class-validator';
import { Role } from 'src/common/enums/role.enum';

// This DTO is for what a staff member can update about themselves.
// It inherits all fields from CreateStaffDto and makes them optional.
export class UpdateStaffDto extends PartialType(CreateStaffDto) {}

// This DTO is ONLY for what an Admin can change about another staff member.
export class UpdateStaffAdminDto {
  @ApiProperty({
    required: false,
    example: 'Full-Time',
    description: "Admin only: Update staff member's contract type",
  })
  @IsString()
  @IsOptional()
  contractType?: string;

  @ApiProperty({
    required: false,
    example: 80000,
    description: "Admin only: Update staff member's annual salary",
  })
  @IsNumber()
  @Min(0)
  @IsOptional()
  salary?: number;

  @ApiProperty({
    required: false,
    enum: Role,
    example: Role.MANAGER,
    description: "Admin only: Change a staff member's role",
  })
  @IsEnum(Role)
  @IsOptional()
  jobTitle?: Role;
}
