import 'express-serve-static-core';
import { JwtPayload } from 'src/auth/guards/auth.guard';

declare module 'express-serve-static-core' {
  interface Request {
    user?: JwtPayload;
  }
}
