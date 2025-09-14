import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose'; // --- Use `Types` from mongoose
import { Role } from '../../common/enums/role.enum';

export type UserDocument = HydratedDocument<User>;

@Schema({ timestamps: true })
export class User {
  @Prop({ required: true, unique: true, trim: true, lowercase: true })
  email: string;

  @Prop({ required: true })
  password: string;

  @Prop({ type: String, enum: Role, required: true })
  role: Role;

  // --- FIX: Standardize type to Types.ObjectId ---
  @Prop({ type: Types.ObjectId, required: true })
  identityId: Types.ObjectId;

  @Prop({ type: String, required: true, enum: ['Staff', 'Patient'] })
  identityType: string;

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ required: false })
  hashedRefreshToken?: string;
}

export const UserSchema = SchemaFactory.createForClass(User);
