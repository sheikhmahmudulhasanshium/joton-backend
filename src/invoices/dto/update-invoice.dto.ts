import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNumber, IsOptional, Min } from 'class-validator';

export class UpdateInvoiceDto {
  @ApiProperty({
    required: false,
    enum: ['Pending', 'Paid', 'Overdue', 'Cancelled'],
  })
  @IsEnum(['Pending', 'Paid', 'Overdue', 'Cancelled'])
  @IsOptional()
  status?: string;

  @ApiProperty({
    required: false,
    description: 'Amount of discount to apply.',
  })
  @IsNumber()
  @Min(0)
  @IsOptional()
  discount?: number;

  @ApiProperty({
    required: false,
    description: 'The amount that has been paid by the patient.',
  })
  @IsNumber()
  @Min(0)
  @IsOptional()
  paidAmount?: number;
}
