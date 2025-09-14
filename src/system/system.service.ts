// src/system/system.service.ts

import { ForbiddenException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { StaffService } from '../staff/staff.service';

@Injectable()
export class SystemService {
  constructor(
    private readonly staffService: StaffService,
    private readonly configService: ConfigService, // Inject ConfigService
  ) {}

  async getSystemStatus(): Promise<{ staffCount: number }> {
    const staffCount = await this.staffService.countAllStaff();
    return { staffCount };
  }

  // --- NEW METHOD ---
  /**
   * Provides the admin registration secret ONLY if the system has not been set up yet.
   * Throws a ForbiddenException if a staff member already exists.
   * @returns The setup token if the system is new.
   */
  async getSetupToken(): Promise<{ secret: string }> {
    const staffCount = await this.staffService.countAllStaff();
    if (staffCount > 0) {
      throw new ForbiddenException(
        'System has already been configured. Access denied.',
      );
    }

    const secret = this.configService.get<string>('ADMIN_REGISTRATION_SECRET');
    if (!secret) {
      throw new Error(
        'ADMIN_REGISTRATION_SECRET is not configured on the server.',
      );
    }

    return { secret };
  }
}
