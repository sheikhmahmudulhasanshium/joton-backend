import { ApiProperty } from '@nestjs/swagger'; // --- IMPORT THIS ---
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class LoginDto {
  @ApiProperty({
    example: 'doctor.strange@hms.com',
    description: 'The email address of the user for login',
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    example: 'Password123!',
    description: 'The user password (must be at least 8 characters)',
  })
  @IsString()
  @IsNotEmpty()
  password: string;
}
