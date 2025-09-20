import {
  Injectable,
  NotFoundException,
  ConflictException,
  forwardRef,
  Inject,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  Department,
  DepartmentDocument,
  InformationalSlide,
  AssignedStaff,
} from './schemas/department.schema';
import { CreateDepartmentDto } from './dto/create-department.dto';
import { UpdateDepartmentDto } from './dto/update-department.dto';
import { StaffService } from '../staff/staff.service';
import { AssignStaffDto } from './dto/assign-staff.dto';
import { Staff } from '../staff/schemas/staff.schema';
import { CreateSlideDto } from './dto/create-slide.dto';
import { UpdateSlideDto } from './dto/update-slide.dto';

type PopulatedStaff = Pick<
  Staff,
  'staffId' | 'firstName' | 'lastName' | 'jobTitle'
>;

type PopulatedAssignedStaff = Omit<AssignedStaff, 'staffMemberId'> & {
  staffMemberId: PopulatedStaff;
};

// Define a type for a Mongoose sub-document with an _id
type MongooseSubDocument<T> = T & { _id: Types.ObjectId };

@Injectable()
export class DepartmentsService {
  constructor(
    @InjectModel(Department.name)
    private departmentModel: Model<DepartmentDocument>,
    @Inject(forwardRef(() => StaffService))
    private staffService: StaffService,
  ) {}

  // PUBLIC METHODS

  async findAllPublic() {
    const departments = await this.departmentModel
      .find()
      .select('title slug description imageUrl icon assignedStaff')
      .exec();

    if (!departments) {
      return [];
    }

    return departments.map((dept) => {
      const staff = dept.assignedStaff || [];
      const doctors = staff.filter((s) =>
        s.roleInDepartment.toLowerCase().includes('doctor'),
      );
      const specialists = staff.filter((s) =>
        s.roleInDepartment.toLowerCase().includes('specialist'),
      );

      return {
        title: dept.title,
        slug: dept.slug,
        description: dept.description,
        imageUrl: dept.imageUrl,
        icon: dept.icon,
        statistics: {
          doctorCount: doctors.length,
          specialistCount: specialists.length,
        },
      };
    });
  }

  async findBySlugPublic(slug: string) {
    const department = await this.departmentModel.findOne({ slug }).exec();

    if (!department) {
      throw new NotFoundException(`Department with slug "${slug}" not found.`);
    }

    const staff = department.assignedStaff || [];
    const doctors = staff.filter((s) =>
      s.roleInDepartment.toLowerCase().includes('doctor'),
    );
    const specialists = staff.filter((s) =>
      s.roleInDepartment.toLowerCase().includes('specialist'),
    );
    const nurses = staff.filter((s) =>
      s.roleInDepartment.toLowerCase().includes('nurse'),
    );

    return {
      title: department.title,
      slug: department.slug,
      description: department.description,
      imageUrl: department.imageUrl,
      icon: department.icon,
      patientServices: department.patientServices || [],
      statistics: {
        doctorCount: doctors.length,
        specialistCount: specialists.length,
        nurseCount: nurses.length,
        totalStaff: staff.length,
      },
    };
  }

  async findStaffByDepartmentSlug(slug: string) {
    const department = await this.departmentModel
      .findOne({ slug })
      .populate<{ assignedStaff: PopulatedAssignedStaff[] }>({
        path: 'assignedStaff.staffMemberId',
        model: 'Staff',
        select: 'staffId firstName lastName jobTitle',
      })
      .exec();

    if (!department) {
      throw new NotFoundException(`Department with slug "${slug}" not found.`);
    }

    const assignedStaffList = department.assignedStaff || [];

    return assignedStaffList
      .filter((assignment) => !!assignment.staffMemberId)
      .map((assignment) => {
        const staffProfile = assignment.staffMemberId;

        return {
          staffId: staffProfile.staffId,
          firstName: staffProfile.firstName,
          lastName: staffProfile.lastName,
          jobTitle: staffProfile.jobTitle,
          departmentInfo: {
            role: assignment.roleInDepartment,
          },
        };
      });
  }

  // ADMIN METHODS - DEPARTMENT

  // --- THIS IS THE NEW METHOD FOR ADMINS ---
  async findAllAdmin(): Promise<Department[]> {
    return this.departmentModel.find().exec();
  }

