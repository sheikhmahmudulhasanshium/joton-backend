import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Staff, StaffDocument } from './schemas/staff.schema';
import { CreateStaffDto } from './dto/create-staff.dto';
import { CoreService } from '../core/core.service';
import { UpdateStaffAdminDto, UpdateStaffDto } from './dto/update-staff.dto';

@Injectable()
export class StaffService {
  constructor(
    @InjectModel(Staff.name) private staffModel: Model<StaffDocument>,
    private coreService: CoreService,
  ) {}

  async createNewStaff(createStaffDto: CreateStaffDto): Promise<Staff> {
    const staffId = await this.coreService.generateStaffId();
    const newStaff = new this.staffModel({
      ...createStaffDto,
      staffId,
    });
    return newStaff.save();
  }

  async findById(id: string): Promise<Staff> {
    // By default, exclude sensitive fields like salary from general lookups.
    const staff = await this.staffModel
      .findById(id)
      .select('-salaryDetails')
      .exec();

    if (!staff) {
      throw new NotFoundException(`Staff with ID ${id} not found.`);
    }
    return staff;
  }

  async update(id: string, updateStaffDto: UpdateStaffDto): Promise<Staff> {
    // This DTO cannot update sensitive fields like salary because they are not defined in it.
    // This is a security feature.
    const existingStaff = await this.staffModel
      .findByIdAndUpdate(id, updateStaffDto, { new: true })
      .exec();

    if (!existingStaff) {
      throw new NotFoundException(`Staff with ID ${id} not found.`);
    }
    return existingStaff;
  }

  async updateAdminData(
    id: string,
    updateStaffAdminDto: UpdateStaffAdminDto,
  ): Promise<Staff> {
    // This method uses a separate DTO that allows updating sensitive fields.
    const existingStaff = await this.staffModel
      .findByIdAndUpdate(id, updateStaffAdminDto, { new: true })
      .exec();

    if (!existingStaff) {
      throw new NotFoundException(`Staff with ID ${id} not found.`);
    }
    return existingStaff;
  }
}
