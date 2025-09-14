import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose'; // --- Use `Types` from mongoose
import { Role } from '../../common/enums/role.enum';

export type StaffDocument = HydratedDocument<Staff>;

@Schema({ timestamps: true })
export class Staff {
  @Prop({ required: true, unique: true })
  staffId: string;

  @Prop({ required: true })
  firstName: string;

  @Prop({ required: true })
  lastName: string;

  @Prop({ type: String, enum: Role, required: true })
  jobTitle: Role;

  @Prop({ required: true })
  department: string;

  @Prop({ required: true, unique: true })
  workEmail: string;

  @Prop({ required: true })
  contactPhone: string;

  // --- FIX: Standardize type to Types.ObjectId ---
  @Prop({ type: Types.ObjectId, ref: 'User', required: false })
  userId?: Types.ObjectId;
}

export const StaffSchema = SchemaFactory.createForClass(Staff);
