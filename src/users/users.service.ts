import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Schema as MongooseSchema } from 'mongoose';
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

  /**
   * Creates a new user login account. This is an internal method
   * called by other services (e.g., StaffService) and not exposed
   * via a public endpoint.
   */
  async createUserAccount(
    email: string,
    password: string,
    role: Role,
    identityId: MongooseSchema.Types.ObjectId,
    identityType: 'Staff' | 'Patient',
  ): Promise<User> {
    const saltRounds = this.configService.get<number>('BCRYPT_SALT_ROUNDS');
    const hashedPassword = await bcrypt.hash(password, Number(saltRounds));

    const createdUser = new this.userModel({
      email,
      password: hashedPassword,
      role,
      identityId,
      identityType,
    });
    return createdUser.save();
  }

  /**
   * Finds all user accounts.
   * IMPORTANT: Excludes sensitive fields like password and refresh token.
   */
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
    if (refreshToken) {
      const saltRounds = this.configService.get<number>('BCRYPT_SALT_ROUNDS');
      const hashedRefreshToken = await bcrypt.hash(
        refreshToken,
        Number(saltRounds),
      );
      await this.userModel
        .findByIdAndUpdate(userId, { hashedRefreshToken })
        .exec();
    } else {
      await this.userModel
        .findByIdAndUpdate(userId, { hashedRefreshToken: null })
        .exec();
    }
  }
}
