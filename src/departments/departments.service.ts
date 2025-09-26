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

type MongooseSubDocument<T> = T & { _id: Types.ObjectId };

/**
 * Generates a clean, URL-friendly slug from a string.
 * It prioritizes using the first alphabetic word if it makes sense.
 * Examples:
 * 'Nutrition & Dietetics' -> 'nutrition'
 * 'ENT (Otolaryngology)' -> 'ent'
 * 'General Medicine' -> 'general-medicine'
 * @param title The string to slugify.
 * @returns A sanitized slug string.
 */
const generateSlug = (title: string): string => {
  const sanitizedTitle = title.trim();
  const firstWordMatch = sanitizedTitle.match(/^([a-zA-Z]+)/);

  // Use the first word if it's a standalone word (like ENT, or Nutrition in 'Nutrition & ...')
  if (
    firstWordMatch &&
    firstWordMatch[1] &&
    (sanitizedTitle.split(' ').length > 1 || sanitizedTitle.includes('('))
  ) {
    const firstWord = firstWordMatch[1].toLowerCase();
    // A simple heuristic: if the first word is short, it's likely an acronym or primary name.
    if (firstWord.length <= 10) return firstWord;
  }

  // Otherwise, create a standard slug from the full title.
  return sanitizedTitle
    .toLowerCase()
    .replace(/\s+/g, '-') // Replace spaces with -
    .replace(/[^\w-]+/g, '') // Remove all non-word chars
    .replace(/--+/g, '-') // Replace multiple - with single -
    .replace(/^-+/, '') // Trim - from start of text
    .replace(/-+$/, ''); // Trim - from end of text
};

@Injectable()
export class DepartmentsService {
  constructor(
    @InjectModel(Department.name)
    private departmentModel: Model<DepartmentDocument>,
    @Inject(forwardRef(() => StaffService))
    private staffService: StaffService,
  ) {}

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

    const slug = generateSlug(createDepartmentDto.title);
    const slugExists = await this.departmentModel.findOne({ slug }).exec();
    if (slugExists) {
      throw new ConflictException(
        `A department with the generated slug "${slug}" already exists. Please choose a different title.`,
      );
    }

    const newDepartment = new this.departmentModel({
      ...createDepartmentDto,
      slug: slug,
    });
    return newDepartment.save();
  }

  async update(
    currentSlug: string,
    updateDepartmentDto: UpdateDepartmentDto,
  ): Promise<Department> {
    const department = await this.departmentModel
      .findOne({ slug: currentSlug })
      .exec();
    if (!department) {
      throw new NotFoundException(
        `Department with slug "${currentSlug}" not found.`,
      );
    }

    const { slug: newSlugFromDto, ...restOfDto } = updateDepartmentDto;

    if (restOfDto.title && restOfDto.title !== department.title) {
      const titleExists = await this.departmentModel
        .findOne({ title: restOfDto.title, _id: { $ne: department._id } })
        .exec();
      if (titleExists) {
        throw new ConflictException(
          `A department with the title "${restOfDto.title}" already exists.`,
        );
      }
    }

    const finalSlug = newSlugFromDto
      ? generateSlug(newSlugFromDto)
      : department.slug;
    if (finalSlug !== department.slug) {
      const slugExists = await this.departmentModel
        .findOne({ _id: { $ne: department._id }, slug: finalSlug })
        .exec();
      if (slugExists) {
        throw new ConflictException(
          `The slug "${finalSlug}" is already in use by another department.`,
        );
      }
    }

    department.set({
      ...restOfDto,
      slug: finalSlug,
    });

    return department.save();
  }

  async delete(slug: string): Promise<void> {
    const result = await this.departmentModel.deleteOne({ slug }).exec();
    if (result.deletedCount === 0) {
      throw new NotFoundException(`Department with slug "${slug}" not found.`);
    }
  }

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
