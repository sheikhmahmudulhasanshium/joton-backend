import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Patient, PatientDocument } from './schemas/patient.schema';
import { CreatePatientDto } from './dto/create-patient.dto';
import { CoreService } from '../core/core.service';
import { UpdatePatientDto } from './dto/update-patient.dto';

@Injectable()
export class PatientsService {
  constructor(
    @InjectModel(Patient.name) private patientModel: Model<PatientDocument>,
    private coreService: CoreService,
  ) {}

  async registerNewPatient(
    createPatientDto: CreatePatientDto,
  ): Promise<Patient> {
    const patientId = await this.coreService.generatePatientId();
    const newPatient = new this.patientModel({
      ...createPatientDto,
      patientId,
    });
    return newPatient.save();
  }

  async findById(id: string): Promise<Patient> {
    const patient = await this.patientModel.findById(id).exec();
    if (!patient) {
      throw new NotFoundException(`Patient with ID ${id} not found.`);
    }
    return patient;
  }

  async update(
    id: string,
    updatePatientDto: UpdatePatientDto,
  ): Promise<Patient> {
    const existingPatient = await this.patientModel
      .findByIdAndUpdate(id, updatePatientDto, { new: true })
      .exec();

    if (!existingPatient) {
      throw new NotFoundException(`Patient with ID ${id} not found.`);
    }
    return existingPatient;
  }
}
