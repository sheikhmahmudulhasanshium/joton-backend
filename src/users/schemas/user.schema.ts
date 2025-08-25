// src/users/schemas/user.schema.ts

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type UserDocument = HydratedDocument<User>;

@Schema({ timestamps: true })
export class User {
  @Prop({ required: true, unique: true, trim: true })
  email: string;

  @Prop({ required: true })
  password: string;

  @Prop({
    required: true,
    enum: ['ADMIN', 'DOCTOR', 'PATIENT', 'NURSE'],
    default: 'PATIENT',
  })
  role: string;

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ required: false })
  googleId?: string;
}

export const UserSchema = SchemaFactory.createForClass(User);
