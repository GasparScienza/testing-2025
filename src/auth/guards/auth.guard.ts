import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { Reflector } from '@nestjs/core';

export type JwtPayload = {
  sub: string;
  role?: 'ADMIN' | 'USER';
  iat?: number;
  exp?: number;
};

type CookieJar = Record<string, string | undefined>;

export type RequestWithUser = Omit<Request, 'cookies' | 'signedCookies'> & {
  cookies?: CookieJar;
  signedCookies?: CookieJar;
  user?: JwtPayload;
};

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private jwtService: JwtService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean[]>(
      IS_PUBLIC_KEY,
      [ctx.getHandler(), ctx.getClass()],
    );
    if (isPublic) return true;

    const token = this.extractTokenFromCookieHeader(
      ctx.switchToHttp().getRequest<RequestWithUser>(),
    );
    if (!token) throw new UnauthorizedException('Guard');
    try {
      const payload = await this.jwtService.verifyAsync<JwtPayload>(token, {
        secret: process.env.SECRET_JWT!,
      });
      ctx.switchToHttp().getRequest<RequestWithUser>().user = payload;
      return true;
    } catch {
      throw new UnauthorizedException('Token inválido o expirado');
    }
  }

  private extractTokenFromCookieHeader(
    req: RequestWithUser,
  ): string | undefined {
    const token = req.signedCookies?.token ?? req.cookies?.token;
    return typeof token === 'string' && token.length > 0 ? token : undefined;
  }
}
