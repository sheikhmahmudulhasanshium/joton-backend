import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { UserFromJwt } from '../interfaces/jwt.interface';

// We define an interface for the request object after Passport has attached the user
interface AuthenticatedRequest extends Request {
  user: UserFromJwt;
}

export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): UserFromJwt => {
    const request = ctx.switchToHttp().getRequest<AuthenticatedRequest>();
    return request.user;
  },
);
