import { ApiProperty } from '@nestjs/swagger';
import { CreateStaffDto } from '../../staff/dto/create-staff.dto';
import { IsNotEmpty, IsString } from 'class-validator';

// This DTO inherits all the properties and validation from CreateStaffDto
// and adds the 'secret' field required for this specific endpoint.
export class CreateAdminDto extends CreateStaffDto {
  @ApiProperty({
    description:
      'A secret key required to register the initial admin account. Must match the value in the server .env file.',
    example: 'a-very-long-and-random-secret-key...',
  })
  @IsString()
  @IsNotEmpty()
  secret: string;
}
