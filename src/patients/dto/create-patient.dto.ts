// src/patients/dto/create-patient.dto.ts

import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsDateString,
  IsOptional,
  IsPhoneNumber,
  IsBoolean, // <-- IMPORT IsBoolean
} from 'class-validator';

export class CreatePatientDto {
  @ApiProperty({ example: 'John', description: "Patient's first name" })
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @ApiProperty({ example: 'Doe', description: "Patient's last name" })
  @IsString()
  @IsNotEmpty()
  lastName: string;

  @ApiProperty({
    example: '1985-05-20',
    description: "Patient's date of birth in YYYY-MM-DD format",
  })
  @IsDateString()
  @IsNotEmpty()
  dateOfBirth: Date;

  @ApiProperty({ example: 'Male', description: "Patient's gender" })
  @IsString()
  @IsNotEmpty()
  gender: string;

  @ApiProperty({
    example: '+8801712345678',
    description: "Patient's contact phone number (including country code)",
  })
  @IsPhoneNumber(undefined, {
    message: 'A valid international phone number is required.',
  })
  @IsNotEmpty()
  contactPhone: string;

  @ApiProperty({
    required: false,
    example: 'O+',
    description: "Patient's blood group (optional)",
  })
  @IsString()
  @IsOptional()
  bloodGroup?: string;

  // --- ADD THESE NEW OPTIONAL DTO PROPERTIES ---
  @ApiProperty({
    required: false,
    description: 'Indicates if the patient is a relative of a staff member.',
  })
  @IsBoolean()
  @IsOptional()
  isStaffRelative?: boolean;

  @ApiProperty({
    required: false,
    description: 'The Staff ID of the related staff member.',
    example: 'EMP-00001',
  })
  @IsString()
  @IsOptional()
  staffId?: string;

  @ApiProperty({
    required: false,
    description: "The patient's relation to the staff member.",
    example: 'Spouse',
  })
  @IsString()
  @IsOptional()
  relation?: string;
}
