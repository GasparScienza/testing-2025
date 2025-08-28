import {
  Controller,
  Post,
  Body,
  UnauthorizedException,
  Res,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { SignInDto } from './dto/sign-in.dto';
import { Response } from 'express';
import { SignUpDTO } from './dto/sign-up.dto';
import { AuthGuard } from './guards/auth.guard';
import { Roles } from './decorators/role.decorator';
import { RolesGuard } from './guards/role.guard';
import { Public } from './decorators/public.decorator';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('/login')
  async signIn(
    @Body() signInDto: SignInDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const token = await this.authService.signIn(signInDto);
    console.log('token:', token);
    if (!token) throw new UnauthorizedException();
    res.cookie('token', token);
    res.send({ success: true });
  }

  @Post('/logout')
  signOut(@Res({ passthrough: true }) res: Response) {
    res.clearCookie('token');
  }

  @Public()
  @Post('/signup')
  async signUp(
    @Body() body: SignUpDTO,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.signUp(body);
    res.cookie('token', result, {
      // httpOnly:
      // secure:
    });
    return true;
  }

  @UseGuards(AuthGuard, RolesGuard)
  @Roles('ADMIN', 'USER')
  @Post('/role')
  testRouteWithRole() {
    return;
  }
}
