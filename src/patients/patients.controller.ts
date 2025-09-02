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
import { PatientsService } from './patients.service';
import { CreatePatientDto } from './dto/create-patient.dto';
import { Roles } from 'src/common/decorators/roles.decorator';
import { Role } from 'src/common/enums/role.enum';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { UpdatePatientDto } from './dto/update-patient.dto';
import { UserFromJwt } from 'src/common/interfaces/jwt.interface';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('Patients')
@ApiBearerAuth()
@Controller('patients')
@UseGuards(RolesGuard)
export class PatientsController {
  constructor(private readonly patientsService: PatientsService) {}

  @Post('register')
  @Roles(Role.RECEPTIONIST, Role.ADMIN)
  @ApiOperation({ summary: 'Register a new patient (Receptionist/Admin only)' })
  register(@Body() createPatientDto: CreatePatientDto) {
    return this.patientsService.registerNewPatient(createPatientDto);
  }

  @Get(':id')
  @Roles(Role.RECEPTIONIST, Role.ADMIN, Role.DOCTOR, Role.NURSE, Role.PATIENT)
  @ApiOperation({ summary: 'Get a patient profile by ID' })
  async findOne(@Param('id') id: string, @CurrentUser() user: UserFromJwt) {
    // Ownership Check: A patient can only view their own profile.
    if (user.role === Role.PATIENT && user.identityId !== id) {
      throw new ForbiddenException(
        'Access denied. Patients can only view their own profile.',
      );
    }
    return this.patientsService.findById(id);
  }

  @Patch(':id')
  @Roles(Role.PATIENT, Role.ADMIN) // Only a patient or an admin can update a profile
  @ApiOperation({ summary: 'Update a patient profile' })
  async update(
    @Param('id') id: string,
    @Body() updatePatientDto: UpdatePatientDto,
    @CurrentUser() user: UserFromJwt,
  ) {
    // Ownership Check: A patient can only update their own profile. Admins can update any.
    if (user.role === Role.PATIENT && user.identityId !== id) {
      throw new ForbiddenException(
        'Access denied. Patients can only update their own profile.',
      );
    }
    return this.patientsService.update(id, updatePatientDto);
  }
}
