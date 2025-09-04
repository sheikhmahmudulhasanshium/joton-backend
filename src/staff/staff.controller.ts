import {
  Controller,
  Post,
  Body,
  UseGuards,
  Get,
  Param,
  Patch,
  ForbiddenException,
} from '@nestjs/common';
import { StaffService } from './staff.service';
import { CreateStaffDto } from './dto/create-staff.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { UpdateStaffAdminDto, UpdateStaffDto } from './dto/update-staff.dto';
import { UserFromJwt } from '../common/interfaces/jwt.interface';
import { Role } from '../common/enums/role.enum';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('Staff')
@ApiBearerAuth()
@Controller('staff')
@UseGuards(RolesGuard)
export class StaffController {
  constructor(private readonly staffService: StaffService) {}

  @Post()
  @Roles(Role.ADMIN, Role.OWNER, Role.MANAGER)
  @ApiOperation({ summary: 'Create a new staff profile (Admin/Manager only)' })
  create(@Body() createStaffDto: CreateStaffDto) {
    return this.staffService.createNewStaff(createStaffDto);
  }

  @Get(':id')
  @Roles(
    Role.ADMIN,
    Role.OWNER,
    Role.MANAGER,
    Role.DOCTOR,
    Role.NURSE,
    Role.RECEPTIONIST,
  )
  @ApiOperation({ summary: 'Get a staff profile by ID' })
  findOne(@Param('id') id: string) {
    return this.staffService.findById(id);
  }

  @Patch(':id')
  @Roles(Role.ADMIN, Role.OWNER, Role.DOCTOR, Role.NURSE, Role.RECEPTIONIST) // Any staff member can attempt this
  @ApiOperation({ summary: "Update a staff member's own profile information" })
  async update(
    @Param('id') id: string,
    @Body() updateStaffDto: UpdateStaffDto,
    @CurrentUser() user: UserFromJwt,
  ) {
    // Ownership Check: Non-admins can ONLY update their own profile.
    if (user.role !== Role.ADMIN && user.identityId !== id) {
      throw new ForbiddenException(
        'Access denied. You can only update your own profile.',
      );
    }
    return this.staffService.update(id, updateStaffDto);
  }

  @Patch(':id/admin')
  @Roles(Role.ADMIN, Role.OWNER) // ONLY Admins and Owners can access this endpoint
  @ApiOperation({
    summary: "Update a staff member's sensitive data (Admin Only)",
    description: 'Used to update fields like contract type, salary, or role.',
  })
  updateAdminData(
    @Param('id') id: string,
    @Body() updateStaffAdminDto: UpdateStaffAdminDto,
  ) {
    // The RolesGuard has already protected this endpoint.
    return this.staffService.updateAdminData(id, updateStaffAdminDto);
  }
}
