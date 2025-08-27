/**
 * This file defines the Data Transfer Object (DTO) for creating a new staff member.
 * A DTO is an object that defines how the data will be sent over the network.
 * It's used for request body validation and for generating API documentation.
 */

import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsEmail,
  IsEnum,
  IsPhoneNumber,
} from 'class-validator';
import { Role } from 'src/common/enums/role.enum';

export class CreateStaffDto {
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
    example: 'jane.smith@hms.com',
    description:
      "Staff member's work email, which will be used for their login account",
    type: String,
  })
  @IsEmail()
  @IsNotEmpty()
  workEmail: string;

  @ApiProperty({
    example: '+8801987654321',
    description: "Staff member's primary contact phone number",
    type: String,
  })
  @IsPhoneNumber('BD') // Specifies validation for Bangladesh phone numbers
  @IsNotEmpty()
  contactPhone: string;

  @ApiProperty({
    enum: Role, // This tells Swagger to show a dropdown of available roles
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
