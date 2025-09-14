// src/auth/auth.controller.ts

import {
  Controller,
  Post,
  Body,
  UnauthorizedException,
  Res,
  UseGuards,
  Get,
  ConflictException,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AuthService, SanitizedUser } from './auth.service';
import { Public } from '../common/decorators/public.decorator';
import { Response } from 'express';
import { LoginDto } from './dto/login.dto';
import { PatientsService } from '../patients/patients.service';
import { StaffService } from '../staff/staff.service';
import {
  UserFromJwt,
  UserWithRefreshToken,
} from '../common/interfaces/jwt.interface';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtRefreshGuard } from '../common/guards/jwt-refresh.guard';
import { CreateAdminDto } from './dto/create-admin.dto';
import { ConfigService } from '@nestjs/config';
import { Role } from '../common/enums/role.enum';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private patientsService: PatientsService,
    private staffService: StaffService,
    private configService: ConfigService,
  ) {}

  @Public()
  @Post('register-admin')
  @ApiOperation({ summary: 'Register the first administrator account' })
  async registerAdmin(@Body() createAdminDto: CreateAdminDto) {
    const registrationSecret = this.configService.get<string>(
      'ADMIN_REGISTRATION_SECRET',
    );

    if (!registrationSecret || createAdminDto.secret !== registrationSecret) {
      throw new UnauthorizedException(
        'Invalid or missing registration secret.',
      );
    }

    const staffCount = await this.staffService.countAllStaff();
    if (staffCount > 0) {
      throw new ConflictException(
        'An admin account already exists. Setup is complete.',
      );
    }

    const staffData = {
      ...createAdminDto,
      jobTitle: Role.ADMIN,
      department: 'Administration',
    };

    const newStaff = await this.staffService.createNewStaff(staffData);

    return {
      message: `Admin account for ${newStaff.workEmail} created successfully.`,
      staffId: newStaff.staffId,
    };
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Log in a user' })
  async login(
    @Body() loginDto: LoginDto,
    @Res({ passthrough: true }) response: Response,
  ): Promise<SanitizedUser> {
    const user = await this.authService.validateUser(
      loginDto.email,
      loginDto.password,
    );
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const {
      accessToken,
      refreshToken,
      user: userPayload,
    } = await this.authService.login(user);

    response.cookie('access_token', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV !== 'development',
      sameSite: 'strict',
      path: '/',
    });

    response.cookie('refresh_token', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV !== 'development',
      sameSite: 'strict',
      path: '/',
    });

    return userPayload;
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Log out the current user' })
  @ApiBearerAuth()
  @ApiResponse({ status: 200, description: 'Logout was successful.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  logout(@Res({ passthrough: true }) response: Response): { message: string } {
    response.clearCookie('access_token', { path: '/' });
    response.clearCookie('refresh_token', { path: '/' });
    return { message: 'Logout successful' };
  }

  @Get('profile')
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get the current user's profile" })
  @ApiResponse({ status: 200, description: 'Returns the user profile data.' })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized if token is invalid or missing.',
  })
  async getProfile(@CurrentUser() user: UserFromJwt) {
    if (user.identityType === 'Patient') {
      return this.patientsService.findById(user.identityId);
    }
    if (user.identityType === 'Staff') {
      return this.staffService.findById(user.identityId);
    }
    throw new UnauthorizedException('Could not determine user profile type.');
  }

  @UseGuards(JwtRefreshGuard)
  @Get('refresh')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Refresh authentication tokens' })
  async refreshTokens(
    @CurrentUser() user: UserWithRefreshToken,
    @Res({ passthrough: true }) response: Response,
  ) {
    const { accessToken, refreshToken } = await this.authService.refreshTokens(
      user.sub,
      user.refreshToken,
    );

    response.cookie('access_token', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV !== 'development',
      sameSite: 'strict',
      path: '/',
    });
    response.cookie('refresh_token', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV !== 'development',
      sameSite: 'strict',
      path: '/',
    });

    return { message: 'Tokens refreshed successfully' };
  }
}
