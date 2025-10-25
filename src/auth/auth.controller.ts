import { Body, Controller, Get, Post, Res, UseGuards } from '@nestjs/common';
import { Response } from 'express';
import { AuthService } from './auth.service';
import { Public } from './decorators/public.decorator';
import { Roles } from './decorators/role.decorator';
import { SignInDto } from './dto/sign-in.dto';
import { SignUpDTO } from './dto/sign-up.dto';
import { AuthGuard } from './guards/auth.guard';
import { RolesGuard } from './guards/role.guard';

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
    res.cookie('token', token);
    res.status(200);
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
  @Get('/me')
  testRouteWithRole() {
    return true;
  }
}
