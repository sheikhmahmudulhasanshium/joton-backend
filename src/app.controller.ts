import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { Public } from './common/decorators/public.decorator';
import { Throttle } from '@nestjs/throttler';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @Public()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('status')
  @Public()
  @Throttle({ heartbeat: { limit: 60, ttl: 60000 } })
  getStatus(): { status: string; timestamp: string } {
    return this.appService.getStatus();
  }
}
