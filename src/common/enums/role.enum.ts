export enum Role {
  // Core Roles
  ADMIN = 'ADMIN',
  OWNER = 'OWNER',
  PATIENT = 'PATIENT',

  // Staff Roles
  DOCTOR = 'DOCTOR',
  NURSE = 'NURSE',
  MANAGER = 'MANAGER',
  RECEPTIONIST = 'RECEPTIONIST',
  PHARMACIST = 'PHARMACIST',
  EMPLOYEE = 'EMPLOYEE', // Generic staff

  // Other Stakeholders
  MEDICINE_SHOP_KEEPER = 'MEDICINE_SHOP_KEEPER',

  // System & Status Roles
  TESTER = 'TESTER',
  BANNED = 'BANNED',
  USER = 'USER', // Default for a newly logged in user, can be updated
}
