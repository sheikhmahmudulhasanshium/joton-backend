import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { User, UserDocument } from './schemas/user.schema';
import * as bcrypt from 'bcrypt';
import { ConfigService } from '@nestjs/config';
import { Role } from '../common/enums/role.enum';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private configService: ConfigService,
  ) {}

  async countAllUsers(): Promise<number> {
    return this.userModel.countDocuments().exec();
  }

  async createUserAccount(
    email: string,
    password: string,
    role: Role,
    identityId: Types.ObjectId,
    identityType: 'Staff' | 'Patient',
  ): Promise<UserDocument> {
    // --- THIS IS THE FIX ---
    // 1. Get the value from config service. It might be a string or undefined.
    const saltRoundsEnv = this.configService.get<string>('BCRYPT_SALT_ROUNDS');
    // 2. Provide a default value if it's undefined, THEN parse it.
    const saltRounds = parseInt(saltRoundsEnv || '10', 10);

    const hashedPassword = await bcrypt.hash(password, saltRounds);

    const createdUser = new this.userModel({
      email,
      password: hashedPassword,
      role,
      identityId,
      identityType,
    });
    return createdUser.save();
  }

  async findAll(): Promise<User[]> {
    return this.userModel.find().select('-password -hashedRefreshToken').exec();
  }

  async findByEmail(email: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ email }).exec();
  }

  async findById(id: string): Promise<UserDocument | null> {
    return this.userModel.findById(id).exec();
  }

  async updateRefreshToken(userId: string, refreshToken: string | null) {
    // Also apply the fix here for consistency and safety.
    const saltRoundsEnv = this.configService.get<string>('BCRYPT_SALT_ROUNDS');
    const saltRounds = parseInt(saltRoundsEnv || '10', 10);

    if (refreshToken) {
      const hashedRefreshToken = await bcrypt.hash(refreshToken, saltRounds);
      await this.userModel
        .findByIdAndUpdate(userId, { hashedRefreshToken })
        .exec();
    } else {
      await this.userModel
        .findByIdAndUpdate(userId, { hashedRefreshToken: null })
        .exec();
    }
  }

  async deleteUserAccount(userId: string): Promise<void> {
    await this.userModel.findByIdAndDelete(userId).exec();
  }
}
