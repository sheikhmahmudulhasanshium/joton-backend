import { Controller, Get, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';
import { RolesGuard } from '../common/guards/roles.guard';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { Public } from 'src/common/decorators/public.decorator';

@ApiTags('Users')
@Controller('users')
@UseGuards(RolesGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('count')
  @Public()
  @ApiOperation({
    summary: 'Get the total number of user accounts in the system',
    description:
      'Returns a count of all registered users. Used for initial setup checks.',
  })
  @ApiResponse({
    status: 200,
    description: 'Returns the total user count.',
    schema: { example: { count: 5 } },
  })
  async getUserCount() {
    const count = await this.usersService.countAllUsers();
    return { count };
  }

  @Get()
  @Roles(Role.ADMIN, Role.OWNER)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get all user accounts (Admin Only)',
    description:
      'Retrieves a complete list of all user login accounts. Requires ADMIN or OWNER role.',
  })
  @ApiResponse({
    status: 200,
    description: 'A list of user accounts has been successfully returned.',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden. User lacks the required role.',
  })
  findAll() {
    return this.usersService.findAll();
  }

  @Get('admin-only-data')
  @Roles(Role.ADMIN, Role.OWNER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get sample admin data (Admin Only)' })
  getAdminData() {
    return { message: 'This data is only for Admins and Owners!' };
  }
}
