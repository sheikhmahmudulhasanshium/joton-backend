import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, StrategyOptionsWithRequest } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import {
  JwtRefreshPayload,
  UserWithRefreshToken,
} from '../../common/interfaces/jwt.interface';

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(
  Strategy,
  'jwt-refresh',
) {
  constructor(private configService: ConfigService) {
    const secret = configService.get<string>('JWT_REFRESH_SECRET');
    if (!secret) {
      throw new UnauthorizedException('JWT Refresh Secret not configured.');
    }

    const strategyOptions: StrategyOptionsWithRequest = {
      jwtFromRequest: (req: Request) =>
        (req.cookies?.refresh_token as string) || null,
      ignoreExpiration: false,
      secretOrKey: secret,
      passReqToCallback: true, // This is the key
    };

    super(strategyOptions);
  }

  validate(req: Request, payload: JwtRefreshPayload): UserWithRefreshToken {
    const refreshToken = req.cookies.refresh_token as string;
    return {
      sub: payload.sub,
      refreshToken,
    };
  }
}
