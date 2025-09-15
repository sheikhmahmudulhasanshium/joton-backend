// src/system/system.controller.ts

import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Public } from '../common/decorators/public.decorator';
import { SystemService } from './system.service';

@ApiTags('System')
@Controller('system')
export class SystemController {
  constructor(private readonly systemService: SystemService) {}

  @Get('status')
  @Public()
  @ApiOperation({
    summary: 'Get system status',
    description:
      'Checks if the initial admin setup is required by counting staff members.',
  })
  @ApiResponse({
    status: 200,
    description: 'Returns the current count of staff members.',
    schema: { example: { staffCount: 0 } },
  })
  async getStatus(): Promise<{ staffCount: number }> {
    return this.systemService.getSystemStatus();
  }

  @Get('setup-token')
  @Public()
  @ApiOperation({
    summary: 'Get the initial admin registration secret',
    description:
      'This endpoint ONLY works if no staff accounts exist. It provides the secret required to register the first admin, automating the setup process for the frontend.',
  })
  @ApiResponse({
    status: 200,
    description: 'Returns the registration secret.',
    schema: { example: { secret: 'a-very-long-secret-key' } },
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden. An admin account already exists.',
  })
  async getSetupToken(): Promise<{ secret: string }> {
    return this.systemService.getSetupToken();
  }
}
