/**
 * This controller is for high-level administrative purposes related to managing
 * user login accounts (`users` collection). It should be protected with
 * the highest-level roles (e.g., ADMIN, OWNER).
 */

import { Controller, Get, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';
import { RolesGuard } from '../common/guards/roles.guard';

// --- Import Swagger decorators for API documentation ---
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';

// @ApiTags groups all endpoints from this controller under the "Users (Admin)" heading in Swagger
@ApiTags('Users (Admin)')
@Controller('users')
// @UseGuards applied at the controller level protects all endpoints within it
// (though we will still specify roles per-endpoint for clarity and security).
@UseGuards(RolesGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  /**
   * Retrieves a list of all user login accounts in the system.
   * This endpoint is strictly for administrative use.
   * Sensitive information like passwords and refresh tokens are excluded.
   */
  @Get()
  @Roles(Role.ADMIN, Role.OWNER) // Specify that only these two roles can access this endpoint
  @ApiBearerAuth() // Tells Swagger that this endpoint requires an authentication token
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
    // The actual logic is delegated to the service layer
    return this.usersService.findAll();
  }

  // You can keep this for testing or expand it later.
  @Get('admin-only-data')
  @Roles(Role.ADMIN, Role.OWNER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get sample admin data (Admin Only)' })
  getAdminData() {
    return { message: 'This data is only for Admins and Owners!' };
  }
}
