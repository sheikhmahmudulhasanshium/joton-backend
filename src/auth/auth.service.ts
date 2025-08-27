import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { ConfigService } from '@nestjs/config';
import {
  JwtAccessPayload,
  JwtRefreshPayload,
} from 'src/common/interfaces/jwt.interface';
import { Role } from 'src/common/enums/role.enum';
import { User } from '../users/schemas/user.schema';

// --- THIS IS THE FIX ---
// We define our type based on the simple `User` class, not the complex `UserDocument`.
// This perfectly matches the plain object returned by `.toObject()`.
export type SanitizedUser = Omit<User, 'password' | 'hashedRefreshToken'> & {
  _id: { toString: () => string };
  identityId: { toString: () => string };
  identityType: 'Staff' | 'Patient';
};

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async validateUser(
    email: string,
    pass: string,
  ): Promise<SanitizedUser | null> {
    const user = await this.usersService.findByEmail(email);
    if (user && (await bcrypt.compare(pass, user.password))) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password, hashedRefreshToken, ...result } = user.toObject();
      return result as SanitizedUser;
    }
    return null;
  }

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
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
        expiresIn: this.configService.get<string>(
          'JWT_REFRESH_EXPIRATION_TIME',
        ),
      }),
    ]);

    return { accessToken, refreshToken };
  }

  async login(user: SanitizedUser) {
    const tokens = await this.generateTokens(
      user._id.toString(),
      user.role,
      user.identityId.toString(),
      user.identityType,
    );
    await this.usersService.updateRefreshToken(
      user._id.toString(),
      tokens.refreshToken,
    );
    return { ...tokens, user };
  }

  async logout(userId: string): Promise<void> {
    await this.usersService.updateRefreshToken(userId, null);
  }

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

    const user = userDoc.toObject() as SanitizedUser;

    const tokens = await this.generateTokens(
      user._id.toString(),
      user.role,
      user.identityId.toString(),
      user.identityType,
    );
    await this.usersService.updateRefreshToken(
      user._id.toString(),
      tokens.refreshToken,
    );
    return tokens;
  }
}
