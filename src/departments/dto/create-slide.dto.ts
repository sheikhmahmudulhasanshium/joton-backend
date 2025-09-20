import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsInt,
  Min,
  IsOptional,
  IsUrl,
  IsBoolean,
} from 'class-validator';

export class CreateSlideDto {
  @ApiProperty({ example: 1, description: 'The display order of the slide.' })
  @IsInt()
  @Min(1)
  order: number;

  @ApiProperty({ example: 'Welcome to Cardiology' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ example: 'Your Heart in Our Hands' })
  @IsString()
  @IsNotEmpty()
  tagline: string;

  @ApiProperty({
    required: false,
    example: 'Detailed info about our approach.',
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ required: false, example: 'https://.../image.jpg' })
  @IsUrl()
  @IsOptional()
  imageUrl?: string;

  @ApiProperty({ required: false, example: 'HeartIcon' })
  @IsString()
  @IsOptional()
  icon?: string;

  @ApiProperty({
    required: false,
    default: false,
    description: 'Set to true to hide the slide from public view.',
  })
  @IsBoolean()
  @IsOptional()
  isHidden?: boolean;
}
