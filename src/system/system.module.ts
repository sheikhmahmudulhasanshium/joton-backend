// src/system/system.module.ts

import { Module } from '@nestjs/common';
import { SystemController } from './system.controller';
import { SystemService } from './system.service';
import { StaffModule } from '../staff/staff.module';

@Module({
  imports: [StaffModule], // Import StaffModule to access StaffService
  controllers: [SystemController],
  providers: [SystemService],
})
export class SystemModule {}
