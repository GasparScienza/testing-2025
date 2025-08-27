import {
  Controller,
  Post,
  Body,
  UnauthorizedException,
  Res,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { SignInDto } from './dto/sign-in.dto';
import { Response } from 'express';
import { SignUpDTO } from './dto/sign-up.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('/signin')
  async signIn(
    @Body() signInDto: SignInDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const token = await this.authService.signIn(signInDto);
    if (!token) throw new UnauthorizedException();
    res.cookie('token', token);
    res.send({ success: true });
  }

  @Post('/signout')
  signOut(@Res({ passthrough: true }) res: Response) {
    res.clearCookie('token');
  }

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
}
