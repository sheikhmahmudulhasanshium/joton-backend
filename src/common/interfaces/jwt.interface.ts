import { Role } from '../enums/role.enum';

/**
 * Defines the shape of the data encoded in the JWT Access Token.
 */
export interface JwtAccessPayload {
  sub: string; // The user's account ID from the `users` collection
  role: Role;
  identityId: string; // The user's profile ID from `staff_profiles` or `patient_profiles`
  identityType: 'Staff' | 'Patient';
}

/**
 * Defines the shape of the data encoded in the JWT Refresh Token.
 */
export interface JwtRefreshPayload {
  sub: string; // The user's account ID
}

/**
 * Defines the shape of the user object that our JwtAccessStrategy
 * will return and attach to the request.
 */
export type UserFromJwt = JwtAccessPayload;

/**
 * Defines the shape of the user object that our JwtRefreshStrategy
 * will return, including the refresh token itself.
 */
export type UserWithRefreshToken = JwtRefreshPayload & { refreshToken: string };
