// src/staff/dto/create-staff.dto.ts

import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsEmail,
  IsEnum,
  IsPhoneNumber,
  MinLength,
} from 'class-validator';
import { Role } from '../../common/enums/role.enum';

export class CreateStaffDto {
  @ApiProperty({
    example: 'jane.smith@hms.com',
    description:
      "Staff member's work email, which will be used for their login account",
    type: String,
  })
  @IsEmail()
  @IsNotEmpty()
  workEmail: string;

  @ApiProperty({
    example: 'Password123!',
    description: 'Initial password for the staff member (min 8 characters).',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  password: string;

  @ApiProperty({
    example: 'Jane',
    description: "Staff member's first name",
    type: String,
  })
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @ApiProperty({
    example: 'Smith',
    description: "Staff member's last name",
    type: String,
  })
  @IsString()
  @IsNotEmpty()
  lastName: string;

  @ApiProperty({
    example: '+8801987654321',
    description: "Staff member's primary contact phone number",
    type: String,
  })
  @IsPhoneNumber(undefined, {
    message: 'A valid international phone number is required.',
  })
  @IsNotEmpty()
  contactPhone: string;

  @ApiProperty({
    enum: Role,
    example: Role.DOCTOR,
    description: 'The job title/role of the staff member within the system',
  })
  @IsEnum(Role)
  @IsNotEmpty()
  jobTitle: Role;

  @ApiProperty({
    example: 'Cardiology',
    description: 'The department the staff member is assigned to',
    type: String,
  })
  @IsString()
  @IsNotEmpty()
  department: string;
}
