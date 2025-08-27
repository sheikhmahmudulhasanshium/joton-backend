import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Invoice, InvoiceDocument } from './schemas/invoice.schema';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { CoreService } from '../core/core.service';
import { UpdateInvoiceDto } from './dto/update-invoice.dto';

@Injectable()
export class InvoicesService {
  constructor(
    @InjectModel(Invoice.name) private invoiceModel: Model<InvoiceDocument>,
    private coreService: CoreService,
  ) {}

  async create(createInvoiceDto: CreateInvoiceDto): Promise<Invoice> {
    const invoiceId = await this.coreService.generateInvoiceId();

    // Calculate total amount from items
    const totalAmount = createInvoiceDto.items.reduce(
      (sum, item) => sum + item.cost,
      0,
    );

    const newInvoice = new this.invoiceModel({
      ...createInvoiceDto,
      invoiceId,
      totalAmount,
    });

    return newInvoice.save();
  }

  async findById(id: string): Promise<Invoice> {
    const invoice = await this.invoiceModel.findById(id).exec();
    if (!invoice) {
      throw new NotFoundException(`Invoice with ID ${id} not found.`);
    }
    return invoice;
  }

  async findAllForPatient(patientId: string): Promise<Invoice[]> {
    return this.invoiceModel.find({ patientId }).exec();
  }

  async update(
    id: string,
    updateInvoiceDto: UpdateInvoiceDto,
  ): Promise<Invoice> {
    const existingInvoice = await this.invoiceModel
      .findByIdAndUpdate(id, updateInvoiceDto, { new: true })
      .exec();

    if (!existingInvoice) {
      throw new NotFoundException(`Invoice with ID ${id} not found.`);
    }
    return existingInvoice;
  }
}
