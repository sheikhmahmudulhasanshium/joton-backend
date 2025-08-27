import { Injectable } from '@nestjs/common';
import { Model } from 'mongoose';
import { Patient, PatientDocument } from '../patients/schemas/patient.schema';
import { InjectModel } from '@nestjs/mongoose';
import { Staff, StaffDocument } from '../staff/schemas/staff.schema';
import { Invoice, InvoiceDocument } from '../invoices/schemas/invoice.schema'; // Import Invoice

@Injectable()
export class CoreService {
  constructor(
    @InjectModel(Patient.name) private patientModel: Model<PatientDocument>,
    @InjectModel(Staff.name) private staffModel: Model<StaffDocument>,
    @InjectModel(Invoice.name) private invoiceModel: Model<InvoiceDocument>, // Inject Invoice Model
  ) {}

  async generatePatientId(): Promise<string> {
    const lastPatient = await this.patientModel
      .findOne()
      .sort({ patientId: -1 })
      .exec();
    const lastIdNumber = lastPatient
      ? parseInt(lastPatient.patientId.split('-')[2], 10)
      : 0;
    const newIdNumber = (lastIdNumber + 1).toString().padStart(5, '0');
    const year = new Date().getFullYear();
    return `JHMS-${year}-${newIdNumber}`;
  }

  async generateStaffId(): Promise<string> {
    const lastStaff = await this.staffModel
      .findOne()
      .sort({ staffId: -1 })
      .exec();
    const lastIdNumber = lastStaff
      ? parseInt(lastStaff.staffId.split('-')[1], 10)
      : 0;
    const newIdNumber = (lastIdNumber + 1).toString().padStart(5, '0');
    return `EMP-${newIdNumber}`;
  }

  // --- ADD THIS METHOD ---
  async generateInvoiceId(): Promise<string> {
    const lastInvoice = await this.invoiceModel
      .findOne()
      .sort({ invoiceId: -1 })
      .exec();
    const lastIdNumber = lastInvoice
      ? parseInt(lastInvoice.invoiceId.split('-')[2], 10)
      : 0;
    const newIdNumber = (lastIdNumber + 1).toString().padStart(7, '0');
    const year = new Date().getFullYear();
    return `INV-${year}-${newIdNumber}`;
  }
}
