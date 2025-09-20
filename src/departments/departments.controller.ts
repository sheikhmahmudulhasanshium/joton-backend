import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { DepartmentsService } from './departments.service';
import { CreateDepartmentDto } from './dto/create-department.dto';
import { UpdateDepartmentDto } from './dto/update-department.dto';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Public } from '../common/decorators/public.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';
import { RolesGuard } from '../common/guards/roles.guard';
import { AssignStaffDto } from './dto/assign-staff.dto';
import { CreateSlideDto } from './dto/create-slide.dto';
import { UpdateSlideDto } from './dto/update-slide.dto';

@ApiTags('Departments')
@Controller('departments')
export class DepartmentsController {
  constructor(private readonly departmentsService: DepartmentsService) {}

  // --- PUBLIC ENDPOINTS ---

  @Public()
  @Get()
  @ApiOperation({ summary: 'Get a list of all departments (summary view)' })
  findAllPublic() {
    return this.departmentsService.findAllPublic();
  }

  @Public()
  @Get(':slug')
  @ApiOperation({ summary: 'Get detailed information for a single department' })
  findOnePublic(@Param('slug') slug: string) {
    return this.departmentsService.findBySlugPublic(slug);
  }

  @Public()
  @Get(':slug/staff')
  @ApiOperation({ summary: 'Get all staff members assigned to a department' })
  findStaffInDepartment(@Param('slug') slug: string) {
    return this.departmentsService.findStaffByDepartmentSlug(slug);
  }

  // --- ADMIN ENDPOINTS - DEPARTMENT ---

  // --- THIS IS THE NEW ADMIN-ONLY GETTER ---
  @Get('admin/all')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get a list of all departments (full data for admin)',
  })
  findAllAdmin() {
    return this.departmentsService.findAllAdmin();
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new department (Admin only)' })
  create(@Body() createDepartmentDto: CreateDepartmentDto) {
    return this.departmentsService.create(createDepartmentDto);
  }

  @Patch(':slug')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a department (Admin only)' })
  update(
    @Param('slug') slug: string,
    @Body() updateDepartmentDto: UpdateDepartmentDto,
  ) {
    return this.departmentsService.update(slug, updateDepartmentDto);
  }

  @Delete(':slug')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a department (Admin only)' })
  remove(@Param('slug') slug: string) {
    return this.departmentsService.delete(slug);
  }

  // --- ADMIN ENDPOINTS - STAFF ASSIGNMENT ---

  @Post(':slug/staff')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Assign a staff member to a department' })
  assignStaff(
    @Param('slug') slug: string,
    @Body() assignStaffDto: AssignStaffDto,
  ) {
    return this.departmentsService.assignStaff(slug, assignStaffDto);
  }

  @Delete(':slug/staff/:staffMongoId')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Remove a staff member from a department' })
  removeStaff(
    @Param('slug') slug: string,
    @Param('staffMongoId') staffMongoId: string,
  ) {
    return this.departmentsService.removeStaff(slug, staffMongoId);
  }

  // --- ADMIN ENDPOINTS - SLIDES ---

  @Post(':slug/slides')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Add an informational slide to a department' })
  addSlide(
    @Param('slug') slug: string,
    @Body() createSlideDto: CreateSlideDto,
  ) {
    return this.departmentsService.addSlide(slug, createSlideDto);
  }

  @Patch(':slug/slides/:slideId')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update an informational slide' })
  updateSlide(
    @Param('slug') slug: string,
    @Param('slideId') slideId: string,
    @Body() updateSlideDto: UpdateSlideDto,
  ) {
    return this.departmentsService.updateSlide(slug, slideId, updateSlideDto);
  }

  @Delete(':slug/slides/:slideId')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Remove an informational slide' })
  removeSlide(@Param('slug') slug: string, @Param('slideId') slideId: string) {
    return this.departmentsService.removeSlide(slug, slideId);
  }
}
