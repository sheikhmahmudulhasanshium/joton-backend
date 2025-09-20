import { ApiProperty } from '@nestjs/swagger';
import { IsMongoId, IsNotEmpty, IsString } from 'class-validator';

export class AssignStaffDto {
  @ApiProperty({
    description: "The MongoDB ObjectId of the staff member's profile.",
    example: '60d0fe4f5311236168a109ca',
  })
  @IsMongoId()
  @IsNotEmpty()
  staffMongoId: string;

  @ApiProperty({
    description: "The staff member's specific role within this department.",
    example: 'Senior Cardiologist',
  })
  @IsString()
  @IsNotEmpty()
  roleInDepartment: string;
}
