import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, StrategyOptionsWithoutRequest } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import {
  JwtAccessPayload,
  UserFromJwt,
} from 'src/common/interfaces/jwt.interface';

// --- THIS IS OUR MANUAL PARSER ---
// It reads the raw cookie header and extracts a specific cookie by name.
const cookieExtractor = (req: Request, cookieName: string): string | null => {
  const cookieHeader = req.headers.cookie;
  if (!cookieHeader) {
    return null;
  }
  const cookies = cookieHeader.split('; ');
  const targetCookie = cookies.find((cookie) =>
    cookie.startsWith(`${cookieName}=`),
  );
  return targetCookie ? targetCookie.split('=')[1] : null;
};

@Injectable()
export class JwtAccessStrategy extends PassportStrategy(
  Strategy,
  'jwt-access',
) {
  constructor(private configService: ConfigService) {
    const secret = configService.get<string>('JWT_ACCESS_SECRET');
    if (!secret) {
      throw new UnauthorizedException('JWT Access Secret not configured.');
    }

    const strategyOptions: StrategyOptionsWithoutRequest = {
      // Use our manual parser to find the 'access_token'
      jwtFromRequest: (req: Request) => cookieExtractor(req, 'access_token'),
      ignoreExpiration: false,
      secretOrKey: secret,
    };

    super(strategyOptions);
  }

  validate(payload: JwtAccessPayload): UserFromJwt {
    return {
      sub: payload.sub,
      role: payload.role,
      identityId: payload.identityId,
      identityType: payload.identityType,
    };
  }
}
