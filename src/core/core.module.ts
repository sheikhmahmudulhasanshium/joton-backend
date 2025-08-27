import { Global, Module } from '@nestjs/common';
import { CoreService } from './core.service';
import { MongooseModule } from '@nestjs/mongoose';
import { Patient, PatientSchema } from '../patients/schemas/patient.schema';
import { Staff, StaffSchema } from '../staff/schemas/staff.schema';
import { Invoice, InvoiceSchema } from '../invoices/schemas/invoice.schema'; // Import Invoice

@Global()
@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Patient.name, schema: PatientSchema },
      { name: Staff.name, schema: StaffSchema },
      { name: Invoice.name, schema: InvoiceSchema }, // Add Invoice Schema
    ]),
  ],
  providers: [CoreService],
  exports: [CoreService],
})
export class CoreModule {}
