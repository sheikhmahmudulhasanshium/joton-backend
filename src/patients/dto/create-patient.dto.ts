import { ApiProperty } from '@nestjs/swagger'; // --- IMPORT THIS ---
import {
  IsString,
  IsNotEmpty,
  IsDateString,
  IsOptional,
  IsPhoneNumber,
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
  @IsPhoneNumber('BD') // Example for Bangladesh phone number validation
  @IsNotEmpty()
  contactPhone: string;

  @ApiProperty({
    required: false, // --- Marks this as optional in Swagger ---
    example: 'O+',
    description: "Patient's blood group (optional)",
  })
  @IsString()
  @IsOptional()
  bloodGroup?: string;
}
