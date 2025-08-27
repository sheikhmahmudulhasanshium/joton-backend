import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema } from 'mongoose';

@Schema({ _id: false }) // This is a sub-document, no _id needed
class InvoiceItem {
  @Prop({ required: true })
  description: string;

  @Prop({ required: true })
  cost: number;
}
const InvoiceItemSchema = SchemaFactory.createForClass(InvoiceItem);

export type InvoiceDocument = HydratedDocument<Invoice>;

@Schema({ timestamps: true })
export class Invoice {
  @Prop({ required: true, unique: true })
  invoiceId: string; // Human-readable e.g., INV-2024-0000001

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Patient', required: true })
  patientId: MongooseSchema.Types.ObjectId;

  @Prop({
    type: String,
    enum: ['Pending', 'Paid', 'Overdue', 'Cancelled'],
    default: 'Pending',
  })
  status: string;

  @Prop({ type: [InvoiceItemSchema], required: true })
  items: InvoiceItem[];

  @Prop({ required: true })
  totalAmount: number;

  @Prop({ default: 0 })
  discount: number;

  @Prop({ default: 0 })
  paidAmount: number;

  @Prop({ default: () => new Date() })
  issuedDate: Date;

  @Prop({ required: true })
  dueDate: Date;
}

export const InvoiceSchema = SchemaFactory.createForClass(Invoice);
