import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsUrl,
  IsArray,
  ArrayMinSize,
} from 'class-validator';

export class CreateDepartmentDto {
  @ApiProperty({
    example: 'Cardiology',
    description: 'The title of the department.',
  })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({
    description:
      'A detailed description of the services offered by the department.',
    example:
      'Expert care for your heart and vascular system, from prevention to complex interventions.',
  })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({
    description: 'A URL for the main image representing the department.',
    example: 'https://example.com/images/cardiology.jpg',
  })
  @IsUrl()
  @IsNotEmpty()
  imageUrl: string;

  @ApiProperty({
    description: 'A string identifier for a frontend icon component.',
    example: 'HandHeart',
  })
  @IsString()
  @IsNotEmpty()
  icon: string;

  @ApiProperty({
    description: 'A list of key services provided to patients.',
    example: [
      'ECG & Echocardiogram',
      'Coronary Angioplasty',
      'Heart Failure Management',
    ],
  })
  @IsArray()
  @IsString({ each: true })
  @ArrayMinSize(1)
  patientServices: string[];
}
