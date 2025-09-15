// src/staff/staff.service.ts

import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Staff, StaffDocument } from './schemas/staff.schema';
import { CreateStaffDto } from './dto/create-staff.dto';
import { CoreService } from '../core/core.service';
import { UpdateStaffAdminDto, UpdateStaffDto } from './dto/update-staff.dto';
import { UsersService } from '../users/users.service';
import { Role } from '../common/enums/role.enum';
import { SearchStaffDto } from './dto/search-staff.dto';

@Injectable()
export class StaffService {
  constructor(
    @InjectModel(Staff.name) private staffModel: Model<StaffDocument>,
    private coreService: CoreService,
    private usersService: UsersService,
  ) {}

  async findByEmail(email: string): Promise<StaffDocument | null> {
    return this.staffModel.findOne({ workEmail: email }).exec();
  }

  async findByStaffId(staffId: string): Promise<Staff> {
    const staff = await this.staffModel
      .findOne({ staffId })
      .select('firstName lastName contactPhone')
      .exec();
    if (!staff) {
      throw new NotFoundException(`Staff with Staff ID ${staffId} not found.`);
    }
    return staff;
  }

  async searchByName(searchStaffDto: SearchStaffDto): Promise<{
    data: Staff[];
    total: number;
    page: number;
    limit: number;
  }> {
    const { name, page = 1, limit = 10 } = searchStaffDto;
    const skip = (page - 1) * limit;

    const nameRegex = new RegExp(name, 'i');

    const query = {
      $or: [{ firstName: nameRegex }, { lastName: nameRegex }],
    };

    const [staffMembers, total] = await Promise.all([
      this.staffModel.find(query).skip(skip).limit(limit).exec(),
      this.staffModel.countDocuments(query).exec(),
    ]);

    return {
      data: staffMembers,
      total,
      page,
      limit,
    };
  }

  async createNewStaff(createStaffDto: CreateStaffDto): Promise<Staff> {
    const existingStaff = await this.findByEmail(createStaffDto.workEmail);
    if (existingStaff) {
      throw new ConflictException(
        'A staff member with this email already exists.',
      );
    }

    const existingUser = await this.usersService.findByEmail(
      createStaffDto.workEmail,
    );
    if (existingUser) {
      throw new ConflictException(
        'A user account with this email already exists.',
      );
    }

    const staffId = await this.coreService.generateStaffId();

    const newStaffProfile = new this.staffModel({
      staffId,
      firstName: createStaffDto.firstName,
      lastName: createStaffDto.lastName,
      jobTitle: createStaffDto.jobTitle,
      department: createStaffDto.department,
      workEmail: createStaffDto.workEmail,
      contactPhone: createStaffDto.contactPhone,
    });

    try {
      await newStaffProfile.save();

      const newUserAccount = await this.usersService.createUserAccount(
        createStaffDto.workEmail,
        createStaffDto.password,
        createStaffDto.jobTitle,
        newStaffProfile._id,
        'Staff',
      );

      newStaffProfile.userId = newUserAccount._id;
      await newStaffProfile.save();

      return newStaffProfile;
    } catch (error) {
      await this.staffModel.findByIdAndDelete(newStaffProfile._id).exec();
      throw error;
    }
  }

  async deleteStaff(id: string): Promise<void> {
    const staffProfile = await this.staffModel.findById(id).exec();
    if (!staffProfile) {
      throw new NotFoundException(`Staff with ID ${id} not found.`);
    }

    if (staffProfile.jobTitle === Role.OWNER) {
      throw new BadRequestException('The system Owner cannot be deleted.');
    }

    if (staffProfile.userId) {
      await this.usersService.deleteUserAccount(staffProfile.userId.toString());
    }

    await this.staffModel.findByIdAndDelete(id).exec();
  }

  async findById(id: string): Promise<Staff> {
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
    const existingStaff = await this.staffModel
      .findByIdAndUpdate(id, updateStaffDto, { new: true })
      .exec();
    if (!existingStaff) {
      throw new NotFoundException(`Staff with ID ${id} not found.`);
    }
    return existingStaff;
  }

  async countAllStaff(): Promise<number> {
    return this.staffModel.countDocuments().exec();
  }

  async updateAdminData(
    id: string,
    updateStaffAdminDto: UpdateStaffAdminDto,
  ): Promise<Staff> {
    const existingStaff = await this.staffModel
      .findByIdAndUpdate(id, updateStaffAdminDto, { new: true })
      .exec();
    if (!existingStaff) {
      throw new NotFoundException(`Staff with ID ${id} not found.`);
    }
    return existingStaff;
  }
}
