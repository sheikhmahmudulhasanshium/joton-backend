// src/staff/staff.controller.ts

import {
  Controller,
  Post,
  Body,
  UseGuards,
  Get,
  Param,
  Patch,
  ForbiddenException,
  Delete,
  HttpCode,
  HttpStatus,
  Query,
} from '@nestjs/common';
import { StaffService } from './staff.service';
import { CreateStaffDto } from './dto/create-staff.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiQuery,
  ApiResponse,
} from '@nestjs/swagger';
import { UpdateStaffAdminDto, UpdateStaffDto } from './dto/update-staff.dto';
import { UserFromJwt } from '../common/interfaces/jwt.interface';
import { Role } from '../common/enums/role.enum';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { SearchStaffDto } from './dto/search-staff.dto';
import { Public } from 'src/common/decorators/public.decorator';

@ApiTags('Staff')
@Controller('staff')
export class StaffController {
  constructor(private readonly staffService: StaffService) {}

  @Get('count')
  @Public()
  @ApiOperation({
    summary: 'Get the total number of staff accounts',
    description:
      'Returns a count of all registered staff members. Used for initial setup checks.',
  })
  async getStaffCount() {
    const count = await this.staffService.countAllStaff();
    return { count };
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.OWNER, Role.MANAGER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new staff profile (Admin/Manager only)' })
  create(@Body() createStaffDto: CreateStaffDto) {
    return this.staffService.createNewStaff(createStaffDto);
  }

  @Get('search')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.OWNER, Role.MANAGER, Role.RECEPTIONIST)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Search for staff members by name' })
  @ApiQuery({
    name: 'name',
    type: String,
    description: 'Partial name to search for',
  })
  @ApiQuery({
    name: 'page',
    type: Number,
    required: false,
    description: 'Page number',
  })
  @ApiQuery({
    name: 'limit',
    type: Number,
    required: false,
    description: 'Results per page',
  })
  search(@Query() searchStaffDto: SearchStaffDto) {
    return this.staffService.searchByName(searchStaffDto);
  }

  @Get('search-by-id/:staffId')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.OWNER)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Find a staff member by their Staff ID (Admin/Owner only)',
  })
  @ApiResponse({ status: 200, description: 'Staff member found.' })
  @ApiResponse({ status: 404, description: 'Staff member not found.' })
  findByStaffId(@Param('staffId') staffId: string) {
    return this.staffService.findByStaffId(staffId);
  }

  @Get(':id')
  @UseGuards(RolesGuard)
  @Roles(
    Role.ADMIN,
    Role.OWNER,
    Role.MANAGER,
    Role.DOCTOR,
    Role.NURSE,
    Role.RECEPTIONIST,
  )
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get a staff profile by ID' })
  findOne(@Param('id') id: string) {
    return this.staffService.findById(id);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.OWNER)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Delete a staff member and their login (Admin/Owner only)',
  })
  async remove(@Param('id') id: string): Promise<void> {
    await this.staffService.deleteStaff(id);
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.OWNER, Role.DOCTOR, Role.NURSE, Role.RECEPTIONIST)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Update a staff member's own profile information" })
  async update(
    @Param('id') id: string,
    @Body() updateStaffDto: UpdateStaffDto,
    @CurrentUser() user: UserFromJwt,
  ) {
    if (user.role !== Role.ADMIN && user.identityId !== id) {
      throw new ForbiddenException(
        'Access denied. You can only update your own profile.',
      );
    }
    return this.staffService.update(id, updateStaffDto);
  }

  @Patch(':id/admin')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.OWNER)
  @ApiBearerAuth()
  @ApiOperation({
    summary: "Update a staff member's sensitive data (Admin Only)",
  })
  updateAdminData(
    @Param('id') id: string,
    @Body() updateStaffAdminDto: UpdateStaffAdminDto,
  ) {
    return this.staffService.updateAdminData(id, updateStaffAdminDto);
  }
}
