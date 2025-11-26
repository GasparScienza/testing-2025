import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { Public } from './decorators/public.decorator';
import { Roles } from './decorators/role.decorator';
import { SignInDto } from './dto/sign-in.dto';
import { SignUpDTO } from './dto/sign-up.dto';
import { AuthGuard, RequestWithUser } from './guards/auth.guard';
import { RolesGuard } from './guards/role.guard';
import { GoogleAuthGuard } from './guards/google-auth/google-auth.guard';
import { TurnstileService } from './turnstile.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService, private readonly turnstileService: TurnstileService) { }

  @Public()
  @Post('/login')
  async signIn(
    @Body() signInDto: SignInDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const token = await this.authService.signIn(signInDto);
    const ip = req.headers['x-forwarded-for'] as string
      || req.socket.remoteAddress;

    await this.turnstileService.validate(signInDto.turnstileToken, ip);

    res.cookie('token', token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: false,
    });
    res.status(200);
    res.send({ success: true });
  }

  @Post('/logout')
  @Public()
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
  async testRouteWithRole(@Req() req: RequestWithUser) {
    if (!req.user?.sub) throw new UnauthorizedException();
    return await this.authService.getData(req.user?.sub);
  }

  @Public()
  @UseGuards(GoogleAuthGuard)
  @Get("google/login")
  async loginWithGoogle() {

  }

  @Public()
  @UseGuards(GoogleAuthGuard)
  @Get("google/callback")
  async googleCallback(@Req() req: Request, @Res() res: Response) {
    console.log('VIENE USER?', req.user)
    const jwt = await this.authService.getJwtSigned(req.user);

    res.cookie('access_token', jwt, {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      maxAge: 1000 * 60 * 15,
    });

    // return {
    //   message: 'Login Google OK',
    //   accessToken: jwt,
    //   user: req.user,
    // };
    return res.redirect('https://google.com/');
  }
}
