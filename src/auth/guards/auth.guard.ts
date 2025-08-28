import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';

export type JwtPayload = {
  sub: string;
  role?: 'ADMIN' | 'USER';
  iat?: number;
  exp?: number;
};

export type RequestWithUser = Request & { user?: JwtPayload };
@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private jwtService: JwtService) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const token = this.extractTokenFromCookieHeader(
      ctx.switchToHttp().getRequest<RequestWithUser>(),
    );
    if (!token) throw new UnauthorizedException('Guard');

    const payload = await this.jwtService.verifyAsync<JwtPayload>(token, {
      secret: process.env.SECRET_JWT!,
    });
    ctx.switchToHttp().getRequest<RequestWithUser>().user = payload;
    return true;
  }

  private extractTokenFromCookieHeader(req: Request): string | undefined {
    const cookieHeader = req.headers['cookie'];
    if (typeof cookieHeader !== 'string') return undefined;

    for (const part of cookieHeader.split(';')) {
      const [k, v] = part.split('=').map((s) => s?.trim());
      if (k === 'token' && typeof v === 'string' && v.length > 0) {
        try {
          return decodeURIComponent(v);
        } catch {
          return v;
        }
      }
    }
    return undefined;
  }
}
