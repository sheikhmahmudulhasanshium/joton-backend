import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, StrategyOptionsWithoutRequest } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import {
  JwtAccessPayload,
  UserFromJwt,
} from 'src/common/interfaces/jwt.interface';

const cookieExtractor = (req: Request): string | null => {
  if (req && req.cookies) {
    return req.cookies['access_token'] as string | null;
  }
  return null;
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
      jwtFromRequest: cookieExtractor,
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
