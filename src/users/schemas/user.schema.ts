import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema } from 'mongoose';
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

  @Prop({ type: MongooseSchema.Types.ObjectId, required: true })
  identityId: MongooseSchema.Types.ObjectId;

  @Prop({ type: String, required: true, enum: ['Staff', 'Patient'] })
  identityType: string;

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ required: false })
  hashedRefreshToken?: string;
}

export const UserSchema = SchemaFactory.createForClass(User);
