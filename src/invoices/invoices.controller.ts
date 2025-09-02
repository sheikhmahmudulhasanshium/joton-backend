import {
  Controller,
  Post,
  Body,
  UseGuards,
  Get,
  Param,
  Patch,
  ForbiddenException,
} from '@nestjs/common';
import { InvoicesService } from './invoices.service';
import { Roles } from 'src/common/decorators/roles.decorator';
import { Role } from 'src/common/enums/role.enum';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { UserFromJwt } from 'src/common/interfaces/jwt.interface';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { UpdateInvoiceDto } from './dto/update-invoice.dto';
import { Invoice } from './schemas/invoice.schema';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('Invoices')
@ApiBearerAuth()
@Controller('invoices')
@UseGuards(RolesGuard)
export class InvoicesController {
  constructor(private readonly invoicesService: InvoicesService) {}

  @Post()
  @Roles(Role.RECEPTIONIST, Role.ADMIN)
  @ApiOperation({ summary: 'Create a new invoice (Receptionist/Admin only)' })
  create(@Body() createInvoiceDto: CreateInvoiceDto) {
    return this.invoicesService.create(createInvoiceDto);
  }

  @Get('my-invoices')
  @Roles(Role.PATIENT)
  @ApiOperation({
    summary: 'Get all invoices for the currently logged-in patient',
  })
  findAllForCurrentPatient(@CurrentUser() user: UserFromJwt) {
    return this.invoicesService.findAllForPatient(user.identityId);
  }

  @Get(':id')
  @Roles(Role.RECEPTIONIST, Role.ADMIN, Role.PATIENT)
  @ApiOperation({ summary: 'Get a single invoice by its ID' })
  async findOne(@Param('id') id: string, @CurrentUser() user: UserFromJwt) {
    const invoice: Invoice = await this.invoicesService.findById(id);

    // --- THIS IS THE FINAL COMBINATION ---

    // Step 1: Use the explicit temporary variable. This is the cleanest code.
    // The disable comment MUST be directly above THIS line.
    // eslint-disable-next-line @typescript-eslint/no-base-to-string
    const patientIdString = invoice.patientId.toString();

    // Step 2: Use the clean variable for the comparison.
    if (user.role === Role.PATIENT && patientIdString !== user.identityId) {
      throw new ForbiddenException('Access denied.');
    }

    return invoice;
  }

  @Patch(':id')
  @Roles(Role.RECEPTIONIST, Role.ADMIN)
  @ApiOperation({
    summary: 'Update an invoice with payment details (Receptionist/Admin only)',
  })
  update(@Param('id') id: string, @Body() updateInvoiceDto: UpdateInvoiceDto) {
    return this.invoicesService.update(id, updateInvoiceDto);
  }
}
