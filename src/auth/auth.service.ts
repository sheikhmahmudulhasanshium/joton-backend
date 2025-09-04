import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { ConfigService } from '@nestjs/config';
import { User } from '../users/schemas/user.schema';
import {
  JwtAccessPayload,
  JwtRefreshPayload,
} from '../common/interfaces/jwt.interface';
import { Role } from '../common/enums/role.enum';

/**
 * The definitive, clean SanitizedUser type.
 * It omits sensitive fields and ensures `_id` and `identityId` are simple strings,
 * which makes it much easier to use throughout the application.
 */
export type SanitizedUser = Omit<
  User,
  'password' | 'hashedRefreshToken' | '_id' | 'identityId' | 'identityType'
> & {
  _id: string;
  identityId: string;
  identityType: 'Staff' | 'Patient';
};

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  /**
   * Validates user credentials. On success, it returns a fully sanitized user object
   * with `_id` and `identityId` already converted to strings.
   */
  async validateUser(
    email: string,
    pass: string,
  ): Promise<SanitizedUser | null> {
    const user = await this.usersService.findByEmail(email);

    if (user && (await bcrypt.compare(pass, user.password))) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password, hashedRefreshToken, ...result } = user.toObject();

      const sanitizedUser: SanitizedUser = {
        ...result,
        _id: String(result._id),
        // FINAL FIX: Disable the linter rule for this specific, known false positive.
        // eslint-disable-next-line @typescript-eslint/no-base-to-string
        identityId: String(result.identityId),
        identityType: result.identityType as 'Staff' | 'Patient',
      };
      return sanitizedUser;
    }
    return null;
  }

  /**
   * Generates new access and refresh JWTs for a given user payload.
   */
  async generateTokens(
    userId: string,
    role: Role,
    identityId: string,
    identityType: 'Staff' | 'Patient',
  ) {
    const accessTokenPayload: JwtAccessPayload = {
      sub: userId,
      role,
      identityId,
      identityType,
    };
    const refreshTokenPayload: JwtRefreshPayload = { sub: userId };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(accessTokenPayload, {
        secret: this.configService.get<string>('JWT_ACCESS_SECRET'),
        expiresIn: this.configService.get<string>('JWT_ACCESS_EXPIRATION_TIME'),
      }),
      this.jwtService.signAsync(refreshTokenPayload, {
        // FINAL FIX: Corrected typo from `secretOrKey` back to `secret`.
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
        expiresIn: this.configService.get<string>(
          'JWT_REFRESH_EXPIRATION_TIME',
        ),
      }),
    ]);

    return { accessToken, refreshToken };
  }

  /**
   * Handles the user login process. Receives a user object that is already sanitized.
   */
  async login(user: SanitizedUser) {
    const tokens = await this.generateTokens(
      user._id,
      user.role,
      user.identityId,
      user.identityType,
    );
    await this.usersService.updateRefreshToken(user._id, tokens.refreshToken);
    return { ...tokens, user };
  }

  /**
   * Handles user logout by clearing their stored refresh token from the database.
   */
  async logout(userId: string): Promise<void> {
    await this.usersService.updateRefreshToken(userId, null);
  }

  /**
   * Generates new tokens if a valid refresh token is provided.
   */
  async refreshTokens(userId: string, refreshToken: string) {
    const userDoc = await this.usersService.findById(userId);

    if (!userDoc || !userDoc.hashedRefreshToken) {
      throw new UnauthorizedException('Access Denied');
    }

    const refreshTokenMatches = await bcrypt.compare(
      refreshToken,
      userDoc.hashedRefreshToken,
    );

    if (!refreshTokenMatches) {
      throw new UnauthorizedException('Access Denied');
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, hashedRefreshToken, ...userObject } = userDoc.toObject();

    const sanitizedUser: SanitizedUser = {
      ...userObject,
      _id: String(userObject._id),
      // FINAL FIX: Disable the linter rule for this specific, known false positive.
      // eslint-disable-next-line @typescript-eslint/no-base-to-string
      identityId: String(userObject.identityId),
      identityType: userObject.identityType as 'Staff' | 'Patient',
    };

    const tokens = await this.generateTokens(
      sanitizedUser._id,
      sanitizedUser.role,
      sanitizedUser.identityId,
      sanitizedUser.identityType,
    );

    await this.usersService.updateRefreshToken(
      sanitizedUser._id,
      tokens.refreshToken,
    );
    return tokens;
  }
}
