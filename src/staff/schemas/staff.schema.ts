import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema } from 'mongoose';
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

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: false })
  userId?: MongooseSchema.Types.ObjectId;
}

export const StaffSchema = SchemaFactory.createForClass(Staff);
