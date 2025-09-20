import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

// This sub-document defines the structure for assigning staff to a department.
@Schema({ _id: false })
export class AssignedStaff {
  @Prop({ type: Types.ObjectId, ref: 'Staff', required: true })
  staffMemberId: Types.ObjectId;

  @Prop({ required: true })
  roleInDepartment: string;
}
const AssignedStaffSchema = SchemaFactory.createForClass(AssignedStaff);

// This sub-document defines the structure for informational slides.
@Schema({ _id: false })
export class InformationalSlide {
  @Prop({ required: true })
  order: number;

  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  tagline: string;

  @Prop({ required: false })
  description?: string;

  @Prop({ required: false })
  imageUrl?: string;

  @Prop({ required: false })
  icon?: string;

  @Prop({ default: false })
  isHidden: boolean;
}
const InformationalSlideSchema =
  SchemaFactory.createForClass(InformationalSlide);

export type DepartmentDocument = HydratedDocument<Department>;

@Schema({ timestamps: true })
export class Department {
  @Prop({ required: true, unique: true })
  title: string;

  @Prop({ required: true, unique: true })
  slug: string;

  @Prop({ required: true })
  description: string;

  @Prop({ required: true })
  imageUrl: string;

  @Prop({ required: true })
  icon: string;

  @Prop({ type: [String], default: [] })
  patientServices: string[];

  @Prop({ type: [InformationalSlideSchema], default: [] })
  informationalSlides: InformationalSlide[];

  @Prop({ type: [AssignedStaffSchema], default: [] })
  assignedStaff: AssignedStaff[];
}

export const DepartmentSchema = SchemaFactory.createForClass(Department);

// Create a text index for searching
DepartmentSchema.index({ title: 'text', description: 'text' });

// The pre-save hook that was causing issues has been removed.
