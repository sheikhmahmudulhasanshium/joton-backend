import {
  Controller,
  Post,
  Body,
  UnauthorizedException,
  Res,
  UseGuards,
  Get,
} from '@nestjs/common';
import { AuthService, SanitizedUser } from './auth.service'; // Import SanitizedUser
import { Public } from 'src/common/decorators/public.decorator';
import { Response } from 'express';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { JwtRefreshGuard } from 'src/common/guards/jwt-refresh.guard';
import { LoginDto } from './dto/login.dto';
import { StaffService } from '../staff/staff.service';
import {
  UserFromJwt,
  UserWithRefreshToken,
} from 'src/common/interfaces/jwt.interface';
import { PatientsService } from 'src/patients/patients.service';

// --- THIS IS THE FIX ---
// The LoginResponse is simply the SanitizedUser type.
// We are exporting SanitizedUser from auth.service.ts to make it available here.
type LoginResponse = SanitizedUser;

@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private patientsService: PatientsService,
    private staffService: StaffService,
  ) {}

  @Public()
  @Post('login')
  async login(
    @Body() loginDto: LoginDto,
    @Res({ passthrough: true }) response: Response,
  ): Promise<LoginResponse> {
    // This promise now correctly matches the return type
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
    });

    response.cookie('refresh_token', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV !== 'development',
      sameSite: 'strict',
    });

    // userPayload is of type SanitizedUser, which now matches LoginResponse
    return userPayload;
  }

  @UseGuards(JwtRefreshGuard)
  @Get('refresh')
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
    });
    response.cookie('refresh_token', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV !== 'development',
      sameSite: 'strict',
    });

    return { message: 'Tokens refreshed successfully' };
  }

  @Post('logout')
  async logout(
    @CurrentUser() user: UserFromJwt,
    @Res({ passthrough: true }) response: Response,
  ) {
    await this.authService.logout(user.sub);
    response.clearCookie('access_token');
    response.clearCookie('refresh_token');
    return { message: 'Logged out successfully' };
  }

  @Get('profile')
  async getProfile(@CurrentUser() user: UserFromJwt) {
    if (user.identityType === 'Patient') {
      return this.patientsService.findById(user.identityId);
    }
    if (user.identityType === 'Staff') {
      return this.staffService.findById(user.identityId);
    }
    throw new UnauthorizedException('Could not determine user profile type.');
  }
}