  async create(createDepartmentDto: CreateDepartmentDto): Promise<Department> {
    const existing = await this.departmentModel
      .findOne({ title: createDepartmentDto.title })
      .exec();
    if (existing) {
      throw new ConflictException(
        `A department with title "${createDepartmentDto.title}" already exists.`,
      );
    }

    // --- DEFINITIVE FIX APPLIED HERE ---
    // 1. Manually generate the slug from the title.
    const slug = createDepartmentDto.title.toLowerCase().replace(/\s+/g, '-');

    // 2. Check if a department with this generated slug already exists.
    const slugExists = await this.departmentModel.findOne({ slug }).exec();
    if (slugExists) {
      throw new ConflictException(
        `A department with the generated slug "${slug}" already exists. Please choose a different title.`,
      );
    }

    // 3. Create the new department document, now including the slug.
    const newDepartment = new this.departmentModel({
      ...createDepartmentDto,
      slug: slug, // Add the generated slug
    });

    return newDepartment.save();
  }

  async update(
    slug: string,
    updateDepartmentDto: UpdateDepartmentDto,
  ): Promise<Department> {
    const department = await this.departmentModel
      .findOneAndUpdate({ slug }, updateDepartmentDto, { new: true })
      .exec();

    if (!department) {
      throw new NotFoundException(`Department with slug "${slug}" not found.`);
    }
    return department;
  }

  async delete(slug: string): Promise<void> {
    const result = await this.departmentModel.deleteOne({ slug }).exec();
    if (result.deletedCount === 0) {
      throw new NotFoundException(`Department with slug "${slug}" not found.`);
    }
  }

  // ADMIN METHODS - STAFF ASSIGNMENT

  async assignStaff(
    slug: string,
    assignStaffDto: AssignStaffDto,
  ): Promise<Department> {
    const department = await this.departmentModel.findOne({ slug }).exec();
    if (!department) {
      throw new NotFoundException(`Department with slug "${slug}" not found.`);
    }

    await this.staffService.findById(assignStaffDto.staffMongoId);

    const isAlreadyAssigned = (department.assignedStaff || []).some(
      (s) => s.staffMemberId.toString() === assignStaffDto.staffMongoId,
    );
    if (isAlreadyAssigned) {
      throw new ConflictException(
        'This staff member is already assigned to this department.',
      );
    }

    const staffObjectId = new Types.ObjectId(assignStaffDto.staffMongoId);
    department.assignedStaff.push({
      staffMemberId: staffObjectId,
      roleInDepartment: assignStaffDto.roleInDepartment,
    });

    return department.save();
  }

  async removeStaff(slug: string, staffMongoId: string): Promise<Department> {
    const department = await this.departmentModel.findOne({ slug }).exec();
    if (!department) {
      throw new NotFoundException(`Department with slug "${slug}" not found.`);
    }

    const staffObjectId = new Types.ObjectId(staffMongoId);
    const initialLength = department.assignedStaff.length;

    department.assignedStaff = (department.assignedStaff || []).filter(
      (s) => s.staffMemberId.toString() !== staffObjectId.toString(),
    );

    if (department.assignedStaff.length === initialLength) {
      throw new NotFoundException(
        `Staff member with ID "${staffMongoId}" is not assigned to this department.`,
      );
    }

    return department.save();
  }

  // ADMIN METHODS - SLIDES

  async addSlide(
    slug: string,
    createSlideDto: CreateSlideDto,
  ): Promise<Department> {
    const department = await this.departmentModel.findOne({ slug }).exec();
    if (!department) {
      throw new NotFoundException(`Department with slug "${slug}" not found.`);
    }

    const newSlide = new InformationalSlide();
    Object.assign(newSlide, createSlideDto);

    department.informationalSlides.push(newSlide);
    return department.save();
  }

  async updateSlide(
    slug: string,
    slideId: string,
    updateSlideDto: UpdateSlideDto,
  ): Promise<Department> {
    const department = await this.departmentModel.findOne({ slug }).exec();
    if (!department) {
      throw new NotFoundException(`Department with slug "${slug}" not found.`);
    }

    const slide = department.informationalSlides.find(
      (s) =>
        (s as MongooseSubDocument<InformationalSlide>)._id.toString() ===
        slideId,
    ) as MongooseSubDocument<InformationalSlide> | undefined;

    if (!slide) {
      throw new NotFoundException(
        `Slide with ID "${slideId}" not found in this department.`,
      );
    }

    Object.assign(slide, updateSlideDto);
    return department.save();
  }

  async removeSlide(slug: string, slideId: string): Promise<Department> {
    const department = await this.departmentModel.findOne({ slug }).exec();
    if (!department) {
      throw new NotFoundException(`Department with slug "${slug}" not found.`);
    }

    const initialLength = department.informationalSlides.length;
    department.informationalSlides = department.informationalSlides.filter(
      (s) =>
        (s as MongooseSubDocument<InformationalSlide>)._id.toString() !==
        slideId,
    );

    if (department.informationalSlides.length === initialLength) {
      throw new NotFoundException(`Slide with ID "${slideId}" not found.`);
    }

    return department.save();
  }
}
