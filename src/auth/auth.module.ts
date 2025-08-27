import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { JwtAccessStrategy } from './strategies/jwt-access.strategy';
import { JwtRefreshStrategy } from './strategies/jwt-refresh.strategy';
import { UsersModule } from '../users/users.module';

// --- ADD THESE TWO IMPORTS ---
import { PatientsModule } from '../patients/patients.module';
import { StaffModule } from '../staff/staff.module';

@Module({
  imports: [
    UsersModule,
    PassportModule,
    JwtModule.register({}),

    // --- ADD THESE TWO MODULES TO THE IMPORTS ARRAY ---
    PatientsModule,
    StaffModule,
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtAccessStrategy, JwtRefreshStrategy],
})
export class AuthModule {}
