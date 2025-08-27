import { ApiProperty } from '@nestjs/swagger';
import {
  IsMongoId,
  IsNotEmpty,
  IsDateString,
  IsArray,
  ValidateNested,
  IsString,
  IsNumber,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

class CreateInvoiceItemDto {
  @ApiProperty({ example: 'Doctor Consultation Fee' })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({ example: 500 })
  @IsNumber()
  @Min(0)
  cost: number;
}

export class CreateInvoiceDto {
  @ApiProperty({ description: 'The MongoDB ObjectId of the patient.' })
  @IsMongoId()
  @IsNotEmpty()
  patientId: string;

  @ApiProperty({ type: [CreateInvoiceItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateInvoiceItemDto)
  items: CreateInvoiceItemDto[];

  @ApiProperty({ description: 'The date the payment is due.' })
  @IsDateString()
  dueDate: Date;
}
